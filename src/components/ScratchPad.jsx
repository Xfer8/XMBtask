// ─── ScratchPad.jsx ───────────────────────────────────────────────────────────
// Stateful controller for the AI text analysis feature.
// States: idle → analyzing → results | error
// "Create Task" opens the TaskModal pre-filled so the user can review before saving.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { analyzeTextForTasks } from "../services/aiService";
import { generateTaskId, generateSubtaskId } from "../services/dataService";
import TaskModal        from "./tasks/TaskModal";
import ScratchPadResults from "./ScratchPadResults";

export default function ScratchPad({ tasks = [], projects = [], onAddTask, onUpdateTask, isAdmin = false, enabled = false, onToggle }) {
  const [text,        setText]        = useState("");
  const [status,      setStatus]      = useState("idle"); // idle | analyzing | results | error
  const [suggestions, setSuggestions] = useState([]);
  const [errorMsg,    setErrorMsg]    = useState("");

  const textareaRef = useRef(null);

  // Auto-expand textarea: reset to auto then grow to fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [text]);

  // Pending task = suggestion being reviewed in the TaskModal before saving
  const [pendingTask,    setPendingTask]    = useState(null);
  const [pendingTaskIdx, setPendingTaskIdx] = useState(null);

  // ── Analyze ────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setStatus("analyzing");
    setErrorMsg("");
    try {
      const results = await analyzeTextForTasks(text, projects, tasks);
      setSuggestions(results);
      setStatus("results");
    } catch (err) {
      console.error("AI analysis error:", err);
      setErrorMsg(err.message ?? "Analysis failed. Please try again.");
      setStatus("error");
    }
  };

  // ── Discard a suggestion ───────────────────────────────────────────────────
  const handleDiscard = (idx) => {
    setSuggestions(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) setStatus("idle");
      return next;
    });
  };

  // ── Create task — opens TaskModal pre-filled ───────────────────────────────
  const handleCreate = (idx) => {
    const s = suggestions[idx];
    const prefilledTask = {
      id:          generateTaskId(tasks),
      title:       s.title,
      description: s.description ?? "",
      status:      "Not Started",
      priority:    s.priority ?? "Medium",
      dueDate:     s.dueDate ?? null,
      owner:       "",
      projectId:   s.suggestedProjectId ?? null,
      images:      [],
      updates:     [],
      subtasks:    [],
      links:       [],
    };
    setPendingTask(prefilledTask);
    setPendingTaskIdx(idx);
  };

  // ── TaskModal callbacks ────────────────────────────────────────────────────
  const handleModalUpdate = (updated) => setPendingTask(updated);

  const handleModalSave = () => {
    onAddTask(pendingTask);
    handleDiscard(pendingTaskIdx);
    setPendingTask(null);
    setPendingTaskIdx(null);
  };

  const handleModalCancel = () => {
    // Don't create the task — keep the suggestion in the list
    setPendingTask(null);
    setPendingTaskIdx(null);
  };

  // ── Add suggestion as subtask to an existing task ──────────────────────────
  const handleAddSubtask = (idx, parentTask) => {
    const s          = suggestions[idx];
    const newSubtask = {
      id:     generateSubtaskId(tasks),
      title:  s.title,
      status: "Not Started",
    };
    onUpdateTask({
      ...parentTask,
      subtasks: [...(parentTask.subtasks ?? []), newSubtask],
    });
    handleDiscard(idx);
  };

  const isAnalyzing = status === "analyzing";
  const hasText     = text.trim().length > 0;

  return (
    <>
      <div style={{
        background:   "#2a2a2a",
        border:       "1px solid #444450",
        borderRadius: "10px",
        padding:      "16px",
        marginBottom: "20px",
      }}>
        {/* Header */}
        <div style={{
          display:       "flex",
          alignItems:    "center",
          justifyContent:"space-between",
          marginBottom:  "10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              fontSize:      "13px",
              fontWeight:    600,
              color:         "#888890",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              Scratch Pad
            </span>
            {isAdmin && !enabled && (
              <span style={{
                fontSize:      "9px",
                fontWeight:    700,
                color:         "#c8a830",
                background:    "#1e1a0a",
                border:        "1px solid #4a3a10",
                borderRadius:  "4px",
                padding:       "2px 7px",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}>
                Unreleased
              </span>
            )}
          </div>

          {/* Admin toggle */}
          {isAdmin && onToggle && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#555560" }}>
                {enabled ? "Enabled" : "Disabled"}
              </span>
              <div
                onClick={() => onToggle(!enabled)}
                style={{
                  width:        "36px",
                  height:       "20px",
                  borderRadius: "999px",
                  background:   enabled ? "#4ADE80" : "#3a3a3a",
                  cursor:       "pointer",
                  position:     "relative",
                  transition:   "background 0.2s",
                  flexShrink:   0,
                }}
              >
                <div style={{
                  position:     "absolute",
                  top:          "3px",
                  left:         enabled ? "19px" : "3px",
                  width:        "14px",
                  height:       "14px",
                  borderRadius: "50%",
                  background:   enabled ? "#0a1a0f" : "#888890",
                  transition:   "left 0.2s, background 0.2s",
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Disabled overlay for non-admins */}
        {!enabled && !isAdmin && (
          <div style={{
            background:   "rgba(30,30,30,0.85)",
            border:       "1px dashed #3a3a3a",
            borderRadius: "8px",
            padding:      "24px 16px",
            textAlign:    "center",
            marginBottom: "10px",
          }}>
            <div style={{ fontSize: "18px", marginBottom: "8px", opacity: 0.4 }}>🚧</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#555560", marginBottom: "4px" }}>
              Under Construction
            </div>
            <div style={{ fontSize: "12px", color: "#444450" }}>
              This feature is not yet available.
            </div>
          </div>
        )}

        {/* Text area — starts at 6 lines, grows with content */}
        <textarea
          ref={textareaRef}
          rows={6}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste meeting notes, emails, or any text here and click Analyze to extract actionable tasks…"
          disabled={isAnalyzing || (!enabled && !isAdmin)}
          style={{
            width:        "100%",
            background:   "#1e1e1e",
            border:       "1px solid #3a3a3a",
            borderRadius: "6px",
            color:        "#f0f0f0",
            fontSize:     "13px",
            fontFamily:   "inherit",
            lineHeight:   1.6,
            padding:      "10px 12px",
            resize:       "none",
            boxSizing:    "border-box",
            outline:      "none",
            overflow:     "hidden",
            opacity:      isAnalyzing || (!enabled && !isAdmin) ? 0.3 : 1,
          }}
        />

        {/* Footer: char count + button */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          marginTop:      "10px",
        }}>
          <span style={{ fontSize: "11px", color: "#444450" }}>
            {text.length > 0 ? `${text.length} characters` : ""}
          </span>

          <button
            onClick={handleAnalyze}
            disabled={!hasText || isAnalyzing}
            style={{
              background:   hasText && !isAnalyzing ? "#4ADE80" : "#1a3d2a",
              border:       "none",
              borderRadius: "7px",
              color:        hasText && !isAnalyzing ? "#0a1a0f" : "#2e6644",
              cursor:       hasText && !isAnalyzing ? "pointer" : "default",
              fontSize:     "13px",
              fontWeight:   700,
              fontFamily:   "inherit",
              padding:      "8px 20px",
              display:      "flex",
              alignItems:   "center",
              gap:          "8px",
              transition:   "background 0.15s, color 0.15s",
            }}
          >
            {isAnalyzing && (
              <span style={{
                display:      "inline-block",
                width:        "12px",
                height:       "12px",
                border:       "2px solid #2e6644",
                borderTop:    "2px solid #4ADE80",
                borderRadius: "50%",
                animation:    "spin 0.8s linear infinite",
              }} />
            )}
            {isAnalyzing ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        {/* Spinner keyframe */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Error */}
        {status === "error" && (
          <div style={{
            marginTop:    "12px",
            background:   "#4A1B1B",
            border:       "1px solid #943636",
            borderRadius: "8px",
            padding:      "10px 14px",
            fontSize:     "12px",
            color:        "#FF6B6B",
          }}>
            {errorMsg}
          </div>
        )}

        {/* Results */}
        {status === "results" && (
          <ScratchPadResults
            suggestions={suggestions}
            projects={projects}
            tasks={tasks}
            onDiscard={handleDiscard}
            onCreate={handleCreate}
            onAddSubtask={handleAddSubtask}
          />
        )}
      </div>

      {/* Task creation modal — rendered outside the card so it overlays everything */}
      {pendingTask && (
        <TaskModal
          title="New Task"
          task={pendingTask}
          tasks={tasks}
          projects={projects}
          onUpdate={handleModalUpdate}
          onClose={handleModalSave}
          onCancel={handleModalCancel}
        />
      )}
    </>
  );
}
