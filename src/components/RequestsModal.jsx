import { useState } from "react";
import { approveRequest, denyRequest } from "../services/requestsService";

const formatTs = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
};

// ── RequestCard ───────────────────────────────────────────────────────────────
function RequestCard({ req }) {
  const defaultMessage =
    `Hi ${req.name},\n\nYour request to access XMBtask has been approved. You can sign in at https://xmbtask.kai3d.io.\n\nWelcome!`;

  const [message,      setMessage]      = useState(defaultMessage);
  const [confirmDeny,  setConfirmDeny]  = useState(false);

  const handleApprove = async () => {
    // Open mailto in a new tab so the user can send from their own email client
    const mailto = `mailto:${req.email}?subject=${encodeURIComponent("XMBtask Access Approved")}&body=${encodeURIComponent(message)}`;
    window.open(mailto, "_blank");
    try { await approveRequest(req); }
    catch (err) { console.error("Approve failed:", err); }
  };

  const handleDeny = async () => {
    try { await denyRequest(req.id); }
    catch (err) { console.error("Deny failed:", err); }
  };

  return (
    <div style={{
      background: "#1e1e1e", border: "1px solid #3a3a3a",
      borderRadius: "10px", padding: "16px 18px",
    }}>
      {/* Name + email + timestamp */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f0" }}>
            {req.name}
          </div>
          <div style={{ fontSize: "12px", color: "#4ADE80", marginTop: "2px" }}>
            {req.email}
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "#555560", whiteSpace: "nowrap", flexShrink: 0 }}>
          {formatTs(req.timestamp)}
        </div>
      </div>

      {/* Request message */}
      {req.message && (
        <div style={{
          fontSize: "12px", color: "#888890", lineHeight: 1.6,
          borderLeft: "2px solid #3a3a3a", paddingLeft: "10px",
          marginBottom: "14px",
        }}>
          {req.message}
        </div>
      )}

      {/* Reply message */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{
          fontSize: "10px", fontWeight: 700, color: "#555560",
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px",
        }}>
          Message to send on approve
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={7}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "#252525", border: "1px solid #3a3a3a",
            borderRadius: "7px", color: "#c8c8d0",
            fontSize: "12px", padding: "8px 10px",
            fontFamily: "inherit", lineHeight: 1.6,
            resize: "vertical", outline: "none",
          }}
        />
      </div>

      {/* Actions */}
      {confirmDeny ? (
        <div style={{
          background: "#2a0e0e", border: "1px solid #7a2020",
          borderRadius: "7px", padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
        }}>
          <span style={{ fontSize: "12px", color: "#FF6B6B" }}>
            Deny and delete this request?
          </span>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button onClick={() => setConfirmDeny(false)} style={{
              background: "none", border: "1px solid #555560", borderRadius: "6px",
              cursor: "pointer", color: "#888890", fontSize: "12px",
              padding: "4px 12px", fontFamily: "inherit",
            }}>
              Cancel
            </button>
            <button onClick={handleDeny} style={{
              background: "#7a2020", border: "none", borderRadius: "6px",
              cursor: "pointer", color: "#FF6B6B", fontSize: "12px",
              fontWeight: 700, padding: "4px 12px", fontFamily: "inherit",
            }}>
              Deny
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={() => setConfirmDeny(true)} style={{
            background: "#2a0e0e", border: "1px solid #7a2020", borderRadius: "6px",
            cursor: "pointer", color: "#FF6B6B", fontSize: "12px",
            padding: "6px 16px", fontFamily: "inherit",
          }}>
            Deny
          </button>
          <button onClick={handleApprove} style={{
            background: "#4ADE80", border: "none", borderRadius: "6px",
            cursor: "pointer", color: "#0a1a0f", fontSize: "12px",
            fontWeight: 700, padding: "6px 16px", fontFamily: "inherit",
          }}>
            Send &amp; Approve
          </button>
        </div>
      )}
    </div>
  );
}

// ── RequestsModal ─────────────────────────────────────────────────────────────
export default function RequestsModal({ requests, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 700,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "40px 20px", overflowY: "auto",
    }} onClick={onClose}>
      <div style={{
        background: "#2c2c2c", border: "1px solid #3a3a3a",
        borderRadius: "14px", padding: "28px 32px",
        width: "100%", maxWidth: "520px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        margin: "auto",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0f0" }}>Access Requests</div>
            <div style={{ fontSize: "12px", color: "#555560", marginTop: "2px" }}>
              {requests.length === 0
                ? "No pending requests"
                : `${requests.length} pending request${requests.length !== 1 ? "s" : ""}`}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#555560", fontSize: "18px", lineHeight: 1,
            padding: "4px 8px", fontFamily: "inherit",
          }}>
            ✕
          </button>
        </div>

        {/* Request list */}
        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", fontSize: "13px", color: "#555560" }}>
            All caught up — no pending requests.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {requests.map(req => <RequestCard key={req.id} req={req} />)}
          </div>
        )}
      </div>
    </div>
  );
}
