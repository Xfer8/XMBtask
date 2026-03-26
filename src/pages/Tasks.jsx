import { useState } from "react";
import TaskCard  from "../components/TaskCard";
import TaskModal from "../components/tasks/TaskModal";

const EMPTY_TASK = {
  title:"", description:"", status:"Not Started", priority:"Medium",
  dueDate:null, owner:"", images:[], updates:[], subtasks:[], links:[],
};

const PRIORITY_ORDER = { High:0, Medium:1, Low:2 };

const sortTasks = tasks => [...tasks].sort((a, b) => {
  const pd = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
  if (pd !== 0) return pd;
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return a.title.localeCompare(b.title);
});

const generateId = tasks => {
  const max = tasks.reduce((m, t) => Math.max(m, parseInt(t.id?.replace("XMB-T", "")) || 0), 0);
  return `XMB-T${String(max + 1).padStart(3, "0")}`;
};

export default function Tasks({ tasks = [], projects = [], onAdd, onUpdate, onDelete }) {
  // editing = { task, isNew } | null
  const [editing, setEditing] = useState(null);

  // ── Open handlers ───────────────────────────────────────────────────────────
  const openNew = () => {
    const newTask = { ...EMPTY_TASK, id: generateId(tasks) };
    onAdd?.(newTask);                          // add immediately so it persists
    setEditing({ task: newTask, isNew: true });
  };

  const openEdit = task => setEditing({ task: { ...task }, isNew: false });

  // ── Modal callbacks ─────────────────────────────────────────────────────────
  // Called on every field change — writes live to app state
  const handleUpdate = updated => {
    onUpdate?.(updated);
    setEditing(e => ({ ...e, task: updated }));
  };

  // Save: changes already applied, just close
  const handleClose = () => setEditing(null);

  // Cancel: restore snapshot (or delete if new)
  const handleCancel = snapshot => {
    if (editing.isNew) onDelete?.(snapshot.id);
    else onUpdate?.(snapshot);
    setEditing(null);
  };

  // Delete: remove and close
  const handleDelete = () => {
    onDelete?.(editing.task.id);
    setEditing(null);
  };

  return (
    <div style={{ width:"100%", padding:"24px 20px", boxSizing:"border-box", maxWidth:"720px", margin:"0 auto" }}>

      {/* ── Toolbar ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
        <div style={{ fontSize:"16px", fontWeight:700, color:"#f0f0f0" }}>Tasks</div>
        <button
          onClick={openNew}
          style={{
            background:"#4ADE80", border:"none", borderRadius:"7px",
            cursor:"pointer", color:"#0E3F24", fontSize:"13px",
            fontWeight:600, padding:"7px 16px", fontFamily:"inherit",
          }}
        >
          + New Task
        </button>
      </div>

      {/* ── Task list ── */}
      {tasks.length === 0 ? (
        <div style={{ fontSize:"13px", color:"#55555e", textAlign:"center", padding:"40px 0" }}>
          No tasks yet — click "New Task" to get started.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {sortTasks(tasks).map(task => (
            <TaskCard
              key={task.id}
              task={task}
              projectName={projects.find(p => p.id === task.projectId)?.title}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {/* ── Modal overlay (rendered on top of the list) ── */}
      {editing && (
        <TaskModal
          title={editing.isNew ? "New Task" : "Edit Task"}
          task={editing.task}
          projects={projects}
          onUpdate={handleUpdate}
          onClose={handleClose}
          onCancel={handleCancel}
          onDelete={editing.isNew ? null : handleDelete}
        />
      )}
    </div>
  );
}
