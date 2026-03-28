import { useState, useRef, useLayoutEffect } from "react";
import TaskCard          from "../components/TaskCard";
import TaskModal         from "../components/tasks/TaskModal";
import ProjectGroup      from "../components/tasks/ProjectGroup";
import ProjectBar        from "../components/tasks/ProjectBar";
import AnimatedTaskList  from "../components/tasks/AnimatedTaskList";

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
  const [search,          setSearch]          = useState("");
  const [viewMode,        setViewMode]        = useState("by-project"); // "by-project" | "all-tasks"
  const [slideDir,        setSlideDir]        = useState("right");
  const viewModeMounted = useRef(false); // suppress slide on initial mount
  const [activeProjectId, setActiveProjectId] = useState(null);
  // outgoing: null = no crossfade active
  //           { projectId } = crossfade active; this filter drives the fading-out layer
  const [outgoing, setOutgoing] = useState(null);

  // ── Project filter — crossfade transition ──────────────────────────────────
  // Old content becomes an absolute overlay playing xfadeOut.
  // New content renders in normal flow playing xfadeIn.
  // Both happen simultaneously for a true crossfade.
  const fadeTimerRef = useRef(null);

  const handleProjectFilter = (id) => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    prevGroupY.current = {};
    setOutgoing({ projectId: activeProjectId }); // freeze old content as outgoing layer
    setActiveProjectId(id);                       // new content renders immediately
    fadeTimerRef.current = setTimeout(() => {
      setOutgoing(null);
      fadeTimerRef.current = null;
    }, 160); // slightly longer than the 120ms CSS animation to ensure it finishes
  };

  // ── Group-level FLIP animation ─────────────────────────────────────────────
  // Animates groups sliding when tasks reorder within a stable filter view.
  // Skipped entirely when activeProjectId changes (fade handles that instead).
  const groupWrappers        = useRef({}); // group key → wrapper DOM element
  const prevGroupY           = useRef({}); // group key → natural top from last render
  const prevActiveProjectId  = useRef(activeProjectId);

  useLayoutEffect(() => {
    // If the filter changed, skip FLIP — just record fresh positions for next time
    if (prevActiveProjectId.current !== activeProjectId) {
      prevActiveProjectId.current = activeProjectId;
      const nextY = {};
      Object.entries(groupWrappers.current).forEach(([id, el]) => {
        if (el) nextY[id] = el.getBoundingClientRect().top;
      });
      prevGroupY.current = nextY;
      return;
    }

    const W = groupWrappers.current;
    const P = prevGroupY.current;

    const nextY = {};
    Object.entries(W).forEach(([id, el]) => {
      if (el) nextY[id] = el.getBoundingClientRect().top;
    });

    Object.entries(W).forEach(([id, el]) => {
      if (!el || P[id] === undefined) return;
      const dy = P[id] - nextY[id];
      if (Math.abs(dy) < 1) return;

      el.style.transition = "none";
      el.style.transform  = `translateY(${dy}px)`;
      el.getBoundingClientRect(); // force layout flush

      requestAnimationFrame(() => {
        el.style.transition = "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
        el.style.transform  = "";
      });
    });

    prevGroupY.current = nextY;
  });

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
  // Renders the groups list for a given filter ID.
  // withFlipRefs=true attaches the FLIP ref callbacks (only for the live layer).
  const renderGroupsContent = (filterId, withFlipRefs) => {
    const projs = projects.filter(p =>
      p.status === "Active" && (!filterId || p.id === filterId)
    );
    const uncatTasks = filterId
      ? []
      : filteredTasks.filter(t => !t.projectId || !projects.find(p => p.id === t.projectId));

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"40px" }}>
        {projs.map(project => {
          const projectTasks = filteredTasks.filter(t => t.projectId === project.id);
          if (projectTasks.length === 0) return null;
          return (
            <div
              key={project.id}
              ref={withFlipRefs ? (el => {
                if (el) groupWrappers.current[project.id] = el;
                else    delete groupWrappers.current[project.id];
              }) : undefined}
            >
              <ProjectGroup
                project={project}
                tasks={projectTasks}
                onEdit={openEdit}
                onUpdate={onUpdate}
                allProjects={projects}
                filterKey={filterId ?? "__all__"}
              />
            </div>
          );
        })}

        {uncatTasks.length > 0 && (
          <div
            ref={withFlipRefs ? (el => {
              if (el) groupWrappers.current["__uncategorized__"] = el;
              else    delete groupWrappers.current["__uncategorized__"];
            }) : undefined}
          >
            <ProjectGroup
              project={null}
              tasks={uncatTasks}
              onEdit={openEdit}
              onUpdate={onUpdate}
              allProjects={projects}
              filterKey={filterId ?? "__all__"}
            />
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div style={{ fontSize:"13px", color:"#55555e", textAlign:"center", padding:"40px 0" }}>
            {q ? "No tasks match your search." : "No tasks yet — click \"New Task\" to get started."}
          </div>
        )}
      </div>
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

        {/* Search input */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          style={{
            flex:         1,
            background:   "#1e1e1e",
            border:       "1px solid #3a3a3a",
            borderRadius: "5px",
            color:        "#f0f0f0",
            fontSize:     "13px",
            padding:      "0 12px",
            height:       "34px",
            fontFamily:   "inherit",
            outline:      "none",
          }}
        />

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
            onClick={() => { viewModeMounted.current = true; setSlideDir("left"); setViewMode("by-project"); }}
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
            onClick={() => { viewModeMounted.current = true; setSlideDir("right"); setViewMode("all-tasks"); setActiveProjectId(null); }}
          />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div
        key={viewMode}
        className={viewModeMounted.current ? (slideDir === "right" ? "slide-from-right" : "slide-from-left") : undefined}
      >
        {viewMode === "by-project" ? (

          // ── By Project view ────────────────────────────────────────────────
          // Crossfade: incoming content is in normal flow (xfade-in).
          // Outgoing content is an absolute overlay (xfade-out), removed after animation.
          <div style={{ position: "relative" }}>

            {/* Incoming (live) layer */}
            <div key={activeProjectId ?? "__all__"} className={outgoing ? "xfade-in" : undefined}>
              {renderGroupsContent(activeProjectId, true)}
            </div>

            {/* Outgoing layer — absolute overlay, fades out */}
            {outgoing && (
              <div
                className="xfade-out"
                style={{ position:"absolute", top:0, left:0, right:0, pointerEvents:"none" }}
              >
                {renderGroupsContent(outgoing.projectId, false)}
              </div>
            )}
          </div>

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
