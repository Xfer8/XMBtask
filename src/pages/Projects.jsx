import { useState } from "react";
import { getPalette } from "../colors";
import ProjectModal from "../components/projects/ProjectModal";

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateProjectId = projects => {
  const max = projects.reduce((m, p) => Math.max(m, parseInt(p.id?.replace("XMB-P","")) || 0), 0);
  return `XMB-P${String(max + 1).padStart(3, "0")}`;
};

// ── ProjectCard ───────────────────────────────────────────────────────────────
function ProjectCard({ project, taskCount, onEdit, onDelete }) {
  const [hov,        setHov]        = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const p          = getPalette(project.color);
  const isActive   = project.status === "Active";
  const statusPal  = getPalette(isActive ? "green" : "gray");

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#313131" : "#2a2a2a",
        border:`1px solid ${hov ? "#555560" : "#444450"}`,
        borderLeft:`3px solid ${p.text}`,
        borderRadius:"12px",
        padding:"14px 18px",
        transition:"background 0.15s, border-color 0.15s",
      }}
    >
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        {/* Color dot + title */}
        <div style={{ width:"9px", height:"9px", borderRadius:"50%", background:p.text, flexShrink:0 }}/>
        <span style={{ fontSize:"14px", fontWeight:700, color:"#f0f0f0", flex:1, minWidth:0 }}>
          {project.title}
        </span>

        {/* Task count */}
        {taskCount > 0 && (
          <span style={{ fontSize:"11px", color:"#55555e", whiteSpace:"nowrap" }}>
            {taskCount} task{taskCount !== 1 ? "s" : ""}
          </span>
        )}

        {/* Status badge */}
        <span style={{
          fontSize:"10px", fontWeight:700, padding:"2px 9px", borderRadius:"9999px",
          background: statusPal.bg, color: statusPal.text, whiteSpace:"nowrap", flexShrink:0,
        }}>
          {project.status}
        </span>

        {/* Edit button */}
        <button
          onClick={() => onEdit(project)}
          style={{
            background:"none", border:"1px solid #3a3a3a", borderRadius:"6px",
            cursor:"pointer", color:"#888890", fontSize:"12px",
            padding:"3px 10px", fontFamily:"inherit", flexShrink:0,
            transition:"border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#555560"; e.currentTarget.style.color="#f0f0f0"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="#3a3a3a"; e.currentTarget.style.color="#888890"; }}
        >
          Edit
        </button>

        {/* Delete / Confirm */}
        {confirmDel ? (
          <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
            <span style={{ fontSize:"11px", color:"#888890" }}>Delete?</span>
            <button
              onClick={() => { onDelete(project.id); setConfirmDel(false); }}
              style={{ background:"#4A1B1B", border:"1px solid #943636", borderRadius:"6px", cursor:"pointer", color:"#FF6B6B", fontSize:"12px", padding:"3px 10px", fontFamily:"inherit" }}
            >Yes</button>
            <button
              onClick={() => setConfirmDel(false)}
              style={{ background:"none", border:"1px solid #3a3a3a", borderRadius:"6px", cursor:"pointer", color:"#888890", fontSize:"12px", padding:"3px 10px", fontFamily:"inherit" }}
            >No</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            style={{
              background:"none", border:"1px solid #3a3a3a", borderRadius:"6px",
              cursor:"pointer", color:"#55555e", fontSize:"13px",
              padding:"3px 8px", fontFamily:"inherit", flexShrink:0, lineHeight:1,
              transition:"border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#943636"; e.currentTarget.style.color="#FF6B6B"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#3a3a3a"; e.currentTarget.style.color="#55555e"; }}
          >✕</button>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <div style={{ fontSize:"13px", color:"#888890", lineHeight:"1.5", marginTop:"8px", paddingLeft:"17px" }}>
          {project.description}
        </div>
      )}
    </div>
  );
}

// ── ProjectsPage ──────────────────────────────────────────────────────────────
export default function Projects({ projects = [], tasks = [], onAdd, onUpdate, onDelete }) {
  const [showNew,  setShowNew]  = useState(false);
  const [editing,  setEditing]  = useState(null); // project being edited

  const handleAdd = form => {
    onAdd?.({ ...form, id: generateProjectId(projects) });
    setShowNew(false);
  };

  const handleUpdate = form => {
    onUpdate?.({ ...editing, ...form });
    setEditing(null);
  };

  const handleDelete = id => {
    onDelete?.(id);
    setEditing(null);
  };

  // Sort: Active first, then Closed; alphabetical within each group
  const sorted = [...projects].sort((a, b) => {
    if (a.status !== b.status) return a.status === "Active" ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <div style={{ width:"100%", padding:"24px 20px", boxSizing:"border-box", maxWidth:"720px", margin:"0 auto" }}>

      {/* ── Page header ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div style={{ fontSize:"16px", fontWeight:700, color:"#f0f0f0" }}>Projects</div>
        <button
          onClick={() => setShowNew(true)}
          style={{
            background:"#4ADE80", border:"none", borderRadius:"7px", cursor:"pointer",
            color:"#0E3F24", fontSize:"13px", fontWeight:600,
            padding:"7px 16px", fontFamily:"inherit",
          }}
        >
          + New Project
        </button>
      </div>

      {/* ── Project list ── */}
      {projects.length === 0 ? (
        <div style={{ fontSize:"13px", color:"#55555e", textAlign:"center", padding:"40px 0" }}>
          No projects yet — click "New Project" to get started.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {sorted.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={tasks.filter(t => t.projectId === project.id).length}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── New project modal ── */}
      {showNew && (
        <ProjectModal
          title="New Project"
          onSave={handleAdd}
          onCancel={() => setShowNew(false)}
        />
      )}

      {/* ── Edit project modal ── */}
      {editing && (
        <ProjectModal
          title="Edit Project"
          initial={editing}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
          onDelete={() => handleDelete(editing.id)}
        />
      )}
    </div>
  );
}
