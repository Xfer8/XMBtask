import { useState } from "react";

const STATUS_COLORS = {
  "Not Started": { text: "#D1D5DB", bg: "#2a2e3a" },
  "In Progress":  { text: "#38BDF8", bg: "#0B3547" },
  "Needs Review": { text: "#FB923C", bg: "#45260D" },
  "Done":         { text: "#4ADE80", bg: "#0E3F24" },
};

const PRIORITY_COLORS = {
  "Low":    { text: "#4ADE80", bg: "#0E3F24" },
  "Medium": { text: "#FACC15", bg: "#3D3208" },
  "High":   { text: "#FF6B6B", bg: "#4A1B1B" },
};

function Badge({ label, colors }) {
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, padding: "2px 9px",
      borderRadius: "9999px", background: colors.bg, color: colors.text,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

const formatDueDate = (iso) => {
  if (!iso) return null;
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const getDueDateColor = (iso) => {
  if (!iso) return "#888890";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((new Date(iso + "T00:00:00") - today) / 86400000);
  if (diff <= 0) return "#FF6B6B";
  if (diff <= 2) return "#FB923C";
  if (diff <= 7) return "#FACC15";
  return "#4ADE80";
};

export default function TaskCard({ task, projectName, onEdit }) {
  const [hov, setHov] = useState(false);
  const statusColors   = STATUS_COLORS[task.status]    ?? STATUS_COLORS["Not Started"];
  const priorityColors = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS["Medium"];

  return (
    <div
      onClick={() => onEdit(task)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#313131" : "#2a2a2a",
        border: `1px solid ${hov ? "#555560" : "#444450"}`,
        borderRadius: "10px",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f0", lineHeight: 1.3 }}>
        {task.title}
      </div>

      {task.description && (
        <div style={{
          fontSize: "13px", color: "#c8c8d0", lineHeight: 1.5,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {task.description}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
        <Badge label={task.status}   colors={statusColors} />
        <Badge label={task.priority} colors={priorityColors} />
        {projectName && (
          <span style={{ fontSize: "11px", color: "#55555e", fontStyle: "italic" }}>{projectName}</span>
        )}
        {task.owner && (
          <span style={{ fontSize: "11px", color: "#888890" }}>{task.owner}</span>
        )}
        {task.dueDate && (
          <span style={{ fontSize: "11px", color: getDueDateColor(task.dueDate), marginLeft: "auto", whiteSpace: "nowrap" }}>
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
