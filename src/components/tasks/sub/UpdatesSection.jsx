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

export default function UpdatesSection({ updates, onChange }) {
  const [text,     setText]     = useState("");
  const [expanded, setExpanded] = useState(false);
  const taRef = useRef(null);

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

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      <textarea
        ref={taRef} value={text} placeholder="Add an update… (Ctrl+Enter to save)" rows={2}
        onChange={e => { setText(e.target.value); resize(); }}
        onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleAdd(); }}
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

      {expanded && updates.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:"4px" }}>
          {[...updates].reverse().map(u => (
            <div key={u.id} style={{ background:"#1a1a1e", borderRadius:"8px", padding:"10px 12px", borderLeft:"2px solid #3a3a3a" }}>
              <div style={{ fontSize:"10px", color:"#55555e", marginBottom:"4px" }}>{formatTimestamp(u.timestamp)}</div>
              <div style={{ fontSize:"12px", color:"#888890", lineHeight:"1.5", whiteSpace:"pre-wrap" }}>{u.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
