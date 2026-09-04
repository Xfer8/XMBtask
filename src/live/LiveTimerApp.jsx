import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import Login from '../pages/Login'
import PrototypeApp, { createEmptyState, normalizeState } from '../prototype/PrototypeApp'

const STATE_REF = doc(db, 'xmbtask', 'state')
const MAX_STATE_LENGTH = 750000

function actorFromUser(user, isAdmin) {
  const name = user.displayName?.trim() || user.email?.split('@')[0] || 'Member'
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return {
    id: user.uid,
    name,
    initials: initials || 'XM',
    color: '#42d98a',
    role: isAdmin ? 'Owner' : 'Member',
  }
}

function AccessDenied({ onSignOut }) {
  return (
    <main className="prototype-auth-screen">
      <section className="prototype-auth-card">
        <div className="prototype-brand"><span>XMB</span>task</div>
        <span className="prototype-kicker">Private workspace</span>
        <h1>Access not enabled</h1>
        <p>This Google account is not on the XMBtask access list.</p>
        <button type="button" className="prototype-secondary-button is-full" onClick={onSignOut}>Sign out</button>
      </section>
    </main>
  )
}

export default function LiveTimerApp() {
  const { user, hasAccess, isAdmin, signOutUser } = useAuth()
  const [state, setState] = useState(null)
  const [syncStatus, setSyncStatus] = useState('Connecting…')
  const saveTimerRef = useRef(null)
  const latestStateRef = useRef(null)

  useEffect(() => {
    if (!user || !hasAccess) return undefined

    return onSnapshot(STATE_REF, async (snapshot) => {
      if (!snapshot.exists()) {
        if (!isAdmin) {
          setSyncStatus('Waiting for setup')
          return
        }

        const initialState = createEmptyState()
        const stateJson = JSON.stringify(initialState)
        await setDoc(STATE_REF, {
          schemaVersion: 3,
          stateJson,
          updatedAt: serverTimestamp(),
          updatedByUid: user.uid,
          updatedByName: actorFromUser(user, isAdmin).name,
        })
        return
      }

      try {
        const nextState = normalizeState(JSON.parse(snapshot.data().stateJson))
        latestStateRef.current = nextState
        setState(nextState)
        setSyncStatus(snapshot.metadata.hasPendingWrites ? 'Saving…' : 'Synced')
      } catch (error) {
        console.error('Could not read shared timer state:', error)
        setSyncStatus('Sync error')
      }
    }, (error) => {
      console.error('Shared timer subscription failed:', error)
      setSyncStatus('Sync error')
    })
  }, [hasAccess, isAdmin, user])

  useEffect(() => () => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
  }, [])

  const persistState = useCallback((nextState) => {
    const stateJson = JSON.stringify(nextState)
    if (stateJson.length > MAX_STATE_LENGTH) {
      setSyncStatus('Data limit reached')
      throw new Error('The shared timer data has reached its storage limit.')
    }

    setSyncStatus('Saving…')
    return setDoc(STATE_REF, {
      schemaVersion: 3,
      stateJson,
      updatedAt: serverTimestamp(),
      updatedByUid: user.uid,
      updatedByName: actorFromUser(user, isAdmin).name,
    })
  }, [isAdmin, user])

  const updateState = useCallback((updater) => {
    setState((currentState) => {
      const current = normalizeState(currentState ?? latestStateRef.current ?? createEmptyState())
      const nextState = normalizeState(typeof updater === 'function' ? updater(current) : updater)
      latestStateRef.current = nextState

      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null
        persistState(latestStateRef.current).catch((error) => {
          console.error('Shared timer save failed:', error)
          setSyncStatus('Sync error')
        })
      }, 250)

      return nextState
    })
  }, [persistState])

  if (user === undefined) return <main className="prototype-auth-screen"><div className="prototype-auth-loading">Loading XMBtask…</div></main>
  if (user === null) return <Login />
  if (!hasAccess) return <AccessDenied onSignOut={signOutUser} />
  if (!state) return <main className="prototype-auth-screen"><div className="prototype-auth-loading">Loading shared timer…</div></main>

  return (
    <PrototypeApp
      live
      initialState={state}
      setSharedState={updateState}
      currentUser={actorFromUser(user, isAdmin)}
      canManageActivity={isAdmin}
      syncStatus={syncStatus}
      onSignOut={signOutUser}
    />
  )
}

