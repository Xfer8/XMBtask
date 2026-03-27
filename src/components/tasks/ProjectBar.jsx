import { useState } from "react";
import { getPalette } from "../../colors";

// ── BarSegment ─────────────────────────────────────────────────────────────────
// One proportional slice of the project bar.
// flex value = task count, so segments are automatically proportional.

function BarSegment({ project, isActive, onClick }) {
  const [hov, setHov] = useState(false);
  const pal = getPalette(project.color);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      title={project.title}
      style={{
        flex:       1,        // controlled by parent wrapper flex
        height:     "100%",
        background: pal.text,
        opacity:    isActive ? 1 : hov ? 0.75 : 0.45,
        cursor:     "pointer",
        transition: "opacity 0.15s",
        boxShadow:  "none",
      }}
    />
  );
}

// ── LegendItem ─────────────────────────────────────────────────────────────────
// One row in the legend strip below the bar.
// Active state gets a colored border + tinted background.

function LegendItem({ project, count, isActive, onClick }) {
  const [hov, setHov] = useState(false);
  const pal = getPalette(project.color);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:    "flex",
        alignItems: "center",
        gap:        "5px",
        cursor:     "pointer",
        userSelect: "none",
      }}
    >
      {/* Color dot — outside the highlight box */}
      <div style={{
        width:        "8px",
        height:       "8px",
        borderRadius: "50%",
        background:   pal.text,
        flexShrink:   0,
        opacity:      isActive ? 1 : 0.7,
        transition:   "opacity 0.15s",
      }} />

      {/* Name + count — this is the part that gets the highlight box */}
      <span style={{
        fontSize:     "11px",
        fontWeight:   600,
        color:        isActive ? pal.text : "#888890",
        transition:   "color 0.15s, background 0.15s, border-color 0.15s",
        whiteSpace:   "nowrap",
        padding:      "2px 8px",
        borderRadius: "6px",
        border:       isActive ? `1px solid ${pal.border}` : `1px solid transparent`,
        background:   isActive ? pal.bg : hov ? "rgba(255,255,255,0.04)" : "transparent",
      }}>
        {project.title} ({count})
      </span>
    </div>
  );
}

// ── ProjectBar ─────────────────────────────────────────────────────────────────
// Full-width proportional bar + legend showing non-done tasks per project.
// Only renders if at least one active project has open tasks.
//
// Props:
//   tasks           — full task list
//   projects        — full project list
//   activeProjectId — currently selected project id (null = no filter)
//   onSelect        — called with project id to select, or null to clear

export default function ProjectBar({ tasks, projects, activeProjectId, onSelect }) {
  // Count non-done tasks per active project
  const openTasks = tasks.filter(t => t.status !== "Done");

  const entries = projects
    .filter(p => p.status === "Active")
    .map(p => ({
      project: p,
      count:   openTasks.filter(t => t.projectId === p.id).length,
    }))
    .filter(e => e.count > 0);

  // Nothing to show
  if (entries.length === 0) return null;

  const toggle = (id) => onSelect(activeProjectId === id ? null : id);

  return (
    <div style={{ marginBottom: "20px" }}>

      {/* ── Proportional bar ──────────────────────────────────────────────── */}
      <div style={{
        display:      "flex",
        height:       "20px",
        borderRadius: "6px",
        overflow:     "hidden",
        gap:          "2px",
        background:   "#1a1a1e", // gap color between segments
      }}>
        {entries.map(({ project, count }) => (
          // Wrap in a flex-proportional div so BarSegment fills it
          <div
            key={project.id}
            style={{ flex: count, minWidth: "4px" }}
          >
            <BarSegment
              project={project}
              isActive={activeProjectId === project.id}
              onClick={() => toggle(project.id)}
            />
          </div>
        ))}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div style={{
        display:   "flex",
        flexWrap:  "wrap",
        gap:       "4px",
        marginTop: "8px",
      }}>
        {entries.map(({ project, count }) => (
          <LegendItem
            key={project.id}
            project={project}
            count={count}
            isActive={activeProjectId === project.id}
            onClick={() => toggle(project.id)}
          />
        ))}
      </div>
    </div>
  );
}
