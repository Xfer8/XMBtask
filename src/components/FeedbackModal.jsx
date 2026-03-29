import { useState } from "react";
import { submitFeedback } from "../services/feedbackService";
import { useAuth } from "../contexts/AuthContext";

const TYPE_OPTIONS = [
  { value: "new-feature",      label: "New Feature" },
  { value: "existing-feature", label: "Existing Feature" },
  { value: "general",          label: "General Feedback" },
  { value: "other",            label: "Other" },
];

const labelStyle = {
  fontSize: "11px", fontWeight: 600, color: "#888890",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: "6px",
};

export default function FeedbackModal({ onClose }) {
  const { user } = useAuth();
  const [type,        setType]        = useState("");
  const [description, setDescription] = useState("");
  const [status,      setStatus]      = useState("idle"); // idle | submitting | done | error

  const canSubmit = type && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || status === "submitting") return;
    setStatus("submitting");
    try {
      await submitFeedback({
        type,
        description: description.trim(),
        userEmail: user?.email        ?? "Unknown",
        userName:  user?.displayName  ?? "Unknown",
      });
      setStatus("done");
    } catch (err) {
      console.error("Feedback submission error:", err);
      setStatus("error");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#2c2c2c", border: "1px solid #3a3a3a", borderRadius: "14px",
        padding: "28px 32px", width: "420px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
      }}>
        {status === "done" ? (
          /* ── Success state ─────────────────────────────────────────────────── */
          <>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f0f0f0", marginBottom: "8px" }}>
              Thanks for the feedback!
            </div>
            <div style={{ fontSize: "13px", color: "#888890", lineHeight: 1.5, marginBottom: "24px" }}>
              Your submission has been received and will be reviewed soon.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{
                background: "#4ADE80", border: "none", borderRadius: "7px",
                color: "#0a1a0f", fontSize: "13px", fontWeight: 700,
                padding: "8px 20px", cursor: "pointer", fontFamily: "inherit",
              }}>
                Done
              </button>
            </div>
          </>
        ) : (
          /* ── Form ──────────────────────────────────────────────────────────── */
          <>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f0f0f0", marginBottom: "4px" }}>
              Share Feedback
            </div>
            <div style={{ fontSize: "13px", color: "#888890", lineHeight: 1.5, marginBottom: "20px" }}>
              Have an idea or spotted something to improve? Let us know.
            </div>

            {/* Type */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                style={{
                  width: "100%", background: "#1e1e1e",
                  border: "1px solid #3a3a3a", borderRadius: "6px",
                  color: type ? "#f0f0f0" : "#555560",
                  fontSize: "13px", padding: "9px 12px",
                  fontFamily: "inherit", outline: "none", cursor: "pointer",
                }}
              >
                <option value="" disabled>Select a type…</option>
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe your idea or feedback…"
                style={{
                  width: "100%", background: "#1e1e1e",
                  border: "1px solid #3a3a3a", borderRadius: "6px",
                  color: "#f0f0f0", fontSize: "13px", fontFamily: "inherit",
                  lineHeight: 1.6, padding: "10px 12px",
                  resize: "vertical", boxSizing: "border-box", outline: "none",
                }}
              />
            </div>

            {status === "error" && (
              <div style={{
                marginBottom: "14px", background: "#4A1B1B",
                border: "1px solid #943636", borderRadius: "8px",
                padding: "10px 14px", fontSize: "12px", color: "#FF6B6B",
              }}>
                Something went wrong. Please try again.
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{
                background: "none", border: "1px solid #3a3a3a", borderRadius: "7px",
                cursor: "pointer", color: "#888890", fontSize: "13px",
                padding: "7px 18px", fontFamily: "inherit",
              }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || status === "submitting"}
                style={{
                  background:   canSubmit && status !== "submitting" ? "#4ADE80" : "#1a3d2a",
                  border:       "none", borderRadius: "7px",
                  color:        canSubmit && status !== "submitting" ? "#0a1a0f" : "#2e6644",
                  fontSize:     "13px", fontWeight: 700, padding: "7px 20px",
                  cursor:       canSubmit && status !== "submitting" ? "pointer" : "default",
                  fontFamily:   "inherit", transition: "background 0.15s, color 0.15s",
                }}
              >
                {status === "submitting" ? "Submitting…" : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
