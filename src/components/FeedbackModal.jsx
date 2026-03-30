import { useEffect, useRef, useState } from "react";
import { submitFeedback } from "../services/feedbackService";
import { uploadFeedbackImage, deleteStorageImage } from "../services/storageService";
import { useAuth } from "../contexts/AuthContext";

const TYPE_OPTIONS = [
  { value: "bug-report",       label: "Bug Report" },
  { value: "new-feature",      label: "New Feature" },
  { value: "existing-feature", label: "Existing Feature" },
  { value: "general",          label: "General Feedback" },
  { value: "other",            label: "Other" },
];

const imgSrc = img => typeof img === "string" ? img : img?.url ?? "";

const labelStyle = {
  fontSize: "11px", fontWeight: 600, color: "#888890",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: "6px",
};

const ImageIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="5.5" cy="5.5" r="1.2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1.5 10.5l3.5-3 3 3 2-2 3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function FeedbackModal({ onClose }) {
  const { user } = useAuth();
  const [type,        setType]        = useState("");
  const [description, setDescription] = useState("");
  const [images,      setImages]      = useState([]); // array of { url, storagePath }
  const [uploading,   setUploading]   = useState(0);  // count of in-progress uploads
  const [status,      setStatus]      = useState("idle"); // idle | submitting | done | error
  const [showConfirm, setShowConfirm] = useState(false);
  const pasteZoneRef = useRef(null);
  const imagesRef    = useRef(images);

  useEffect(() => { imagesRef.current = images; }, [images]);

  const isDirty    = type !== "" || description.trim() !== "" || images.length > 0;
  const canSubmit  = type && description.trim().length > 0;
  const isFormDone = status === "done";

  // ── Paste handler on the image zone ──────────────────────────────────────────
  useEffect(() => {
    const el = pasteZoneRef.current;
    if (!el) return;
    const h = async e => {
      const items = Array.from(e.clipboardData?.items ?? []).filter(i => i.type.startsWith("image/"));
      if (!items.length) return;
      e.preventDefault();
      const blobs = items.map(i => i.getAsFile());
      setUploading(v => v + blobs.length);
      try {
        const results = await Promise.allSettled(blobs.map(blob => uploadFeedbackImage(blob)));
        const newImgs = results.filter(r => r.status === "fulfilled").map(r => r.value);
        setImages(prev => [...prev, ...newImgs]);
      } finally {
        setUploading(v => v - blobs.length);
      }
    };
    el.addEventListener("paste", h);
    return () => el.removeEventListener("paste", h);
  }, []); // uses setImages (stable) and uploadFeedbackImage — no stale closure risk

  const handleRemoveImage = (i) => {
    const img = images[i];
    if (img?.storagePath) deleteStorageImage(img.storagePath).catch(() => {});
    setImages(prev => prev.filter((_, j) => j !== i));
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit || status === "submitting") return;
    setStatus("submitting");
    try {
      await submitFeedback({
        type,
        description: description.trim(),
        images,
        userEmail: user?.email       ?? "Unknown",
        userName:  user?.displayName ?? "Unknown",
      });
      setStatus("done");
    } catch (err) {
      console.error("Feedback submission error:", err);
      setStatus("error");
    }
  };

  // ── Cancel flow ───────────────────────────────────────────────────────────────
  const handleCancelClick = () => {
    if (isDirty && !isFormDone) setShowConfirm(true);
    else onClose();
  };

  const cancelRef = useRef(null);
  cancelRef.current = { isDirty, isFormDone, onClose };

  useEffect(() => {
    const h = e => {
      if (e.key !== "Escape") return;
      const { isDirty, isFormDone, onClose } = cancelRef.current;
      if (isDirty && !isFormDone) setShowConfirm(true);
      else onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [pasteZoneFocused, setPasteZoneFocused] = useState(false);

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
        position: "relative",
      }}>
        {isFormDone ? (
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
                  color: type ? "#f0f0f0" : "#777780",
                  fontSize: "13px", padding: "9px 12px",
                  fontFamily: "inherit", outline: "none", cursor: "pointer",
                }}
              >
                <option value="" disabled>Select a type…</option>
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} style={{ color: "#f0f0f0" }}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "14px" }}>
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

            {/* Screenshots */}
            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>Screenshots</label>
              <div
                ref={pasteZoneRef}
                tabIndex={0}
                onFocus={() => setPasteZoneFocused(true)}
                onBlur={() => setPasteZoneFocused(false)}
                style={{
                  minHeight: "52px", borderRadius: "8px", padding: "10px 12px",
                  border: `1.5px dashed ${pasteZoneFocused ? "#38BDF8" : "#3a3a3a"}`,
                  outline: "none", transition: "border-color 0.15s", cursor: "text",
                  display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center",
                }}
              >
                {images.length === 0 && uploading === 0 && (
                  <span style={{ fontSize: "12px", color: "#55555e", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ImageIcon size={14} />
                    Click here, then paste a screenshot (Ctrl+V)
                  </span>
                )}
                {images.map((img, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img
                      src={imgSrc(img)} alt=""
                      style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "6px", display: "block" }}
                    />
                    <button
                      onClick={() => handleRemoveImage(i)}
                      style={{
                        position: "absolute", top: "-6px", right: "-6px",
                        width: "18px", height: "18px", borderRadius: "50%",
                        background: "#FF6B6B", border: "none", color: "#2A2A2A",
                        cursor: "pointer", fontSize: "10px", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >✕</button>
                  </div>
                ))}
                {uploading > 0 && Array.from({ length: uploading }).map((_, i) => (
                  <div
                    key={`up-${i}`}
                    style={{
                      width: "72px", height: "72px", borderRadius: "6px",
                      background: "#222", border: "1px dashed #3a3a3a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "#55555e" }}>⏳</span>
                  </div>
                ))}
              </div>
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
              <button onClick={handleCancelClick} style={{
                background: "none", border: "1px solid #3a3a3a", borderRadius: "7px",
                cursor: "pointer", color: "#888890", fontSize: "13px",
                padding: "7px 18px", fontFamily: "inherit",
              }}>
                {isDirty ? "Cancel" : "Close"}
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

        {/* ── Discard confirmation overlay ──────────────────────────────────── */}
        {showConfirm && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            background: "rgba(0,0,0,0.6)", borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              background: "#2c2c2c", border: "1px solid #3a3a3a",
              borderRadius: "12px", padding: "24px 28px",
              width: "280px", textAlign: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f0", marginBottom: "8px" }}>
                Discard feedback?
              </div>
              <div style={{ fontSize: "13px", color: "#888890", marginBottom: "20px", lineHeight: 1.5 }}>
                Your draft will be lost.
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{
                    background: "none", border: "1px solid #3a3a3a", borderRadius: "7px",
                    cursor: "pointer", color: "#888890", fontSize: "13px",
                    padding: "7px 18px", fontFamily: "inherit",
                  }}
                >
                  Keep Editing
                </button>
                <button
                  onClick={onClose}
                  style={{
                    background: "#4A1B1B", border: "1px solid #943636", borderRadius: "7px",
                    cursor: "pointer", color: "#FF6B6B", fontSize: "13px",
                    fontWeight: 600, padding: "7px 18px", fontFamily: "inherit",
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
