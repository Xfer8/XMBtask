import { useState } from "react";

const DAYS        = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Date helpers ───────────────────────────────────────────────────────────────

const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const formatDisplayDate = (d) =>
  `${DAYS[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;

// Short form used in the "Due" label: "Fri Mar 26"
const formatDueDate = (d) =>
  `${DAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;

const isComplete = (completions, reminderId, date) =>
  completions.some(c => c.reminderId === reminderId && c.date === date);

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
      if (r.createdAt && dateStr < r.createdAt) return;
      if (!isComplete(completions, r.id, dateStr))
        items.push({ reminder: r, date: dateStr, dueDate: formatDueDate(d), display: formatDisplayDate(d) });
    });
  }
  return items;
};

// ── CheckCircle ────────────────────────────────────────────────────────────────
function CheckCircle({ checked, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${checked ? "#4ADE80" : hov ? "#4ADE80" : "#3a3a44"}`,
        background: checked ? "#4ADE80" : "transparent",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "border-color 0.15s, background 0.15s",
        padding: 0,
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="#0E3F24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

// ── LinkBadge ──────────────────────────────────────────────────────────────────
function LinkBadge({ url, displayName }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            "5px",
        flexShrink:     0,
        padding:        "3px 10px",
        borderRadius:   "6px",
        border:         `1px solid ${hov ? "rgba(74,222,128,0.4)" : "rgba(74,222,128,0.18)"}`,
        background:     hov ? "rgba(74,222,128,0.1)" : "rgba(74,222,128,0.05)",
        color:          hov ? "#4ADE80" : "rgba(74,222,128,0.7)",
        fontSize:       "11px",
        fontWeight:     600,
        textDecoration: "none",
        transition:     "background 0.15s, border-color 0.15s, color 0.15s",
        maxWidth:       "140px",
        overflow:       "hidden",
        textOverflow:   "ellipsis",
        whiteSpace:     "nowrap",
      }}
    >
      {/* link icon */}
      <svg width="10" height="10" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
        <path d="M5.5 8.5l3-3M8 3h3v3M11 3L6.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      {displayName || "Link"}
    </a>
  );
}

// ── ReminderRow ────────────────────────────────────────────────────────────────
// overdueDate — short date string ("Fri Mar 26") shown in the Due label for overdue rows
function ReminderRow({ reminder, complete, onToggle, overdueDate }) {
  // Build the "Due …" string:
  // Today:   "09:00"            (time only, if set)
  // Overdue: "Due Fri Mar 26"   or   "Due Fri Mar 26 · 09:00"
  const dueLabel = overdueDate
    ? `Due ${overdueDate}${reminder.time ? ` · ${reminder.time}` : ""}`
    : reminder.time || null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "10px 0",
      borderBottom: "1px solid #2a2a2a",
      opacity: complete ? 0.45 : 1,
      transition: "opacity 0.2s",
    }}>
      <CheckCircle checked={complete} onClick={onToggle} />

      {/* Reminder text — larger and bolder */}
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: "14px", fontWeight: 700,
        color: complete ? "#55555e" : "#f0f0f0",
        textDecoration: complete ? "line-through" : "none",
        transition: "color 0.15s",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {reminder.text}
      </span>

      {/* Due time / overdue date — right-aligned, smaller */}
      {dueLabel && (
        <span style={{
          fontSize: "11px", fontWeight: 600, flexShrink: 0,
          color: overdueDate ? "#FF6B6B" : "#555560",
          whiteSpace: "nowrap",
        }}>
          {dueLabel}
        </span>
      )}

      {/* Link badge — far right */}
      {reminder.url && (
        <LinkBadge url={reminder.url} displayName={reminder.displayName} />
      )}
    </div>
  );
}

// ── RemindersContainer ─────────────────────────────────────────────────────────
export default function RemindersContainer({ reminders, completions, onToggle, onManage }) {
  const [overdueOpen, setOverdueOpen] = useState(true);

  const today        = new Date();
  const todayISO     = toISODate(today);
  const todayDay     = DAYS[today.getDay()];
  const todayItems   = reminders.filter(r => r.days.includes(todayDay));
  const overdueItems = getOverdueItems(reminders, completions);

  return (
    <div style={{
      background: "#2a2a2a", border: "1px solid #3d3d3d",
      borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      overflow: "hidden",
    }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderBottom: "1px solid #333338",
      }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#55555e" }}>
            Reminders
          </div>
          <div style={{ fontSize: "12px", color: "#888890", marginTop: "2px" }}>
            {formatDisplayDate(today)}
          </div>
        </div>
        <button
          onClick={onManage}
          style={{
            background: "none", border: "1px solid #3a3a3a", borderRadius: "7px",
            cursor: "pointer", color: "#888890", fontSize: "11px", fontWeight: 600,
            padding: "5px 14px", fontFamily: "inherit",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#4ADE80"; e.currentTarget.style.color = "#4ADE80"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#3a3a3a"; e.currentTarget.style.color = "#888890"; }}
        >
          Manage
        </button>
      </div>

      {/* ── Today's reminders ───────────────────────────────────────────────── */}
      <div style={{ padding: "4px 20px 12px" }}>
        {todayItems.length === 0 ? (
          <div style={{ fontSize: "13px", color: "#55555e", padding: "14px 0" }}>
            No reminders scheduled for today.
          </div>
        ) : todayItems.map(r => (
          <ReminderRow
            key={r.id}
            reminder={r}
            complete={isComplete(completions, r.id, todayISO)}
            onToggle={() => onToggle(r.id, todayISO)}
          />
        ))}
      </div>

      {/* ── Overdue ─────────────────────────────────────────────────────────── */}
      {overdueItems.length > 0 && (
        <div style={{ borderTop: "1px solid #333338" }}>
          <button
            onClick={() => setOverdueOpen(v => !v)}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", fontFamily: "inherit", color: "#FF6B6B",
            }}
          >
            <span style={{
              fontSize: "9px", display: "inline-block",
              transform: overdueOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.15s",
            }}>▶</span>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Overdue ({overdueItems.length})
            </span>
          </button>

          {overdueOpen && (
            <div style={{ padding: "0 20px 12px" }}>
              {overdueItems.map(({ reminder, date, dueDate }) => (
                <ReminderRow
                  key={`${reminder.id}-${date}`}
                  reminder={reminder}
                  complete={isComplete(completions, reminder.id, date)}
                  onToggle={() => onToggle(reminder.id, date)}
                  overdueDate={dueDate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {reminders.length === 0 && (
        <div style={{ padding: "0 20px 20px", fontSize: "13px", color: "#55555e", textAlign: "center" }}>
          Click <strong style={{ color: "#888890" }}>Manage</strong> to add your first reminder.
        </div>
      )}
    </div>
  );
}
