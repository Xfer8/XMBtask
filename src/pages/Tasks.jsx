import { useState, useRef } from "react";
import TaskCard          from "../components/TaskCard";
import TaskModal         from "../components/tasks/TaskModal";
import ProjectGroup      from "../components/tasks/ProjectGroup";
import ProjectBar        from "../components/tasks/ProjectBar";
import AnimatedTaskList  from "../components/tasks/AnimatedTaskList";
import AnimatedGroupList from "../components/tasks/AnimatedGroupList";

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
        borderRadius:"3px",
        cursor:      "pointer",
        color:       active ? "#0E3F24" : "#888890",
        fontSize:    "12px",
        fontWeight:  active ? 700 : 500,
        padding:     "0 14px",
        fontFamily:  "inherit",
        transition:  "background 0.15s, color 0.15s",
        whiteSpace:  "nowrap",
        alignSelf:   "stretch",
      }}
    >
      {label}
    </button>
  );
}

// ── Tasks page ─────────────────────────────────────────────────────────────────

export default function Tasks({ tasks = [], projects = [], onAdd, onUpdate, onDelete }) {
  const [editing,         setEditing]         = useState(null);
  // frozenTasks: snapshot taken when the modal opens.
  // The task list renders this instead of the live `tasks` prop while the modal
  // is open, so background animations/re-renders don't happen as the user types.
  // Cleared on Save/Close/Cancel/Delete so the list updates normally afterward.
  const [frozenTasks,     setFrozenTasks]     = useState(null);
  const displayTasks = frozenTasks ?? tasks;
  const [search,          setSearch]          = useState("");
  const [viewMode,        setViewMode]        = useState("by-project"); // "by-project" | "all-tasks"
  const [activeProjectId, setActiveProjectId] = useState(null);

  const handleProjectFilter = (id) => setActiveProjectId(id);

  // ── Open handlers ──────────────────────────────────────────────────────────
  const openNew = () => {
    setFrozenTasks([...tasks]); // freeze display before adding the blank task
    const newTask = { ...EMPTY_TASK, id: generateId(tasks) };
    onAdd?.(newTask);
    setEditing({ task: newTask, isNew: true });
  };

  const openEdit = task => {
    setFrozenTasks([...tasks]); // freeze display at current state
    setEditing({ task: { ...task }, isNew: false });
  };

  // ── Modal callbacks ────────────────────────────────────────────────────────
  const handleUpdate = updated => {
    onUpdate?.(updated); // still updates live state → Firestore saves fire normally
    setEditing(e => ({ ...e, task: updated }));
  };

  const handleClose = () => {
    setFrozenTasks(null); // unfreeze — list updates to live state with animations
    setEditing(null);
  };

  const handleCancel = snapshot => {
    setFrozenTasks(null);
    if (editing.isNew) onDelete?.(snapshot.id);
    else onUpdate?.(snapshot);
    setEditing(null);
  };

  const handleDelete = () => {
    setFrozenTasks(null);
    onDelete?.(editing.task.id);
    setEditing(null);
  };

  // ── Search filter ──────────────────────────────────────────────────────────
  const q = search.toLowerCase().trim();
  const filteredTasks = q
    ? displayTasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
      )
    : displayTasks;

  // ── By-project grouping ────────────────────────────────────────────────────
  const renderGroupsContent = (filterId) => {
    const projs = projects.filter(p =>
      p.status === "Active" && (!filterId || p.id === filterId)
    );
    const uncatTasks = filterId
      ? []
      : filteredTasks.filter(t => !t.projectId || !projects.find(p => p.id === t.projectId));

    if (filteredTasks.length === 0) {
      return (
        <div style={{ fontSize:"13px", color:"#55555e", textAlign:"center", padding:"40px 0" }}>
          {q ? "No tasks match your search." : "No tasks yet — click \"New Task\" to get started."}
        </div>
      );
    }

    return (
      <AnimatedGroupList gap="40px" animated={false}>
        {projs.map(project => {
          const projectTasks = filteredTasks.filter(t => t.projectId === project.id);
          if (projectTasks.length === 0) return null;
          return (
            <ProjectGroup
              key={project.id}
              project={project}
              tasks={projectTasks}
              onEdit={openEdit}
              onUpdate={onUpdate}
              allProjects={projects}
              filterKey={filterId ?? "__all__"}
            />
          );
        })}
        {uncatTasks.length > 0 ? (
          <ProjectGroup
            key="__uncat__"
            project={null}
            tasks={uncatTasks}
            onEdit={openEdit}
            onUpdate={onUpdate}
            allProjects={projects}
            filterKey={filterId ?? "__all__"}
          />
        ) : null}
      </AnimatedGroupList>
    );
  };

  return (
    <div style={{ width:"100%", padding:"24px 20px", boxSizing:"border-box", maxWidth:"680px", margin:"0 auto" }}>

      {/* ── Project bar ─────────────────────────────────────────────────────── */}
      <ProjectBar
        tasks={tasks}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelect={handleProjectFilter}
      />

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"stretch", gap:"10px", marginBottom:"24px" }}>

        {/* New Task button */}
        <button
          onClick={openNew}
          style={{
            background:   "#4ADE80",
            border:       "none",
            borderRadius: "5px",
            cursor:       "pointer",
            color:        "#0E3F24",
            fontSize:     "13px",
            fontWeight:   600,
            padding:      "0 16px",
            height:       "34px",
            fontFamily:   "inherit",
            whiteSpace:   "nowrap",
            flexShrink:   0,
          }}
        >
          + New Task
        </button>

        {/* Search input + clear button */}
        <div style={{ position: "relative", flex: 1 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              width:        "100%",
              boxSizing:    "border-box",
              background:   "#1e1e1e",
              border:       "1px solid #3a3a3a",
              borderRadius: "5px",
              color:        "#f0f0f0",
              fontSize:     "13px",
              padding:      search ? "0 30px 0 12px" : "0 12px",
              height:       "34px",
              fontFamily:   "inherit",
              outline:      "none",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position:     "absolute",
                right:        "8px",
                top:          "50%",
                transform:    "translateY(-50%)",
                background:   "#3a3a3a",
                border:       "none",
                borderRadius: "50%",
                cursor:       "pointer",
                color:        "#a0a0a8",
                fontSize:     "11px",
                lineHeight:   1,
                width:        "18px",
                height:       "18px",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                fontFamily:   "inherit",
                flexShrink:   0,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* View toggle */}
        <div style={{
          display:      "flex",
          alignItems:   "stretch",
          background:   "#1e1e1e",
          border:       "1px solid #3a3a3a",
          borderRadius: "5px",
          padding:      "1px",
          gap:          0,
          flexShrink:   0,
          height:       "34px",
          boxSizing:    "border-box",
        }}>
          <ToggleSegment
            label="By Project"
            active={viewMode === "by-project"}
            onClick={() => setViewMode("by-project")}
          />
          {/* Vertical divider */}
          <div style={{
            width:        "1px",
            background:   "#3a3a3a",
            alignSelf:    "stretch",
            margin:       "0",
            flexShrink:   0,
          }} />
          <ToggleSegment
            label="All Tasks"
            active={viewMode === "all-tasks"}
            onClick={() => { setViewMode("all-tasks"); setActiveProjectId(null); }}
          />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div>
        {viewMode === "by-project" ? (

          // ── By Project view ────────────────────────────────────────────────
          renderGroupsContent(activeProjectId)

        ) : (

          // ── All Tasks view ─────────────────────────────────────────────────
          filteredTasks.length === 0 ? (
            <div style={{ fontSize:"13px", color:"#55555e", textAlign:"center", padding:"40px 0" }}>
              {q ? "No tasks match your search." : "No tasks yet — click \"New Task\" to get started."}
            </div>
          ) : (
            <AnimatedTaskList
              tasks={sortTasks(filteredTasks)}
              projects={projects}
              onEdit={openEdit}
              onUpdate={onUpdate}
              animated={false}
            />
          )
        )}
      </div>

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
