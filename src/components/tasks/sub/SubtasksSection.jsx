import { useState } from "react";
import { generateSubtaskId } from "../../../services/dataService";

const EMPTY_SUBTASK = { title:"", url:"", urlDisplayName:"", status:"open" };

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

export default function SubtasksSection({ subtasks, tasks = [], onChange }) {
  const [adding,    setAdding]    = useState(false);
  const [form,      setForm]      = useState(EMPTY_SUBTASK);
  const [editingId, setEditingId] = useState(null);
  const [editForm,  setEditForm]  = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setEd = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.title.trim()) return;
    onChange([...subtasks, { ...form, id: generateSubtaskId(tasks), status:"open" }]);
    setForm(EMPTY_SUBTASK);
    setAdding(false);
  };

  const startEdit = s => { setEditingId(s.id); setEditForm({ ...s }); setConfirmDel(null); };
  const saveEdit  = () => {
    onChange(subtasks.map(s => s.id === editingId ? { ...s, ...editForm } : s));
    setEditingId(null); setEditForm(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {subtasks.map(s => {
        if (editingId === s.id) return (
          <div key={s.id} style={{ display:"flex", flexDirection:"column", gap:"8px", background:"#1E1E1E", borderRadius:"8px", padding:"12px" }}>
            <input type="text" value={editForm.title} placeholder="Subtask title" onChange={e => setEd("title", e.target.value)} style={inputStyle}/>
            <input type="text" value={editForm.url} placeholder="URL (optional)" onChange={e => setEd("url", e.target.value)} style={inputStyle}/>
            <input type="text" value={editForm.urlDisplayName} placeholder="Link display name (optional)" onChange={e => setEd("urlDisplayName", e.target.value)} style={inputStyle}/>
            <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
              <button onClick={() => { setEditingId(null); setEditForm(null); }} style={cancelBtnStyle}>Cancel</button>
              <button onClick={saveEdit} disabled={!editForm.title.trim()} style={saveBtnStyle}>Save</button>
            </div>
          </div>
        );

        return (
          <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"10px", background:"#1E1E1E", borderRadius:"8px", padding:"8px 12px" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <span style={{ fontSize:"13px", color:"#f0f0f0", textDecoration: s.status==="complete" ? "line-through" : "none", opacity: s.status==="complete" ? 0.5 : 1 }}>
                {s.title}
              </span>
              {s.url && (
                <a
                  href={s.url}
                  onClick={e => { e.preventDefault(); window.open(s.url, "_blank", "noopener,noreferrer"); }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#38BDF8"; e.currentTarget.style.color = "#0B1E2D"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#38BDF8"; }}
                  style={{
                    marginLeft:"8px", fontSize:"11px", fontWeight:600, textDecoration:"none",
                    color:"#38BDF8", background:"transparent",
                    border:"1px solid #38BDF8", borderRadius:"999px",
                    padding:"1px 7px", transition:"background 0.15s, color 0.15s",
                    whiteSpace:"nowrap",
                  }}
                >
                  {s.urlDisplayName || s.url}
                </a>
              )}
            </div>
            {confirmDel === s.id ? (
              <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
                <span style={{ fontSize:"11px", color:"#888890" }}>Delete?</span>
                <button onClick={() => { onChange(subtasks.filter(x => x.id !== s.id)); setConfirmDel(null); }} style={{ ...saveBtnStyle, background:"#4A1B1B", color:"#FF6B6B", border:"1px solid #943636" }}>Yes</button>
                <button onClick={() => setConfirmDel(null)} style={cancelBtnStyle}>No</button>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:"2px", flexShrink:0 }}>
                <button onClick={() => startEdit(s)} style={{ background:"none", border:"none", cursor:"pointer", color:"#4ADE80", padding:"2px 4px", display:"flex", alignItems:"center" }}><PencilIcon/></button>
                <button onClick={() => setConfirmDel(s.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#55555e", fontSize:"14px", lineHeight:1, padding:"2px 4px" }}>✕</button>
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px", background:"#1E1E1E", borderRadius:"8px", padding:"12px" }}>
          <input type="text" value={form.title} placeholder="Subtask title (required)" onChange={e => set("title", e.target.value)} style={inputStyle}/>
          <input type="text" value={form.url} placeholder="URL (optional)" onChange={e => set("url", e.target.value)} style={inputStyle}/>
          <input type="text" value={form.urlDisplayName} placeholder="Link display name (optional)" onChange={e => set("urlDisplayName", e.target.value)} style={inputStyle}/>
          <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
            <button onClick={() => { setAdding(false); setForm(EMPTY_SUBTASK); }} style={cancelBtnStyle}>Cancel</button>
            <button onClick={handleAdd} disabled={!form.title.trim()} style={saveBtnStyle}>Add Subtask</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ background:"none", border:"1px dashed #3a3a3a", borderRadius:"8px", padding:"7px 12px", cursor:"pointer", fontSize:"12px", color:"#888890", textAlign:"left", fontFamily:"inherit" }}>
          + Add Subtask
        </button>
      )}
    </div>
  );
}
