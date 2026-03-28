import { useState } from "react";
import { generateReminderId } from "../../services/dataService";

const DAYS      = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon",    "Tue",     "Wed",       "Thu",      "Fri",    "Sat",      "Sun"];
const EMPTY     = { text: "", days: [], time: "" };

const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "#1e1e1e",
  border: "1px solid #3a3a3a", borderRadius: "8px", color: "#f0f0f0",
  fontSize: "13px", padding: "8px 12px", fontFamily: "inherit", outline: "none",
};
const cancelBtn = {
  background: "none", border: "1px solid #3a3a3a", borderRadius: "7px",
  cursor: "pointer", color: "#888890", fontSize: "12px",
  padding: "5px 14px", fontFamily: "inherit",
};
const saveBtn = {
  background: "#0E3F24", border: "1px solid #1D7F48", borderRadius: "7px",
  cursor: "pointer", color: "#4ADE80", fontSize: "12px", fontWeight: 600,
  padding: "5px 14px", fontFamily: "inherit",
};

// ── Day toggle pills ───────────────────────────────────────────────────────────
function DayPills({ selected, onChange }) {
  const toggle = d => onChange(
    selected.includes(d) ? selected.filter(x => x !== d) : [...selected, d]
  );
  return (
    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
      {DAYS.map((day, i) => {
        const on = selected.includes(day);
        return (
          <button
            key={day}
            onClick={() => toggle(day)}
            style={{
              background:   on ? "#0E3F24" : "#1e1e1e",
              border:       `1px solid ${on ? "#1D7F48" : "#3a3a3a"}`,
              borderRadius: "6px",
              color:        on ? "#4ADE80" : "#666670",
              fontSize:     "11px", fontWeight: 700,
              padding:      "4px 10px", cursor: "pointer",
              fontFamily:   "inherit",
              transition:   "background 0.15s, border-color 0.15s, color 0.15s",
            }}
          >
            {DAY_SHORT[i]}
          </button>
        );
      })}
    </div>
  );
}

// ── Reminder form (add or edit) ────────────────────────────────────────────────
function ReminderForm({ value, onChange, onSave, onCancel, saveLabel = "Save" }) {
  const valid = value.text.trim().length > 0 && value.days.length > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input
        type="text"
        placeholder="Reminder text…"
        value={value.text}
        onChange={e => onChange({ ...value, text: e.target.value })}
        style={inputStyle}
        autoFocus
      />
      <DayPills selected={value.days} onChange={days => onChange({ ...value, days })} />
      <input
        type="time"
        value={value.time}
        onChange={e => onChange({ ...value, time: e.target.value })}
        style={{ ...inputStyle, width: "140px", colorScheme: "dark" }}
      />
      <div style={{ fontSize: "10px", color: "#444450" }}>
        Time is optional — used for future alert support.
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={cancelBtn}>Cancel</button>
        <button onClick={onSave} disabled={!valid} style={{ ...saveBtn, opacity: valid ? 1 : 0.45 }}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

// ── Summary of days for a reminder row ────────────────────────────────────────
const daysSummary = days => {
  if (days.length === 7) return "Every day";
  if (JSON.stringify([...days].sort()) === JSON.stringify(["Friday","Monday","Thursday","Tuesday","Wednesday"]))
    return "Weekdays";
  return days.map(d => DAY_SHORT[DAYS.indexOf(d)]).join(", ");
};

// ── ManageRemindersModal ───────────────────────────────────────────────────────
export default function ManageRemindersModal({ reminders, onSave, onClose }) {
  const [adding,    setAdding]    = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [editForm,  setEditForm]  = useState(null);
  const [confirmDel,setConfirmDel]= useState(null);

  const handleAdd = () => {
    onSave([...reminders, { ...form, id: generateReminderId(reminders) }]);
    setForm(EMPTY); setAdding(false);
  };

  const startEdit = r => { setEditingId(r.id); setEditForm({ ...r }); setConfirmDel(null); };
  const saveEdit  = () => {
    onSave(reminders.map(r => r.id === editingId ? { ...r, ...editForm } : r));
    setEditingId(null); setEditForm(null);
  };

  const PencilIcon = () => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 4l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "40px 20px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#2c2c2c", border: "1px solid #3a3a3a", borderRadius: "14px",
          padding: "24px 28px", width: "100%", maxWidth: "480px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)", margin: "auto",
        }}
      >
        {/* Heading */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#f0f0f0" }}>Manage Reminders</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555560", fontSize: "20px", cursor: "pointer", lineHeight: 1, padding: "2px 4px" }}>✕</button>
        </div>

        {/* Existing reminders */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
          {reminders.length === 0 && !adding && (
            <div style={{ fontSize: "13px", color: "#55555e", textAlign: "center", padding: "16px 0" }}>
              No reminders configured yet.
            </div>
          )}

          {reminders.map(r => {
            // ── Inline edit ────────────────────────────────────────────────
            if (editingId === r.id) return (
              <div key={r.id} style={{ background: "#1e1e1e", borderRadius: "10px", padding: "12px" }}>
                <ReminderForm
                  value={editForm}
                  onChange={setEditForm}
                  onSave={saveEdit}
                  onCancel={() => { setEditingId(null); setEditForm(null); }}
                  saveLabel="Update"
                />
              </div>
            );

            // ── Display row ────────────────────────────────────────────────
            return (
              <div key={r.id} style={{
                background: "#1e1e1e", borderRadius: "10px", padding: "10px 14px",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", color: "#f0f0f0", fontWeight: 600, marginBottom: "3px" }}>
                    {r.text}
                  </div>
                  <div style={{ fontSize: "11px", color: "#555560", display: "flex", gap: "8px", alignItems: "center" }}>
                    <span>{daysSummary(r.days)}</span>
                    {r.time && <><span style={{ color: "#3a3a3a" }}>·</span><span>{r.time}</span></>}
                  </div>
                </div>

                {confirmDel === r.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "#888890" }}>Delete?</span>
                    <button
                      onClick={() => { onSave(reminders.filter(x => x.id !== r.id)); setConfirmDel(null); }}
                      style={{ ...saveBtn, background: "#4A1B1B", color: "#FF6B6B", border: "1px solid #943636" }}
                    >Yes</button>
                    <button onClick={() => setConfirmDel(null)} style={cancelBtn}>No</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                    <button onClick={() => startEdit(r)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ADE80", padding: "3px 5px", display: "flex", alignItems: "center" }}><PencilIcon /></button>
                    <button onClick={() => setConfirmDel(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#55555e", fontSize: "14px", lineHeight: 1, padding: "3px 5px" }}>✕</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add form */}
        {adding ? (
          <div style={{ background: "#1e1e1e", borderRadius: "10px", padding: "12px" }}>
            <ReminderForm
              value={form}
              onChange={setForm}
              onSave={handleAdd}
              onCancel={() => { setAdding(false); setForm(EMPTY); }}
              saveLabel="Add Reminder"
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              width: "100%", background: "none", border: "1px dashed #3a3a3a",
              borderRadius: "8px", padding: "8px", cursor: "pointer",
              fontSize: "12px", color: "#888890", fontFamily: "inherit",
            }}
          >
            + Add Reminder
          </button>
        )}
      </div>
    </div>
  );
}
