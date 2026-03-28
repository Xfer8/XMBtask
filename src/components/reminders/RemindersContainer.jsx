import { useState, useEffect } from "react";

const DAYS        = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ── Date helpers ───────────────────────────────────────────────────────────────
const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;


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
  "neutral":      "#333340",
};

// ── StatusBar ─────────────────────────────────────────────────────────────────
function StatusBar({ status }) {
  const color     = STATUS_COLOR[status] ?? STATUS_COLOR.neutral;
  const boxShadow = status === "overdue-today"
    ? "0 0 10px 2px rgba(255,107,107,0.65)"
    : undefined;
  return (
    <div
      className="reminder-bar"
      style={{
        width:        "5px",
        alignSelf:    "stretch",
        borderRadius: "3px",
        flexShrink:   0,
        background:   color,
        boxShadow,
      }}
    />
  );
}

// hex → "r,g,b" for rgba() usage
const hexToRgb = (hex) => {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "136,136,144";
  return [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)).join(",");
};

// ── LinkBadge ─────────────────────────────────────────────────────────────────
function LinkBadge({ url, displayName, color }) {
  const [hov, setHov] = useState(false);
  const rgb = hexToRgb(color);
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        alignSelf:      "stretch",
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "center",
        gap:            "3px",
        flexShrink:     0,
        borderLeft:     `1px solid rgba(${rgb},${hov ? 0.35 : 0.18})`,
        paddingLeft:    "16px",
        textDecoration: "none",
        transition:     "border-color 0.15s",
      }}
    >
      {/* Label row */}
      <span style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "4px",
        fontSize:      "9px",
        fontWeight:    800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color:         `rgba(${rgb},0.6)`,
        lineHeight:    1,
      }}>
        <svg width="8" height="8" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0 }}>
          <path d="M5.5 8.5l3-3M8 3h3v3M11 3L6.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        LINK
      </span>
      {/* Display name */}
      <span style={{
        fontSize:     "11px",
        fontWeight:   700,
        letterSpacing:"0.02em",
        color:        `rgba(${rgb},${hov ? 1 : 0.85})`,
        whiteSpace:   "nowrap",
        overflow:     "hidden",
        textOverflow: "ellipsis",
        maxWidth:     "120px",
        lineHeight:   1.2,
        transition:   "color 0.15s",
      }}>
        {displayName || "Open Link"}
      </span>
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
    if (status === "overdue-today")     return time12 ? `OVERDUE: ${time12}` : "OVERDUE";
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
        background:    effectiveSt === "overdue-today"
          ? hov ? "rgba(255,107,107,0.12)" : "rgba(255,107,107,0.06)"
          : hov ? "rgba(255,255,255,0.025)" : "transparent",
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
        <LinkBadge url={reminder.url} displayName={reminder.displayName} color={barColor} />
      )}
    </div>
  );
}

// "3/28/26" format
const formatShortDate = (d) => {
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const yy = String(d.getFullYear()).slice(2);
  return `${mm}/${dd}/${yy}`;
};

// ── RemindersContainer ────────────────────────────────────────────────────────
export default function RemindersContainer({ reminders, completions, onToggle, onManage }) {
  const [, setTick] = useState(0); // re-evaluate urgency every minute

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const today   = new Date();
  const todayISO = toISODate(today);
  const todayDay = DAYS[today.getDay()];

  const viewItems = reminders.filter(r => r.days.includes(todayDay));

  return (
    <>
      {/* ── Header — sits above the card, matches ProjectGroup heading ───────── */}
      <div style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "10px",
        marginBottom:  "8px",
        paddingBottom: "6px",
        paddingLeft:   "6px",
        paddingRight:  "6px",
      }}>
        {/* Title */}
        <span style={{
          fontSize:      "13px",
          fontWeight:    700,
          color:         "#f0f0f0",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          whiteSpace:    "nowrap",
          userSelect:    "none",
        }}>
          {todayDay} Reminders
        </span>

        {/* Separator */}
        <span style={{ color: "#555560", fontSize: "14px", fontWeight: 300, userSelect: "none" }}>|</span>

        {/* Date */}
        <span style={{ fontSize: "13px", color: "#c8c8d0", whiteSpace: "nowrap", userSelect: "none" }}>
          {formatShortDate(today)}
        </span>

        {/* Separator */}
        <span style={{ color: "#555560", fontSize: "14px", fontWeight: 300, userSelect: "none" }}>|</span>

        {/* Right accent line */}
        <div style={{ flex: 1, height: "2px", background: "#f0f0f0", borderRadius: "1px" }} />

        {/* Manage button */}
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
            flexShrink:    0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#4ADE80"; e.currentTarget.style.color = "#4ADE80"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#444450"; e.currentTarget.style.color = "#888890"; }}
        >
          MANAGE
        </button>
      </div>

      {/* ── Card — reminder rows grouped together ────────────────────────────── */}
      <div style={{
        background:   "#2a2a2a",
        border:       "1px solid #444450",
        borderRadius: "8px",
        overflow:     "hidden",
        boxShadow:    "0 6px 24px rgba(0,0,0,0.35)",
      }}>
        {reminders.length === 0 ? (
          <div style={{ padding: "20px", fontSize: "12px", color: "#444450", textAlign: "center" }}>
            Click <strong style={{ color: "#888890" }}>MANAGE</strong> to add your first reminder.
          </div>
        ) : viewItems.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#444450", padding: "18px", textAlign: "center" }}>
            No reminders scheduled for today.
          </div>
        ) : (
          viewItems.map(r => {
            const complete = isComplete(completions, r.id, todayISO);
            const status   = complete ? "neutral" : getUrgencyStatus(r);
            return (
              <ReminderRow
                key={r.id}
                reminder={r}
                complete={complete}
                onToggle={() => onToggle(r.id, todayISO)}
                status={status}
              />
            );
          })
        )}
      </div>
    </>
  );
}
