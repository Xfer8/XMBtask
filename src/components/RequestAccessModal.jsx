import { useState } from "react";
import { submitAccessRequest } from "../services/requestsService";

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "#1e1e1e", border: "1px solid #3a3a3a",
  borderRadius: "8px", color: "#f0f0f0",
  fontSize: "13px", padding: "9px 12px",
  fontFamily: "inherit", outline: "none",
};

export default function RequestAccessModal({ onClose, initialEmail = "", initialName = "" }) {
  const [name,    setName]    = useState(initialName);
  const [email,   setEmail]   = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [status,  setStatus]  = useState("idle"); // idle | submitting | success | error
  const [errMsg,  setErrMsg]  = useState("");

  const canSubmit = name.trim() && email.trim() && message.trim() && status !== "submitting";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus("submitting");
    try {
      await submitAccessRequest({ name: name.trim(), email: email.trim(), message: message.trim() });
      setStatus("success");
    } catch (err) {
      setErrMsg(err.message ?? "Submission failed. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 700,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "#2c2c2c", border: "1px solid #3a3a3a",
        borderRadius: "14px", padding: "28px 32px",
        width: "100%", maxWidth: "420px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
      }} onClick={e => e.stopPropagation()}>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>✓</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#4ADE80", marginBottom: "8px" }}>
              Request sent
            </div>
            <div style={{ fontSize: "13px", color: "#888890", lineHeight: 1.6, marginBottom: "24px" }}>
              Your request has been submitted. The app owner will review it and be in touch.
            </div>
            <button onClick={onClose} style={{
              background: "#4ADE80", border: "none", borderRadius: "8px",
              cursor: "pointer", color: "#0a1a0f", fontSize: "13px",
              fontWeight: 700, padding: "9px 24px", fontFamily: "inherit",
            }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0f0", marginBottom: "6px" }}>
              Request access
            </div>
            <div style={{ fontSize: "13px", color: "#888890", marginBottom: "22px", lineHeight: 1.5 }}>
              Fill out the form below and the app owner will review your request.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "22px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#888890",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  display: "block", marginBottom: "6px" }}>
                  Name
                </label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your full name" autoFocus style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#888890",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  display: "block", marginBottom: "6px" }}>
                  Email
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#888890",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  display: "block", marginBottom: "6px" }}>
                  What's something only a Vato would know?
                </label>
                <textarea
                  value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Briefly describe how you plan to use XMBtask…"
                  rows={3}
                  style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
                />
              </div>
            </div>

            {status === "error" && (
              <div style={{ fontSize: "12px", color: "#FF6B6B", marginBottom: "14px" }}>
                {errMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{
                background: "none", border: "1px solid #3a3a3a", borderRadius: "8px",
                cursor: "pointer", color: "#888890", fontSize: "13px",
                padding: "8px 18px", fontFamily: "inherit",
              }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit} style={{
                background: canSubmit ? "#4ADE80" : "#1a3d2a", border: "none", borderRadius: "8px",
                cursor: canSubmit ? "pointer" : "default",
                color: canSubmit ? "#0a1a0f" : "#2e6644",
                fontSize: "13px", fontWeight: 700,
                padding: "8px 20px", fontFamily: "inherit",
              }}>
                {status === "submitting" ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
