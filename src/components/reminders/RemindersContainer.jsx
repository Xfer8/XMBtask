import { useState, useEffect } from "react";

const DAYS        = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MON_UP      = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const DAY_UP      = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const DAY_SHORT   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Date helpers ───────────────────────────────────────────────────────────────
const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

// "SAT, MAR 28" — used in the nav pill
const formatNavDate = (d) =>
  `${DAY_UP[d.getDay()]}, ${MON_UP[d.getMonth()]} ${d.getDate()}`;

// "Fri Mar 26" — used in overdue due-date label
const formatDueDate = (d) =>
  `${DAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;

// "09:00" → "9:00AM", "14:30" → "2:30PM"
const formatTime12h = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return m === 0
    ? `${hour}${period}`
    : `${hour}:${String(m).padStart(2,"0")}${period}`;
};

const isComplete = (completions, reminderId, date) =>
  completions.some(c => c.reminderId === reminderId && c.date === date);

// "4H" if due in > 1 hour, "42M" if due in < 1 hour, null if past or no time
const formatTimeRemaining = (hhmm) => {
  if (!hhmm) return null;
  const now  = new Date();
  const [h, m] = hhmm.split(":").map(Number);
  const due  = new Date(now);
  due.setHours(h, m, 0, 0);
  const diffMs   = due - now;
  if (diffMs <= 0) return null;
  const diffMins = Math.round(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}M`;
  return `${Math.floor(diffMs / 3_600_000)}H`;
};

// Returns ALL overdue items (including completed) from past 7 days
const getOverdueItems = (reminders, completions) => {
  const items = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = toISODate(d);
    const dayName = DAYS[d.getDay()];
    reminders.forEach(r => {
      if (!r.days.includes(dayName)) return;
      items.push({
        reminder: r,
        date:     dateStr,
        dueDate:  formatDueDate(d),
      });
    });
  }
  return items;
};

// Returns urgency status for a reminder scheduled today
const getUrgencyStatus = (reminder) => {
  if (!reminder.time) return "ok";  // no time set → green, same as plenty of time
  const now = new Date();
  const [h, m] = reminder.time.split(":").map(Number);
  const due = new Date(now);
  due.setHours(h, m, 0, 0);
  const diffMs = due - now;
  if (diffMs < 0)                    return "overdue-today"; // past time today → red pulse
  if (diffMs < 60 * 60 * 1000)      return "soon";          // < 1 hour → orange
  return "ok";                                               // > 1 hour → green
};

const STATUS_COLOR = {
  "ok":           "#4ADE80",
  "soon":         "#F97316",
  "overdue-today":"#FF6B6B",
  "overdue-past": "#FF6B6B",
  "neutral":      "#333340",
};

// ── StatusBar ─────────────────────────────────────────────────────────────────
function StatusBar({ status }) {
  const color     = STATUS_COLOR[status] ?? STATUS_COLOR.neutral;
  const animation =
    status === "overdue-today" ? "pulseRed 1.4s ease-in-out infinite" :
    status === "soon"          ? "pulseOrangeBar 1.2s ease-in-out infinite" :
    undefined;
  return (
    <div style={{
      width:        "5px",
      alignSelf:    "stretch",
      borderRadius: "3px",
      flexShrink:   0,
      background:   color,
      animation,
    }} />
  );
}

// ── LinkBadge ─────────────────────────────────────────────────────────────────
function LinkBadge({ url, displayName }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={e => e.stopPropagation()}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            "5px",
        flexShrink:     0,
        padding:        "3px 10px",
        borderRadius:   "3px",
        border:         `1px solid ${hov ? "rgba(74,222,128,0.4)" : "rgba(74,222,128,0.15)"}`,
        background:     hov ? "rgba(74,222,128,0.08)" : "transparent",
        color:          hov ? "#4ADE80" : "rgba(74,222,128,0.6)",
        fontSize:       "10px",
        fontWeight:     700,
        textDecoration: "none",
        letterSpacing:  "0.03em",
        transition:     "background 0.15s, border-color 0.15s, color 0.15s",
        maxWidth:       "130px",
        overflow:       "hidden",
        textOverflow:   "ellipsis",
        whiteSpace:     "nowrap",
      }}
    >
      <svg width="9" height="9" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0 }}>
        <path d="M5.5 8.5l3-3M8 3h3v3M11 3L6.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      {displayName || "Link"}
    </a>
  );
}

// ── ReminderRow ───────────────────────────────────────────────────────────────
function ReminderRow({ reminder, complete, onToggle, status = "neutral", overdueDate }) {
  const [hov, setHov]   = useState(false);
  const time12          = formatTime12h(reminder.time);
  const effectiveSt     = complete ? "ok" : status;
  const barColor        = STATUS_COLOR[effectiveSt] ?? STATUS_COLOR.neutral;
  const timeRemaining   = formatTimeRemaining(reminder.time);

  // Meta line — always rendered at fixed height so all rows stay the same size
  const metaContent = (() => {
    if (complete)                       return "DONE";
    if (overdueDate) return `DUE: ${overdueDate}${time12 ? ` · ${time12}` : ""}`;
    if (timeRemaining !== null)         return `DUE IN: ${timeRemaining}`;
    if (status === "overdue-today")     return time12 ? `DUE: ${time12}` : "OVERDUE";
    return "";  // no time set → space reserved but blank
  })();

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={effectiveSt === "soon" ? "reminder-soon" : undefined}
      style={{
        display:       "flex",
        alignItems:    "stretch",
        gap:           "14px",
        padding:       "11px 18px",
        borderBottom:  "1px solid rgba(255,255,255,0.03)",
        cursor:        "pointer",
        background:    hov ? "rgba(255,255,255,0.025)" : "transparent",
        transition:    "background 0.12s",
        opacity:       complete ? 0.6 : 1,
      }}
    >
      <StatusBar status={effectiveSt} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:       "15px",
          fontWeight:     700,
          lineHeight:     1.2,
          color:          complete ? "#55555e" : "#f0f0f0",
          textDecoration: complete ? "line-through" : "none",
          whiteSpace:     "nowrap",
          overflow:       "hidden",
          textOverflow:   "ellipsis",
          transition:     "color 0.15s",
        }}>
          {reminder.text}
        </div>

        {/* Always rendered — fixed height keeps all rows the same height */}
        <div style={{
          fontSize:      "10px",
          fontWeight:    800,
          color:         metaContent ? barColor : "transparent",
          marginTop:     "3px",
          letterSpacing: "0.05em",
          height:        "14px",
          lineHeight:    "14px",
          textTransform: "uppercase",
        }}>
          {metaContent || "\u00A0"}
        </div>
      </div>

      {reminder.url && (
        <div style={{ alignSelf: "center" }}>
          <LinkBadge url={reminder.url} displayName={reminder.displayName} />
        </div>
      )}
    </div>
  );
}

// ── RemindersContainer ────────────────────────────────────────────────────────
export default function RemindersContainer({ reminders, completions, onToggle, onManage }) {
  const [overdueOpen,  setOverdueOpen]  = useState(false); // collapsed by default
  const [offset,       setOffset]       = useState(0);
  const [showLimitMsg, setShowLimitMsg] = useState(false);
  const [, setTick] = useState(0); // re-evaluate urgency every minute

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const HISTORY_LIMIT = -30;

  const goBack = () => {
    if (offset <= HISTORY_LIMIT) {
      setShowLimitMsg(true);
      setTimeout(() => setShowLimitMsg(false), 3000);
    } else {
      setOffset(o => o - 1);
      setShowLimitMsg(false);
    }
  };
  const goForward = () => { setOffset(o => o + 1); setShowLimitMsg(false); };

  const today    = new Date();
  const viewDate = new Date(today);
  viewDate.setDate(today.getDate() + offset);

  const viewISO  = toISODate(viewDate);
  const viewDay  = DAYS[viewDate.getDay()];
  const isToday  = offset === 0;

  const viewItems    = reminders.filter(r => r.days.includes(viewDay));
  const overdueItems = getOverdueItems(reminders, completions);
  const incompleteOverdueCount = overdueItems.filter(
    ({ reminder, date }) => !isComplete(completions, reminder.id, date)
  ).length;

  // ── Shared button hover helper ─────────────────────────────────────────────
  const navBtnStyle = (dim) => ({
    background:  "none",
    border:      "none",
    cursor:      dim ? "default" : "pointer",
    padding:     "0 9px",
    color:       dim ? "#2e2e38" : "#555560",
    fontSize:    "14px",
    lineHeight:  "28px",
    fontFamily:  "inherit",
    transition:  "color 0.15s",
  });

  return (
    <div style={{
      background:   "#2a2a2a",
      border:       "1px solid #444450",
      borderRadius: "8px",
      overflow:     "hidden",
      boxShadow:    "0 6px 24px rgba(0,0,0,0.35)",
    }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "10px 18px",
        background:     "rgba(0,0,0,0.18)",
        borderBottom:   "1px solid #333338",
      }}>
        {/* Left: label + date nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{
            fontSize:      "9px",
            fontWeight:    900,
            color:         "#444450",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            userSelect:    "none",
          }}>
            DAILY_REMINDERS
          </span>

          {/* Date nav pill */}
          <div style={{
            display:      "flex",
            alignItems:   "center",
            background:   "#1c1c22",
            border:       "1px solid #2e2e38",
            borderRadius: "3px",
            height:       "28px",
          }}>
            <button
              onClick={goBack}
              disabled={offset <= HISTORY_LIMIT}
              style={navBtnStyle(offset <= HISTORY_LIMIT)}
              onMouseEnter={e => { if (offset > HISTORY_LIMIT) e.currentTarget.style.color = "#c8c8d0"; }}
              onMouseLeave={e => { e.currentTarget.style.color = offset <= HISTORY_LIMIT ? "#2e2e38" : "#555560"; }}
            >‹</button>

            <span style={{
              fontSize:      "9px",
              fontWeight:    800,
              color:         isToday ? "#888890" : "#c8c8d0",
              padding:       "0 12px",
              borderLeft:    "1px solid #2e2e38",
              borderRight:   "1px solid #2e2e38",
              lineHeight:    "28px",
              userSelect:    "none",
              letterSpacing: "0.06em",
              whiteSpace:    "nowrap",
            }}>
              {formatNavDate(viewDate)}
            </span>

            <button
              onClick={goForward}
              style={navBtnStyle(false)}
              onMouseEnter={e => { e.currentTarget.style.color = "#c8c8d0"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#555560"; }}
            >›</button>
          </div>

          {/* "TODAY" jump button when not on today */}
          {!isToday && (
            <button
              onClick={() => { setOffset(0); setShowLimitMsg(false); }}
              style={{
                background:    "none",
                border:        "1px solid #333340",
                borderRadius:  "3px",
                cursor:        "pointer",
                color:         "#555560",
                fontSize:      "9px",
                fontWeight:    800,
                padding:       "3px 10px",
                fontFamily:    "inherit",
                letterSpacing: "0.08em",
                transition:    "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#4ADE80"; e.currentTarget.style.color = "#4ADE80"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#333340"; e.currentTarget.style.color = "#555560"; }}
            >
              TODAY
            </button>
          )}
        </div>

        {/* Right: Manage button */}
        <button
          onClick={onManage}
          style={{
            background:    "transparent",
            border:        "1px solid #444450",
            borderRadius:  "2px",
            cursor:        "pointer",
            color:         "#888890",
            fontSize:      "9px",
            fontWeight:    900,
            letterSpacing: "1.5px",
            padding:       "5px 13px",
            fontFamily:    "inherit",
            textTransform: "uppercase",
            transition:    "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#4ADE80"; e.currentTarget.style.color = "#4ADE80"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#444450"; e.currentTarget.style.color = "#888890"; }}
        >
          MANAGE
        </button>
      </div>

      {/* 30-day limit notice */}
      {showLimitMsg && (
        <div style={{
          fontSize:   "11px",
          color:      "#888890",
          fontStyle:  "italic",
          padding:    "8px 18px",
          background: "rgba(0,0,0,0.1)",
          borderBottom: "1px solid #333338",
        }}>
          Reminder history is only kept for 30 days.
        </div>
      )}

      {/* ── Today's / viewed-date reminders ──────────────────────────────────── */}
      <div>
        {viewItems.length === 0 ? (
          <div style={{
            fontSize:  "12px",
            color:     "#444450",
            padding:   "18px",
            textAlign: "center",
          }}>
            No reminders scheduled for {isToday ? "today" : formatNavDate(viewDate)}.
          </div>
        ) : (
          viewItems.map(r => {
            const complete = isComplete(completions, r.id, viewISO);
            const status   = isToday && !complete ? getUrgencyStatus(r) : "neutral";
            return (
              <ReminderRow
                key={r.id}
                reminder={r}
                complete={complete}
                onToggle={() => onToggle(r.id, viewISO)}
                status={status}
              />
            );
          })
        )}
      </div>

      {/* ── Overdue drawer — only on today's view ─────────────────────────────── */}
      {isToday && overdueItems.length > 0 && (
        <div style={{ borderTop: "1px solid #333338" }}>

          {/* Trigger row */}
          <button
            onClick={() => setOverdueOpen(v => !v)}
            style={{
              width:       "100%",
              background:  "rgba(239,68,68,0.04)",
              border:      "none",
              cursor:      "pointer",
              display:     "flex",
              alignItems:  "center",
              padding:     "10px 18px",
              gap:         "10px",
              fontFamily:  "inherit",
            }}
          >
            {/* Red "!" badge */}
            <div style={{
              width:          "18px",
              height:         "18px",
              background:     "#FF6B6B",
              borderRadius:   "3px",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              color:          "#fff",
              fontSize:       "12px",
              fontWeight:     900,
              flexShrink:     0,
              lineHeight:     1,
            }}>!</div>

            <span style={{
              fontSize:      "9px",
              fontWeight:    900,
              color:         "#FF6B6B",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              flex:          1,
              textAlign:     "left",
            }}>
              OVERDUE
            </span>

            {incompleteOverdueCount > 0 && (
              <span style={{
                background:    "#FF6B6B",
                color:         "#fff",
                fontSize:      "9px",
                fontWeight:    900,
                padding:       "2px 9px",
                borderRadius:  "2px",
                letterSpacing: "0.5px",
              }}>
                {incompleteOverdueCount} REMINDER{incompleteOverdueCount !== 1 ? "S" : ""}
              </span>
            )}

            <span style={{
              color:      "#444450",
              fontSize:   "9px",
              transform:  overdueOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
              lineHeight: 1,
            }}>▼</span>
          </button>

          {/* Drawer content */}
          {overdueOpen && (
            <div style={{ background: "#252528" }}>
              {overdueItems.map(({ reminder, date, dueDate }) => {
                const complete = isComplete(completions, reminder.id, date);
                return (
                  <ReminderRow
                    key={`${reminder.id}-${date}`}
                    reminder={reminder}
                    complete={complete}
                    onToggle={() => onToggle(reminder.id, date)}
                    status={complete ? "neutral" : "overdue-past"}
                    overdueDate={dueDate}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {reminders.length === 0 && (
        <div style={{
          padding:   "20px",
          fontSize:  "12px",
          color:     "#444450",
          textAlign: "center",
        }}>
          Click <strong style={{ color: "#888890" }}>MANAGE</strong> to add your first reminder.
        </div>
      )}
    </div>
  );
}
