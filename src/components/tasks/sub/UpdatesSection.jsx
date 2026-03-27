import { useState, useRef } from "react";

const generateUpdateId = () => `UP${Date.now()}`;

const formatTimestamp = iso => new Date(iso).toLocaleString("en-US", {
  month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit",
});

const inputStyle = {
  width:"100%", boxSizing:"border-box", background:"#1e1e1e",
  border:"1px solid #3a3a3a", borderRadius:"8px", color:"#f0f0f0",
  fontSize:"13px", padding:"8px 12px", fontFamily:"inherit", outline:"none",
};

const ChevronIcon = ({ expanded }) => (
  <svg width={11} height={11} viewBox="0 0 12 12" fill="none"
    style={{ transition:"transform 0.2s", transform: expanded ? "rotate(180deg)" : "none", flexShrink:0 }}>
    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

// ── Single update row ──────────────────────────────────────────────────────────

function UpdateRow({ update, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const iconBtn = (onClick, children, danger = false) => (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "3px 5px",
        borderRadius: "5px",
        color: danger ? "#FF6B6B" : "#55555e",
        display: "flex", alignItems: "center",
        transition: "color 0.15s, background 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color    = danger ? "#FF6B6B" : "#c8c8d0";
        e.currentTarget.style.background = danger ? "#4A1B1B" : "#3a3a3a";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color    = danger ? "#FF6B6B" : "#55555e";
        e.currentTarget.style.background = "none";
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirmDel(false); }}
      style={{
        background:"#1E1E1E", borderRadius:"8px", padding:"10px 12px",
        borderLeft:"2px solid #3a3a3a", position:"relative",
      }}
    >
      {/* Timestamp + action buttons */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"4px" }}>
        <div style={{ fontSize:"10px", color:"#55555e" }}>{formatTimestamp(update.timestamp)}</div>

        {/* Buttons — only visible on hover */}
        <div style={{
          display:"flex", alignItems:"center", gap:"2px",
          opacity: 1,
        }}>
          {confirmDel ? (
            <>
              <span style={{ fontSize:"11px", color:"#888890", marginRight:"4px" }}>Delete?</span>
              {iconBtn(() => onDelete(update.id), "Yes", true)}
              {iconBtn(() => setConfirmDel(false), "No")}
            </>
          ) : (
            <>
              {iconBtn(() => onEdit(update), <EditIcon />)}
              {iconBtn(() => setConfirmDel(true), <TrashIcon />, true)}
            </>
          )}
        </div>
      </div>

      <div style={{ fontSize:"12px", color:"#888890", lineHeight:"1.5", whiteSpace:"pre-wrap" }}>
        {update.text}
      </div>
    </div>
  );
}

// ── UpdatesSection ─────────────────────────────────────────────────────────────

export default function UpdatesSection({ updates, onChange }) {
  const [text,      setText]      = useState("");
  const [expanded,  setExpanded]  = useState(false);
  const [editingId, setEditingId] = useState(null);  // id of update being edited
  const [editText,  setEditText]  = useState("");
  const taRef     = useRef(null);
  const editTaRef = useRef(null);

  const resize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    onChange([...updates, { id: generateUpdateId(), text: text.trim(), timestamp: new Date().toISOString() }]);
    setText("");
    if (taRef.current) taRef.current.style.height = "auto";
    setExpanded(true);
  };

  const handleEditStart = (update) => {
    setEditingId(update.id);
    setEditText(update.text);
    setExpanded(true);
    // Focus after render
    setTimeout(() => editTaRef.current?.focus(), 0);
  };

  const handleEditSave = () => {
    if (!editText.trim()) return;
    onChange(updates.map(u => u.id === editingId ? { ...u, text: editText.trim() } : u));
    setEditingId(null);
    setEditText("");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleDelete = (id) => {
    onChange(updates.filter(u => u.id !== id));
  };

  const sorted = [...updates].reverse();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {/* New update textarea */}
      <textarea
        ref={taRef} value={text} placeholder="Add an update… (Enter to save, Shift+Enter for new line)" rows={2}
        onChange={e => { setText(e.target.value); resize(); }}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
        style={{ ...inputStyle, resize:"none", lineHeight:"1.5", overflow:"hidden" }}
      />

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button
          onClick={handleAdd} disabled={!text.trim()}
          style={{
            background:"none",
            border:`1px solid ${text.trim() ? "#166A8E" : "#3a3a3a"}`,
            borderRadius:"7px", cursor: text.trim() ? "pointer" : "default",
            color: text.trim() ? "#38BDF8" : "#55555e",
            fontSize:"12px", padding:"5px 12px", fontFamily:"inherit",
            transition:"border-color 0.15s, color 0.15s",
          }}
        >
          Add Update
        </button>
        {updates.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:"12px", color:"#888890", display:"flex", alignItems:"center", gap:"5px", fontFamily:"inherit" }}
          >
            <ChevronIcon expanded={expanded}/>
            {expanded ? "Hide" : "Show"} history ({updates.length})
          </button>
        )}
      </div>

      {/* History list */}
      {expanded && sorted.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:"4px" }}>
          {sorted.map(u => (
            editingId === u.id ? (
              /* Inline edit form */
              <div key={u.id} style={{ background:"#1E1E1E", borderRadius:"8px", padding:"10px 12px", borderLeft:"2px solid #2DB86A" }}>
                <div style={{ fontSize:"10px", color:"#55555e", marginBottom:"6px" }}>{formatTimestamp(u.timestamp)}</div>
                <textarea
                  ref={editTaRef}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(); } if (e.key === "Escape") handleEditCancel(); }}
                  rows={3}
                  style={{ ...inputStyle, resize:"vertical", lineHeight:"1.5", marginBottom:"8px" }}
                />
                <div style={{ display:"flex", gap:"6px" }}>
                  <button
                    onClick={handleEditSave}
                    disabled={!editText.trim()}
                    style={{
                      background: editText.trim() ? "#4ADE80" : "#1a3d2a",
                      border:"none", borderRadius:"6px",
                      cursor: editText.trim() ? "pointer" : "default",
                      color: editText.trim() ? "#0E3F24" : "#2e6644",
                      fontSize:"12px", fontWeight:600,
                      padding:"4px 12px", fontFamily:"inherit",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleEditCancel}
                    style={{
                      background:"none", border:"1px solid #3a3a3a", borderRadius:"6px",
                      cursor:"pointer", color:"#888890",
                      fontSize:"12px", padding:"4px 12px", fontFamily:"inherit",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <UpdateRow
                key={u.id}
                update={u}
                onEdit={handleEditStart}
                onDelete={handleDelete}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}
