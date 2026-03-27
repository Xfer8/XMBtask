import { useState } from "react";
import TaskCard     from "../components/TaskCard";
import TaskModal    from "../components/tasks/TaskModal";
import ProjectGroup from "../components/tasks/ProjectGroup";

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

// ── View toggle segment ────────────────────────────────────────────────────────

function ToggleSegment({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background:  active ? "#4ADE80" : "transparent",
        border:      "none",
        borderRadius:"6px",
        cursor:      "pointer",
        color:       active ? "#0E3F24" : "#888890",
        fontSize:    "12px",
        fontWeight:  active ? 700 : 500,
        padding:     "5px 14px",
        fontFamily:  "inherit",
        transition:  "background 0.15s, color 0.15s",
        whiteSpace:  "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Tasks page ─────────────────────────────────────────────────────────────────

export default function Tasks({ tasks = [], projects = [], onAdd, onUpdate, onDelete }) {
  const [editing,  setEditing]  = useState(null);
  const [search,   setSearch]   = useState("");
  const [viewMode, setViewMode] = useState("by-project"); // "by-project" | "all-tasks"

  // ── Open handlers ──────────────────────────────────────────────────────────
  const openNew = () => {
    const newTask = { ...EMPTY_TASK, id: generateId(tasks) };
    onAdd?.(newTask);
    setEditing({ task: newTask, isNew: true });
  };

  const openEdit = task => setEditing({ task: { ...task }, isNew: false });

  // ── Modal callbacks ────────────────────────────────────────────────────────
  const handleUpdate = updated => {
    onUpdate?.(updated);
    setEditing(e => ({ ...e, task: updated }));
  };

  const handleClose = () => setEditing(null);

  const handleCancel = snapshot => {
    if (editing.isNew) onDelete?.(snapshot.id);
    else onUpdate?.(snapshot);
    setEditing(null);
  };

  const handleDelete = () => {
    onDelete?.(editing.task.id);
    setEditing(null);
  };

  // ── Search filter ──────────────────────────────────────────────────────────
  const q = search.toLowerCase().trim();
  const filteredTasks = q
    ? tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
      )
    : tasks;

  // ── By-project grouping ────────────────────────────────────────────────────
  const activeProjects  = projects.filter(p => p.status === "Active");
  const uncategorized   = filteredTasks.filter(t => !t.projectId || !projects.find(p => p.id === t.projectId));

  return (
    <div style={{ width:"100%", padding:"24px 20px", boxSizing:"border-box", maxWidth:"720px", margin:"0 auto" }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"24px" }}>

        {/* New Task button */}
        <button
          onClick={openNew}
          style={{
            background:   "#4ADE80",
            border:       "none",
            borderRadius: "7px",
            cursor:       "pointer",
            color:        "#0E3F24",
            fontSize:     "13px",
            fontWeight:   600,
            padding:      "7px 16px",
            fontFamily:   "inherit",
            whiteSpace:   "nowrap",
            flexShrink:   0,
          }}
        >
          + New Task
        </button>

        {/* Search input */}
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{
            position:  "absolute",
            left:      "10px",
            top:       "50%",
            transform: "translateY(-50%)",
            color:     "#555560",
            fontSize:  "13px",
            pointerEvents: "none",
          }}>
            🔍
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            style={{
              width:        "100%",
              boxSizing:    "border-box",
              background:   "#1e1e1e",
              border:       "1px solid #3a3a3a",
              borderRadius: "7px",
              color:        "#f0f0f0",
              fontSize:     "13px",
              padding:      "7px 12px 7px 32px",
              fontFamily:   "inherit",
              outline:      "none",
            }}
          />
        </div>

        {/* View toggle */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          background:   "#1e1e1e",
          border:       "1px solid #3a3a3a",
          borderRadius: "8px",
          padding:      "2px",
          gap:          "2px",
          flexShrink:   0,
        }}>
          <ToggleSegment
            label="By Project"
            active={viewMode === "by-project"}
            onClick={() => setViewMode("by-project")}
          />
          <ToggleSegment
            label="All Tasks"
            active={viewMode === "all-tasks"}
            onClick={() => setViewMode("all-tasks")}
          />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {viewMode === "by-project" ? (

        // ── By Project view ──────────────────────────────────────────────────
        <div style={{ display:"flex", flexDirection:"column", gap:"28px" }}>
          {activeProjects.map(project => {
            const projectTasks = filteredTasks.filter(t => t.projectId === project.id);
            // Hide projects with no tasks (unless searching, show empties so user knows)
            if (projectTasks.length === 0 && !q) return null;
            return (
              <ProjectGroup
                key={project.id}
                project={project}
                tasks={projectTasks}
                onEdit={openEdit}
                onUpdate={onUpdate}
                allProjects={projects}
              />
            );
          })}

          {/* Uncategorized tasks */}
          {uncategorized.length > 0 && (
            <ProjectGroup
              key="uncategorized"
              project={null}
              tasks={uncategorized}
              onEdit={openEdit}
              onUpdate={onUpdate}
              allProjects={projects}
            />
          )}

          {/* Empty state */}
          {filteredTasks.length === 0 && (
            <div style={{ fontSize:"13px", color:"#55555e", textAlign:"center", padding:"40px 0" }}>
              {q ? "No tasks match your search." : "No tasks yet — click \"New Task\" to get started."}
            </div>
          )}
        </div>

      ) : (

        // ── All Tasks view ───────────────────────────────────────────────────
        filteredTasks.length === 0 ? (
          <div style={{ fontSize:"13px", color:"#55555e", textAlign:"center", padding:"40px 0" }}>
            {q ? "No tasks match your search." : "No tasks yet — click \"New Task\" to get started."}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {sortTasks(filteredTasks).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                projects={projects}
                onEdit={openEdit}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {editing && (
        <TaskModal
          title={editing.isNew ? "New Task" : "Edit Task"}
          task={editing.task}
          tasks={tasks}
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
