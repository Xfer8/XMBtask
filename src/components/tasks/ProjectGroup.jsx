import { useState, useRef } from "react";
import { getPalette } from "../../colors";
import { STATUS_COLORS } from "../../theme";
import TaskCard from "../TaskCard";
import AnimatedTaskList from "./AnimatedTaskList";

// ── Helpers ────────────────────────────────────────────────────────────────────

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

const sortTasks = tasks => [...tasks].sort((a, b) => {
  const pd = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
  if (pd !== 0) return pd;
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return a.title.localeCompare(b.title);
});

const STATUS_OPTIONS = ["Not Started", "In Progress", "Needs Review", "Done"];

// ── StatusFilterPill ───────────────────────────────────────────────────────────

function StatusFilterPill({ status, count, selected, onToggle }) {
  const [hov, setHov] = useState(false);
  const p   = getPalette(STATUS_COLORS[status] ?? "gray");
  const rgb = (() => {
    const h = p.text;
    if (!h || !h.startsWith("#") || h.length < 7) return "136,136,144";
    return [1,3,5].map(i => parseInt(h.slice(i,i+2),16)).join(",");
  })();

  const bg     = selected ? p.bg     : hov ? `rgba(${rgb},0.15)` : `rgba(${rgb},0.08)`;
  const border = selected ? p.border : hov ? p.border            : `rgba(${rgb},0.3)`;
  const color  = selected ? p.text   : hov ? p.text              : `rgba(${rgb},0.65)`;

  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onToggle}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          "5px",
        background:   bg,
        border:       `1px solid ${border}`,
        borderRadius: "6px",
        cursor:       "pointer",
        color,
        fontSize:     "10px",
        fontWeight:   700,
        padding:      "3px 9px",
        fontFamily:   "inherit",
        transition:   "background 0.15s, border-color 0.15s, color 0.15s",
        whiteSpace:   "nowrap",
      }}
    >
      {status}
      <span style={{ fontSize: "9px", fontWeight: 800, opacity: selected ? 0.7 : 0.6 }}>
        · {count}
      </span>
    </button>
  );
}

// ── Separator ─────────────────────────────────────────────────────────────────

const Sep = () => (
  <span style={{ color: "#3a3a3a", fontSize: "14px", fontWeight: 300, userSelect: "none" }}>|</span>
);

// ── ProjectGroup ───────────────────────────────────────────────────────────────
// Status pill clicks crossfade the task list; FLIP is reserved for task reorders
// within a stable filter view.

export default function ProjectGroup({ project, tasks, onEdit, onUpdate, allProjects, filterKey }) {
  const pal = project ? getPalette(project.color) : getPalette("gray");

  const [selected,       setSelected]       = useState(null);
  const [showDone,       setShowDone]       = useState(false);
  const [outgoingFilter, setOutgoingFilter] = useState(null); // { selected } | null
  const fadeTimerRef = useRef(null);

  // Crossfade on status pill click — same pattern as project-level crossfade
  const toggle = (status) => {
    const next = selected === status ? null : status;
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setOutgoingFilter({ selected });  // freeze current filter as the outgoing layer
    setSelected(next);                // incoming layer renders with new filter
    fadeTimerRef.current = setTimeout(() => {
      setOutgoingFilter(null);
      fadeTimerRef.current = null;
    }, 160);
  };

  const presentStatuses = STATUS_OPTIONS.filter(s => tasks.some(t => t.status === s));

  // ── Task content renderer ──────────────────────────────────────────────────
  // filterSelected — the status filter driving this render (null = show all)
  // interactive    — whether the done toggle / edit handlers are live
  const renderTaskContent = (filterSelected, interactive = true) => {
    const noFilter    = filterSelected === null;
    const activeTasks = sortTasks(
      tasks.filter(t => t.status !== "Done" && (noFilter || t.status === filterSelected))
    );
    const doneTasks   = sortTasks(
      tasks.filter(t => t.status === "Done" && (noFilter || filterSelected === "Done"))
    );

    if (activeTasks.length === 0 && doneTasks.length === 0) {
      return (
        <div style={{ fontSize: "13px", color: "#55555e", padding: "10px 0 14px" }}>
          No tasks match the active filters.
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Active tasks — key resets FLIP whenever the status filter changes,
            but preserves it across renders where only task values change.      */}
        <AnimatedTaskList
          key={`${filterKey}|${filterSelected ?? "__all__"}`}
          tasks={activeTasks}
          projects={allProjects}
          onEdit={interactive ? onEdit : undefined}
          onUpdate={interactive ? onUpdate : undefined}
        />

        {/* Done tasks collapsible */}
        {doneTasks.length > 0 && (
          <div style={{ marginTop: "4px" }}>
            <button
              onClick={interactive ? () => setShowDone(v => !v) : undefined}
              style={{
                background: "none", border: "none",
                cursor:     interactive ? "pointer" : "default",
                color:      "#555560", fontSize: "11px", fontWeight: 600,
                padding:    "4px 0", fontFamily: "inherit",
                display:    "flex", alignItems: "center", gap: "6px",
                userSelect: "none",
              }}
            >
              <span style={{
                display:    "inline-block",
                transform:  showDone ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
                fontSize:   "9px",
              }}>▶</span>
              {showDone ? "Hide" : "Show"} completed ({doneTasks.length})
            </button>

            {showDone && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                {doneTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projects={allProjects}
                    onEdit={interactive ? onEdit : undefined}
                    onUpdate={interactive ? onUpdate : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* ── Group header ──────────────────────────────────────────────────── */}
      <div style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "10px",
        marginBottom:  "8px",
        paddingBottom: "6px",
        flexWrap:      "wrap",
      }}>
        <div style={{
          width:        "9px",
          height:       "9px",
          borderRadius: "50%",
          background:   pal.text,
          flexShrink:   0,
        }} />

        <span style={{
          fontSize:      "13px",
          fontWeight:    700,
          color:         "#f0f0f0",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          whiteSpace:    "nowrap",
        }}>
          {project ? project.title : "Uncategorized"}
        </span>

        <Sep />

        <span style={{ fontSize: "12px", color: "#555560", whiteSpace: "nowrap" }}>
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </span>

        <Sep />

        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {presentStatuses.map(status => (
            <StatusFilterPill
              key={status}
              status={status}
              count={tasks.filter(t => t.status === status).length}
              selected={selected === status}
              onToggle={() => toggle(status)}
            />
          ))}
        </div>

        <div style={{
          flex:         1,
          minWidth:     "8px",
          marginRight:  "8px",
          height:       "2px",
          background:   pal.text,
          borderRadius: "1px",
        }} />
      </div>

      {/* ── Task list — crossfade on filter change, FLIP on task reorder ──── */}
      <div style={{ position: "relative" }}>

        {/* Incoming (live) layer */}
        <div
          key={selected ?? "__all__"}
          className={outgoingFilter ? "xfade-in" : undefined}
        >
          {renderTaskContent(selected, true)}
        </div>

        {/* Outgoing layer — absolute overlay, fades out */}
        {outgoingFilter && (
          <div
            className="xfade-out"
            style={{
              position:      "absolute",
              top:           0,
              left:          0,
              right:         0,
              pointerEvents: "none",
            }}
          >
            {renderTaskContent(outgoingFilter.selected, false)}
          </div>
        )}
      </div>
    </div>
  );
}
