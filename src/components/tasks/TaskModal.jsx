import { useEffect, useRef, useState } from "react";
import LinksSection    from "./sub/LinksSection";
import ImagePasteZone  from "./sub/ImagePasteZone";
import SubtasksSection from "./sub/SubtasksSection";
import UpdatesSection  from "./sub/UpdatesSection";

const STATUS_OPTIONS   = ["Not Started", "In Progress", "Needs Review", "Done"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

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

function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom:"22px" }}>
      <div style={{
        fontSize:"10px", fontWeight:700, color:"#55555e",
        letterSpacing:"0.08em", textTransform:"uppercase",
        marginBottom:"10px", paddingBottom:"6px",
        borderBottom:"1px solid #2e2e33",
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── TaskModal ─────────────────────────────────────────────────────────────────
// Overlays the app. task is fully controlled — every field change fires onUpdate.
// onClose   = user clicked Save (changes already applied live)
// onCancel  = user clicked Cancel — receives snapshot to restore
// onDelete  = user clicked Delete
export default function TaskModal({ title, task, tasks = [], projects = [], onUpdate, onClose, onCancel, onDelete }) {
  // Snapshot taken on mount for cancel/restore
  const [snapshot]    = useState(() => JSON.parse(JSON.stringify(task)));
  const [showConfirm, setShowConfirm] = useState(false);
  const [flashFooter, setFlashFooter] = useState(false);
  const descRef    = useRef(null);
  const footerRef  = useRef(null);

  // Auto-resize description textarea up to 450px
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 450) + "px";
    el.style.overflowY = el.scrollHeight > 450 ? "auto" : "hidden";
  }, [task.description]);

  const set      = (k, v) => onUpdate({ ...task, [k]: v });
  const valid    = task.title.trim().length > 0 && !!task.projectId;
  const isDirty  = JSON.stringify(task) !== JSON.stringify(snapshot);

  const activeProjects = projects.filter(p => p.status === "Active");

  const handleCancel = () => {
    if (isDirty) setShowConfirm(true);
    else onCancel(snapshot);
  };

  // Backdrop click while dirty → pulse the footer to guide user to Save/Cancel
  const handleBackdropClick = () => {
    if (isDirty) {
      setFlashFooter(true);
      footerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      setTimeout(() => setFlashFooter(false), 600);
    } else {
      onClose();
    }
  };

  // Escape → close (save)
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    // ── Backdrop ──────────────────────────────────────────────────────────────
    <div
      onClick={handleBackdropClick}
      style={{
        position:"fixed", inset:0, zIndex:500,
        background:"rgba(0,0,0,0.75)",
        display:"flex", alignItems:"flex-start", justifyContent:"center",
        overflowY:"auto", padding:"40px 20px",
      }}
    >
      {/* ── Modal box ───────────────────────────────────────────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#2c2c2c",
          border:"1px solid #3a3a3a",
          borderRadius:"14px",
          padding:"24px 28px",
          width:"100%", maxWidth:"560px",
          boxShadow:"0 16px 48px rgba(0,0,0,0.6)",
          margin:"auto", position:"relative",
        }}
      >
        {/* Modal heading */}
        <div style={{ fontSize:"14px", fontWeight:700, color:"#f0f0f0", marginBottom:"22px" }}>
          {title}
        </div>

        {/* ── Basic Info ──────────────────────────────────────────────────── */}
        <FormSection title="Basic Info">
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                type="text" value={task.title} placeholder="Task title" autoFocus
                onChange={e => set("title", e.target.value)}
                style={{ ...inputStyle, fontSize:"15px", padding:"10px 14px", fontWeight:600 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                ref={descRef}
                value={task.description} placeholder="Optional description" rows={3}
                onChange={e => set("description", e.target.value)}
                style={{ ...inputStyle, resize:"none", lineHeight:"1.5", overflowY:"hidden" }}
              />
            </div>
          </div>
        </FormSection>

        {/* ── Details ─────────────────────────────────────────────────────── */}
        <FormSection title="Details">
          {/* Project */}
          <div style={{ marginBottom:"12px" }}>
            <label style={labelStyle}>Project <span style={{ color:"#FF6B6B" }}>*</span></label>
            <select
              value={task.projectId ?? ""}
              onChange={e => set("projectId", e.target.value || null)}
              style={{ ...inputStyle, cursor:"pointer" }}
            >
              <option value="">— Select project —</option>
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={task.status} onChange={e => set("status", e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={task.priority} onChange={e => set("priority", e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date" value={task.dueDate ?? ""}
                onChange={e => set("dueDate", e.target.value || null)}
                style={{ ...inputStyle, colorScheme:"dark" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Owner</label>
              <input
                type="text" value={task.owner} placeholder="Owner name"
                onChange={e => set("owner", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </FormSection>

        {/* ── Links ───────────────────────────────────────────────────────── */}
        <FormSection title="Links">
          <LinksSection links={task.links ?? []} onChange={v => set("links", v)}/>
        </FormSection>

        {/* ── Images ──────────────────────────────────────────────────────── */}
        <FormSection title="Images">
          <ImagePasteZone images={task.images ?? []} onChange={v => set("images", v)}/>
        </FormSection>

        {/* ── Subtasks ─────────────────────────────────────────────────────── */}
        <FormSection title="Subtasks">
          <SubtasksSection subtasks={task.subtasks ?? []} tasks={tasks} onChange={v => set("subtasks", v)}/>
        </FormSection>

        {/* ── Updates ──────────────────────────────────────────────────────── */}
        <FormSection title="Updates">
          <UpdatesSection updates={task.updates ?? []} onChange={v => set("updates", v)}/>
        </FormSection>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div ref={footerRef} style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          paddingTop:"16px", borderTop:"1px solid #2e2e33",
          borderRadius:"0 0 8px 8px",
          transition: "box-shadow 0.15s, background 0.15s",
          ...(flashFooter ? {
            background:  "rgba(74,222,128,0.06)",
            boxShadow:   "0 0 0 2px rgba(74,222,128,0.35)",
            borderRadius:"8px",
            padding:     "16px 10px 4px",
            margin:      "0 -10px -4px",
          } : {}),
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
            <button onClick={handleCancel} style={{
              background:"none", border:"1px solid #3a3a3a", borderRadius:"7px",
              cursor:"pointer", color:"#888890", fontSize:"13px",
              padding:"7px 18px", fontFamily:"inherit",
            }}>
              Cancel
            </button>
            <button onClick={onClose} disabled={!valid} style={{
              background: valid ? "#4ADE80" : "#1a3d2a", border:"none", borderRadius:"7px",
              cursor: valid ? "pointer" : "default",
              color: valid ? "#0E3F24" : "#2e6644",
              fontSize:"13px", fontWeight:600, padding:"7px 18px", fontFamily:"inherit",
            }}>
              Save
            </button>
          </div>
        </div>
        {/* ── Discard confirmation overlay ─────────────────────────────────── */}
        {showConfirm && (
          <div style={{
            position:"absolute", inset:0, zIndex:10,
            background:"rgba(0,0,0,0.6)", borderRadius:"14px",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{
              background:"#2c2c2c", border:"1px solid #3a3a3a",
              borderRadius:"12px", padding:"24px 28px",
              width:"280px", textAlign:"center",
              boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
            }}>
              <div style={{ fontSize:"14px", fontWeight:700, color:"#f0f0f0", marginBottom:"8px" }}>
                Discard changes?
              </div>
              <div style={{ fontSize:"13px", color:"#888890", marginBottom:"20px", lineHeight:1.5 }}>
                Your unsaved changes will be lost.
              </div>
              <div style={{ display:"flex", gap:"8px", justifyContent:"center" }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{
                    background:"none", border:"1px solid #3a3a3a", borderRadius:"7px",
                    cursor:"pointer", color:"#888890", fontSize:"13px",
                    padding:"7px 18px", fontFamily:"inherit",
                  }}
                >
                  Keep Editing
                </button>
                <button
                  onClick={() => onCancel(snapshot)}
                  style={{
                    background:"#4A1B1B", border:"1px solid #943636", borderRadius:"7px",
                    cursor:"pointer", color:"#FF6B6B", fontSize:"13px",
                    fontWeight:600, padding:"7px 18px", fontFamily:"inherit",
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
