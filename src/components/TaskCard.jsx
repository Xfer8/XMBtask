import { useState, useRef, useEffect } from "react";
import { getPalette } from "../colors";
import { STATUS_COLORS, PRIORITY_COLORS } from "../theme";
import ImageViewer from "./tasks/sub/ImageViewer";
import SplitBadge from "./ui/SplitBadge";

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return null;
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const formatShortDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
};

const getDueDateColorKey = (iso) => {
  if (!iso) return "gray";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((new Date(iso + "T00:00:00") - today) / 86400000);
  if (diff <= 0) return "red";
  if (diff <= 2) return "orange";
  if (diff <= 7) return "yellow";
  return "green";
};

// ── Shared badge metrics (keeps all card badges the same size) ────────────────
const BADGE = { fontSize:"12px", fontWeight:600, padding:"4px 10px", borderRadius:"4px", whiteSpace:"nowrap" };

// ── GlowBadge ─────────────────────────────────────────────────────────────────

function GlowBadge({ label, colorKey }) {
  const p = getPalette(colorKey);
  return (
    <span style={{ ...BADGE, background: p.bg, color: p.text, border: `1px solid ${p.bg}`, flexShrink: 0 }}>
      {label}
    </span>
  );
}

// ── StatusBadge — hover to reveal "Edit Status", click for dropdown ──────────

const STATUS_OPTIONS = ["Not Started", "In Progress", "Needs Review", "Done"];

function StatusBadge({ status, colorKey, onChange }) {
  const [hov,  setHov]  = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const p   = getPalette(colorKey);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <span
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          ...BADGE,
          background: hov ? p.hoverBg  : p.bg,
          color:      hov ? p.hoverText : p.text,
          border: `1px solid ${hov ? p.hoverBorder : p.bg}`,
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
          display: "inline-block", flexShrink: 0,
        }}
      >
        {status}
      </span>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", left: 0, top: "calc(100% + 4px)", zIndex: 400,
            background: "#2a2a2e", border: "1px solid #3a3a44",
            borderRadius: "8px", padding: "4px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            minWidth: "150px",
          }}
        >
          {STATUS_OPTIONS.map(opt => {
            const optP = getPalette(STATUS_COLORS[opt] ?? "gray");
            const selected = opt === status;
            return (
              <div
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); setHov(false); }}
                style={{
                  padding: "5px 8px", borderRadius: "5px", cursor: "pointer",
                  background: selected ? "#3a3a44" : "transparent",
                  display: "flex", alignItems: "center", gap: "8px",
                  transition: "background 0.1s",
                }}
              >
                <span style={{
                  fontSize: "10px", fontWeight: 600,
                  padding: "2px 8px", borderRadius: "4px",
                  background: optP.bg, color: optP.text,
                }}>
                  {opt}
                </span>
                {selected && (
                  <span style={{ fontSize: "10px", color: "#55555e", marginLeft: "auto" }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PriorityBadge — hover to reveal "Edit Priority", click for dropdown ───────

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

function PriorityBadge({ priority, colorKey, onChange }) {
  const [hov,  setHov]  = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const p   = getPalette(colorKey);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <span
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          ...BADGE,
          background: hov ? p.hoverBg  : p.bg,
          color:      hov ? p.hoverText : p.text,
          border: `1px solid ${hov ? p.hoverBorder : p.bg}`,
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
          display: "inline-block",
        }}
      >
        {priority}
      </span>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 400,
            background: "#2a2a2e", border: "1px solid #3a3a44",
            borderRadius: "8px", padding: "4px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            minWidth: "130px",
          }}
        >
          {PRIORITY_OPTIONS.map(opt => {
            const optP = getPalette(PRIORITY_COLORS[opt] ?? "gray");
            const selected = opt === priority;
            return (
              <div
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); setHov(false); }}
                style={{
                  padding: "5px 8px", borderRadius: "5px", cursor: "pointer",
                  background: selected ? "#3a3a44" : "transparent",
                  display: "flex", alignItems: "center", gap: "8px",
                  transition: "background 0.1s",
                }}
              >
                <span style={{
                  fontSize: "10px", fontWeight: 600,
                  padding: "2px 8px", borderRadius: "4px",
                  background: optP.bg, color: optP.text,
                }}>
                  {opt}
                </span>
                {selected && (
                  <span style={{ fontSize: "10px", color: "#55555e", marginLeft: "auto" }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── DueDateBadge — hover to reveal "Change Due Date", click for date picker ───

function DueDateBadge({ dueDate, colorKey, onChange }) {
  const [hov,  setHov]  = useState(false);
  const [open, setOpen] = useState(false);
  const ref      = useRef(null);
  const inputRef = useRef(null);
  const p = getPalette(colorKey ?? "gray");

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      try { inputRef.current.showPicker(); } catch {}
    }
  }, [open]);

  const label = dueDate ? formatDate(dueDate) : "No due date";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <span
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          ...BADGE,
          background: dueDate
            ? (hov ? p.hoverBg   : p.bg)
            : (hov ? "#374151"   : "#2a2a2a"),
          color: dueDate
            ? (hov ? p.hoverText : p.text)
            : (hov ? "#D1D5DB"   : "#55555e"),
          border: `1px solid ${hov
            ? (dueDate ? p.hoverBorder : "#4B5563")
            : (dueDate ? p.bg : "#374151")}`,
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
          display: "inline-block",
        }}
      >
        {label}
      </span>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 400,
            background: "#2a2a2e", border: "1px solid #3a3a44",
            borderRadius: "8px", padding: "10px 12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <input
            ref={inputRef}
            type="date"
            value={dueDate ?? ""}
            onChange={(e) => { onChange(e.target.value || null); setOpen(false); setHov(false); }}
            style={{
              background: "#1e1e1e", border: "1px solid #3a3a3a",
              borderRadius: "6px", color: "#f0f0f0",
              fontSize: "12px", padding: "6px 10px",
              colorScheme: "dark", fontFamily: "inherit", outline: "none",
              display: "block",
            }}
          />
          {dueDate && (
            <button
              onClick={() => { onChange(null); setOpen(false); setHov(false); }}
              style={{
                marginTop: "6px", background: "none", border: "none",
                color: "#888890", fontSize: "11px",
                cursor: "pointer", fontFamily: "inherit", padding: "2px 0",
                display: "block",
              }}
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────

function ProgressBar({ pct, colorKey = "green" }) {
  const p = getPalette(colorKey);
  return (
    <div style={{ height: "4px", background: "#2e2e33", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, pct))}%`,
        background: p.text, borderRadius: "4px",
        transition: "width 0.3s ease",
      }} />
    </div>
  );
}

// ── UpdatePopover ─────────────────────────────────────────────────────────────

function UpdatePopover({ updates = [], onAdd, onClose }) {
  const [text, setText] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd({ id: "UP" + Date.now(), text: trimmed, timestamp: new Date().toISOString() });
    setText("");
    onClose();
  };

  const sorted = [...updates].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const formatTs = (iso) => new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  return (
    <div
      ref={ref}
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute", zIndex: 600,
        top: "calc(100% + 6px)", left: 0,
        width: "300px",
        background: "#2a2a2e", border: "1px solid #3a3a44",
        borderRadius: "10px", padding: "14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{
        fontSize: "10px", fontWeight: 700, color: "#55555e",
        letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px",
      }}>
        Updates
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); }
          if (e.key === "Escape") { e.stopPropagation(); setText(""); onClose(); }
        }}
        placeholder="Add an update… (Enter to save, Shift+Enter for new line)"
        rows={3}
        autoFocus
        style={{
          width: "100%", boxSizing: "border-box",
          background: "#1e1e1e", border: "1px solid #3a3a3a", borderRadius: "7px",
          color: "#f0f0f0", fontSize: "12px", padding: "8px 10px",
          fontFamily: "inherit", outline: "none", resize: "none",
          lineHeight: "1.5", marginBottom: "8px",
        }}
      />
      <button
        onClick={handleAdd}
        disabled={!text.trim()}
        style={{
          background: text.trim() ? "#4ADE80" : "#1a3d2a",
          border: "none", borderRadius: "6px",
          cursor: text.trim() ? "pointer" : "default",
          color: text.trim() ? "#0E3F24" : "#2e6644",
          fontSize: "12px", fontWeight: 600,
          padding: "5px 14px", fontFamily: "inherit",
          marginBottom: sorted.length ? "12px" : 0, display: "block",
        }}
      >
        Add
      </button>
      {sorted.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
          {sorted.map(u => (
            <div key={u.id} style={{ background: "#1a1a1e", borderRadius: "7px", padding: "8px 10px" }}>
              <div style={{ fontSize: "12px", color: "#c8c8d0", lineHeight: 1.4, marginBottom: "3px" }}>{u.text}</div>
              <div style={{ fontSize: "10px", color: "#55555e" }}>{formatTs(u.timestamp)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────

export default function TaskCard({ task, projects = [], onEdit, onUpdate }) {
  const [hov,          setHov]          = useState(false);
  const [showPopover,  setShowPopover]  = useState(false);
  const [viewerIndex,  setViewerIndex]  = useState(null); // null = closed

  const project    = projects.find(p => p.id === task.projectId);
  const projectPal = project ? getPalette(project.color) : null;

  const statusColorKey   = STATUS_COLORS[task.status]    ?? "gray";
  const priorityColorKey = PRIORITY_COLORS[task.priority] ?? "yellow";
  const dueDateColorKey  = getDueDateColorKey(task.dueDate);
  const duePal           = getPalette(dueDateColorKey);

  const subtasks = task.subtasks ?? [];
  const updates  = task.updates  ?? [];
  const links    = task.links    ?? [];
  const images   = task.images   ?? [];

  const doneCount  = subtasks.filter(s => s.status === "complete").length;
  const subtaskPct = subtasks.length > 0 ? (doneCount / subtasks.length) * 100 : 0;

  const lastUpdate = updates.length > 0
    ? [...updates].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
    : null;

  const handleSubtaskToggle = (id) => {
    onUpdate?.({ ...task, subtasks: subtasks.map(s =>
      s.id === id ? { ...s, status: s.status === "complete" ? "open" : "complete" } : s
    )});
  };

  const handleAddUpdate = (update) => {
    onUpdate?.({ ...task, updates: [...updates, update] });
  };

  return (
    <>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? "#313131" : "#2a2a2a",
          border: `1px solid ${hov ? "#555560" : "#444450"}`,
          borderRadius: "10px",
          padding: "14px 16px",
          transition: "background 0.15s, border-color 0.15s",
          display: "flex",
          alignItems: "stretch",
          position: "relative",
        }}
      >
        {/* ── Left section ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "9px", minWidth: 0 }}>

          {/* Title + Project badge */}
          <div
            onClick={() => onEdit(task)}
            style={{ display: "flex", alignItems: "flex-start", gap: "8px", flexWrap: "wrap", cursor: "pointer" }}
          >
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f0", lineHeight: 1.3 }}>
              {task.title}
            </span>
            {project && (
              <span style={{
                fontSize: "10px", fontWeight: 600,
                padding: "2px 8px", borderRadius: "4px",
                background: projectPal.bg, color: projectPal.text,
                whiteSpace: "nowrap", flexShrink: 0, marginTop: "2px",
              }}>
                {project.title}
              </span>
            )}
          </div>

          {/* Description — up to 4 lines */}
          {task.description && (
            <div
              onClick={() => onEdit(task)}
              style={{
                fontSize: "12px", color: "#c8c8d0", lineHeight: 1.5,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
                cursor: "pointer",
              }}
            >
              {task.description}
            </div>
          )}

          {/* Last update row — label | text | date, all inline */}
          <div
            onClick={e => { e.stopPropagation(); setShowPopover(v => !v); }}
            style={{
              background: "#2e2e36", borderRadius: "6px",
              padding: "6px 10px", cursor: "pointer",
              position: "relative",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <span style={{
              fontSize: "12px", fontWeight: 700, color: "#55555e",
              letterSpacing: "0.1em", textTransform: "uppercase",
              whiteSpace: "nowrap", flexShrink: 0,
            }}>
              Last Update
            </span>
            <span style={{
              flex: 1, fontSize: "12px",
              color: lastUpdate ? "#888890" : "#55555e",
              fontStyle: lastUpdate ? "normal" : "italic",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {lastUpdate ? lastUpdate.text : "No updates yet — click to add one"}
            </span>
            {lastUpdate && (
              <span style={{ fontSize: "12px", color: "#55555e", whiteSpace: "nowrap", flexShrink: 0 }}>
                {formatShortDate(lastUpdate.timestamp)}
              </span>
            )}

            {showPopover && (
              <UpdatePopover
                updates={updates}
                onAdd={handleAddUpdate}
                onClose={() => setShowPopover(false)}
              />
            )}
          </div>

          {/* Subtask progress bar + "N/M subtasks" label below + checklist */}
          {subtasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <ProgressBar pct={subtaskPct} />
              <span style={{ fontSize: "10px", color: "#55555e" }}>
                {doneCount}/{subtasks.length} subtasks
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {subtasks.map(s => (
                  <div
                    key={s.id}
                    onClick={e => { e.stopPropagation(); handleSubtaskToggle(s.id); }}
                    style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer" }}
                  >
                    <div style={{
                      width: "14px", height: "14px", flexShrink: 0,
                      borderRadius: "3px",
                      border: `1.5px solid ${s.status === "complete" ? "#4ADE80" : "#3a3a3a"}`,
                      background: s.status === "complete" ? "#4ADE80" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.12s, border-color 0.12s",
                    }}>
                      {s.status === "complete" && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="#0E3F24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span style={{
                      fontSize: "11px", lineHeight: 1.3,
                      color: s.status === "complete" ? "#55555e" : "#c8c8d0",
                      textDecoration: s.status === "complete" ? "line-through" : "none",
                    }}>
                      {s.title}
                    </span>
                    {s.url && (
                      <a
                        href={s.url}
                        onClick={e => e.stopPropagation()}
                        target="_blank" rel="noreferrer"
                        style={{ fontSize: "10px", color: "#38BDF8", textDecoration: "none", whiteSpace: "nowrap" }}
                      >
                        {s.urlDisplayName || s.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status badge + Link badges — same size */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <StatusBadge
              status={task.status}
              colorKey={statusColorKey}
              onChange={(val) => onUpdate?.({ ...task, status: val })}
            />
            {links.map(link => {
              if (link.type === "Sherlock") {
                return (
                  <SplitBadge
                    key={link.id}
                    label="Sherlock"
                    value={link.displayName || link.url}
                    colorKey="orange"
                    href={link.url}
                    onClick={e => e.stopPropagation()}
                  />
                );
              }
              return (
                <a
                  key={link.id}
                  href={link.url}
                  onClick={e => e.stopPropagation()}
                  target="_blank" rel="noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <span style={{
                    fontSize: "10px", fontWeight: 600,
                    padding: "2px 8px", borderRadius: "4px",
                    background: "#0B3547", color: "#38BDF8",
                    border: "1px solid #166A8E", whiteSpace: "nowrap",
                  }}>
                    {link.displayName || link.type}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* ── Vertical divider ───────────────────────────────────────────────── */}
        <div style={{ width: "1px", background: "#444450", margin: "0 14px", flexShrink: 0 }} />

        {/* ── Right sidebar (110px, right-aligned) ───────────────────────────── */}
        <div style={{
          width: "110px", flexShrink: 0,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between", gap: "6px",
        }}>
          {/* Priority + Due date + Owner — right-justified */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
            <PriorityBadge
              priority={task.priority}
              colorKey={priorityColorKey}
              onChange={(val) => onUpdate?.({ ...task, priority: val })}
            />

            <DueDateBadge
              dueDate={task.dueDate}
              colorKey={dueDateColorKey}
              onChange={(val) => onUpdate?.({ ...task, dueDate: val })}
            />

            {task.owner && (
              <span style={{
                ...BADGE,
                background: "#374151", color: "#D1D5DB",
                border: "1px solid #374151",
                maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {task.owner}
              </span>
            )}
          </div>

          {/* Image thumbnail with count bubble */}
          {images.length > 0 && (
            <div
              onClick={e => { e.stopPropagation(); setViewerIndex(0); }}
              style={{ position: "relative", cursor: "pointer" }}
            >
              <img
                src={images[0]}
                alt="attachment"
                style={{
                  width: "100%", height: "60px",
                  objectFit: "cover", borderRadius: "6px", display: "block",
                }}
              />
              {/* Count bubble — centered on bottom-left corner */}
              <div style={{
                position: "absolute", bottom: 0, left: 0,
                transform: "translate(calc(-50% + 5px), calc(50% - 5px))",
                background: "#444450", color: "#f0f0f0",
                fontSize: "10px", fontWeight: 700,
                width: "20px", height: "20px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {images.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Image viewer modal ─────────────────────────────────────────────────── */}
      {viewerIndex !== null && (
        <ImageViewer
          images={images}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
