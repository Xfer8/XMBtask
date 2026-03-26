import { useState } from "react";
import { getPalette } from "../../../colors";
import SplitBadge from "../../ui/SplitBadge";

const LINK_TYPES       = ["Source", "Sherlock", "Jira", "Email", "Other"];
const LINK_TYPE_COLORS = { Source:"yellow", Sherlock:"orange", Jira:"purple", Email:"teal", Other:"gray" };
const generateLinkId   = () => `LK${Date.now()}`;
const EMPTY_LINK       = { url:"", displayName:"", type:"" };

const inputStyle = {
  width:"100%", boxSizing:"border-box", background:"#1e1e1e",
  border:"1px solid #3a3a3a", borderRadius:"8px", color:"#f0f0f0",
  fontSize:"13px", padding:"8px 12px", fontFamily:"inherit", outline:"none",
};
const cancelBtnStyle = {
  background:"none", border:"1px solid #3a3a3a", borderRadius:"7px",
  cursor:"pointer", color:"#888890", fontSize:"12px", padding:"5px 12px", fontFamily:"inherit",
};
const saveBtnStyle = {
  background:"#0E3F24", border:"1px solid #1D7F48", borderRadius:"7px",
  cursor:"pointer", color:"#4ADE80", fontSize:"12px", fontWeight:600,
  padding:"5px 12px", fontFamily:"inherit",
};

const PencilIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 4l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const detectType = url => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("atlassian.net"))     return "Jira";
    if (host.includes("sherlock.epic.com")) return "Sherlock";
  } catch (_) {}
  return null;
};

const autoName = (type, url) => {
  if (type === "Sherlock") { const m = url.match(/[?&#]id=(\d+)/i); return m ? m[1] : null; }
  if (type === "Jira")     { const m = url.match(/\/([A-Z]+-\d+)/); return m ? m[1] : null; }
  return null;
};

export default function LinksSection({ links, onChange }) {
  const [adding,    setAdding]    = useState(false);
  const [form,      setForm]      = useState(EMPTY_LINK);
  const [editingId, setEditingId] = useState(null);
  const [editForm,  setEditForm]  = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === "url") {
      const detected = detectType(next.url);
      if (detected && !next.type) next.type = detected;
      if (next.type && !next.displayName) {
        const name = autoName(next.type, next.url);
        if (name) next.displayName = name;
      }
    }
    return next;
  });

  const handleAdd = () => {
    if ((!form.url.trim() && form.type !== "Email") || !form.type) return;
    onChange([...links, { ...form, id: generateLinkId() }]);
    setForm(EMPTY_LINK);
    setAdding(false);
  };

  const startEdit = l => { setEditingId(l.id); setEditForm({ ...l }); setConfirmDel(null); };
  const saveEdit  = () => {
    onChange(links.map(l => l.id === editingId ? { ...l, ...editForm } : l));
    setEditingId(null); setEditForm(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {links.map(l => {
        if (editingId === l.id) return (
          <div key={l.id} style={{ display:"flex", flexDirection:"column", gap:"8px", background:"#1a1a1e", borderRadius:"8px", padding:"12px" }}>
            <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputStyle, cursor:"pointer" }}>
              <option value="">Select type…</option>
              {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {editForm.type !== "Email" && (
              <input type="text" value={editForm.url} placeholder="URL" onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} style={inputStyle}/>
            )}
            <input type="text" value={editForm.displayName} placeholder="Display name (optional)" onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))} style={inputStyle}/>
            <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
              <button onClick={() => { setEditingId(null); setEditForm(null); }} style={cancelBtnStyle}>Cancel</button>
              <button onClick={saveEdit} style={saveBtnStyle}>Save</button>
            </div>
          </div>
        );

        const p = getPalette(LINK_TYPE_COLORS[l.type] ?? "gray");
        const isSplit = l.type === "Sherlock" || l.type === "Jira";
        const splitColor = l.type === "Sherlock" ? "orange" : "blue";
        return (
          <div key={l.id} style={{ display:"flex", alignItems:"center", gap:"10px", background:"#1a1a1e", borderRadius:"8px", padding:"8px 12px" }}>
            {isSplit ? (
              <>
                <SplitBadge
                  label={l.type}
                  value={l.displayName || l.url || ""}
                  colorKey={splitColor}
                  onClick={() => startEdit(l)}
                />
                <div style={{ flex:1 }} />
              </>
            ) : (
              <>
                <span style={{ fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"4px", background:p.bg, color:p.text, whiteSpace:"nowrap", flexShrink:0 }}>{l.type}</span>
                <div onClick={() => startEdit(l)} style={{ flex:1, minWidth:0, cursor:"pointer" }}>
                  <span style={{ fontSize:"13px", color:p.text, display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {l.displayName || l.url || "(no URL)"}
                  </span>
                </div>
              </>
            )}
            {confirmDel === l.id ? (
              <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
                <span style={{ fontSize:"11px", color:"#888890" }}>Delete?</span>
                <button onClick={() => { onChange(links.filter(x => x.id !== l.id)); setConfirmDel(null); }} style={{ ...saveBtnStyle, background:"#4A1B1B", color:"#FF6B6B", border:"1px solid #943636" }}>Yes</button>
                <button onClick={() => setConfirmDel(null)} style={cancelBtnStyle}>No</button>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:"2px", flexShrink:0 }}>
                <button onClick={() => startEdit(l)} style={{ background:"none", border:"none", cursor:"pointer", color:"#4ADE80", padding:"2px 4px", display:"flex", alignItems:"center" }}><PencilIcon/></button>
                <button onClick={() => setConfirmDel(l.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#55555e", fontSize:"14px", lineHeight:1, padding:"2px 4px" }}>✕</button>
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px", background:"#1a1a1e", borderRadius:"8px", padding:"12px" }}>
          <select value={form.type} onChange={e => set("type", e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
            <option value="">Select type…</option>
            {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {form.type !== "Email" && (
            <input type="text" value={form.url} placeholder="URL (required)" onChange={e => set("url", e.target.value)} style={inputStyle}/>
          )}
          <input type="text" value={form.displayName} placeholder="Display name (optional)" onChange={e => set("displayName", e.target.value)} style={inputStyle}/>
          <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
            <button onClick={() => { setAdding(false); setForm(EMPTY_LINK); }} style={cancelBtnStyle}>Cancel</button>
            <button onClick={handleAdd} disabled={!form.type || (!form.url.trim() && form.type !== "Email")} style={saveBtnStyle}>Add Link</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ background:"none", border:"1px dashed #3a3a3a", borderRadius:"8px", padding:"7px 12px", cursor:"pointer", fontSize:"12px", color:"#888890", textAlign:"left", fontFamily:"inherit" }}>
          + Add Link
        </button>
      )}
    </div>
  );
}
