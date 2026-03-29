import { useEffect, useState } from "react";
import { getPalette } from "../../colors";

const PROJECT_COLORS = ["blue","green","teal","purple","pink","orange","red","yellow"];
const EMPTY_PROJECT  = { title:"", description:"", status:"Active", color:"blue" };

const inputStyle = {
  width:"100%", boxSizing:"border-box", background:"#1e1e1e",
  border:"1px solid #3a3a3a", borderRadius:"8px", color:"#f0f0f0",
  fontSize:"13px", padding:"8px 12px", fontFamily:"inherit", outline:"none",
};
const labelStyle = {
  fontSize:"11px", fontWeight:600, color:"#888890",
  letterSpacing:"0.06em", textTransform:"uppercase",
  display:"block", marginBottom:"6px",
};

// ── ProjectModal ──────────────────────────────────────────────────────────────
// title    = modal heading ("New Project" | "Edit Project")
// initial  = existing project data for editing, or null/undefined for new
// onSave   = called with form data when Save is clicked
// onCancel = called when Cancel or Escape is pressed
// onDelete = called when Delete is clicked (only shown when editing)
export default function ProjectModal({ title, initial, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState({ ...EMPTY_PROJECT, ...(initial ?? {}) });
  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.title.trim().length > 0;

  // Escape → cancel
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);

  return (
    // ── Backdrop ──────────────────────────────────────────────────────────────
    <div
      onClick={onCancel}
      style={{
        position:"fixed", inset:0, zIndex:500,
        background:"rgba(0,0,0,0.75)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"20px",
      }}
    >
      {/* ── Modal box ───────────────────────────────────────────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#2c2c2c", border:"1px solid #3a3a3a", borderRadius:"14px",
          padding:"24px 28px", width:"100%", maxWidth:"480px",
          boxShadow:"0 16px 48px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ fontSize:"14px", fontWeight:700, color:"#f0f0f0", marginBottom:"22px" }}>
          {title}
        </div>

        {/* Title */}
        <div style={{ marginBottom:"16px" }}>
          <label style={labelStyle}>Title <span style={{ color:"#FF6B6B" }}>*</span></label>
          <input
            type="text" value={form.title} placeholder="Project title" autoFocus
            onChange={e => set("title", e.target.value)}
            style={{ ...inputStyle, fontSize:"15px", padding:"10px 14px", fontWeight:600 }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom:"20px" }}>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description} placeholder="Describe what this project is about. The more detail you provide, the better AI tools will be able to suggest and assign tasks to it automatically." rows={3}
            onChange={e => set("description", e.target.value)}
            style={{ ...inputStyle, resize:"vertical", lineHeight:"1.5" }}
          />
        </div>

        {/* Status + Color row */}
        <div style={{ display:"flex", gap:"32px", marginBottom:"24px", flexWrap:"wrap" }}>

          {/* Status toggle */}
          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display:"flex", gap:"6px" }}>
              {["Active","Closed"].map(s => {
                const active = form.status === s;
                return (
                  <button key={s} onClick={() => set("status", s)} style={{
                    padding:"5px 14px", borderRadius:"9999px", cursor:"pointer",
                    fontSize:"12px", fontWeight: active ? 600 : 400, fontFamily:"inherit",
                    border:`1.5px solid ${active ? "#2DB86A" : "#3a3a3a"}`,
                    background: active ? "#2DB86A" : "transparent",
                    color: active ? "#0E3F24" : "#888890",
                    transition:"all 0.15s",
                  }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color swatches */}
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>
              {PROJECT_COLORS.map(c => {
                const p       = getPalette(c);
                const selected = form.color === c;
                return (
                  <div
                    key={c}
                    onClick={() => set("color", c)}
                    title={c}
                    style={{
                      width:"22px", height:"22px", borderRadius:"50%",
                      background: p.text, cursor:"pointer", boxSizing:"border-box",
                      border: selected ? "3px solid #f0f0f0" : "3px solid transparent",
                      boxShadow: selected ? `0 0 0 1px ${p.text}` : "none",
                      transition:"border-color 0.12s, box-shadow 0.12s",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          paddingTop:"16px", borderTop:"1px solid #2e2e33",
        }}>
          <div>
            {onDelete && (
              <button onClick={onDelete} style={{
                background:"none", border:"1px solid #943636", borderRadius:"7px",
                cursor:"pointer", color:"#FF6B6B", fontSize:"13px",
                padding:"7px 16px", fontFamily:"inherit",
              }}>
                Delete
              </button>
            )}
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={onCancel} style={{
              background:"none", border:"1px solid #3a3a3a", borderRadius:"7px",
              cursor:"pointer", color:"#888890", fontSize:"13px",
              padding:"7px 18px", fontFamily:"inherit",
            }}>
              Cancel
            </button>
            <button
              onClick={() => valid && onSave(form)}
              disabled={!valid}
              style={{
                background: valid ? "#4ADE80" : "#1a3d2a", border:"none", borderRadius:"7px",
                cursor: valid ? "pointer" : "default",
                color: valid ? "#0E3F24" : "#2e6644",
                fontSize:"13px", fontWeight:600, padding:"7px 18px", fontFamily:"inherit",
              }}
            >
              Save Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
