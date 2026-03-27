import { useState } from "react";
import { getPalette } from "../../colors";
import { STATUS_COLORS } from "../../theme";
import TaskCard from "../TaskCard";

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

function StatusFilterPill({ status, count, active, onToggle }) {
  const [hov, setHov] = useState(false);
  const colorKey = STATUS_COLORS[status] ?? "gray";
  const p        = getPalette(colorKey); // glow palette

  const bg      = active ? p.bg     : hov ? "rgba(255,255,255,0.04)" : "transparent";
  const border  = active ? p.border : hov ? "#444450"               : "#3a3a3a";
  const color   = active ? p.text   : hov ? "#888890"               : "#555560";

  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onToggle}
      style={{
        display:     "flex",
        alignItems:  "center",
        gap:         "5px",
        background:  bg,
        border:      `1px solid ${border}`,
        borderRadius:"6px",
        cursor:      "pointer",
        color,
        fontSize:    "10px",
        fontWeight:  700,
        padding:     "3px 8px",
        fontFamily:  "inherit",
        transition:  "background 0.15s, border-color 0.15s, color 0.15s",
        whiteSpace:  "nowrap",
      }}
    >
      {status}
      {count > 0 && (
        <span style={{
          fontSize:     "9px",
          fontWeight:   800,
          background:   active ? "rgba(0,0,0,0.25)" : "#2a2a2a",
          color:        active ? p.text : "#555560",
          borderRadius: "999px",
          padding:      "1px 5px",
          transition:   "background 0.15s, color 0.15s",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── ProjectGroup ───────────────────────────────────────────────────────────────
// Shows all tasks for one project (or "Uncategorized") under a header that
// includes a color dot, project name, total task count, and per-status
// filter toggle pills.
//
// Done tasks are separated into a collapsible section at the bottom so the
// main list stays focused on active work.

export default function ProjectGroup({ project, tasks, onEdit, onUpdate, allProjects }) {
  const pal = project ? getPalette(project.color) : getPalette("gray");

  // All statuses active by default
  const [activeStatuses, setActiveStatuses] = useState(() => new Set(STATUS_OPTIONS));
  const [showDone,       setShowDone]       = useState(false);

  const toggleStatus = (status) => {
    setActiveStatuses(prev => {
      const next = new Set(prev);
      // Always keep at least one status active so the view is never blank
      if (next.has(status) && next.size > 1) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  // Active (non-done) tasks that pass the filter
  const activeFiltered = sortTasks(
    tasks.filter(t => t.status !== "Done" && activeStatuses.has(t.status))
  );

  // Done tasks — shown in collapsible only if "Done" is toggled on
  const doneTasks = activeStatuses.has("Done")
    ? sortTasks(tasks.filter(t => t.status === "Done"))
    : [];

  const totalCount = tasks.length;

  return (
    <div>
      {/* ── Group header ──────────────────────────────────────────────────── */}
      <div style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "10px",
        marginBottom:  "12px",
        paddingBottom: "10px",
        borderBottom:  "1px solid #2e2e33",
        flexWrap:      "wrap",
      }}>
        {/* Color dot */}
        <div style={{
          width:        "10px",
          height:       "10px",
          borderRadius: "50%",
          background:   pal.text,
          flexShrink:   0,
        }} />

        {/* Project name */}
        <span style={{
          fontSize:      "13px",
          fontWeight:    700,
          color:         "#f0f0f0",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}>
          {project ? project.title : "Uncategorized"}
        </span>

        {/* Task count */}
        <span style={{ fontSize: "12px", color: "#555560" }}>
          {totalCount} task{totalCount !== 1 ? "s" : ""}
        </span>

        <div style={{ flex: 1 }} />

        {/* Status filter pills */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map(status => (
            <StatusFilterPill
              key={status}
              status={status}
              count={tasks.filter(t => t.status === status).length}
              active={activeStatuses.has(status)}
              onToggle={() => toggleStatus(status)}
            />
          ))}
        </div>
      </div>

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      {activeFiltered.length === 0 && doneTasks.length === 0 ? (
        <div style={{ fontSize: "13px", color: "#55555e", padding: "10px 0 14px" }}>
          No tasks match the active filters.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {activeFiltered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              projects={allProjects}
              onEdit={onEdit}
              onUpdate={onUpdate}
            />
          ))}

          {/* ── Done tasks collapsible ──────────────────────────────────── */}
          {doneTasks.length > 0 && (
            <div style={{ marginTop: "4px" }}>
              <button
                onClick={() => setShowDone(v => !v)}
                style={{
                  background:  "none",
                  border:      "none",
                  cursor:      "pointer",
                  color:       "#666",
                  fontSize:    "11px",
                  fontWeight:  600,
                  padding:     "4px 0",
                  fontFamily:  "inherit",
                  display:     "flex",
                  alignItems:  "center",
                  gap:         "6px",
                  userSelect:  "none",
                }}
              >
                <span style={{
                  display:    "inline-block",
                  transform:  showDone ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.15s",
                  fontSize:   "9px",
                }}>
                  ▶
                </span>
                {showDone ? "Hide" : "Show"} completed ({doneTasks.length})
              </button>

              {showDone && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                  {doneTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projects={allProjects}
                      onEdit={onEdit}
                      onUpdate={onUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
