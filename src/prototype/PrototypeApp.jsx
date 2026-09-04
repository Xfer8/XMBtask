import { useEffect, useMemo, useState } from 'react'
import './prototype.css'

const STORAGE_KEY = 'xmbtask-v2-prototype-v2'
const LEGACY_STORAGE_KEY = 'xmbtask-v2-prototype-v1'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DEFAULT_DEVICE_OPTIONS = ['Tablet', 'VR', 'TV', 'Laptop']
const LEGACY_DEFAULT_DEVICE_OPTIONS = ['Tablet', 'Phone', 'Laptop']

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
    schemaVersion: 3,
    currentUserId: 'brock',
    settings: {
      weeklyHours: 20,
      resetDay: 1,
      resetTime: '00:00',
      timezone: 'America/New_York',
      remainingFormat: 'clock',
      recentActivityLimit: 5,
      deviceOptions: DEFAULT_DEVICE_OPTIONS,
    },
    sessions: [
      {
        id: uniqueId('session'),
        checkout: {
          at: checkoutAt,
          actor: MOCK_USERS[0],
          details: [
            { id: 'device', label: 'Device', value: 'Tablet', showInCurrentState: true },
          ],
        },
        checkin: {
          at: checkinAt,
          actor: MOCK_USERS[1],
          details: [],
        },
      },
    ],
    resets: [],
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function createEmptyState() {
  return {
    ...createDefaultState(),
    currentUserId: null,
    sessions: [],
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

// eslint-disable-next-line react-refresh/only-export-components
export function normalizeState(parsed) {
  const defaults = createDefaultState()
  const rawCheckoutFields = parsed?.settings?.checkoutFields ?? []
  const legacyDeviceField = rawCheckoutFields.find((field) => field.id === 'device' || field.label?.trim().toLowerCase() === 'device')
  const savedSettings = { ...(parsed?.settings ?? {}) }
  delete savedSettings.checkoutFields
  delete savedSettings.checkinFields
  const hasSessionSchema = Array.isArray(parsed?.sessions)
  const migrated = hasSessionSchema ? { sessions: parsed.sessions, resets: parsed.resets ?? [] } : migrateLegacyEvents(parsed?.events)
  const savedDeviceOptions = parsed?.settings?.deviceOptions
  const usesLegacyDeviceDefaults = Array.isArray(savedDeviceOptions)
    && savedDeviceOptions.length === LEGACY_DEFAULT_DEVICE_OPTIONS.length
    && savedDeviceOptions.every((option, index) => option === LEGACY_DEFAULT_DEVICE_OPTIONS[index])
  const sessions = (hasSessionSchema || Array.isArray(parsed?.events) ? migrated.sessions : defaults.sessions).map((session) => {
    const device = getDeviceDetail(session)
    return {
      ...session,
      checkout: {
        ...session.checkout,
        details: device ? [{ id: 'device', label: 'Device', value: device.value, showInCurrentState: true }] : [],
      },
      checkin: session.checkin ? { ...session.checkin, details: [] } : null,
    }
  })

  return {
    schemaVersion: 3,
    currentUserId: parsed?.currentUserId ?? defaults.currentUserId,
    settings: {
      ...defaults.settings,
      ...savedSettings,
      deviceOptions: usesLegacyDeviceDefaults
        ? DEFAULT_DEVICE_OPTIONS
        : savedDeviceOptions ?? (legacyDeviceField?.options?.length ? legacyDeviceField.options : defaults.settings.deviceOptions),
    },
    sessions,
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

function getNextScheduledReset(settings, targetTime) {
  const periodStart = getScheduledPeriodStart(settings, targetTime)
  const periodStartParts = getZonedDateTimeParts(periodStart, settings.timezone)
  const [resetHour, resetMinute] = settings.resetTime.split(':').map(Number)
  const nextResetDate = new Date(Date.UTC(periodStartParts.year, periodStartParts.month - 1, periodStartParts.day + 7))

  return zonedDateTimeToTimestamp({
    year: nextResetDate.getUTCFullYear(),
    month: nextResetDate.getUTCMonth() + 1,
    day: nextResetDate.getUTCDate(),
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

function getCurrentPeriodDeviceUsage(state, now = Date.now()) {
  const period = getPeriodContext(state, now)
  const usage = Object.fromEntries(DEFAULT_DEVICE_OPTIONS.map((device) => [device, 0]))

  state.sessions.forEach((session) => {
    const device = getDeviceDetail(session)?.value
    const configuredDevice = DEFAULT_DEVICE_OPTIONS.find((option) => option.toLowerCase() === String(device).toLowerCase())
    if (!configuredDevice) return

    const sessionStart = Math.max(new Date(session.checkout.at).getTime(), period.startTime)
    const sessionEnd = Math.min(session.checkin ? new Date(session.checkin.at).getTime() : now, now)
    if (sessionEnd > sessionStart) usage[configuredDevice] += Math.floor((sessionEnd - sessionStart) / 1000)
  })

  return DEFAULT_DEVICE_OPTIONS.map((device) => ({ device, seconds: usage[device] }))
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
  return {
    id: uniqueId('session'),
    checkout: {
      at: checkoutAt,
      actor,
      details: [{ id: 'device', label: 'Device', value: '', showInCurrentState: true }],
    },
    checkin: {
      at: checkinAt,
      actor,
      details: [],
    },
  }
}

function formatShortTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatWeekday(value) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(value))
}

function formatNumericDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatResetDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date(value))
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

function DeviceIcon({ device, size = 34 }) {
  const normalizedDevice = device?.trim().toLowerCase() ?? ''
  const common = { width: size, height: size, fill: 'currentColor', 'aria-hidden': true }

  if (normalizedDevice === 'tablet') {
    return (
      <svg {...common} viewBox="350 505 145 180">
        <path fillRule="evenodd" d="M370.832 515.496C385.848 515.264 468.948 513.837 476.945 516.941C479.332 517.868 481.1 520.179 482.071 522.499C482.77 524.168 483.034 525.889 483.117 527.681C483.762 541.646 484.116 664.206 482.123 668.901C480.578 672.539 477.638 674.16 474.206 675.598C457.854 676.524 440.985 675.733 424.583 675.731C408.553 675.729 392.091 676.526 376.111 675.648C373.36 675.496 370.304 675.132 367.713 674.144C365.671 673.365 363.803 670.937 362.95 668.959C362.232 667.297 361.958 665.536 361.864 663.743C361.171 650.504 360.915 526.863 362.718 522.484C364.255 518.748 367.344 517.029 370.832 515.496ZM372.999 533.719L471.725 533.707L471.731 657.247L373.025 657.211L372.999 533.719ZM420.999 661.822C423.587 660.998 426.354 662.425 427.184 665.011C428.013 667.598 426.592 670.367 424.007 671.202C421.415 672.04 418.636 670.614 417.804 668.02C416.971 665.426 418.403 662.649 420.999 661.822Z" />
      </svg>
    )
  }

  if (normalizedDevice === 'tv') {
    return (
      <svg {...common} viewBox="745 510 210 170">
        <path fillRule="evenodd" d="M757.848 522.79C763.099 522.235 775.813 522.546 781.518 522.549L827.288 522.573L896.154 522.559C904.486 522.556 934.906 521.661 940.937 524.09C942.767 528.497 942.17 541.316 942.16 546.576L942.101 578.081L942.115 615.745C942.145 623.059 942.505 630.563 942.085 637.856C941.972 639.809 941.849 643.515 940.453 644.99C938.214 647.357 862.181 646.379 852.972 646.413L852.921 660.379L868.537 660.34C877.319 660.37 886.139 660.112 894.882 660.277C897.982 660.335 900.673 663.421 899.476 666.777C896.111 669.894 881.407 668.938 876.191 668.936L840.426 668.903L815.658 668.892C810.065 668.942 797.887 671.1 797.075 663.398C799.583 658.874 808.544 660.402 813.298 660.379L844.557 660.399L844.443 646.366L789.582 646.38C783.433 646.389 762.773 646.849 757.628 645.689C756.039 643.86 755.4 638.338 755.408 635.936C755.53 599.564 754.896 563.125 755.68 526.772C755.714 525.177 756.822 523.909 757.848 522.79ZM764.013 531.307L933.515 531.292C933.054 566.346 933.414 602.462 933.506 637.546C919.307 638.525 893.118 637.651 878.05 637.647L763.997 637.723L764.013 531.307Z" />
      </svg>
    )
  }

  if (normalizedDevice === 'laptop') {
    return (
      <svg {...common} viewBox="315 198 205 145">
        <path fillRule="evenodd" d="M351.145 209.308C388.821 208.275 427.067 210.057 464.802 209.154C474.216 208.929 489.669 206.94 490.764 219.933C491.672 230.713 491.294 241.8 491.275 252.648L491.284 314.063C495.59 313.959 502.652 313.532 506.665 314.311C507.688 315.096 508.093 315.055 508.054 316.533C507.635 332.482 492.486 330.432 481.715 330.296L383.994 330.259C371.345 330.254 358.789 330.301 346.042 330.406C338.662 330.468 328.939 330.922 325.899 321.923C324.923 319.034 323.907 317.014 325.906 314.44C329.059 313.625 337.904 313.99 341.569 314.039C341.974 299.981 340.12 222.971 342.996 216.156C344.534 212.514 347.665 210.718 351.145 209.308ZM353.759 221.001L479.082 221.075L479.098 297.691L353.79 297.759C354.212 272.59 353.949 246.225 353.759 221.001ZM401.877 310.964C406.073 310.912 428.256 310.113 430.594 311.585C431.068 313.939 430.591 315.161 430.018 317.449C426.103 318.243 405.576 318.538 403.053 316.713C401.741 314.718 401.925 313.317 401.877 310.964Z" />
      </svg>
    )
  }

  if (normalizedDevice === 'vr') {
    return (
      <svg {...common} viewBox="725 212 235 130">
        <path fillRule="evenodd" d="M781.93 223.573C783.379 223.504 784.829 223.455 786.28 223.426C811.652 223.074 837.389 223.526 862.846 223.357C876.349 223.991 893.403 222.038 906.344 224.353C920.692 226.921 926.816 243.578 925.392 256.473C924.903 260.896 925.796 266.227 925.417 270.637C924.189 284.89 928.193 302.501 922.24 315.68C914.428 331.426 895.943 329.234 881.189 329.082C865.94 329.306 860.137 329.339 852.98 314.488C851.803 312.414 850.58 310.298 848.291 309.319C830.029 302.843 833.077 324.42 819.793 328.17C817.391 328.848 813.812 329.382 811.325 329.186C799.43 328.247 783.306 331.534 772.703 325.513C766.931 322.225 762.765 316.71 761.18 310.26C758.752 300.678 760.372 258.566 760.363 246.232C760.361 243.706 762.556 237.841 764.126 235.472C768.747 228.499 773.976 225.427 781.93 223.573ZM783.458 232.823C785.408 232.749 787.359 232.706 789.311 232.695L865.199 232.618C877.63 232.613 891.146 232.097 903.529 233.352C906.2 233.623 909.253 235.663 911.133 237.581C913.193 239.659 914.621 242.279 915.249 245.136C917.586 255.936 915.234 275.553 915.919 287.289C917.855 320.437 910.09 319.998 881.27 319.63C853.811 319.754 869.138 309.251 851.543 300.48C832.594 291.034 825.215 311.788 816.688 319.135C814.792 320.768 782.202 320.156 777.518 317.296C769.404 312.34 768.967 302.459 769.511 293.439C773.281 275.096 759.537 239.078 783.458 232.823Z" />
        <path d="M786.264 243.87C797.941 243.032 896.542 242.913 900.707 244.888C902.672 245.82 903.788 248.348 904.318 250.312C905.456 254.533 905.166 290.907 904.692 296.384C904.542 298.121 904.317 300.278 903.347 301.763C902.778 302.634 902.687 302.468 901.769 302.709C900.996 302.254 899.984 301.567 899.935 300.571C899.286 287.392 899.927 274.084 899.784 260.884C899.741 256.862 899.991 253.013 899.214 249.098C895.646 248.44 891.864 248.609 888.239 248.615C857.027 248.673 825.811 248.476 794.601 248.675C792.047 248.691 789.158 249.039 786.708 249.759C782.454 258.909 789.531 298.213 783.033 303.562L784.075 303.04L782.031 302.62C779.168 298.531 781.261 263.721 780.633 256.599C780.065 250.153 780.957 247.482 786.264 243.87Z" />
        <path d="M814.529 255.834C816.695 256.257 817.192 256.595 817.413 258.784C815.725 263.171 802.012 276.026 797.927 279.589C795.837 279.268 795.799 278.893 795.257 277.169C796.478 273.092 810.749 259.648 814.529 255.834Z" />
        <path d="M745.438 251.384C748.163 251.237 751.43 251.28 754.204 251.244L754.254 260.567C751.432 260.447 747.959 260.032 745.619 261.487C744.408 265.274 743.825 288.759 746.129 291.301C748.412 292.394 751.595 292.002 754.207 291.917L754.162 301.161C735.412 301.712 734.933 294.21 735.558 277.883C736.002 266.282 732.08 256.519 745.438 251.384Z" />
        <path d="M931.297 251.263C950.167 250.912 950.194 258.713 949.692 274.987C949.356 285.877 953.298 296.861 939.967 301.094L931.322 301.2L931.302 291.975C934.068 292.04 937.652 292.415 939.899 290.966C940.931 288.813 940.629 272.579 941.124 268.521C942.027 261.113 937.378 260.477 931.27 260.547L931.297 251.263Z" />
      </svg>
    )
  }

  return <Icon name="timer" size={size} />
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
        {eyebrow && <div className="prototype-eyebrow">{eyebrow}</div>}
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

function getDeviceDetail(session) {
  return session?.checkout?.details?.find((detail) => detail.id === 'device' || detail.label?.trim().toLowerCase() === 'device')
}

function RemainingWheel({ remaining, allowance, compact = false }) {
  const ratio = allowance > 0 ? Math.max(0, Math.min(1, remaining / allowance)) : 0
  const percentage = Math.round(ratio * 100)
  const segmentMix = ratio <= 0.5 ? ratio * 200 : (ratio - 0.5) * 200
  const wheelColor = ratio <= 0.5
    ? `color-mix(in srgb, var(--prototype-yellow) ${segmentMix}%, var(--prototype-orange))`
    : `color-mix(in srgb, var(--prototype-green) ${segmentMix}%, var(--prototype-yellow))`
  return (
    <span
      className={`prototype-remaining-wheel ${compact ? 'is-compact' : ''}`}
      style={{ '--remaining-angle': `${ratio * 360}deg`, '--wheel-color': wheelColor }}
      role="img"
      aria-label={`${percentage}% of the weekly allowance remaining`}
    />
  )
}

function ActivityTable({ sessions, state, remainingFormat, now, label = 'Timer sessions', canManage = false, onEditSession }) {
  return (
    <div className="prototype-audit-table-wrap">
      <table className={`prototype-audit-table ${canManage ? 'has-actions' : ''}`} aria-label={label}>
        <colgroup>
          <col className="is-datetime" />
          <col className="is-member" />
          <col className="is-datetime" />
          <col className="is-member" />
          <col className="is-duration" />
          <col className="is-remaining" />
          {canManage && <col className="is-actions" />}
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Check out date &amp; time</th>
            <th scope="col">Check out user</th>
            <th scope="col">Check in date &amp; time</th>
            <th scope="col">Check in user</th>
            <th scope="col">Duration</th>
            <th scope="col">Time remaining</th>
            {canManage && <th scope="col"><span className="prototype-visually-hidden">Edit</span></th>}
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => {
            const active = !session.checkin
            const targetTime = active ? now : new Date(session.checkin.at).getTime()
            const balance = getRemainingAt(state, targetTime, now)
            return (
              <tr key={session.id}>
                <td><time dateTime={session.checkout.at}>{formatDateTime(session.checkout.at)}</time></td>
                <td className="prototype-audit-member">{session.checkout.actor.name}</td>
                <td>{session.checkin ? <time dateTime={session.checkin.at}>{formatDateTime(session.checkin.at)}</time> : <span className="prototype-audit-empty">Not checked in</span>}</td>
                <td className="prototype-audit-member">{session.checkin?.actor.name ?? <span className="prototype-audit-empty">—</span>}</td>
                <td className="prototype-audit-number">{formatElapsed(getSessionDuration(session, now))}</td>
                <td className="prototype-audit-number">{formatRemaining(balance.remaining, remainingFormat)}</td>
                {canManage && (
                  <td className="prototype-audit-actions">
                    <button type="button" onClick={() => onEditSession(session.id)} aria-label={`Edit session from ${formatDateTime(session.checkout.at)}`} title="Edit session"><Icon name="edit" size={17} /></button>
                  </td>
                )}
              </tr>
            )
          })}
          {sessions.length === 0 && <tr><td className="prototype-session-empty" colSpan={canManage ? 7 : 6}>No sessions match this view.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function SessionDayTimeline({ session, sessions, now }) {
  const calendarDay = new Date(session.checkout.at)
  calendarDay.setHours(0, 0, 0, 0)
  const timelineStart = new Date(calendarDay)
  timelineStart.setHours(6, 0, 0, 0)
  const timelineEnd = new Date(calendarDay)
  timelineEnd.setDate(timelineEnd.getDate() + 1)
  const startTime = timelineStart.getTime()
  const endTime = timelineEnd.getTime()
  const timelineLength = endTime - startTime
  const active = !session.checkin
  const segments = sessions
    .filter((item) => {
      const itemStart = new Date(item.checkout.at).getTime()
      const itemEnd = item.checkin ? new Date(item.checkin.at).getTime() : now
      return itemStart < endTime && itemEnd > startTime
    })
    .map((item) => {
      const itemStart = Math.max(new Date(item.checkout.at).getTime(), startTime)
      const itemEnd = Math.min(item.checkin ? new Date(item.checkin.at).getTime() : now, endTime)
      const left = ((itemStart - startTime) / timelineLength) * 100
      const rawWidth = ((itemEnd - itemStart) / timelineLength) * 100
      const width = Math.min(100 - left, Math.max(rawWidth, 1))
      const device = getDeviceDetail(item)?.value || 'Unspecified device'
      return { item, left, width, device }
    })

  return (
    <div className="prototype-card-timeline">
      <div className="prototype-timeline-heading">
        <span>Start time: <time dateTime={session.checkout.at}>{formatShortTime(session.checkout.at)}</time></span>
        <span>End time: <time dateTime={session.checkin?.at}>{session.checkin ? formatShortTime(session.checkin.at) : 'In progress'}</time></span>
      </div>
      <div className="prototype-timeline-labels" aria-hidden="true"><span>6a</span><span>12p</span><span>6p</span><span>12a</span></div>
      <div className="prototype-day-track" role="img" aria-label={`Sessions from 6 AM to midnight on ${formatNumericDate(calendarDay)}`}>
        <i style={{ left: '33.333%' }} /><i style={{ left: '66.667%' }} />
        {segments.map(({ item, left, width, device }) => {
          const isCurrent = item.id === session.id
          const endLabel = item.checkin ? formatShortTime(item.checkin.at) : 'now'
          return <span className={`prototype-day-segment ${isCurrent ? `is-current ${active ? 'is-active' : 'is-complete'}` : 'is-muted'}`} style={{ left: `${left}%`, width: `${width}%` }} title={`${device}: ${formatShortTime(item.checkout.at)}–${endLabel}`} key={item.id} />
        })}
      </div>
    </div>
  )
}

function RecentSessionCard({ session, state, remainingFormat, now }) {
  const active = !session.checkin
  const targetTime = active ? now : new Date(session.checkin.at).getTime()
  const balance = getRemainingAt(state, targetTime, now)
  const device = getDeviceDetail(session)?.value || 'Unspecified device'

  return (
    <article className={`prototype-recent-session-card ${active ? 'is-active' : 'is-complete'}`}>
      <header>
        <span className="prototype-session-title-dot" />
        <h3>Session: <strong>{device}</strong> <span>— {active ? 'Active' : 'Complete'}</span></h3>
      </header>
      <div className="prototype-recent-session-body">
        <div className="prototype-card-metric">
          <span>Duration</span>
          <strong>{formatElapsed(getSessionDuration(session, now))}</strong>
          <small>{active ? 'Counting now' : 'Final'}</small>
        </div>
        <div className="prototype-card-metric prototype-card-remaining">
          <div><span>Remaining</span><strong>{formatRemaining(balance.remaining, remainingFormat)}</strong><small>Weekly allowance</small></div>
          <RemainingWheel remaining={balance.remaining} allowance={balance.allowance} />
        </div>
        <SessionDayTimeline session={session} sessions={state.sessions} now={now} />
        <div className="prototype-card-activity">
          <span>Activity</span>
          <div className="prototype-card-checkout-date">
            <strong>{formatWeekday(session.checkout.at)}</strong>
            <time dateTime={session.checkout.at}>{formatNumericDate(session.checkout.at)}</time>
          </div>
        </div>
      </div>
    </article>
  )
}

function RecentActivity({ state, onViewAll, remainingFormat, limit, now }) {
  const rowLimit = Math.max(1, Number(limit) || 5)
  const sessions = sortSessionsNewest(state.sessions)
  return (
    <section className="prototype-recent-section">
      <div className="prototype-recent-heading">
        <div>
          <h2>Recent sessions</h2>
        </div>
        <button type="button" className="prototype-text-button" onClick={onViewAll}>View all <Icon name="arrow" size={16} /></button>
      </div>
      <div className="prototype-recent-session-list">
        {sessions.slice(0, rowLimit).map((session) => <RecentSessionCard session={session} state={state} remainingFormat={remainingFormat} now={now} key={session.id} />)}
        {sessions.length === 0 && <div className="prototype-session-empty">No checkout sessions yet.</div>}
      </div>
    </section>
  )
}

function DeviceUsageChart({ state, now, activeDevice }) {
  const usage = getCurrentPeriodDeviceUsage(state, now)
  const highestUsage = Math.max(...usage.map((item) => item.seconds), 0)

  return (
    <section className="prototype-panel prototype-usage-panel" aria-labelledby="device-usage-title">
      <div className="prototype-usage-heading">
        <span className="prototype-kicker" id="device-usage-title">Device usage (hours)</span>
        <small>This week</small>
      </div>
      <div className="prototype-device-chart">
        {usage.map(({ device, seconds }) => {
          const relativeHeight = highestUsage > 0 ? (seconds / highestUsage) * 100 : 0
          const isActive = activeDevice?.toLowerCase() === device.toLowerCase()
          return (
            <div className={`prototype-device-bar ${isActive ? 'is-active' : ''}`} key={device} title={`${device}: ${formatElapsed(seconds)} this week`}>
              <strong className="prototype-device-hours">{(seconds / 3600).toFixed(1)}</strong>
              <div className="prototype-device-bar-track" aria-label={`${device}: ${formatElapsed(seconds)} this week`} role="img">
                <span style={{ height: `${relativeHeight}%` }} />
              </div>
              <DeviceIcon device={device} size={24} />
              <span className="prototype-visually-hidden">{device}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TimerPage({ state, snapshot, now, onAction, setPage }) {
  const { settings } = state
  const activeSession = snapshot.activeSession
  const latestSession = sortSessionsNewest(state.sessions)[0] ?? null
  const displayedSession = activeSession ?? latestSession
  const isOut = Boolean(activeSession)
  const displayedDevice = getDeviceDetail(displayedSession)?.value || 'No device recorded'
  const allowance = Math.max(1, snapshot.allowance)
  const remainingPercent = Math.max(0, Math.min(100, (snapshot.remaining / allowance) * 100))
  const nextScheduledReset = getNextScheduledReset(settings, now)

  return (
    <>
      <PageHeading title="Weekly device timer" />

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
            <span>{Math.round(remainingPercent)}% remaining</span>
            <span>Resets {formatWeekday(nextScheduledReset)}, {formatResetDate(nextScheduledReset)}</span>
          </div>

          <button
            type="button"
            className={`prototype-primary-action ${isOut ? 'is-checkin' : 'is-checkout'}`}
            onClick={() => onAction(isOut ? 'checkin' : 'checkout')}
          >
            <span className="prototype-action-icon"><Icon name={isOut ? 'check' : 'log-out'} size={24} /></span>
            <span>
              <strong>{isOut ? 'Check in' : 'Check out'}</strong>
              <small>{isOut ? 'Stop this session and return the device' : 'Start using this week’s allowance'}</small>
            </span>
            <Icon name="arrow" size={22} />
          </button>

          {isOut && (
            <div className="prototype-live-note">
              <span className="prototype-pulse-dot" />
              Countdown refreshed {formatShortTime(new Date(now).toISOString())}
            </div>
          )}
        </section>

        <aside className="prototype-side-stack">
          <section className="prototype-panel prototype-status-panel">
            <span className="prototype-kicker">Status</span>
            <div className="prototype-current-device-summary">
              <div className={`prototype-state-icon ${isOut ? 'is-active' : ''}`}><DeviceIcon device={displayedDevice} size={102} /></div>
              <div className="prototype-current-device-heading">
                <h2>{displayedDevice}</h2>
                <strong className={`prototype-device-state ${isOut ? 'is-active' : ''}`}>{isOut ? 'Checked out' : 'Checked in'}</strong>
              </div>
            </div>
            <div className="prototype-state-detail">
              <span>Last update:</span>
              <strong>{displayedSession ? formatDateTime(sessionActivityAt(displayedSession)) : 'No activity yet'}</strong>
            </div>
          </section>

          <DeviceUsageChart state={state} now={now} activeDevice={isOut ? displayedDevice : null} />
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

function SettingsPage({ state, snapshot, setState, onStartNewWeek, onResetPrototype, live = false }) {
  const { settings } = state

  const updateSettings = (patch) => {
    setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
  }

  return (
    <>
      <PageHeading eyebrow="Owner controls" title="Settings" description={live ? 'Changes are synchronized to the shared workspace.' : 'Changes are saved locally in this prototype. In the live app, only admins will see this page.'} />

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

      <section className="prototype-panel prototype-form-builder">
        <div className="prototype-panel-heading">
          <div>
            <span className="prototype-kicker">Required identity</span>
            <h2>Device choices</h2>
            <p>Device is the only information requested at check out. You can change its choices, but the field itself cannot be removed.</p>
          </div>
          <div className="prototype-admin-pill is-enabled"><Icon name="check" size={15} /> Always enabled</div>
        </div>
        <div className="prototype-device-options-editor">
          <label>
            <span>Available devices</span>
            <ChoiceOptionsEditor
              options={settings.deviceOptions}
              onChange={(deviceOptions) => { if (deviceOptions.length > 0) updateSettings({ deviceOptions }) }}
            />
            <small>At least one device choice is required.</small>
          </label>
        </div>
      </section>

      {!live && (
        <section className="prototype-panel prototype-danger-zone">
          <div><span className="prototype-kicker">Prototype tools</span><h2>Reset local mock data</h2><p>Restore the sample timer, users, settings, and activity history.</p></div>
          <button type="button" className="prototype-danger-button" onClick={onResetPrototype}>Reset prototype</button>
        </section>
      )}
    </>
  )
}

function EditSessionSheet({ session, allSessions, members, state, remainingFormat, now, isNew = false, onClose, onSave, onDelete }) {
  const [checkoutAt, setCheckoutAt] = useState(() => toDateTimeLocal(session.checkout.at))
  const [checkoutActorId, setCheckoutActorId] = useState(session.checkout.actor.id)
  const [checkoutDevice, setCheckoutDevice] = useState(() => getDeviceDetail(session)?.value ?? '')
  const [checkinAt, setCheckinAt] = useState(() => session.checkin ? toDateTimeLocal(session.checkin.at) : '')
  const [checkinActorId, setCheckinActorId] = useState(session.checkin?.actor.id ?? members[0]?.id ?? session.checkout.actor.id)
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
    if (!checkoutDevice) nextErrors.device = 'Choose a device.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const candidate = {
      ...session,
      checkout: {
        at: checkoutDate.toISOString(),
        actor: members.find((user) => user.id === checkoutActorId) ?? session.checkout.actor,
        details: [{ id: 'device', label: 'Device', value: checkoutDevice, showInCurrentState: true }],
      },
      checkin: session.checkin ? {
        at: checkinDate?.toISOString(),
        actor: members.find((user) => user.id === checkinActorId) ?? session.checkin.actor,
        details: [],
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
              <div className="prototype-admin-three-fields">
                <label className={errors.checkoutAt ? 'has-error' : ''}><span>Date and time <em>Required</em></span><input type="datetime-local" step="60" value={checkoutAt} onChange={(event) => setCheckoutAt(event.target.value)} />{errors.checkoutAt && <small>{errors.checkoutAt}</small>}</label>
                <label><span>Member</span><select value={checkoutActorId} onChange={(event) => setCheckoutActorId(event.target.value)}>{members.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select></label>
                <label className={errors.device ? 'has-error' : ''}><span>Device <em>Required</em></span><select value={checkoutDevice} onChange={(event) => setCheckoutDevice(event.target.value)}><option value="">Choose one…</option>{state.settings.deviceOptions.map((device) => <option value={device} key={device}>{device}</option>)}</select>{errors.device && <small>{errors.device}</small>}</label>
              </div>
            </section>

            <section className="prototype-session-editor-section">
              <div><span className="prototype-kicker">End</span><h3>Check in</h3></div>
              {session.checkin ? (
                <div className="prototype-admin-two-fields">
                  <label className={errors.checkinAt ? 'has-error' : ''}><span>Date and time <em>Required</em></span><input type="datetime-local" step="60" value={checkinAt} onChange={(event) => setCheckinAt(event.target.value)} />{errors.checkinAt && <small>{errors.checkinAt}</small>}</label>
                  <label><span>Member</span><select value={checkinActorId} onChange={(event) => setCheckinActorId(event.target.value)}>{members.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}</select></label>
                </div>
              ) : <div className="prototype-session-open-note"><span className="prototype-pulse-dot" /> This session is active. Check in from the Timer page to create its end.</div>}
            </section>

            {errors.overlap && <div className="prototype-delete-guard"><Icon name="activity" size={17} /><span>{errors.overlap} Sessions may touch, but they cannot overlap.</span></div>}
            <div className="prototype-admin-warning"><Icon name="activity" size={17} /><span>Duration and remaining time are derived automatically. They are never directly editable.</span></div>
          </div>

          <div className={`prototype-sheet-actions prototype-admin-sheet-actions ${isNew ? 'is-create' : ''}`}>
            {!isNew && <button type="button" className="prototype-admin-delete-button" onClick={() => { if (window.confirm('Delete this entire checkout session? Both check-out and check-in records will be removed.')) onDelete(session.id) }}><Icon name="trash" size={17} /> Delete session</button>}
            <div><button type="button" className="prototype-cancel-button" onClick={onClose}>Cancel</button><button type="submit" className="prototype-submit-button is-admin">{isNew ? 'Add session' : 'Save session'} <Icon name="check" size={18} /></button></div>
          </div>
        </form>
      </section>
    </div>
  )
}

function ActionSheet({ mode, deviceOptions, actor, onClose, onSubmit }) {
  const [device, setDevice] = useState('')
  const [error, setError] = useState('')
  const isCheckout = mode === 'checkout'

  const submit = (event) => {
    event.preventDefault()
    if (isCheckout && !device) {
      setError('Choose a device.')
      return
    }
    onSubmit(isCheckout ? { device } : {})
  }

  return (
    <div className="prototype-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="prototype-action-sheet" role="dialog" aria-modal="true" aria-labelledby="action-sheet-title">
        <div className={`prototype-sheet-accent ${isCheckout ? 'is-checkout' : 'is-checkin'}`} />
        <div className="prototype-sheet-header">
          <div className="prototype-action-icon"><Icon name={isCheckout ? 'log-out' : 'check'} size={23} /></div>
          <div><span className="prototype-kicker">Acting as {actor.name}</span><h2 id="action-sheet-title">{isCheckout ? 'Check out' : 'Check in'}</h2><p>{isCheckout ? 'Choose the device, then start the shared countdown.' : 'Confirm the device has been returned and stop the shared countdown.'}</p></div>
          <button type="button" className="prototype-icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={20} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="prototype-sheet-fields">
            {isCheckout ? (
              <label className={error ? 'has-error' : ''}>
                <span>Device <em>Required</em></span>
                <select value={device} onChange={(event) => { setDevice(event.target.value); setError('') }}><option value="">Choose one…</option>{deviceOptions.map((option) => <option value={option} key={option}>{option}</option>)}</select>
                {error && <small>{error}</small>}
              </label>
            ) : <div className="prototype-no-questions"><Icon name="check" size={20} /> Ready to check in.</div>}
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

export default function PrototypeApp({
  live = false,
  initialState = null,
  setSharedState = null,
  currentUser: liveUser = null,
  canManageActivity: liveCanManage = false,
  syncStatus = 'Local only',
  onSignOut = null,
} = {}) {
  const [localState, setLocalState] = useState(readState)
  const state = live ? initialState : localState
  const setState = live ? setSharedState : setLocalState
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
    if (live) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model))
  }, [live, model])

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

  const currentUser = live ? liveUser : (MOCK_USERS.find((user) => user.id === model.currentUserId) ?? MOCK_USERS[0])
  const canManageActivity = live ? liveCanManage : currentUser.role === 'Owner'
  const members = useMemo(() => {
    if (!live) return MOCK_USERS
    const knownMembers = [currentUser]
    model.sessions.forEach((session) => {
      ;[session.checkout?.actor, session.checkin?.actor].filter(Boolean).forEach((actor) => {
        if (!knownMembers.some((member) => member.id === actor.id)) knownMembers.push(actor)
      })
    })
    return knownMembers
  }, [currentUser, live, model.sessions])
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
      const details = mode === 'checkout'
        ? [{ id: 'device', label: 'Device', value: values.device, showInCurrentState: true }]
        : []

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
    setToast(live ? 'A new week has started.' : 'A new mock week has started.')
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
          <span>{live ? 'Private workspace' : 'Prototype mode'}</span>
          <strong>{live ? 'Firebase secured' : 'Stored on this device only'}</strong>
        </div>
      </aside>

      <div className="prototype-mobile-header">
        <div className="prototype-brand"><span>XMB</span>task</div>
        <div className="prototype-mode-chip">{live ? 'Live' : 'Prototype'}</div>
      </div>

      <div className="prototype-app-body">
        <header className="prototype-topbar">
          <div className="prototype-sync-state"><span className="prototype-pulse-dot" /> {live ? `Shared timer · ${syncStatus}` : 'Shared timer mock · Local only'}</div>
          {live ? (
            <div className="prototype-live-user">
              <Avatar user={currentUser} small />
              <strong>{currentUser.name}</strong>
              <button type="button" onClick={onSignOut}>Sign out</button>
            </div>
          ) : (
            <label className="prototype-user-switcher">
              <span>Acting as</span>
              <Avatar user={currentUser} small />
              <select value={model.currentUserId} onChange={(event) => setState((current) => ({ ...normalizeState(current), currentUserId: event.target.value }))} aria-label="Acting user">
                {MOCK_USERS.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
              </select>
            </label>
          )}
        </header>

        <Navigation page={page} setPage={setPage} variant="tablet" />

        <main className="prototype-main">
          {page === 'timer' && <TimerPage state={model} snapshot={snapshot} now={now} onAction={setActiveAction} setPage={setPage} />}
          {page === 'activity' && <ActivityPage state={model} remainingFormat={model.settings.remainingFormat} now={now} canManage={canManageActivity} onEditSession={setEditingSessionId} onAddSession={() => setNewSessionDraft(createHistoricalSessionDraft(model, currentUser, now))} />}
          {page === 'settings' && <SettingsPage state={model} snapshot={snapshot} setState={setState} onStartNewWeek={startNewWeek} onResetPrototype={resetPrototype} live={live} />}
        </main>
      </div>

      <Navigation page={page} setPage={setPage} variant="bottom" />

      {activeAction && (
        <ActionSheet
          mode={activeAction}
          deviceOptions={model.settings.deviceOptions}
          actor={currentUser}
          onClose={() => setActiveAction(null)}
          onSubmit={completeAction}
        />
      )}

      {editingSession && canManageActivity && (
        <EditSessionSheet
          session={editingSession}
          allSessions={model.sessions}
          members={members}
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
          members={members}
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
