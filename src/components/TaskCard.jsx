import { useState, useRef, useEffect } from "react";
import { getPalette } from "../colors";
import { STATUS_COLORS, PRIORITY_COLORS } from "../theme";
import ImageViewer from "./tasks/sub/ImageViewer";
import MutedBadge from "./ui/MutedBadge";

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatShortDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
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

// Convert a hex color string (#RRGGBB) to "r, g, b" for use in rgba()
const hexToRgb = (hex) => {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "136, 136, 144";
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(", ");
};

// ── MetaDropdown — shared dropdown list ───────────────────────────────────────

function MetaDropdown({ options, selected, getColorKey, onSelect }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute", left: 0, top: "calc(100% + 4px)", zIndex: 400,
        background: "#1E1E1E", border: "1px solid #3a3a44",
        borderRadius: "8px", padding: "4px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)", minWidth: "160px",
      }}
    >
      {options.map(opt => {
        const p = getPalette(getColorKey(opt));
        const isSel = opt === selected;
        return (
          <div key={opt} onClick={() => onSelect(opt)} style={{
            padding: "6px 10px", borderRadius: "5px", cursor: "pointer",
            background: isSel ? "#2e2e3a" : "transparent",
            display: "flex", alignItems: "center", gap: "8px",
            transition: "background 0.1s",
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.text, flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "#c8c8d0", fontWeight: isSel ? 600 : 400 }}>{opt}</span>
            {isSel && <span style={{ fontSize: "11px", color: "#55555e", marginLeft: "auto" }}>✓</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── DockCell — one integrated cell in the slim data dock ──────────────────────
// Inspired by the "slim-data-dock" pattern:
//   - Persistent low-opacity color tint on bg + text at rest
//   - Full-color text + brighter bg + glowing top bar on hover
//   - Top glow bar is always faintly visible, becomes vivid on hover

const CELL_W = 85; // px — all three cells identical

function DockCell({ value, placeholder, colorKey, onClick, refProp, style: extraStyle, children }) {
  const [hov, setHov] = useState(false);
  const p      = getPalette(colorKey);
  const rgb    = hexToRgb(p.text);
  const hasVal = !!value;

  const barBg    = hasVal ? (hov ? `rgba(${rgb}, 1)`    : `rgba(${rgb}, 0.55)`) : "transparent";
  const barGlow  = hasVal ? (hov ? `0 0 12px rgba(${rgb}, 0.8)` : `0 0 4px rgba(${rgb}, 0.3)`) : "none";
  const cellBg   = hasVal ? (hov ? `rgba(${rgb}, 0.22)` : `rgba(${rgb}, 0.13)`) : (hov ? "#222226" : "#1e1e22");
  const textColor = hasVal ? (hov ? `rgba(${rgb}, 1)` : `rgba(${rgb}, 0.8)`) : "#555560";
  const textGlow  = hasVal && hov ? `0 0 10px rgba(${rgb}, 0.5)` : "none";
  const textWeight = hasVal ? 900 : 400;

  return (
    <div
      ref={refProp}
      style={{
        position: "relative",
        borderLeft: "1px solid rgba(255,255,255,0.03)",
        ...extraStyle,
      }}
    >
      {/* Top glow bar */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          borderTopRightRadius: extraStyle?.borderTopRightRadius,
          background: barBg,
          boxShadow: barGlow,
          transition: "background 0.2s ease, box-shadow 0.2s ease",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Clickable cell body */}
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={onClick}
        style={{
          width: `${CELL_W}px`, height: "30px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          borderTopRightRadius: extraStyle?.borderTopRightRadius,
          background: cellBg,
          transition: "background 0.2s ease",
        }}
      >
        <span style={{
          fontSize: "9px", fontWeight: textWeight, letterSpacing: "0.8px",
          textTransform: "uppercase", whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
          maxWidth: `${CELL_W - 10}px`,
          color: textColor,
          textShadow: textGlow,
          transition: "color 0.2s ease, text-shadow 0.2s ease",
          userSelect: "none",
        }}>
          {value || placeholder}
        </span>
      </div>

      {/* Dropdown / picker portal */}
      {children}
    </div>
  );
}

// ── StatusCell ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["Not Started", "In Progress", "Needs Review", "Done"];

function StatusCell({ status, colorKey, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <DockCell
      value={status} placeholder="Status"
      colorKey={colorKey}
      onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
      refProp={ref}
    >
      {open && (
        <MetaDropdown
          options={STATUS_OPTIONS} selected={status}
          getColorKey={opt => STATUS_COLORS[opt] ?? "gray"}
          onSelect={opt => { onChange(opt); setOpen(false); }}
        />
      )}
    </DockCell>
  );
}

// ── PriorityCell ───────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

function PriorityCell({ priority, colorKey, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <DockCell
      value={priority} placeholder="Priority"
      colorKey={colorKey}
      onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
      refProp={ref}
    >
      {open && (
        <MetaDropdown
          options={PRIORITY_OPTIONS} selected={priority}
          getColorKey={opt => PRIORITY_COLORS[opt] ?? "gray"}
          onSelect={opt => { onChange(opt); setOpen(false); }}
        />
      )}
    </DockCell>
  );
}

// ── DueDateCell ────────────────────────────────────────────────────────────────

function DueDateCell({ dueDate, colorKey, onChange }) {
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

  return (
    <DockCell
      value={formatShortDate(dueDate)} placeholder="Due Date"
      colorKey={colorKey}
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
            onChange={e => { onChange(e.target.value || null); setOpen(false); }}
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
              onClick={() => { onChange(null); setOpen(false); }}
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
    </DockCell>
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
        width: "100%",
        background: "#2c2c2c", border: "1px solid #3a3a3a",
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
          background: "#1E1E1E", border: "1px solid #3a3a3a", borderRadius: "7px",
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
            <div key={u.id} style={{ background: "#1E1E1E", borderRadius: "7px", padding: "8px 10px", borderLeft: "2px solid #3a3a3a" }}>
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
  const [showPopover, setShowPopover] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);

  const project    = projects.find(p => p.id === task.projectId);
  const projectPal = project ? getPalette(project.color) : null;

  // Use "gray" as the colorKey when no value is set so empty cells look neutral
  const statusColorKey   = task.status   ? (STATUS_COLORS[task.status]     ?? "gray") : "gray";
  const priorityColorKey = task.priority ? (PRIORITY_COLORS[task.priority]  ?? "gray") : "gray";
  const dueDateColorKey  = task.dueDate  ? getDueDateColorKey(task.dueDate)            : "gray";

  const subtasks = task.subtasks ?? [];
  const updates  = task.updates  ?? [];
  const links    = task.links    ?? [];
  const images   = task.images   ?? [];

  const doneCount = subtasks.filter(s => s.status === "complete").length;

  const lastUpdate = updates.length > 0
    ? [...updates].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
    : null;

  const handleSubtaskToggle = (id) => {
    onUpdate?.({ ...task, subtasks: subtasks.map(s =>
      s.id === id ? { ...s, status: s.status === "complete" ? "open" : "complete" } : s
    )});
  };

  return (
    <>
      {/*
        Outer wrapper creates space above the card for the dock tab.
        paddingTop = dock cell height (30px) + dock top border (1px) - 1px overlap = 30px.
        The 1px overlap lets the dock's opaque background cover the card's top border
        in the dock region, making the two borders appear seamlessly connected.
      */}
      <div style={{ position: "relative", paddingTop: "30px" }}>

        {/* ── Dock: floats above the card's top-right corner ─────────────────── */}
        {/*
          Three-sided border (top + left + right, no bottom).
          The card's top border provides the bottom closure below the dock.
          Opaque background (#232323) covers the card's top border in this region
          so only the dock's own border outline is visible there.
        */}
        <div style={{
          position: "absolute", top: 0, right: 0, zIndex: 5,
          display: "flex",
          background: "#232323",
          border: "1px solid #444450",
          borderBottom: "none",
        }}>
          <StatusCell
            status={task.status}
            colorKey={statusColorKey}
            onChange={val => onUpdate?.({ ...task, status: val })}
          />
          <PriorityCell
            priority={task.priority}
            colorKey={priorityColorKey}
            onChange={val => onUpdate?.({ ...task, priority: val })}
          />
          <DueDateCell
            dueDate={task.dueDate}
            colorKey={dueDateColorKey}
            onChange={val => onUpdate?.({ ...task, dueDate: val })}
          />
        </div>

        {/* ── Card ───────────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#2a2a2a",
            border: "1px solid #444450",
            borderRadius: "10px 0px 10px 10px",
            position: "relative",
            zIndex: 1,
          }}
        >

          {/* Title + project tag */}
          <div
            onClick={() => onEdit(task)}
            style={{
              padding: "14px 16px 12px",
              display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
              cursor: "pointer", minWidth: 0,
            }}
          >
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0f0", lineHeight: 1.3 }}>
              {task.title}
            </span>
            {project && (
              <span style={{
                display: "inline-flex", alignItems: "center",
                padding: "2px 8px 2px 5px",
                borderRadius: "2px", whiteSpace: "nowrap", flexShrink: 0,
              }}>
                <span style={{
                  width: "4px", height: "16px",
                  background: projectPal.text,
                  borderRadius: "2px", marginRight: "7px", flexShrink: 0,
                }} />
                <span style={{
                  fontSize: "10px", fontWeight: 900,
                  textTransform: "uppercase", letterSpacing: "1px",
                  color: projectPal.text, lineHeight: 1,
                }}>
                  {project.title}
                </span>
              </span>
            )}
          </div>

        {/* ── Card body ──────────────────────────────────────────────────────── */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* Link badges */}
          {links.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {links.map(link => {
                const colorMap = { Source: "yellow", Sherlock: "orange", Jira: "blue", Email: "purple", Link: "gray", Other: "gray" };
                return (
                  <MutedBadge
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

          {/* Description */}
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

          {/* Image thumbnails */}
          {images.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {images.slice(0, 4).map((src, i) => (
                <div
                  key={i}
                  onClick={e => { e.stopPropagation(); setViewerIndex(i); }}
                  style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
                >
                  <img
                    src={src} alt="attachment"
                    style={{ width: "52px", height: "40px", objectFit: "cover", borderRadius: "5px", display: "block", border: "1px solid #3a3a44" }}
                  />
                  {i === 3 && images.length > 4 && (
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "5px",
                      background: "rgba(0,0,0,0.6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 700, color: "#f0f0f0",
                    }}>
                      +{images.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Last update ghost strip */}
          <div style={{ position: "relative" }}>
            <div
              onClick={e => { e.stopPropagation(); setShowPopover(v => !v); }}
              style={{
                display: "flex", alignItems: "center",
                borderTop: "1px dashed #3a3a3a",
                paddingTop: "10px",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: "2px", height: "24px", flexShrink: 0,
                background: projectPal ? projectPal.text : "#FB923C",
                borderRadius: "2px", marginRight: "12px",
              }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", flexShrink: 0, marginRight: "12px" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#AAA" }}>
                  Last Update
                </span>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#777" }}>
                  {lastUpdate ? formatShortDate(lastUpdate.timestamp) : "—"}
                </span>
              </div>
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
                onAdd={update => onUpdate?.({ ...task, updates: [...updates, update] })}
                onClose={() => setShowPopover(false)}
              />
            )}
          </div>

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "2px" }}>
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
                      width: "14px", height: "14px", flexShrink: 0, borderRadius: "3px",
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
        </div>{/* end card */}
      </div>{/* end outer wrapper */}

      {/* Image viewer modal */}
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
