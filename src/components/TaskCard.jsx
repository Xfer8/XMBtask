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

// ── MetaBadge — shared base for all right-sidebar meta badges ────────────────
// Animated left-to-right fill on hover with color glow.

function MetaBadge({ abbr, value, color, hov, setHov, onClick, refProp, children }) {
  return (
    <div ref={refProp} style={{ position: "relative", width: "100%" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={onClick}
        style={{
          display: "flex", alignItems: "stretch",
          background: "#222222", borderRadius: "2px",
          overflow: "hidden",
          border: hov ? `1px solid ${color}` : "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
          transition: "border-color 0.3s ease",
          width: "100%",
        }}
      >
        {/* Label section with animated left-to-right fill */}
        <div style={{
          position: "relative", width: "44px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.25)", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, height: "100%",
            width: hov ? "100%" : "3px",
            background: color,
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 1,
          }} />
          <span style={{
            position: "relative", zIndex: 2,
            fontSize: "10px", fontWeight: 900,
            color: hov ? "#1A1A1A" : "#666",
            transition: "color 0.3s ease",
            letterSpacing: "0.04em", userSelect: "none",
          }}>
            {abbr}
          </span>
        </div>
        {/* Value section */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          padding: "7px 10px",
          fontSize: "12px", fontWeight: 700, color: "#f0f0f0",
          borderLeft: "1px solid rgba(0,0,0,0.3)", minWidth: 0,
        }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Shared dropdown list ───────────────────────────────────────────────────────

function MetaDropdown({ options, selected, getColorKey, onSelect }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 400,
        background: "#1E1E1E", border: "1px solid #3a3a44",
        borderRadius: "8px", padding: "4px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)", minWidth: "160px",
      }}
    >
      {options.map(opt => {
        const p = getPalette(getColorKey(opt));
        const isSelected = opt === selected;
        return (
          <div key={opt} onClick={() => onSelect(opt)} style={{
            padding: "6px 10px", borderRadius: "5px", cursor: "pointer",
            background: isSelected ? "#2e2e3a" : "transparent",
            display: "flex", alignItems: "center", gap: "8px",
            transition: "background 0.1s",
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.text, flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#c8c8d0", fontWeight: isSelected ? 600 : 400 }}>{opt}</span>
            {isSelected && <span style={{ fontSize: "11px", color: "#55555e", marginLeft: "auto" }}>✓</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["Not Started", "In Progress", "Needs Review", "Done"];

function StatusBadge({ status, colorKey, onChange }) {
  const [hov, setHov] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <MetaBadge
      abbr="STA" value={status}
      color={getPalette(colorKey).text}
      hov={hov} setHov={setHov}
      onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
      refProp={ref}
    >
      {open && (
        <MetaDropdown
          options={STATUS_OPTIONS} selected={status}
          getColorKey={opt => STATUS_COLORS[opt] ?? "gray"}
          onSelect={opt => { onChange(opt); setOpen(false); setHov(false); }}
        />
      )}
    </MetaBadge>
  );
}

// ── PriorityBadge ─────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

function PriorityBadge({ priority, colorKey, onChange }) {
  const [hov, setHov] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <MetaBadge
      abbr="PRY" value={priority}
      color={getPalette(colorKey).text}
      hov={hov} setHov={setHov}
      onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
      refProp={ref}
    >
      {open && (
        <MetaDropdown
          options={PRIORITY_OPTIONS} selected={priority}
          getColorKey={opt => PRIORITY_COLORS[opt] ?? "gray"}
          onSelect={opt => { onChange(opt); setOpen(false); setHov(false); }}
        />
      )}
    </MetaBadge>
  );
}

// ── DueDateBadge ──────────────────────────────────────────────────────────────

function DueDateBadge({ dueDate, colorKey, onChange }) {
  const [hov,  setHov]  = useState(false);
  const [open, setOpen] = useState(false);
  const ref      = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      try { inputRef.current.showPicker(); } catch {}
    }
  }, [open]);

  const color = dueDate ? getPalette(colorKey).text : "#4B5563";
  const label = dueDate ? formatShortDate(dueDate) : "No date";

  return (
    <MetaBadge
      abbr="DUE" value={label}
      color={color}
      hov={hov} setHov={setHov}
      onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
      refProp={ref}
    >
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 400,
            background: "#1E1E1E", border: "1px solid #3a3a44",
            borderRadius: "8px", padding: "10px 12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <input
            ref={inputRef}
            type="date"
            value={dueDate ?? ""}
            onChange={e => { onChange(e.target.value || null); setOpen(false); setHov(false); }}
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
    </MetaBadge>
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
        background: "#1E1E1E", border: "1px solid #3a3a44",
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
  const [hov,            setHov]            = useState(false);
  const [showPopover,    setShowPopover]    = useState(false);
  const [viewerIndex,    setViewerIndex]    = useState(null); // null = closed
  const [showRibbonHov,  setShowRibbonHov]  = useState(false);

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
          background: "#2a2a2a",
          border: "1px solid #444450",
          borderRadius: "10px",
          padding: "14px 16px",
          transition: "background 0.15s, border-color 0.15s",
          display: "flex",
          alignItems: "stretch",
          gap: "20px",
          position: "relative",
        }}
      >
        {/* ── Left section ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "9px", minWidth: 0 }}>

          {/* Title + Project badge */}
          <div
            onClick={() => onEdit(task)}
            style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", cursor: "pointer" }}
          >
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0f0", lineHeight: 1.3 }}>
              {task.title}
            </span>
            {project && (
              <span style={{
                display: "inline-flex", alignItems: "center",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "4px 10px 4px 6px",
                borderRadius: "2px",
                whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {/* Colored neon bar */}
                <span style={{
                  width: "3px", height: "14px",
                  background: projectPal.text,
                  boxShadow: `0 0 8px ${projectPal.text}`,
                  borderRadius: "1px",
                  marginRight: "8px",
                  flexShrink: 0,
                  display: "inline-block",
                }} />
                <span style={{
                  fontSize: "10px", fontWeight: 900,
                  textTransform: "uppercase", letterSpacing: "1px",
                  color: "#DDD",
                  textShadow: "0 0 2px rgba(255,255,255,0.2)",
                }}>
                  {project.title}
                </span>
              </span>
            )}
          </div>

          {/* Link badges */}
          {links.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {links.map(link => {
                const colorMap = { Source:"yellow", Sherlock:"orange", Jira:"blue", Email:"purple", Link:"gray", Other:"gray" };
                return (
                  <SplitBadge
                    key={link.id}
                    label={link.type}
                    value={link.displayName || link.url || "(none)"}
                    colorKey={colorMap[link.type] ?? "gray"}
                    href={link.url || undefined}
                    onClick={e => e.stopPropagation()}
                  />
                );
              })}
            </div>
          )}

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

          {/* Last update ghost strip */}
          <div style={{ position: "relative" }}>
            <div
              onClick={e => { e.stopPropagation(); setShowPopover(v => !v); }}
              onMouseEnter={() => setShowRibbonHov(true)}
              onMouseLeave={() => setShowRibbonHov(false)}
              style={{
                display: "flex", alignItems: "center",
                borderTop: "1px dashed #3a3a3a",
                padding: "12px 0 0 0",
                cursor: "pointer",
              }}
            >
              {/* Orange vertical bar */}
              <div style={{
                width: "2px", height: "24px", flexShrink: 0,
                background: "#FB923C",
                boxShadow: "0 0 8px rgba(251,146,60,0.4)",
                borderRadius: "2px",
                marginRight: "12px",
              }} />

              {/* Stacked label + date */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", flexShrink: 0, marginRight: "12px" }}>
                <span style={{
                  fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#AAA",
                }}>
                  Last Update
                </span>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#777" }}>
                  {lastUpdate ? formatShortDate(lastUpdate.timestamp) : "—"}
                </span>
              </div>

              {/* Update text */}
              <span style={{
                flex: 1, fontSize: "12px", lineHeight: 1.4, minWidth: 0,
                color: "#777", fontStyle: "italic",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {lastUpdate ? lastUpdate.text : "No updates yet — click to add one"}
              </span>
            </div>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
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
                      fontSize: "12px", lineHeight: 1.3,
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
                        onMouseEnter={e => { e.currentTarget.style.background = "#38BDF8"; e.currentTarget.style.color = "#0B1E2D"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#38BDF8"; }}
                        style={{
                          fontSize: "10px", fontWeight: 600, textDecoration: "none",
                          whiteSpace: "nowrap", color: "#38BDF8", background: "transparent",
                          border: "1px solid #38BDF8", borderRadius: "999px",
                          padding: "1px 7px", transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        {s.urlDisplayName || s.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>


        {/* ── Right sidebar ───────────────────────────────────────────────────── */}
        <div style={{
          width: "150px", flexShrink: 0,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between", gap: "6px",
        }}>
          {/* Status + Priority + Due date + Owner */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <StatusBadge
              status={task.status}
              colorKey={statusColorKey}
              onChange={(val) => onUpdate?.({ ...task, status: val })}
            />
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

            {task.owner && (() => {
              const [h, setH] = [false, () => {}]; // owner is display-only, no hover needed
              return (
                <div style={{
                  display: "flex", alignItems: "stretch",
                  background: "#222222", borderRadius: "2px",
                  overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)",
                  width: "100%",
                }}>
                  <div style={{
                    position: "relative", width: "44px", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.25)",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "3px", background: "#4B5563" }} />
                    <span style={{ position: "relative", zIndex: 2, fontSize: "10px", fontWeight: 900, color: "#666", letterSpacing: "0.04em" }}>
                      OWN
                    </span>
                  </div>
                  <div style={{
                    flex: 1, display: "flex", alignItems: "center", padding: "7px 10px",
                    fontSize: "12px", fontWeight: 700, color: "#f0f0f0",
                    borderLeft: "1px solid rgba(0,0,0,0.3)", minWidth: 0,
                  }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.owner}</span>
                  </div>
                </div>
              );
            })()}
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
          onDelete={newImages => onUpdate?.({ ...task, images: newImages })}
        />
      )}
    </>
  );
}
