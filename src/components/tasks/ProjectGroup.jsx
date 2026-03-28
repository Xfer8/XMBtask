import { useState } from "react";
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
// Unselected (default): very muted — dark bg, low-opacity border and text.
// Selected (clicked):   bright — glow palette bg, border, and text.
// Hover on unselected:  slightly brightens toward selected style.

function StatusFilterPill({ status, count, selected, onToggle }) {
  const [hov, setHov] = useState(false);
  const p   = getPalette(STATUS_COLORS[status] ?? "gray"); // glow palette
  const rgb = (() => {
    const h = p.text;
    if (!h || !h.startsWith("#") || h.length < 7) return "136,136,144";
    return [1,3,5].map(i => parseInt(h.slice(i,i+2),16)).join(",");
  })();

  const bg     = selected ? p.bg                  : hov ? `rgba(${rgb},0.15)` : `rgba(${rgb},0.08)`;
  const border = selected ? p.border              : hov ? p.border            : `rgba(${rgb},0.3)`;
  const color  = selected ? p.text               : hov ? p.text               : `rgba(${rgb},0.65)`;

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
      <span style={{
        fontSize:   "9px",
        fontWeight: 800,
        opacity:    selected ? 0.7 : 0.6,
      }}>
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
// Header: ● Project Name  |  N tasks  |  [Status · count] ...
// Status pills only render if that status has at least one task.
// Selecting a pill (click = bright) filters the list to that status.
// Multiple pills can be selected; no selection = show all tasks.
// Done tasks are always in a separate collapsible section at the bottom.

export default function ProjectGroup({ project, tasks, onEdit, onUpdate, allProjects }) {
  const pal = project ? getPalette(project.color) : getPalette("gray");

  // null = no filter (show all); a status string = filter to that status
  const [selected, setSelected] = useState(null);
  const [showDone, setShowDone] = useState(false);

  // Clicking the active filter deselects (back to all); clicking another selects it
  const toggle = (status) => setSelected(prev => prev === status ? null : status);

  const noFilter = selected === null;

  // Active (non-done) tasks, filtered
  const activeTasks = sortTasks(
    tasks.filter(t => t.status !== "Done" && (noFilter || t.status === selected))
  );

  // Done tasks — in collapsible; shown when no filter or "Done" is selected
  const doneTasks = sortTasks(
    tasks.filter(t => t.status === "Done" && (noFilter || selected === "Done"))
  );

  // Only render pills for statuses that have at least one task
  const presentStatuses = STATUS_OPTIONS.filter(s => tasks.some(t => t.status === s));

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
        {/* Left accent line — fixed 8px, project color */}
        <div style={{
          width:        "8px",
          height:       "2px",
          background:   pal.text,
          borderRadius: "1px",
          flexShrink:   0,
        }} />

        {/* Project name */}
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

        {/* Task count */}
        <span style={{ fontSize: "12px", color: "#555560", whiteSpace: "nowrap" }}>
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </span>

        <Sep />

        {/* Status filter pills — only shown statuses */}
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

        {/* Right accent line — fills remaining space, matches left */}
        <div style={{
          flex:         1,
          minWidth:     "8px",
          height:       "2px",
          background:   pal.text,
          borderRadius: "1px",
        }} />
      </div>

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      {activeTasks.length === 0 && doneTasks.length === 0 ? (
        <div style={{ fontSize: "13px", color: "#55555e", padding: "10px 0 14px" }}>
          No tasks match the active filters.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <AnimatedTaskList
            tasks={activeTasks}
            projects={allProjects}
            onEdit={onEdit}
            onUpdate={onUpdate}
          />

          {/* ── Done tasks collapsible ──────────────────────────────────── */}
          {doneTasks.length > 0 && (
            <div style={{ marginTop: "4px" }}>
              <button
                onClick={() => setShowDone(v => !v)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#555560", fontSize: "11px", fontWeight: 600,
                  padding: "4px 0", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: "6px",
                  userSelect: "none",
                }}
              >
                <span style={{
                  display: "inline-block",
                  transform: showDone ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.15s",
                  fontSize: "9px",
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
