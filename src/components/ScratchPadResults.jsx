// ─── ScratchPadResults.jsx ────────────────────────────────────────────────────
// Renders suggested tasks from the AI analysis.
// Each card has a clear "SUGGESTED" section and a separate "EXISTING" section
// for duplicates, plus streamlined Create / Add as Subtask / Discard actions.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { getOpenTasks } from "../services/aiService";
import { STATUS_COLORS, PRIORITY_COLORS } from "../theme";
import { getPalette } from "../colors";

// ── CompactTaskPreview ────────────────────────────────────────────────────────
// Read-only summary of an existing task — used in the duplicate section.
function CompactTaskPreview({ task, projects }) {
  const project     = projects.find(p => p.id === task.projectId);
  const statusPal   = getPalette(STATUS_COLORS[task.status]   ?? "gray");
  const priorityPal = getPalette(PRIORITY_COLORS[task.priority] ?? "gray");

  const formatDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
  };

  return (
    <div style={{
      background:   "#1a1a1a",
      border:       "1px solid #333",
      borderRadius: "8px",
      padding:      "10px 14px",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#e0e0e0", marginBottom: "5px" }}>
        {task.title}
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {project && (
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#4ADE80",
            textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {project.title}
          </span>
        )}
        {project && (task.status || task.priority || task.dueDate) && (
          <span style={{ color: "#333", fontSize: "10px" }}>|</span>
        )}
        {task.status && (
          <span style={{ fontSize: "10px", fontWeight: 600, color: statusPal.text }}>
            {task.status}
          </span>
        )}
        {task.priority && task.priority !== "Medium" && (
          <span style={{ fontSize: "10px", fontWeight: 600, color: priorityPal.text }}>
            {task.priority} Priority
          </span>
        )}
        {task.dueDate && (
          <span style={{ fontSize: "10px", fontWeight: 600, color: "#c8a830" }}>
            Due {formatDate(task.dueDate)}
          </span>
        )}
      </div>
      {task.description && (
        <div style={{
          fontSize: "11px", color: "#555560", lineHeight: 1.5, marginTop: "5px",
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {task.description}
        </div>
      )}
    </div>
  );
}

// ── SubtaskPicker ─────────────────────────────────────────────────────────────
function SubtaskPicker({ suggestion, tasks, projects, onPick, onCancel }) {
  const [search, setSearch] = useState("");
  const openTasks  = getOpenTasks(tasks);
  const duplicates = openTasks.filter(t => suggestion.potentialDuplicateIds?.includes(t.id));
  const others     = openTasks.filter(t => !suggestion.potentialDuplicateIds?.includes(t.id));

  const projectName = (id) => projects.find(p => p.id === id)?.title ?? null;

  const filterFn = (t) => !search || t.title.toLowerCase().includes(search.toLowerCase());

  const TaskRow = ({ task, isDuplicate }) => (
    <div
      onClick={() => onPick(task)}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 10px", borderRadius: "6px", cursor: "pointer",
        background: isDuplicate ? "#1a2e1f" : "transparent",
        border: isDuplicate ? "1px solid #2a4a30" : "1px solid transparent",
        marginBottom: "3px", transition: "background 0.1s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = isDuplicate ? "#1f3825" : "#2a2a2a"}
      onMouseLeave={e => e.currentTarget.style.background = isDuplicate ? "#1a2e1f" : "transparent"}
    >
      {isDuplicate && (
        <span style={{
          fontSize: "9px", color: "#4ADE80", fontWeight: 700,
          background: "#0d2016", border: "1px solid #2DB86A", borderRadius: "4px",
          padding: "1px 5px", whiteSpace: "nowrap", flexShrink: 0,
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          match
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", color: "#e0e0e0", fontWeight: 500,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.title}
        </div>
        {task.projectId && projectName(task.projectId) && (
          <div style={{ fontSize: "10px", color: "#555560", marginTop: "1px" }}>
            {projectName(task.projectId)}
          </div>
        )}
      </div>
    </div>
  );

  const visibleDuplicates = duplicates.filter(filterFn);
  const visibleOthers     = others.filter(filterFn);

  return (
    <div style={{
      marginTop: "10px", background: "#1a1a1a", border: "1px solid #3a3a3a",
      borderRadius: "8px", padding: "12px",
    }}>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#888890",
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
        Add as subtask of…
      </div>
      <input
        autoFocus type="text" placeholder="Search tasks…"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box", background: "#252525",
          border: "1px solid #3a3a3a", borderRadius: "6px", color: "#f0f0f0",
          fontSize: "12px", padding: "6px 10px", fontFamily: "inherit",
          outline: "none", marginBottom: "8px",
        }}
      />
      <div style={{ maxHeight: "200px", overflowY: "auto" }}>
        {visibleDuplicates.length > 0 && (
          <>
            <div style={{ fontSize: "9px", color: "#4ADE80", fontWeight: 700,
              letterSpacing: "0.07em", textTransform: "uppercase",
              marginBottom: "4px", paddingLeft: "2px" }}>
              Possible matches
            </div>
            {visibleDuplicates.map(t => <TaskRow key={t.id} task={t} isDuplicate />)}
            {visibleOthers.length > 0 && <div style={{ borderTop: "1px solid #2a2a2a", margin: "6px 0" }} />}
          </>
        )}
        {visibleOthers.length > 0 && (
          <>
            {visibleDuplicates.length > 0 && (
              <div style={{ fontSize: "9px", color: "#555560", fontWeight: 700,
                letterSpacing: "0.07em", textTransform: "uppercase",
                marginBottom: "4px", paddingLeft: "2px" }}>
                All open tasks
              </div>
            )}
            {visibleOthers.map(t => <TaskRow key={t.id} task={t} isDuplicate={false} />)}
          </>
        )}
        {visibleDuplicates.length === 0 && visibleOthers.length === 0 && (
          <div style={{ fontSize: "12px", color: "#555560", textAlign: "center", padding: "12px 0" }}>
            No tasks match
          </div>
        )}
      </div>
      <div style={{ marginTop: "8px", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#555560", fontSize: "12px", fontFamily: "inherit", padding: "4px 8px",
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── SuggestedTaskCard ─────────────────────────────────────────────────────────
function SuggestedTaskCard({ suggestion, index, projects, tasks, onDiscard, onCreate, onAddSubtask }) {
  const [showPicker, setShowPicker] = useState(false);

  const project = suggestion.suggestedProjectId
    ? projects.find(p => p.id === suggestion.suggestedProjectId)
    : null;

  const duplicateTasks = (suggestion.potentialDuplicateIds ?? [])
    .map(id => tasks.find(t => t.id === id))
    .filter(Boolean);

  const hasDuplicates = duplicateTasks.length > 0;

  return (
    <div style={{
      background: "#252525",
      border: `1px solid ${hasDuplicates ? "#5a3e10" : "#3a3a3a"}`,
      borderRadius: "10px",
      overflow: "hidden",
    }}>

      {/* ── Suggested task section ─────────────────────────────────────────── */}
      <div style={{ padding: "14px 16px" }}>

        {/* Label */}
        <div style={{
          fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "#4ADE80", marginBottom: "8px",
        }}>
          Suggested Task
        </div>

        {/* Title */}
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#f0f0f0", marginBottom: "6px", lineHeight: 1.3 }}>
          {suggestion.title}
        </div>

        {/* Meta badges */}
        {(project || suggestion.priority || suggestion.dueDate) && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", marginBottom: "8px" }}>
            {project && (
              <span style={{
                fontSize: "10px", fontWeight: 700, color: "#4ADE80",
                background: "#0d2016", border: "1px solid #2DB86A",
                borderRadius: "4px", padding: "2px 7px",
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {project.title}
              </span>
            )}
            {suggestion.priority && suggestion.priority !== "Medium" && (
              <span style={{
                fontSize: "10px", fontWeight: 600, borderRadius: "4px", padding: "2px 7px",
                ...(suggestion.priority === "High"
                  ? { color: "#FF6B6B", background: "#2a0e0e", border: "1px solid #7a2020" }
                  : { color: "#888890", background: "#1e1e1e", border: "1px solid #3a3a3a" }),
              }}>
                {suggestion.priority}
              </span>
            )}
            {suggestion.dueDate && (
              <span style={{
                fontSize: "10px", fontWeight: 600, color: "#c8a830",
                background: "#1e1a0a", border: "1px solid #4a3a10",
                borderRadius: "4px", padding: "2px 7px",
              }}>
                Due {suggestion.dueDate}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {suggestion.description && (
          <div style={{ fontSize: "12px", color: "#888890", lineHeight: 1.6 }}>
            {suggestion.description}
          </div>
        )}
      </div>

      {/* ── Duplicate section ─────────────────────────────────────────────── */}
      {hasDuplicates && (
        <div style={{
          borderTop: "1px solid #5a3e10",
          background: "#1e1608",
          padding: "12px 16px",
        }}>
          <div style={{
            fontSize: "10px", fontWeight: 700, color: "#c8a830",
            textTransform: "uppercase", letterSpacing: "0.08em",
            marginBottom: "8px",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span>⚠</span>
            <span>Similar task{duplicateTasks.length > 1 ? "s" : ""} already exist{duplicateTasks.length === 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {duplicateTasks.map(t => (
              <CompactTaskPreview key={t.id} task={t} projects={projects} />
            ))}
          </div>
        </div>
      )}

      {/* ── Action bar ────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${hasDuplicates ? "#5a3e10" : "#333"}`,
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        background: hasDuplicates ? "#1a1200" : "#1e1e1e",
      }}>
        <button onClick={() => onDiscard(index)} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#555560", fontSize: "12px", fontFamily: "inherit",
          padding: "4px 2px",
          transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "#888890"}
          onMouseLeave={e => e.currentTarget.style.color = "#555560"}
        >
          Discard
        </button>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowPicker(v => !v)}
            style={{
              background: "none", border: "1px solid #3a3a3a", borderRadius: "6px",
              cursor: "pointer", color: "#c8c8d0", fontSize: "12px",
              padding: "6px 14px", fontFamily: "inherit",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#555560"; e.currentTarget.style.color = "#f0f0f0"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#3a3a3a"; e.currentTarget.style.color = "#c8c8d0"; }}
          >
            Add as Subtask {showPicker ? "▴" : "▾"}
          </button>

          <button
            onClick={() => onCreate(index)}
            style={{
              background: "#4ADE80", border: "none", borderRadius: "6px",
              cursor: "pointer", color: "#0a1a0f", fontSize: "12px",
              fontWeight: 700, padding: "6px 16px", fontFamily: "inherit",
            }}
          >
            Create New Task
          </button>
        </div>
      </div>

      {/* Subtask picker — inline below action bar */}
      {showPicker && (
        <div style={{ padding: "0 16px 14px", background: hasDuplicates ? "#1a1200" : "#1e1e1e" }}>
          <SubtaskPicker
            suggestion={suggestion}
            tasks={tasks}
            projects={projects}
            onPick={(parentTask) => { onAddSubtask(index, parentTask); setShowPicker(false); }}
            onCancel={() => setShowPicker(false)}
          />
        </div>
      )}
    </div>
  );
}

// ── ScratchPadResults ─────────────────────────────────────────────────────────
export default function ScratchPadResults({ suggestions, projects, tasks, onDiscard, onCreate, onAddSubtask }) {
  if (suggestions.length === 0) {
    return (
      <div style={{
        background: "#1e1e1e", border: "1px solid #3a3a3a", borderRadius: "8px",
        padding: "20px", textAlign: "center", marginTop: "12px",
      }}>
        <div style={{ fontSize: "13px", color: "#555560" }}>
          No actionable tasks found in this text.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "14px" }}>
      <div style={{
        fontSize: "10px", fontWeight: 700, color: "#555560",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px",
      }}>
        Suggested Tasks ({suggestions.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {suggestions.map((s, i) => (
          <SuggestedTaskCard
            key={i} index={i}
            suggestion={s}
            projects={projects}
            tasks={tasks}
            onDiscard={onDiscard}
            onCreate={onCreate}
            onAddSubtask={onAddSubtask}
          />
        ))}
      </div>
    </div>
  );
}
