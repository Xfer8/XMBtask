import { getPalette } from "../../colors";

// ── BarSegment ─────────────────────────────────────────────────────────────────
// One proportional slice of the project bar.
// Uses flex to fill its wrapper div.

function BarSegment({ project, isActive, anyActive, onClick }) {
  const pal = getPalette(project.color);

  // No filter active → all at comfortable default brightness (0.75)
  // Filter active    → selected = full bright (1.0), others = dim (0.45)
  const opacity = anyActive ? (isActive ? 1.0 : 0.45) : 0.75;

  return (
    <div
      onClick={onClick}
      title={project.title}
      style={{
        flex:       1,
        background: pal.text,
        opacity,
        cursor:     "pointer",
        transition: "opacity 0.15s",
      }}
    />
  );
}

// ── LegendItem ─────────────────────────────────────────────────────────────────
// One entry in the legend strip.
// The dot sits outside the highlight box; only name+(count) gets the border/bg.

function LegendItem({ project, count, isActive, onClick }) {
  const pal = getPalette(project.color);

  return (
    <div
      onClick={onClick}
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

      {/* Name (count) — this is the part that gets the highlight box */}
      <span style={{
        fontSize:     "11px",
        fontWeight:   600,
        color:        isActive ? pal.text : "#888890",
        transition:   "color 0.15s, background 0.15s, border-color 0.15s",
        whiteSpace:   "nowrap",
        padding:      "2px 6px",
        borderRadius: "5px",
        border:       isActive ? `1px solid ${pal.border}` : `1px solid transparent`,
        background:   isActive ? pal.bg : "transparent",
      }}>
        {project.title} ({count})
      </span>
    </div>
  );
}

// ── ProjectBar ─────────────────────────────────────────────────────────────────
// Full-width proportional bar + legend showing non-done tasks per project.
// Only renders if at least one active project has open tasks.

export default function ProjectBar({ tasks, projects, activeProjectId, onSelect }) {
  const openTasks = tasks.filter(t => t.status !== "Done");

  const entries = projects
    .filter(p => p.status === "Active")
    .map(p => ({
      project: p,
      count:   openTasks.filter(t => t.projectId === p.id).length,
    }))
    .filter(e => e.count > 0);

  if (entries.length === 0) return null;

  const toggle = (id) => onSelect(activeProjectId === id ? null : id);

  return (
    <div style={{ marginBottom: "20px" }}>

      {/* ── Proportional bar ──────────────────────────────────────────────── */}
      <div style={{
        display:      "flex",
        alignItems:   "stretch",
        height:       "20px",
        borderRadius: "6px",
        overflow:     "hidden",
        gap:          "2px",
        background:   "#1a1a1e",
        // Force GPU compositing to prevent sub-pixel border-radius artifact
        transform:    "translateZ(0)",
      }}>
        {entries.map(({ project, count }) => (
          <div
            key={project.id}
            style={{ flex: count, minWidth: "4px", display: "flex" }}
          >
            <BarSegment
              project={project}
              isActive={activeProjectId === project.id}
              anyActive={activeProjectId !== null}
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
