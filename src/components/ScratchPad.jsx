// ─── ScratchPad.jsx ───────────────────────────────────────────────────────────
// STUB — AI integration removed.
//
// The previous implementation called the Groq API directly from the browser
// using `dangerouslyAllowBrowser: true`, which exposes the API key in the
// client bundle. That approach is not viable for a shared/public deployment.
//
// TODO: re-introduce AI text-to-task analysis through a server-side proxy
// (e.g. a Firebase Cloud Function or another backend) so the API key stays
// secret. When that is built, restore the original ScratchPad UI and wire it
// to the new endpoint instead of `services/aiService`.
//
// The `scratchPadEnabled` feature flag and admin toggle plumbing in App.jsx /
// Dashboard.jsx are intentionally preserved so the feature can be re-enabled
// without re-threading props.
// ─────────────────────────────────────────────────────────────────────────────

export default function ScratchPad() {
  return (
    <div style={{
      background:   "#2a2a2a",
      border:       "1px solid #444450",
      borderRadius: "10px",
      padding:      "16px",
      marginBottom: "20px",
    }}>
      <div style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "10px",
        marginBottom:  "10px",
      }}>
        <span style={{
          fontSize:      "13px",
          fontWeight:    600,
          color:         "#888890",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}>
          Scratch Pad
        </span>
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
      </div>

      <div style={{
        border:       "1px dashed #c8a830",
        borderRadius: "8px",
        padding:      "20px 18px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ fontSize: "22px", lineHeight: 1, opacity: 0.6, flexShrink: 0, marginTop: "2px" }}>🚧</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#c8a830", marginBottom: "6px" }}>
              Coming Soon
            </div>
            <div style={{ fontSize: "12px", color: "#888890", lineHeight: 1.6 }}>
              Paste meeting notes, emails, or any block of text and let AI pull out the actionable tasks for you — complete with suggested priorities, due dates, and project assignments. Review each suggestion before adding it to your task list.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
