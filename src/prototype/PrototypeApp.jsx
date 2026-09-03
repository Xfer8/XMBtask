import { useEffect, useMemo, useState } from 'react'
import './prototype.css'

const STORAGE_KEY = 'xmbtask-v2-prototype-v2'
const LEGACY_STORAGE_KEY = 'xmbtask-v2-prototype-v1'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const FIELD_TYPES = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'yes_no', label: 'Yes / no' },
  { value: 'select', label: 'Choice' },
]

const NAV_ITEMS = [
  { id: 'timer', label: 'Timer', icon: 'timer' },
  { id: 'activity', label: 'Activity', icon: 'activity' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

const MOCK_USERS = [
  { id: 'brock', name: 'Brock', email: 'b10rok@gmail.com', initials: 'BM', color: '#42d98a', role: 'Owner' },
  { id: 'alex', name: 'Alex', email: 'alex@example.com', initials: 'AL', color: '#55b8ff', role: 'Member' },
  { id: 'jordan', name: 'Jordan', email: 'jordan@example.com', initials: 'JR', color: '#c59cff', role: 'Member' },
]

const SYSTEM_USER = { id: 'system', name: 'XMBtask', initials: 'XM', color: '#f3bd4e', role: 'System' }

function uniqueId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

function createDefaultState() {
  const checkoutAt = minutesAgo(123)
  const checkinAt = minutesAgo(45)
  return {
    schemaVersion: 2,
    currentUserId: 'brock',
    settings: {
      weeklyHours: 20,
      resetDay: 1,
      resetTime: '00:00',
      timezone: 'America/New_York',
      remainingFormat: 'clock',
      recentActivityLimit: 5,
      checkoutFields: [
        { id: 'device', label: 'Device', type: 'select', required: true, showInCurrentState: true, options: ['Tablet', 'Phone', 'Laptop'] },
        { id: 'purpose', label: 'Purpose', type: 'short_text', required: true, showInCurrentState: false, options: [] },
        { id: 'expected-return', label: 'Expected return', type: 'short_text', required: false, showInCurrentState: true, options: [] },
      ],
      checkinFields: [
        { id: 'outcome', label: 'Outcome', type: 'select', required: false, options: ['Completed', 'Partially completed', 'Cancelled'] },
        { id: 'notes', label: 'Notes', type: 'long_text', required: false, options: [] },
      ],
    },
    sessions: [
      {
        id: uniqueId('session'),
        checkout: {
          at: checkoutAt,
          actor: MOCK_USERS[0],
          details: [
            { id: 'purpose', label: 'Purpose', value: 'Supply pickup', showInCurrentState: false },
            { id: 'expected-return', label: 'Expected return', value: 'This afternoon', showInCurrentState: true },
          ],
        },
        checkin: {
          at: checkinAt,
          actor: MOCK_USERS[1],
          details: [
          { label: 'Outcome', value: 'Completed' },
          { label: 'Notes', value: 'Everything returned in good order.' },
          ],
        },
      },
    ],
    resets: [],
  }
}

function migrateLegacyEvents(events = []) {
  const sessions = []
  const resets = []
  let openSession = null

  ;[...events]
    .sort((left, right) => new Date(left.occurredAt) - new Date(right.occurredAt))
    .forEach((event) => {
      if (event.type === 'reset') {
        const actor = event.actor ?? SYSTEM_USER
        resets.push({
          id: event.id,
          occurredAt: event.occurredAt,
          actor,
          allowanceSeconds: event.remainingAfter,
          kind: actor.id === SYSTEM_USER.id ? 'legacy-scheduled' : 'manual',
        })
        return
      }

      if (event.type === 'checkout') {
        openSession = {
          id: event.id.replace(/^event-/, 'session-'),
          checkout: { at: event.occurredAt, actor: event.actor, details: event.details ?? [] },
          checkin: null,
        }
        sessions.push(openSession)
        return
      }

      if (event.type === 'checkin' && openSession) {
        openSession.checkin = { at: event.occurredAt, actor: event.actor, details: event.details ?? [] }
        openSession = null
      }
    })

  return { sessions, resets }
}

function normalizeState(parsed) {
  const defaults = createDefaultState()
  const savedCheckoutFields = parsed?.settings?.checkoutFields ?? defaults.settings.checkoutFields
  const hasSessionSchema = Array.isArray(parsed?.sessions)
  const migrated = hasSessionSchema ? { sessions: parsed.sessions, resets: parsed.resets ?? [] } : migrateLegacyEvents(parsed?.events)

  return {
    schemaVersion: 2,
    currentUserId: parsed?.currentUserId ?? defaults.currentUserId,
    settings: {
      ...defaults.settings,
      ...parsed?.settings,
      checkoutFields: savedCheckoutFields.map((field, index) => ({
        ...field,
        showInCurrentState: field.showInCurrentState ?? index === 0,
      })),
      checkinFields: parsed?.settings?.checkinFields ?? defaults.settings.checkinFields,
    },
    sessions: hasSessionSchema || Array.isArray(parsed?.events) ? migrated.sessions : defaults.sessions,
    resets: hasSessionSchema || Array.isArray(parsed?.events)
      ? migrated.resets.map((reset) => ({
        ...reset,
        kind: reset.kind ?? (reset.actor?.id === SYSTEM_USER.id ? 'legacy-scheduled' : 'manual'),
      }))
      : defaults.resets,
  }
}

function readState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!saved) return createDefaultState()

    return normalizeState(JSON.parse(saved))
  } catch {
    return createDefaultState()
  }
}

function formatDuration(totalSeconds, showSign = false) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return `${showSign ? '+' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatRemaining(totalSeconds, format = 'clock') {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (format === 'words') return `${hours}h ${minutes}m`
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatElapsed(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const totalMinutes = Math.floor(safe / 60)
  if (safe > 0 && totalMinutes === 0) return '<1m'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

function sessionActivityAt(session) {
  return session.checkin?.at ?? session.checkout.at
}

function sortSessionsNewest(sessions) {
  return [...sessions].sort((left, right) => new Date(sessionActivityAt(right)) - new Date(sessionActivityAt(left)))
}

function getActiveSession(sessions) {
  return sortSessionsNewest(sessions.filter((session) => !session.checkin))[0] ?? null
}

function getSessionDuration(session, now = Date.now()) {
  const end = session.checkin ? new Date(session.checkin.at).getTime() : now
  return Math.max(0, Math.floor((end - new Date(session.checkout.at).getTime()) / 1000))
}

function getZonedDateTimeParts(timestamp, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp))
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]))
  return values
}

function zonedDateTimeToTimestamp(dateTime, timeZone) {
  const desiredAsUtc = Date.UTC(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hour, dateTime.minute, 0)
  let guess = desiredAsUtc

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = getZonedDateTimeParts(guess, timeZone)
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second)
    const correction = desiredAsUtc - actualAsUtc
    guess += correction
    if (correction === 0) break
  }

  return guess
}

function getScheduledPeriodStart(settings, targetTime) {
  const local = getZonedDateTimeParts(targetTime, settings.timezone)
  const [resetHour, resetMinute] = settings.resetTime.split(':').map(Number)
  const localWeekday = new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay()
  let daysBack = (localWeekday - settings.resetDay + 7) % 7
  const targetMinutes = local.hour * 60 + local.minute
  const resetMinutes = resetHour * 60 + resetMinute
  if (daysBack === 0 && targetMinutes < resetMinutes) daysBack = 7

  const resetCalendarDate = new Date(Date.UTC(local.year, local.month - 1, local.day - daysBack))
  return zonedDateTimeToTimestamp({
    year: resetCalendarDate.getUTCFullYear(),
    month: resetCalendarDate.getUTCMonth() + 1,
    day: resetCalendarDate.getUTCDate(),
    hour: resetHour,
    minute: resetMinute,
  }, settings.timezone)
}

function isManualReset(reset) {
  return reset.kind === 'manual' || (!reset.kind && reset.actor?.id !== SYSTEM_USER.id)
}

function getPeriodContext(state, targetTime) {
  const scheduledStartTime = getScheduledPeriodStart(state.settings, targetTime)
  const reset = [...state.resets]
    .filter((item) => isManualReset(item))
    .filter((item) => {
      const occurredAt = new Date(item.occurredAt).getTime()
      return occurredAt >= scheduledStartTime && occurredAt <= targetTime
    })
    .sort((left, right) => new Date(right.occurredAt) - new Date(left.occurredAt))[0]
  return {
    startTime: reset ? new Date(reset.occurredAt).getTime() : scheduledStartTime,
    allowanceSeconds: reset?.allowanceSeconds ?? Math.round(state.settings.weeklyHours * 3600),
  }
}

function getRemainingAt(state, targetTime, now = Date.now()) {
  const period = getPeriodContext(state, targetTime)
  const usedSeconds = state.sessions.reduce((total, session) => {
    const sessionStart = Math.max(new Date(session.checkout.at).getTime(), period.startTime)
    const sessionEnd = Math.min(session.checkin ? new Date(session.checkin.at).getTime() : now, targetTime)
    if (sessionEnd <= sessionStart) return total
    return total + Math.floor((sessionEnd - sessionStart) / 1000)
  }, 0)
  const raw = period.allowanceSeconds - usedSeconds
  return {
    allowance: period.allowanceSeconds,
    remaining: Math.max(0, raw),
    overtime: Math.max(0, -raw),
  }
}

function getTimerSnapshot(state, now = Date.now()) {
  const activeSession = getActiveSession(state.sessions)
  return { ...getRemainingAt(state, now, now), activeSession }
}

function getLatestActivityAt(state) {
  const values = [
    ...state.sessions.map((session) => sessionActivityAt(session)),
    ...state.resets.filter((reset) => isManualReset(reset)).map((reset) => reset.occurredAt),
  ].filter(Boolean)
  return values.sort((left, right) => new Date(right) - new Date(left))[0] ?? new Date().toISOString()
}

function findSessionConflict(candidate, sessions) {
  const candidateStart = new Date(candidate.checkout.at).getTime()
  const candidateEnd = candidate.checkin ? new Date(candidate.checkin.at).getTime() : Number.POSITIVE_INFINITY
  return sessions.find((session) => {
    if (session.id === candidate.id) return false
    const otherStart = new Date(session.checkout.at).getTime()
    const otherEnd = session.checkin ? new Date(session.checkin.at).getTime() : Number.POSITIVE_INFINITY
    return candidateStart < otherEnd && candidateEnd > otherStart
  }) ?? null
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function toDateTimeLocal(value) {
  const date = new Date(value)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function createHistoricalSessionDraft(state, actor, now = Date.now()) {
  const activeSession = getActiveSession(state.sessions)
  const latestPossibleEnd = activeSession
    ? new Date(activeSession.checkout.at).getTime()
    : Math.floor(now / 60000) * 60000
  const checkoutAt = new Date(latestPossibleEnd - 60 * 60 * 1000).toISOString()
  const checkinAt = new Date(latestPossibleEnd).toISOString()
  const detailsFromFields = (fields, includeCurrentState = false) => fields.map((field) => ({
    id: field.id,
    label: field.label,
    value: field.type === 'yes_no' ? false : '',
    ...(includeCurrentState ? { showInCurrentState: field.showInCurrentState ?? false } : {}),
  }))

  return {
    id: uniqueId('session'),
    checkout: {
      at: checkoutAt,
      actor,
      details: detailsFromFields(state.settings.checkoutFields, true),
    },
    checkin: {
      at: checkinAt,
      actor,
      details: detailsFromFields(state.settings.checkinFields),
    },
  }
}

function formatShortTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function detailsSummary(details) {
  const meaningful = details?.filter((item) => item.value !== '' && item.value !== undefined && item.value !== null)
  if (!meaningful?.length) return 'No additional details'
  return meaningful.map((item) => `${item.label}: ${typeof item.value === 'boolean' ? (item.value ? 'Yes' : 'No') : item.value}`).join(' · ')
}

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

  if (name === 'timer') return <svg {...common}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6M12 2v3"/></svg>
  if (name === 'activity') return <svg {...common}><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/></svg>
  if (name === 'settings') return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-2.12 2.12-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.08 1.65V20.5h-3v-.11a1.8 1.8 0 0 0-1.08-1.65 1.8 1.8 0 0 0-1.98.36l-.06.06-2.12-2.12.06-.06A1.8 1.8 0 0 0 6.76 15a1.8 1.8 0 0 0-1.65-1.08H5v-3h.11A1.8 1.8 0 0 0 6.76 9a1.8 1.8 0 0 0-.36-1.98l-.06-.06 2.12-2.12.06.06a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 11.58 3.6V3.5h3v.1a1.8 1.8 0 0 0 1.08 1.66 1.8 1.8 0 0 0 1.98-.36l.06-.06 2.12 2.12-.06.06A1.8 1.8 0 0 0 19.4 9a1.8 1.8 0 0 0 1.65 1.08h.11v3h-.11A1.8 1.8 0 0 0 19.4 15Z"/></svg>
  if (name === 'arrow') return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>
  if (name === 'log-out') return <svg {...common}><path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 17l5-5-5-5M19 12H8"/></svg>
  if (name === 'close') return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>
  if (name === 'plus') return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>
  if (name === 'edit') return <svg {...common}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"/></svg>
  if (name === 'trash') return <svg {...common}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>
  if (name === 'spark') return <svg {...common}><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3ZM18.5 15l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z"/></svg>
  return null
}

function Avatar({ user, small = false }) {
  return (
    <span className={`prototype-avatar ${small ? 'is-small' : ''}`} style={{ '--avatar-color': user.color }} aria-hidden="true">
      {user.initials}
    </span>
  )
}

function Navigation({ page, setPage, variant = 'sidebar' }) {
  return (
    <nav className={`prototype-nav prototype-nav-${variant}`} aria-label="Primary navigation">
      {NAV_ITEMS.map((item) => (
        <button
          type="button"
          key={item.id}
          className={page === item.id ? 'is-active' : ''}
          onClick={() => setPage(item.id)}
          aria-current={page === item.id ? 'page' : undefined}
        >
          <Icon name={item.icon} size={variant === 'bottom' ? 21 : 19} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="prototype-page-heading">
      <div>
        <div className="prototype-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SessionStatus({ active }) {
  return <span className={`prototype-session-status ${active ? 'is-active' : 'is-complete'}`}><small>Session</small><strong>{active ? 'In use' : 'Complete'}</strong></span>
}

function SessionCheckpoint({ checkpoint, label }) {
  if (!checkpoint) return <div className="prototype-session-checkpoint is-empty"><span>{label}</span><strong>Waiting for check-in</strong><small>The session is still active</small></div>
  return (
    <div className="prototype-session-checkpoint">
      <span>{label}</span>
      <div><Avatar user={checkpoint.actor} small /><div><strong>{checkpoint.actor.name}</strong><time dateTime={checkpoint.at}>{formatDateTime(checkpoint.at)}</time></div></div>
      <p>{detailsSummary(checkpoint.details)}</p>
    </div>
  )
}

function ActivityTable({ sessions, state, remainingFormat, now, label = 'Timer sessions', canManage = false, onEditSession }) {
  return (
    <div className={`prototype-session-table ${canManage ? 'has-actions' : ''}`} role="table" aria-label={label}>
      <div className="prototype-session-header" role="row">
        <span role="columnheader">Status</span>
        <span role="columnheader">Check out</span>
        <span role="columnheader">Check in</span>
        <span role="columnheader">Duration</span>
        <span className="prototype-session-remaining-heading" role="columnheader">Remaining</span>
        {canManage && <span role="columnheader" aria-label="Actions" />}
      </div>
      {sessions.map((session) => {
        const active = !session.checkin
        const targetTime = active ? now : new Date(session.checkin.at).getTime()
        const remaining = getRemainingAt(state, targetTime, now).remaining
        return (
          <article className={`prototype-session-row ${active ? 'is-active' : 'is-complete'}`} role="row" key={session.id}>
            <div className="prototype-session-state" role="cell"><SessionStatus active={active} /></div>
            <div role="cell"><SessionCheckpoint checkpoint={session.checkout} label="Checked out" /></div>
            <div role="cell"><SessionCheckpoint checkpoint={session.checkin} label="Checked in" /></div>
            <div className="prototype-session-metric" role="cell"><span>Duration</span><strong>{formatElapsed(getSessionDuration(session, now))}</strong><small>{active ? 'Live' : 'Final'}</small></div>
            <div className="prototype-session-metric is-remaining" role="cell"><span>Remaining</span><strong>{formatRemaining(remaining, remainingFormat)}</strong><small>After session</small></div>
            {canManage && (
              <div className="prototype-session-actions" role="cell">
                <button type="button" onClick={() => onEditSession(session.id)} aria-label={`Edit session from ${formatDateTime(session.checkout.at)}`} title="Edit session"><Icon name="edit" size={17} /></button>
              </div>
            )}
          </article>
        )
      })}
      {sessions.length === 0 && <div className="prototype-session-empty">No sessions match this view.</div>}
    </div>
  )
}

function RecentActivity({ state, onViewAll, remainingFormat, limit, now }) {
  const rowLimit = Math.max(1, Number(limit) || 5)
  const sessions = sortSessionsNewest(state.sessions)
  return (
    <section className="prototype-panel prototype-recent-panel">
      <div className="prototype-panel-heading">
        <div>
          <span className="prototype-kicker">Shared history</span>
          <h2>Recent sessions</h2>
          <p>Latest {Math.min(rowLimit, sessions.length)} of {sessions.length} checkout sessions</p>
        </div>
        <button type="button" className="prototype-text-button" onClick={onViewAll}>View all <Icon name="arrow" size={16} /></button>
      </div>
      <ActivityTable sessions={sessions.slice(0, rowLimit)} state={state} remainingFormat={remainingFormat} now={now} label="Recent timer sessions" />
    </section>
  )
}

function TimerPage({ state, snapshot, now, onAction, setPage }) {
  const { settings } = state
  const activeSession = snapshot.activeSession
  const isOut = Boolean(activeSession)
  const allowance = Math.max(1, snapshot.allowance)
  const remainingPercent = Math.max(0, Math.min(100, (snapshot.remaining / allowance) * 100))
  const checkedOutUser = activeSession?.checkout.actor
  const currentStateDetails = (activeSession?.checkout.details ?? []).filter((detail) => detail.showInCurrentState && detail.value !== '' && detail.value !== undefined && detail.value !== null)

  return (
    <>
      <PageHeading
        eyebrow="Shared weekly timer"
        title={isOut ? 'Currently checked out' : 'Ready when you are'}
        description={isOut && checkedOutUser ? `Started by ${checkedOutUser.name} at ${formatShortTime(activeSession.checkout.at)}` : 'The timer is paused and available to every member.'}
      >
        <div className={`prototype-live-pill ${isOut ? 'is-out' : 'is-in'}`}>
          <span /> {isOut ? 'Live' : 'Paused'}
        </div>
      </PageHeading>

      <div className="prototype-timer-grid">
        <section className={`prototype-timer-card ${isOut ? 'is-running' : ''}`}>
          <div className="prototype-timer-topline">
            <span>{snapshot.overtime > 0 ? 'Weekly limit reached' : 'Time remaining this week'}</span>
            <span className="prototype-week-chip">{Math.round(allowance / 360) / 10}h weekly</span>
          </div>

          <div className="prototype-countdown" aria-live="off" aria-label={`${formatDuration(snapshot.remaining)} remaining`}>
            {formatDuration(snapshot.remaining)}
          </div>

          {snapshot.overtime > 0 ? (
            <div className="prototype-over-limit">Over limit by {formatDuration(snapshot.overtime, true)}</div>
          ) : (
            <div className="prototype-progress-track" aria-hidden="true">
              <span style={{ width: `${remainingPercent}%` }} />
            </div>
          )}

          <div className="prototype-timer-meta">
            <span>{Math.round(100 - remainingPercent)}% used</span>
            <span>Resets {DAYS[settings.resetDay]} at {settings.resetTime}</span>
          </div>

          <button
            type="button"
            className={`prototype-primary-action ${isOut ? 'is-checkin' : 'is-checkout'}`}
            onClick={() => onAction(isOut ? 'checkin' : 'checkout')}
          >
            <span className="prototype-action-icon"><Icon name={isOut ? 'check' : 'log-out'} size={24} /></span>
            <span>
              <strong>{isOut ? 'Check in' : 'Check out'}</strong>
              <small>{isOut ? 'Stop the timer and add a note' : 'Start using this week’s allowance'}</small>
            </span>
            <Icon name="arrow" size={22} />
          </button>

          <div className="prototype-live-note">
            <span className="prototype-pulse-dot" />
            {isOut ? `Countdown refreshed ${formatShortTime(new Date(now).toISOString())}` : 'All members see the same status'}
          </div>
        </section>

        <aside className="prototype-side-stack">
          <section className="prototype-panel prototype-status-panel">
            <span className="prototype-kicker">Current state</span>
            <div className="prototype-state-icon"><Icon name={isOut ? 'timer' : 'check'} size={30} /></div>
            <h2>{isOut ? 'In use' : 'Checked in'}</h2>
            <p>{isOut ? 'Any member can check this back in. The acting user will be recorded.' : 'No time is being deducted from the weekly allowance.'}</p>
            {isOut && currentStateDetails.length > 0 && (
              <dl className="prototype-current-details">
                {currentStateDetails.map((detail) => (
                  <div key={detail.id}><dt>{detail.label}</dt><dd>{typeof detail.value === 'boolean' ? (detail.value ? 'Yes' : 'No') : detail.value}</dd></div>
                ))}
              </dl>
            )}
            <div className="prototype-state-detail">
              <span>Last change</span>
              <strong>{formatDateTime(getLatestActivityAt(state))}</strong>
            </div>
          </section>

          <section className="prototype-panel prototype-schedule-panel">
            <div className="prototype-schedule-icon"><Icon name="spark" size={20} /></div>
            <div>
              <span className="prototype-kicker">Automatic reset</span>
              <strong>{DAYS[settings.resetDay]} · {settings.resetTime}</strong>
              <small>{settings.timezone.replace('_', ' ')}</small>
            </div>
          </section>
        </aside>
      </div>

      <RecentActivity
        state={state}
        onViewAll={() => setPage('activity')}
        remainingFormat={settings.remainingFormat ?? 'clock'}
        limit={settings.recentActivityLimit ?? 5}
        now={now}
      />
    </>
  )
}

function ActivityPage({ state, remainingFormat, now, canManage, onEditSession, onAddSession }) {
  const [filter, setFilter] = useState('all')
  const sessions = sortSessionsNewest(state.sessions)
  const visibleSessions = filter === 'all' ? sessions : sessions.filter((session) => filter === 'active' ? !session.checkin : Boolean(session.checkin))

  return (
    <>
      <PageHeading eyebrow="Shared history" title="Activity" description="Each row is one complete checkout session, with its start and end kept together.">
        <div className="prototype-activity-heading-actions">
          <div className={`prototype-admin-pill ${canManage ? 'is-enabled' : ''}`}><Icon name={canManage ? 'edit' : 'settings'} size={15} /> {canManage ? 'Owner editing enabled' : 'Owner editing only'}</div>
          {canManage && <button type="button" className="prototype-secondary-button prototype-add-session-button" onClick={onAddSession}><Icon name="plus" size={17} /> Add session</button>}
        </div>
      </PageHeading>

      <section className="prototype-panel prototype-activity-panel">
        <div className="prototype-filter-row">
          {[
            ['all', 'All sessions'],
            ['completed', 'Completed'],
            ['active', 'In progress'],
          ].map(([value, label]) => (
            <button type="button" key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>

        <ActivityTable sessions={visibleSessions} state={state} remainingFormat={remainingFormat} now={now} canManage={canManage} onEditSession={onEditSession} />
      </section>
    </>
  )
}

function ChoiceOptionsEditor({ options, onChange }) {
  const [draft, setDraft] = useState('')

  const addDraft = (rawValue = draft) => {
    const additions = rawValue.split(',').map((item) => item.trim()).filter(Boolean)
    if (additions.length === 0) return
    onChange([...new Set([...options, ...additions])])
    setDraft('')
  }

  return (
    <div className="prototype-choice-editor">
      <div className="prototype-choice-chips">
        {options.map((option) => (
          <span key={option}>{option}<button type="button" onClick={() => onChange(options.filter((item) => item !== option))} aria-label={`Remove ${option}`}>×</button></span>
        ))}
      </div>
      <input
        value={draft}
        placeholder="Type a choice, then press Enter or comma"
        onChange={(event) => {
          const value = event.target.value
          if (value.includes(',')) addDraft(value)
          else setDraft(value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            addDraft()
          }
        }}
        onBlur={() => addDraft()}
      />
    </div>
  )
}

function FieldBuilder({ title, description, fields, onChange, kind, allowCurrentState = false }) {
  const addField = () => {
    onChange([
      ...fields,
      { id: uniqueId(kind), label: 'New field', type: 'short_text', required: false, showInCurrentState: false, options: [] },
    ])
  }

  const updateField = (id, patch) => {
    onChange(fields.map((field) => field.id === id ? { ...field, ...patch } : field))
  }

  return (
    <section className="prototype-panel prototype-form-builder">
      <div className="prototype-panel-heading">
        <div>
          <span className="prototype-kicker">Custom form</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button type="button" className="prototype-secondary-button" onClick={addField}><Icon name="plus" size={17} /> Add field</button>
      </div>

      <div className="prototype-field-list">
        {fields.length === 0 && <div className="prototype-empty-fields">No extra questions. The user can complete this action immediately.</div>}
        {fields.map((field, index) => (
          <div className="prototype-field-editor" key={field.id}>
            <span className="prototype-field-number">{index + 1}</span>
            <label>
              <span>Label</span>
              <input value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} />
            </label>
            <label>
              <span>Type</span>
              <select value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value })}>
                {FIELD_TYPES.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
              </select>
            </label>
            {field.type === 'select' && (
              <label className="prototype-options-field">
                <span>Choices</span>
                <ChoiceOptionsEditor options={field.options} onChange={(options) => updateField(field.id, { options })} />
              </label>
            )}
            <div className="prototype-field-toggles">
              <label className="prototype-checkbox-label">
                <input type="checkbox" checked={field.required} onChange={(event) => updateField(field.id, { required: event.target.checked })} />
                <span>Required</span>
              </label>
              {allowCurrentState && (
                <label className="prototype-checkbox-label">
                  <input type="checkbox" checked={field.showInCurrentState ?? false} onChange={(event) => updateField(field.id, { showInCurrentState: event.target.checked })} />
                  <span>Show in current state</span>
                </label>
              )}
            </div>
            <button type="button" className="prototype-icon-button is-danger" onClick={() => onChange(fields.filter((item) => item.id !== field.id))} aria-label={`Delete ${field.label}`}><Icon name="trash" size={17} /></button>
          </div>
        ))}
      </div>
    </section>
  )
}

function SettingsPage({ state, snapshot, setState, onStartNewWeek, onResetPrototype }) {
  const { settings } = state

  const updateSettings = (patch) => {
    setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
  }

  return (
    <>
      <PageHeading eyebrow="Owner controls" title="Settings" description="Changes are saved locally in this prototype. In the live app, only admins will see this page." />

      <div className="prototype-settings-grid">
        <section className="prototype-panel prototype-settings-card">
          <div className="prototype-panel-heading">
            <div>
              <span className="prototype-kicker">Allowance</span>
              <h2>Weekly timer</h2>
            </div>
          </div>
          <label className="prototype-big-input">
            <span>Hours available each week</span>
            <div><input type="number" min="1" max="168" step="0.5" value={settings.weeklyHours} onChange={(event) => updateSettings({ weeklyHours: Math.max(1, Number(event.target.value) || 1) })} /><strong>hours</strong></div>
          </label>
          <p className="prototype-help-copy">The current week uses {Math.round(snapshot.allowance / 360) / 10} hours. Changes apply immediately; start a new week to clear the time used so far.</p>
          <button type="button" className="prototype-secondary-button is-full" onClick={onStartNewWeek}><Icon name="spark" size={18} /> Start a new week now</button>
        </section>

        <section className="prototype-panel prototype-settings-card">
          <div className="prototype-panel-heading">
            <div>
              <span className="prototype-kicker">Schedule</span>
              <h2>Automatic reset</h2>
            </div>
          </div>
          <div className="prototype-two-fields">
            <label><span>Day</span><select value={settings.resetDay} onChange={(event) => updateSettings({ resetDay: Number(event.target.value) })}>{DAYS.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
            <label><span>Time</span><input type="time" value={settings.resetTime} onChange={(event) => updateSettings({ resetTime: event.target.value })} /></label>
          </div>
          <label><span>Time zone</span><select value={settings.timezone} onChange={(event) => updateSettings({ timezone: event.target.value })}><option>America/New_York</option><option>America/Chicago</option><option>America/Denver</option><option>America/Los_Angeles</option><option>UTC</option></select></label>
          <div className="prototype-schedule-preview"><Icon name="timer" size={18} /><span>Resets every <strong>{DAYS[settings.resetDay]}</strong> at <strong>{settings.resetTime}</strong></span></div>
        </section>

        <section className="prototype-panel prototype-settings-card">
          <div className="prototype-panel-heading">
            <div>
              <span className="prototype-kicker">Activity</span>
              <h2>History display</h2>
            </div>
          </div>
          <label className="prototype-settings-field">
            <span>Remaining-time format</span>
            <select value={settings.remainingFormat ?? 'clock'} onChange={(event) => updateSettings({ remainingFormat: event.target.value })}>
              <option value="clock">HH:MM · 18:42</option>
              <option value="words">Hours and minutes · 18h 42m</option>
            </select>
          </label>
          <label className="prototype-settings-field">
            <span>Rows shown on Timer page</span>
            <input type="number" min="1" max="20" value={settings.recentActivityLimit ?? 5} onChange={(event) => updateSettings({ recentActivityLimit: Math.max(1, Math.min(20, Number(event.target.value) || 1)) })} />
          </label>
          <div className="prototype-format-preview"><span>Preview</span><strong>{formatRemaining(snapshot.remaining, settings.remainingFormat ?? 'clock')}</strong></div>
        </section>
      </div>

      <FieldBuilder
        title="Check out questions"
        description="Information collected before the countdown starts."
        kind="checkout"
        allowCurrentState
        fields={settings.checkoutFields}
        onChange={(checkoutFields) => updateSettings({ checkoutFields })}
      />

      <FieldBuilder
        title="Check in questions"
        description="Information collected when the countdown stops."
        kind="checkin"
        fields={settings.checkinFields}
        onChange={(checkinFields) => updateSettings({ checkinFields })}
      />

      <section className="prototype-panel prototype-danger-zone">
        <div><span className="prototype-kicker">Prototype tools</span><h2>Reset local mock data</h2><p>Restore the sample timer, users, fields, and activity history.</p></div>
        <button type="button" className="prototype-danger-button" onClick={onResetPrototype}>Reset prototype</button>
      </section>
    </>
  )
}

function FieldInput({ field, value, onChange }) {
  if (field.type === 'long_text') return <textarea rows="4" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
  if (field.type === 'number') return <input type="number" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
  if (field.type === 'yes_no') {
    return (
      <div className="prototype-yes-no">
        <button type="button" className={value === true ? 'is-active' : ''} onClick={() => onChange(true)}>Yes</button>
        <button type="button" className={value === false ? 'is-active' : ''} onClick={() => onChange(false)}>No</button>
      </div>
    )
  }
  if (field.type === 'select') return <select value={value ?? ''} onChange={(event) => onChange(event.target.value)}><option value="">Choose one…</option>{field.options.map((option) => <option value={option} key={option}>{option}</option>)}</select>
  return <input type="text" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
}

function EditSessionSheet({ session, allSessions, state, remainingFormat, now, isNew = false, onClose, onSave, onDelete }) {
  const prepareDetails = (details = []) => details.map((detail, index) => ({
    ...detail,
    editorId: detail.id ?? `detail-${index}`,
    value: isNew
      ? detail.value
      : typeof detail.value === 'boolean' ? (detail.value ? 'Yes' : 'No') : String(detail.value ?? ''),
  }))
  const [checkoutAt, setCheckoutAt] = useState(() => toDateTimeLocal(session.checkout.at))
  const [checkoutActorId, setCheckoutActorId] = useState(session.checkout.actor.id)
  const [checkoutDetails, setCheckoutDetails] = useState(() => prepareDetails(session.checkout.details))
  const [checkinAt, setCheckinAt] = useState(() => session.checkin ? toDateTimeLocal(session.checkin.at) : '')
  const [checkinActorId, setCheckinActorId] = useState(session.checkin?.actor.id ?? MOCK_USERS[0].id)
  const [checkinDetails, setCheckinDetails] = useState(() => prepareDetails(session.checkin?.details))
  const [errors, setErrors] = useState({})
  const previewStart = new Date(checkoutAt).getTime()
  const previewEnd = session.checkin ? new Date(checkinAt).getTime() : now
  const previewRangeValid = Number.isFinite(previewStart) && Number.isFinite(previewEnd) && previewEnd > previewStart
  const previewSession = previewRangeValid ? {
    ...session,
    checkout: { ...session.checkout, at: new Date(previewStart).toISOString() },
    checkin: session.checkin ? { ...session.checkin, at: new Date(previewEnd).toISOString() } : null,
  } : null
  const previewConflict = previewSession ? findSessionConflict(previewSession, allSessions) : null
  const previewState = previewSession ? {
    ...state,
    sessions: isNew
      ? [...state.sessions, previewSession]
      : state.sessions.map((item) => item.id === session.id ? previewSession : item),
  } : state
  const previewRemaining = previewSession && !previewConflict ? getRemainingAt(previewState, previewEnd, now).remaining : null

  const updateDetail = (setter, editorId, patch) => {
    setter((current) => current.map((detail) => detail.editorId === editorId ? { ...detail, ...patch } : detail))
  }

  const cleanDetails = (details) => details
    .filter((detail) => detail.label.trim())
    .map((detail) => ({
      id: detail.id,
      label: detail.label.trim(),
      value: detail.value,
      ...(detail.showInCurrentState !== undefined ? { showInCurrentState: detail.showInCurrentState } : {}),
    }))

  const submit = (submitEvent) => {
    submitEvent.preventDefault()
    const checkoutDate = new Date(checkoutAt)
    const checkinDate = checkinAt ? new Date(checkinAt) : null
    const nextErrors = {}
    if (!checkoutAt || Number.isNaN(checkoutDate.getTime())) nextErrors.checkoutAt = 'Enter a valid check-out time.'
    if (session.checkin && (!checkinDate || Number.isNaN(checkinDate.getTime()))) nextErrors.checkinAt = 'Enter a valid check-in time.'
    if (!Number.isNaN(checkoutDate.getTime()) && checkoutDate.getTime() > now) nextErrors.checkoutAt = 'Check-out cannot be in the future.'
    if (checkinDate && !Number.isNaN(checkinDate.getTime()) && checkinDate.getTime() > now) nextErrors.checkinAt = 'Check-in cannot be in the future.'
    if (checkinDate && checkinDate <= checkoutDate) nextErrors.checkinAt = 'Check-in must occur after check-out.'
    if (isNew) {
      const validateRequiredDetails = (details, fields, endpoint) => {
        fields.forEach((field) => {
          const value = details.find((detail) => detail.id === field.id)?.value
          if (field.required && (value === undefined || value === null || value === '')) {
            nextErrors[`${endpoint}-${field.id}`] = 'This field is required.'
          }
        })
      }
      validateRequiredDetails(checkoutDetails, state.settings.checkoutFields, 'checkout')
      validateRequiredDetails(checkinDetails, state.settings.checkinFields, 'checkin')
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const candidate = {
      ...session,
      checkout: {
        at: checkoutDate.toISOString(),
        actor: MOCK_USERS.find((user) => user.id === checkoutActorId) ?? session.checkout.actor,
        details: cleanDetails(checkoutDetails),
      },
      checkin: session.checkin ? {
        at: checkinDate?.toISOString(),
        actor: MOCK_USERS.find((user) => user.id === checkinActorId) ?? session.checkin.actor,
        details: cleanDetails(checkinDetails),
      } : null,
    }

    const conflict = findSessionConflict(candidate, allSessions)
    if (conflict) {
      const conflictEnd = conflict.checkin ? formatDateTime(conflict.checkin.at) : 'still active'
      nextErrors.overlap = `This would overlap the session from ${formatDateTime(conflict.checkout.at)} to ${conflictEnd}.`
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onSave(candidate)
  }

  const renderDetails = (title, details, setter, configuredFields, endpoint) => details.length > 0 && (
    <div className="prototype-admin-details">
      <div><strong>{title}</strong><small>{isNew ? 'Complete the same questions used by the live workflow.' : 'Edit the values captured at this endpoint.'}</small></div>
      {isNew ? (
        <div className="prototype-manual-details-grid">
          {configuredFields.map((field) => {
            const detail = details.find((item) => item.id === field.id)
            if (!detail) return null
            const errorKey = `${endpoint}-${field.id}`
            return (
              <label className={`${errors[errorKey] ? 'has-error' : ''} ${field.type === 'long_text' ? 'is-wide' : ''}`} key={field.id}>
                <span>{field.label}{field.required && <em>Required</em>}</span>
                <FieldInput field={field} value={detail?.value} onChange={(value) => updateDetail(setter, detail.editorId, { value })} />
                {errors[errorKey] && <small>{errors[errorKey]}</small>}
              </label>
            )
          })}
        </div>
      ) : details.map((detail) => (
        <div className="prototype-admin-detail-row" key={detail.editorId}>
          <label><span>Field</span><input value={detail.label} onChange={(event) => updateDetail(setter, detail.editorId, { label: event.target.value })} /></label>
          <label><span>Value</span><input value={detail.value} onChange={(event) => updateDetail(setter, detail.editorId, { value: event.target.value })} /></label>
        </div>
      ))}
    </div>
  )

  return (
    <div className="prototype-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="prototype-action-sheet prototype-admin-sheet" role="dialog" aria-modal="true" aria-labelledby="edit-session-title">
        <div className={`prototype-sheet-accent ${session.checkin ? 'is-checkin' : 'is-checkout'}`} />
        <div className="prototype-sheet-header">
          <div className="prototype-action-icon"><Icon name="edit" size={22} /></div>
          <div>
            <span className="prototype-kicker">{isNew ? 'Historical activity' : 'Calendar-style correction'}</span>
            <h2 id="edit-session-title">{isNew ? 'Add checkout session' : 'Edit checkout session'}</h2>
            <p>{isNew ? 'Enter a complete check-out and check-in block from your paper log.' : 'Start, end, duration, and weekly balance stay synchronized as one event.'}</p>
          </div>
          <button type="button" className="prototype-icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={20} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="prototype-sheet-fields">
            <div className="prototype-edit-event-summary">
              <SessionStatus active={!session.checkin} />
              <div className="prototype-derived-preview">
                <span>Duration<strong>{previewRangeValid ? formatElapsed((previewEnd - previewStart) / 1000) : '—'}</strong></span>
                <span>Remaining<strong>{previewRemaining === null ? '—' : formatRemaining(previewRemaining, remainingFormat)}</strong></span>
              </div>
            </div>

            <section className="prototype-session-editor-section">
              <div><span className="prototype-kicker">Start</span><h3>Check out</h3></div>
              <div className="prototype-admin-two-fields">
                <label className={errors.checkoutAt ? 'has-error' : ''}><span>Date and time <em>Required</em></span><input type="datetime-local" step="60" value={checkoutAt} onChange={(event) => setCheckoutAt(event.target.value)} />{errors.checkoutAt && <small>{errors.checkoutAt}</small>}</label>
                <label><span>Member</span><select value={checkoutActorId} onChange={(event) => setCheckoutActorId(event.target.value)}>{MOCK_USERS.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select></label>
              </div>
              {renderDetails('Check-out details', checkoutDetails, setCheckoutDetails, state.settings.checkoutFields, 'checkout')}
            </section>

            <section className="prototype-session-editor-section">
              <div><span className="prototype-kicker">End</span><h3>Check in</h3></div>
              {session.checkin ? (
                <>
                  <div className="prototype-admin-two-fields">
                    <label className={errors.checkinAt ? 'has-error' : ''}><span>Date and time <em>Required</em></span><input type="datetime-local" step="60" value={checkinAt} onChange={(event) => setCheckinAt(event.target.value)} />{errors.checkinAt && <small>{errors.checkinAt}</small>}</label>
                    <label><span>Member</span><select value={checkinActorId} onChange={(event) => setCheckinActorId(event.target.value)}>{MOCK_USERS.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select></label>
                  </div>
                  {renderDetails('Check-in details', checkinDetails, setCheckinDetails, state.settings.checkinFields, 'checkin')}
                </>
              ) : <div className="prototype-session-open-note"><span className="prototype-pulse-dot" /> This session is active. Check in from the Timer page to create its end.</div>}
            </section>

            {errors.overlap && <div className="prototype-delete-guard"><Icon name="activity" size={17} /><span>{errors.overlap} Sessions may touch, but they cannot overlap.</span></div>}
            <div className="prototype-admin-warning"><Icon name="activity" size={17} /><span>Duration and remaining time are derived automatically. They are never directly editable.</span></div>
          </div>

          <div className={`prototype-sheet-actions prototype-admin-sheet-actions ${isNew ? 'is-create' : ''}`}>
            {!isNew && <button type="button" className="prototype-admin-delete-button" onClick={() => { if (window.confirm('Delete this entire checkout session? Both endpoints and their details will be removed.')) onDelete(session.id) }}><Icon name="trash" size={17} /> Delete session</button>}
            <div><button type="button" className="prototype-cancel-button" onClick={onClose}>Cancel</button><button type="submit" className="prototype-submit-button is-admin">{isNew ? 'Add session' : 'Save session'} <Icon name="check" size={18} /></button></div>
          </div>
        </form>
      </section>
    </div>
  )
}

function ActionSheet({ mode, fields, actor, onClose, onSubmit }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.filter((field) => field.type === 'yes_no').map((field) => [field.id, false])))
  const [errors, setErrors] = useState({})
  const isCheckout = mode === 'checkout'

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    fields.forEach((field) => {
      const value = values[field.id]
      if (field.required && (value === undefined || value === null || value === '')) nextErrors[field.id] = 'This field is required.'
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onSubmit(values)
  }

  return (
    <div className="prototype-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="prototype-action-sheet" role="dialog" aria-modal="true" aria-labelledby="action-sheet-title">
        <div className={`prototype-sheet-accent ${isCheckout ? 'is-checkout' : 'is-checkin'}`} />
        <div className="prototype-sheet-header">
          <div className="prototype-action-icon"><Icon name={isCheckout ? 'log-out' : 'check'} size={23} /></div>
          <div><span className="prototype-kicker">Acting as {actor.name}</span><h2 id="action-sheet-title">{isCheckout ? 'Check out' : 'Check in'}</h2><p>{isCheckout ? 'Add the requested details, then start the shared countdown.' : 'Add the requested details, then stop the shared countdown.'}</p></div>
          <button type="button" className="prototype-icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={20} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="prototype-sheet-fields">
            {fields.length === 0 && <div className="prototype-no-questions"><Icon name="check" size={20} /> No additional information is required.</div>}
            {fields.map((field) => (
              <label key={field.id} className={errors[field.id] ? 'has-error' : ''}>
                <span>{field.label}{field.required && <em>Required</em>}</span>
                <FieldInput field={field} value={values[field.id]} onChange={(value) => setValues((current) => ({ ...current, [field.id]: value }))} />
                {errors[field.id] && <small>{errors[field.id]}</small>}
              </label>
            ))}
          </div>
          <div className="prototype-sheet-actions">
            <button type="button" className="prototype-cancel-button" onClick={onClose}>Cancel</button>
            <button type="submit" className={`prototype-submit-button ${isCheckout ? 'is-checkout' : 'is-checkin'}`}>{isCheckout ? 'Start timer' : 'Stop timer'} <Icon name="arrow" size={18} /></button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function PrototypeApp() {
  const [state, setState] = useState(readState)
  const model = useMemo(() => normalizeState(state), [state])
  const [now, setNow] = useState(Date.now)
  const [page, setPageState] = useState(() => {
    const fromHash = window.location.hash.replace('#', '')
    return NAV_ITEMS.some((item) => item.id === fromHash) ? fromHash : 'timer'
  })
  const [activeAction, setActiveAction] = useState(null)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [newSessionDraft, setNewSessionDraft] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model))
  }, [model])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      const nextPage = window.location.hash.replace('#', '')
      if (NAV_ITEMS.some((item) => item.id === nextPage)) setPageState(nextPage)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const setPage = (nextPage) => {
    setPageState(nextPage)
    window.location.hash = nextPage
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentUser = MOCK_USERS.find((user) => user.id === model.currentUserId) ?? MOCK_USERS[0]
  const canManageActivity = currentUser.role === 'Owner'
  const editingSession = model.sessions.find((session) => session.id === editingSessionId)
  const snapshot = useMemo(() => getTimerSnapshot(model, now), [model, now])

  const completeAction = (values) => {
    const mode = activeAction
    const occurredAt = new Date().toISOString()
    const activeSession = getActiveSession(model.sessions)

    if (mode === 'checkout') {
      const conflict = findSessionConflict({ id: 'pending-session', checkout: { at: occurredAt }, checkin: null }, model.sessions)
      if (conflict) {
        setActiveAction(null)
        setToast('Check-out blocked — the new session would overlap existing history.')
        return
      }
    }

    if (mode === 'checkin' && (!activeSession || new Date(occurredAt) <= new Date(activeSession.checkout.at))) {
      setActiveAction(null)
      setToast('Check-in blocked — the end must occur after the session start.')
      return
    }

    setState((currentState) => {
      const current = normalizeState(currentState)
      const fields = mode === 'checkout' ? current.settings.checkoutFields : current.settings.checkinFields
      const details = fields.map((field) => ({
        id: field.id,
        label: field.label,
        value: values[field.id] ?? '',
        showInCurrentState: mode === 'checkout' && (field.showInCurrentState ?? false),
      }))

      if (mode === 'checkout') {
        if (getActiveSession(current.sessions)) return current
        const session = {
          id: uniqueId('session'),
          checkout: { at: occurredAt, actor: currentUser, details },
          checkin: null,
        }
        return { ...current, sessions: sortSessionsNewest([session, ...current.sessions]) }
      }

      const activeSession = getActiveSession(current.sessions)
      if (!activeSession) return current
      const sessions = current.sessions.map((session) => session.id === activeSession.id
        ? { ...session, checkin: { at: occurredAt, actor: currentUser, details } }
        : session)
      return { ...current, sessions: sortSessionsNewest(sessions) }
    })

    setActiveAction(null)
    setToast(mode === 'checkout' ? 'Checked out — the timer is running.' : 'Checked in — the timer is paused.')
  }

  const startNewWeek = () => {
    const occurredAt = new Date().toISOString()
    setState((currentState) => {
      const current = normalizeState(currentState)
      const allowanceSeconds = Math.round(current.settings.weeklyHours * 3600)
      const reset = {
        id: uniqueId('reset'),
        occurredAt,
        actor: currentUser,
        allowanceSeconds,
        kind: 'manual',
      }
      return { ...current, resets: [reset, ...current.resets] }
    })
    setToast('A new mock week has started.')
  }

  const saveEditedSession = (updatedSession) => {
    const invalidRange = updatedSession.checkin && new Date(updatedSession.checkin.at) <= new Date(updatedSession.checkout.at)
    const occursInFuture = new Date(updatedSession.checkout.at).getTime() > now || (updatedSession.checkin && new Date(updatedSession.checkin.at).getTime() > now)
    const conflict = findSessionConflict(updatedSession, model.sessions)
    if (invalidRange || occursInFuture || conflict) {
      setToast('Session not saved — correct the date conflict first.')
      return
    }

    setState((currentState) => {
      const current = normalizeState(currentState)
      const sessions = current.sessions.map((session) => session.id === updatedSession.id ? updatedSession : session)
      return { ...current, sessions: sortSessionsNewest(sessions) }
    })
    setEditingSessionId(null)
    setToast('Checkout session updated. Derived totals were recalculated.')
  }

  const addHistoricalSession = (newSession) => {
    const invalidRange = !newSession.checkin || new Date(newSession.checkin.at) <= new Date(newSession.checkout.at)
    const occursInFuture = new Date(newSession.checkout.at).getTime() > now || new Date(newSession.checkin.at).getTime() > now
    const conflict = findSessionConflict(newSession, model.sessions)
    if (invalidRange || occursInFuture || conflict) {
      setToast('Session not added — correct the date conflict first.')
      return
    }

    setState((currentState) => {
      const current = normalizeState(currentState)
      return { ...current, sessions: sortSessionsNewest([...current.sessions, newSession]) }
    })
    setNewSessionDraft(null)
    setToast('Historical checkout session added. Derived totals were recalculated.')
  }

  const deleteSession = (sessionId) => {
    setState((currentState) => {
      const current = normalizeState(currentState)
      return { ...current, sessions: current.sessions.filter((session) => session.id !== sessionId) }
    })
    setEditingSessionId(null)
    setToast('Checkout session deleted.')
  }

  const resetPrototype = () => {
    if (!window.confirm('Reset all local prototype changes and restore the sample data?')) return
    setState(createDefaultState())
    setPage('timer')
    setToast('Prototype restored to its starting state.')
  }

  return (
    <div className="prototype-app">
      <aside className="prototype-sidebar">
        <div className="prototype-brand"><span>XMB</span>task<small>shared workspace</small></div>
        <Navigation page={page} setPage={setPage} />
        <div className="prototype-sidebar-footer">
          <span>Prototype mode</span>
          <strong>Stored on this device only</strong>
        </div>
      </aside>

      <div className="prototype-mobile-header">
        <div className="prototype-brand"><span>XMB</span>task</div>
        <div className="prototype-mode-chip">Prototype</div>
      </div>

      <div className="prototype-app-body">
        <header className="prototype-topbar">
          <div className="prototype-sync-state"><span className="prototype-pulse-dot" /> Shared timer mock · Local only</div>
          <label className="prototype-user-switcher">
            <span>Acting as</span>
            <Avatar user={currentUser} small />
            <select value={model.currentUserId} onChange={(event) => setState((current) => ({ ...normalizeState(current), currentUserId: event.target.value }))} aria-label="Acting user">
              {MOCK_USERS.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
            </select>
          </label>
        </header>

        <Navigation page={page} setPage={setPage} variant="tablet" />

        <main className="prototype-main">
          {page === 'timer' && <TimerPage state={model} snapshot={snapshot} now={now} onAction={setActiveAction} setPage={setPage} />}
          {page === 'activity' && <ActivityPage state={model} remainingFormat={model.settings.remainingFormat} now={now} canManage={canManageActivity} onEditSession={setEditingSessionId} onAddSession={() => setNewSessionDraft(createHistoricalSessionDraft(model, currentUser, now))} />}
          {page === 'settings' && <SettingsPage state={model} snapshot={snapshot} setState={setState} onStartNewWeek={startNewWeek} onResetPrototype={resetPrototype} />}
        </main>
      </div>

      <Navigation page={page} setPage={setPage} variant="bottom" />

      {activeAction && (
        <ActionSheet
          mode={activeAction}
          fields={activeAction === 'checkout' ? model.settings.checkoutFields : model.settings.checkinFields}
          actor={currentUser}
          onClose={() => setActiveAction(null)}
          onSubmit={completeAction}
        />
      )}

      {editingSession && canManageActivity && (
        <EditSessionSheet
          session={editingSession}
          allSessions={model.sessions}
          state={model}
          remainingFormat={model.settings.remainingFormat}
          now={now}
          onClose={() => setEditingSessionId(null)}
          onSave={saveEditedSession}
          onDelete={deleteSession}
        />
      )}

      {newSessionDraft && canManageActivity && (
        <EditSessionSheet
          session={newSessionDraft}
          allSessions={model.sessions}
          state={model}
          remainingFormat={model.settings.remainingFormat}
          now={now}
          isNew
          onClose={() => setNewSessionDraft(null)}
          onSave={addHistoricalSession}
        />
      )}

      {toast && <div className="prototype-toast" role="status"><Icon name="check" size={18} /> {toast}</div>}
    </div>
  )
}
