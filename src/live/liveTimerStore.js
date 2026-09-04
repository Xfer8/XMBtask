import { useCallback, useEffect, useRef, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { createEmptyState, normalizeState } from '../prototype/PrototypeApp'

const CONFIG_REF = doc(db, 'xmbtask', 'config')
const RUNTIME_REF = doc(db, 'xmbtask', 'runtime')
const SESSIONS = collection(db, 'xmbtaskSessions')
const RESETS = collection(db, 'xmbtaskResets')
const MAX_SETTINGS_LENGTH = 10000
const MEMBER_COLORS = ['#42d98a', '#55b8ff', '#c59cff', '#f3bd4e', '#ff9d47']

function initialsFor(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'XM'
}

function colorFor(uid) {
  const hash = [...uid].reduce((total, character) => total + character.charCodeAt(0), 0)
  return MEMBER_COLORS[hash % MEMBER_COLORS.length]
}

function actorFor(uid, name) {
  return {
    id: uid,
    name,
    initials: initialsFor(name),
    color: colorFor(uid),
    role: 'Member',
  }
}

function toIso(value) {
  return value?.toDate ? value.toDate().toISOString() : new Date(value).toISOString()
}

function deserializeSession(snapshot) {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    checkout: {
      at: toIso(data.checkoutAt),
      actor: actorFor(data.checkoutUid, data.checkoutName),
      details: [{ id: 'device', label: 'Device', value: data.device, showInCurrentState: true }],
    },
    checkin: data.checkinAt ? {
      at: toIso(data.checkinAt),
      actor: actorFor(data.checkinUid, data.checkinName),
      details: [],
    } : null,
  }
}

function deserializeReset(snapshot) {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    occurredAt: toIso(data.occurredAt),
    actor: actorFor(data.actorUid, data.actorName),
    allowanceSeconds: data.allowanceSeconds,
    kind: data.kind,
  }
}

function sessionFields(session, includeCreatedAt = false) {
  const fields = {
    checkoutAt: Timestamp.fromDate(new Date(session.checkout.at)),
    checkoutUid: session.checkout.actor.id,
    checkoutName: session.checkout.actor.name,
    device: session.checkout.details.find((detail) => detail.id === 'device')?.value ?? '',
    updatedAt: serverTimestamp(),
  }

  if (includeCreatedAt) fields.createdAt = serverTimestamp()
  if (session.checkin) {
    fields.checkinAt = Timestamp.fromDate(new Date(session.checkin.at))
    fields.checkinUid = session.checkin.actor.id
    fields.checkinName = session.checkin.actor.name
  }

  return fields
}

async function createLiveSession(session) {
  const sessionRef = doc(SESSIONS, session.id)
  await runTransaction(db, async (transaction) => {
    const runtime = await transaction.get(RUNTIME_REF)
    if (!runtime.exists() || runtime.data().activeSessionId) throw new Error('Another session is already active.')

    transaction.set(sessionRef, sessionFields(session, true))
    transaction.set(RUNTIME_REF, { activeSessionId: session.id, updatedAt: serverTimestamp() })
  })
}

async function completeLiveSession(session) {
  const sessionRef = doc(SESSIONS, session.id)
  await runTransaction(db, async (transaction) => {
    const [runtime, storedSession] = await Promise.all([
      transaction.get(RUNTIME_REF),
      transaction.get(sessionRef),
    ])
    if (!storedSession.exists() || !runtime.exists() || runtime.data().activeSessionId !== session.id) {
      throw new Error('This session is no longer active.')
    }

    transaction.update(sessionRef, {
      checkinAt: Timestamp.fromDate(new Date(session.checkin.at)),
      checkinUid: session.checkin.actor.id,
      checkinName: session.checkin.actor.name,
      updatedAt: serverTimestamp(),
    })
    transaction.set(RUNTIME_REF, { activeSessionId: '', updatedAt: serverTimestamp() })
  })
}

async function deleteSession(session, isAdmin) {
  if (!isAdmin) throw new Error('Only an administrator can delete sessions.')
  const sessionRef = doc(SESSIONS, session.id)
  if (session.checkin) {
    await deleteDoc(sessionRef)
    return
  }

  await runTransaction(db, async (transaction) => {
    const runtime = await transaction.get(RUNTIME_REF)
    if (runtime.exists() && runtime.data().activeSessionId === session.id) {
      transaction.set(RUNTIME_REF, { activeSessionId: '', updatedAt: serverTimestamp() })
    }
    transaction.delete(sessionRef)
  })
}

async function persistDifference(previous, next, user, isAdmin) {
  const displayName = user.displayName?.trim() || user.email?.split('@')[0] || 'Member'

  if (JSON.stringify(previous.settings) !== JSON.stringify(next.settings)) {
    if (!isAdmin) throw new Error('Only an administrator can change settings.')
    const settingsJson = JSON.stringify(next.settings)
    if (settingsJson.length > MAX_SETTINGS_LENGTH) throw new Error('Settings exceed the storage limit.')
    await setDoc(CONFIG_REF, {
      schemaVersion: 1,
      settingsJson,
      updatedAt: serverTimestamp(),
      updatedByUid: user.uid,
      updatedByName: displayName,
    })
  }

  const previousSessions = new Map(previous.sessions.map((session) => [session.id, session]))
  const nextSessions = new Map(next.sessions.map((session) => [session.id, session]))

  for (const session of next.sessions) {
    const stored = previousSessions.get(session.id)
    if (!stored) {
      if (session.checkin) {
        if (!isAdmin) throw new Error('Only an administrator can add historical sessions.')
        await setDoc(doc(SESSIONS, session.id), sessionFields(session, true))
      } else {
        await createLiveSession(session)
      }
      continue
    }

    if (JSON.stringify(stored) === JSON.stringify(session)) continue
    if (!stored.checkin && session.checkin) {
      await completeLiveSession(session)
    } else {
      if (!isAdmin) throw new Error('Only an administrator can edit session history.')
      await setDoc(doc(SESSIONS, session.id), sessionFields(session), { merge: true })
    }
  }

  for (const session of previous.sessions) {
    if (!nextSessions.has(session.id)) await deleteSession(session, isAdmin)
  }

  const previousResets = new Set(previous.resets.map((reset) => reset.id))
  for (const reset of next.resets) {
    if (previousResets.has(reset.id)) continue
    if (!isAdmin) throw new Error('Only an administrator can reset the week.')
    await setDoc(doc(RESETS, reset.id), {
      occurredAt: Timestamp.fromDate(new Date(reset.occurredAt)),
      actorUid: reset.actor.id,
      actorName: reset.actor.name,
      allowanceSeconds: Math.round(reset.allowanceSeconds),
      kind: reset.kind,
      createdAt: serverTimestamp(),
    })
  }
}

export function useLiveTimerState({ user, isAdmin }) {
  const [state, setState] = useState(null)
  const [syncStatus, setSyncStatus] = useState('Connecting…')
  const stateRef = useRef(null)
  const sourcesRef = useRef({ settings: null, sessions: null, resets: null })
  const writeQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    if (!user) return undefined
    let active = true

    const publish = () => {
      const sources = sourcesRef.current
      if (!sources.settings || !sources.sessions || !sources.resets) return
      const next = normalizeState({
        schemaVersion: 3,
        currentUserId: null,
        settings: sources.settings,
        sessions: sources.sessions,
        resets: sources.resets,
      })
      stateRef.current = next
      setState(next)
      setSyncStatus('Synced')
    }

    const onError = (error) => {
      console.error('Shared timer subscription failed:', error)
      if (active) setSyncStatus('Sync error')
    }

    getDoc(RUNTIME_REF).then((snapshot) => {
      if (!snapshot.exists() && isAdmin) {
        return setDoc(RUNTIME_REF, { activeSessionId: '', updatedAt: serverTimestamp() })
      }
      return undefined
    }).catch(onError)

    const unsubscribeConfig = onSnapshot(CONFIG_REF, async (snapshot) => {
      if (!snapshot.exists()) {
        const settings = createEmptyState().settings
        sourcesRef.current.settings = settings
        if (isAdmin) {
          const name = user.displayName?.trim() || user.email?.split('@')[0] || 'Member'
          await setDoc(CONFIG_REF, {
            schemaVersion: 1,
            settingsJson: JSON.stringify(settings),
            updatedAt: serverTimestamp(),
            updatedByUid: user.uid,
            updatedByName: name,
          })
        }
      } else {
        sourcesRef.current.settings = JSON.parse(snapshot.data().settingsJson)
      }
      publish()
    }, onError)

    const unsubscribeSessions = onSnapshot(query(SESSIONS, orderBy('checkoutAt', 'desc')), (snapshot) => {
      sourcesRef.current.sessions = snapshot.docs.map(deserializeSession)
      publish()
    }, onError)

    const unsubscribeResets = onSnapshot(query(RESETS, orderBy('occurredAt', 'desc')), (snapshot) => {
      sourcesRef.current.resets = snapshot.docs.map(deserializeReset)
      publish()
    }, onError)

    return () => {
      active = false
      unsubscribeConfig()
      unsubscribeSessions()
      unsubscribeResets()
    }
  }, [isAdmin, user])

  const updateState = useCallback((updater) => {
    const previous = stateRef.current
    if (!previous) return
    const next = normalizeState(typeof updater === 'function' ? updater(previous) : updater)
    stateRef.current = next
    setState(next)
    setSyncStatus('Saving…')

    writeQueueRef.current = writeQueueRef.current
      .then(() => persistDifference(previous, next, user, isAdmin))
      .then(() => setSyncStatus('Synced'))
      .catch((error) => {
        console.error('Shared timer save failed:', error)
        setSyncStatus(error.message || 'Sync error')
      })
  }, [isAdmin, user])

  return { state, syncStatus, updateState }
}

