import { useEffect, useMemo, useState } from 'react'
import './prototype.css'

const STORAGE_KEY = 'xmbtask-v2-prototype-v1'

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

function uniqueId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

function createDefaultState() {
  return {
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
    timer: {
      status: 'checked_in',
      allowanceSeconds: 20 * 60 * 60,
      remainingSeconds: 18 * 60 * 60 + 42 * 60,
      checkedOutAt: null,
      checkedOutBy: null,
      checkoutDetails: [],
      lastTransitionAt: minutesAgo(45),
    },
    events: [
      {
        id: uniqueId('event'),
        type: 'checkin',
        occurredAt: minutesAgo(45),
        actor: MOCK_USERS[1],
        remainingAfter: 18 * 60 * 60 + 42 * 60,
        details: [
          { label: 'Outcome', value: 'Completed' },
          { label: 'Notes', value: 'Everything returned in good order.' },
        ],
      },
      {
        id: uniqueId('event'),
        type: 'checkout',
        occurredAt: minutesAgo(123),
        actor: MOCK_USERS[0],
        remainingAfter: 20 * 60 * 60,
        details: [
          { label: 'Purpose', value: 'Supply pickup' },
          { label: 'Expected return', value: 'This afternoon' },
        ],
      },
      {
        id: uniqueId('event'),
        type: 'reset',
        occurredAt: minutesAgo(2 * 24 * 60),
        actor: { id: 'system', name: 'XMBtask', initials: 'XM', color: '#f3bd4e', role: 'System' },
        remainingAfter: 20 * 60 * 60,
        details: [{ label: 'Schedule', value: 'Weekly allowance renewed' }],
      },
    ],
  }
}

function readState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return createDefaultState()

    const defaults = createDefaultState()
    const parsed = JSON.parse(saved)
    const savedCheckoutFields = parsed.settings?.checkoutFields ?? defaults.settings.checkoutFields
    return {
      ...defaults,
      ...parsed,
      settings: {
        ...defaults.settings,
        ...parsed.settings,
        checkoutFields: savedCheckoutFields.map((field, index) => ({
          ...field,
          showInCurrentState: field.showInCurrentState ?? index === 0,
        })),
        checkinFields: parsed.settings?.checkinFields ?? defaults.settings.checkinFields,
      },
      timer: {
        ...defaults.timer,
        ...parsed.timer,
        checkoutDetails: parsed.timer?.checkoutDetails ?? [],
      },
    }
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

function buildActivityGroups(visibleEvents, allEvents, now = Date.now()) {
  const cycleByEvent = new Map()
  let openCheckout = null

  ;[...allEvents]
    .sort((left, right) => new Date(left.occurredAt) - new Date(right.occurredAt))
    .forEach((event) => {
      if (event.type === 'checkout') {
        openCheckout = event
        cycleByEvent.set(event.id, {
          id: event.id,
          status: 'open',
          durationSeconds: Math.max(0, Math.floor((now - new Date(event.occurredAt).getTime()) / 1000)),
        })
        return
      }

      if (event.type === 'checkin' && openCheckout) {
        const cycle = {
          id: openCheckout.id,
          status: 'complete',
          durationSeconds: Math.max(0, Math.floor((new Date(event.occurredAt) - new Date(openCheckout.occurredAt)) / 1000)),
        }
        cycleByEvent.set(openCheckout.id, cycle)
        cycleByEvent.set(event.id, cycle)
        openCheckout = null
      }
    })

  const groups = new Map()
  visibleEvents.forEach((event) => {
    const cycle = cycleByEvent.get(event.id)
    const groupId = cycle ? `cycle-${cycle.id}` : `event-${event.id}`
    if (!groups.has(groupId)) groups.set(groupId, { id: groupId, cycle, events: [] })
    groups.get(groupId).events.push(event)
  })

  return [...groups.values()].map((group) => ({
    ...group,
    events: [...group.events].sort((left, right) => new Date(left.occurredAt) - new Date(right.occurredAt)),
  }))
}

function getTimerSnapshot(timer, now = Date.now()) {
  if (timer.status !== 'checked_out' || !timer.checkedOutAt) {
    return { remaining: timer.remainingSeconds, overtime: 0 }
  }

  const elapsed = Math.max(0, Math.floor((now - new Date(timer.checkedOutAt).getTime()) / 1000))
  const raw = timer.remainingSeconds - elapsed
  return {
    remaining: Math.max(0, raw),
    overtime: Math.max(0, -raw),
  }
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatShortTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function actionLabel(type) {
  if (type === 'checkout') return 'Checked out'
  if (type === 'checkin') return 'Checked in'
  return 'Weekly reset'
}

function eventSummary(event) {
  const meaningful = event.details?.filter((item) => item.value !== '' && item.value !== undefined && item.value !== null)
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

function EventBadge({ type }) {
  return <span className={`prototype-event-badge is-${type}`}>{actionLabel(type)}</span>
}

function ActivityTable({ events, allEvents = events, remainingFormat, now, label = 'Timer activity' }) {
  const activityGroups = buildActivityGroups(events, allEvents, now)

  return (
    <div className="prototype-activity-table" role="table" aria-label={label}>
      <div className="prototype-activity-header" role="row">
        <span role="columnheader">Event</span>
        <span role="columnheader">Member</span>
        <span role="columnheader">Details</span>
        <span role="columnheader">Duration</span>
        <span role="columnheader">Remaining</span>
        <span role="columnheader">Date & time</span>
      </div>
      {activityGroups.map((group) => (
        <section className={`prototype-activity-group ${group.cycle ? 'is-cycle' : 'is-single'} ${group.cycle?.status === 'open' ? 'is-open' : ''}`} role="rowgroup" key={group.id}>
          {group.events.map((event, index) => (
            <article className="prototype-activity-row" role="row" key={event.id} style={{ '--activity-row': index + 1 }}>
              <div className={`prototype-activity-event is-${event.type}`} role="cell"><EventBadge type={event.type} /></div>
              <div className="prototype-member-cell" role="cell"><Avatar user={event.actor} small /><span><strong>{event.actor.name}</strong><small>{event.actor.role}</small></span></div>
              <div className="prototype-detail-cell" role="cell">{eventSummary(event)}</div>
              <div className="prototype-remaining-cell" role="cell">{formatRemaining(event.remainingAfter, remainingFormat)}</div>
              <time role="cell" dateTime={event.occurredAt}>{formatDateTime(event.occurredAt)}</time>
            </article>
          ))}
          <div className={`prototype-duration-cell ${group.cycle?.status === 'open' ? 'is-live' : ''}`} style={{ gridRow: `1 / span ${group.events.length}` }}>
            <span>Duration</span>
            <strong>{group.cycle ? formatElapsed(group.cycle.durationSeconds) : '—'}</strong>
            <small>{group.cycle?.status === 'open' ? 'In progress' : group.cycle ? 'Complete session' : 'Not applicable'}</small>
          </div>
        </section>
      ))}
    </div>
  )
}

function RecentActivity({ events, onViewAll, remainingFormat, limit, now }) {
  const rowLimit = Math.max(1, Number(limit) || 5)
  return (
    <section className="prototype-panel prototype-recent-panel">
      <div className="prototype-panel-heading">
        <div>
          <span className="prototype-kicker">Shared history</span>
          <h2>Recent activity</h2>
          <p>Latest {Math.min(rowLimit, events.length)} of {events.length} recorded events</p>
        </div>
        <button type="button" className="prototype-text-button" onClick={onViewAll}>View all <Icon name="arrow" size={16} /></button>
      </div>
      <ActivityTable events={events.slice(0, rowLimit)} allEvents={events} remainingFormat={remainingFormat} now={now} label="Recent timer activity" />
    </section>
  )
}

function TimerPage({ state, snapshot, now, onAction, setPage }) {
  const { timer, settings, events } = state
  const isOut = timer.status === 'checked_out'
  const allowance = Math.max(1, timer.allowanceSeconds)
  const remainingPercent = Math.max(0, Math.min(100, (snapshot.remaining / allowance) * 100))
  const checkedOutUser = MOCK_USERS.find((user) => user.id === timer.checkedOutBy)
  const latestCheckoutDetails = events.find((event) => event.type === 'checkout')?.details ?? []
  const rawCurrentDetails = timer.checkoutDetails?.length
    ? timer.checkoutDetails
    : latestCheckoutDetails.map((detail, index) => {
        const field = settings.checkoutFields.find((item) => item.id === detail.id || item.label === detail.label)
        return {
          ...detail,
          id: detail.id ?? field?.id ?? `legacy-detail-${index}`,
          showInCurrentState: field?.showInCurrentState ?? index === 0,
        }
      })
  const currentStateDetails = rawCurrentDetails.filter((detail) => detail.showInCurrentState && detail.value !== '' && detail.value !== undefined && detail.value !== null)

  return (
    <>
      <PageHeading
        eyebrow="Shared weekly timer"
        title={isOut ? 'Currently checked out' : 'Ready when you are'}
        description={isOut && checkedOutUser ? `Started by ${checkedOutUser.name} at ${formatShortTime(timer.checkedOutAt)}` : 'The timer is paused and available to every member.'}
      >
        <div className={`prototype-live-pill ${isOut ? 'is-out' : 'is-in'}`}>
          <span /> {isOut ? 'Live' : 'Paused'}
        </div>
      </PageHeading>

      <div className="prototype-timer-grid">
        <section className={`prototype-timer-card ${isOut ? 'is-running' : ''}`}>
          <div className="prototype-timer-topline">
            <span>{snapshot.overtime > 0 ? 'Weekly limit reached' : 'Time remaining this week'}</span>
            <span className="prototype-week-chip">{settings.weeklyHours}h weekly</span>
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
              <strong>{formatDateTime(timer.lastTransitionAt)}</strong>
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
        events={events}
        onViewAll={() => setPage('activity')}
        remainingFormat={settings.remainingFormat ?? 'clock'}
        limit={settings.recentActivityLimit ?? 5}
        now={now}
      />
    </>
  )
}

function ActivityPage({ events, remainingFormat, now }) {
  const [filter, setFilter] = useState('all')
  const visibleEvents = filter === 'all' ? events : events.filter((event) => event.type === filter)

  return (
    <>
      <PageHeading eyebrow="Shared history" title="Activity" description="Every timer transition is recorded with its user, time, and submitted details." />

      <section className="prototype-panel prototype-activity-panel">
        <div className="prototype-filter-row">
          {[
            ['all', 'All events'],
            ['checkout', 'Check outs'],
            ['checkin', 'Check ins'],
            ['reset', 'Resets'],
          ].map(([value, label]) => (
            <button type="button" key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>

        <ActivityTable events={visibleEvents} allEvents={events} remainingFormat={remainingFormat} now={now} />
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

function SettingsPage({ state, setState, onStartNewWeek, onResetPrototype }) {
  const { settings, timer } = state

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
          <p className="prototype-help-copy">The active timer currently uses {Math.round(timer.allowanceSeconds / 3600 * 10) / 10} hours. Start a new week to apply this value immediately.</p>
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
          <div className="prototype-format-preview"><span>Preview</span><strong>{formatRemaining(timer.remainingSeconds, settings.remainingFormat ?? 'clock')}</strong></div>
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
  const [now, setNow] = useState(() => new Date(state.timer.lastTransitionAt).getTime())
  const [page, setPageState] = useState(() => {
    const fromHash = window.location.hash.replace('#', '')
    return NAV_ITEMS.some((item) => item.id === fromHash) ? fromHash : 'timer'
  })
  const [activeAction, setActiveAction] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

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

  const currentUser = MOCK_USERS.find((user) => user.id === state.currentUserId) ?? MOCK_USERS[0]
  const snapshot = useMemo(() => getTimerSnapshot(state.timer, now), [state.timer, now])

  const completeAction = (values) => {
    const mode = activeAction
    const occurredAt = new Date().toISOString()

    setState((current) => {
      const currentSnapshot = getTimerSnapshot(current.timer)
      const fields = mode === 'checkout' ? current.settings.checkoutFields : current.settings.checkinFields
      const details = fields.map((field) => ({
        id: field.id,
        label: field.label,
        value: values[field.id] ?? '',
        showInCurrentState: mode === 'checkout' && (field.showInCurrentState ?? false),
      }))
      const event = {
        id: uniqueId('event'),
        type: mode,
        occurredAt,
        actor: currentUser,
        remainingAfter: currentSnapshot.remaining,
        details,
      }
      const timer = mode === 'checkout'
        ? { ...current.timer, status: 'checked_out', remainingSeconds: currentSnapshot.remaining, checkedOutAt: occurredAt, checkedOutBy: currentUser.id, checkoutDetails: details, lastTransitionAt: occurredAt }
        : { ...current.timer, status: 'checked_in', remainingSeconds: currentSnapshot.remaining, checkedOutAt: null, checkedOutBy: null, checkoutDetails: [], lastTransitionAt: occurredAt }
      return { ...current, timer, events: [event, ...current.events] }
    })

    setActiveAction(null)
    setToast(mode === 'checkout' ? 'Checked out — the timer is running.' : 'Checked in — the timer is paused.')
  }

  const startNewWeek = () => {
    const occurredAt = new Date().toISOString()
    setState((current) => {
      const allowanceSeconds = Math.round(current.settings.weeklyHours * 3600)
      const remainsOut = current.timer.status === 'checked_out'
      const event = {
        id: uniqueId('event'),
        type: 'reset',
        occurredAt,
        actor: currentUser,
        remainingAfter: allowanceSeconds,
        details: [{ label: 'Allowance', value: `${current.settings.weeklyHours} hours` }],
      }
      return {
        ...current,
        timer: {
          ...current.timer,
          allowanceSeconds,
          remainingSeconds: allowanceSeconds,
          checkedOutAt: remainsOut ? occurredAt : null,
          checkedOutBy: remainsOut ? current.timer.checkedOutBy : null,
          lastTransitionAt: occurredAt,
        },
        events: [event, ...current.events],
      }
    })
    setToast('A new mock week has started.')
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
            <select value={state.currentUserId} onChange={(event) => setState((current) => ({ ...current, currentUserId: event.target.value }))} aria-label="Acting user">
              {MOCK_USERS.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
            </select>
          </label>
        </header>

        <Navigation page={page} setPage={setPage} variant="tablet" />

        <main className="prototype-main">
          {page === 'timer' && <TimerPage state={state} snapshot={snapshot} now={now} onAction={setActiveAction} setPage={setPage} />}
          {page === 'activity' && <ActivityPage events={state.events} remainingFormat={state.settings.remainingFormat} now={now} />}
          {page === 'settings' && <SettingsPage state={state} setState={setState} onStartNewWeek={startNewWeek} onResetPrototype={resetPrototype} />}
        </main>
      </div>

      <Navigation page={page} setPage={setPage} variant="bottom" />

      {activeAction && (
        <ActionSheet
          mode={activeAction}
          fields={activeAction === 'checkout' ? state.settings.checkoutFields : state.settings.checkinFields}
          actor={currentUser}
          onClose={() => setActiveAction(null)}
          onSubmit={completeAction}
        />
      )}

      {toast && <div className="prototype-toast" role="status"><Icon name="check" size={18} /> {toast}</div>}
    </div>
  )
}
