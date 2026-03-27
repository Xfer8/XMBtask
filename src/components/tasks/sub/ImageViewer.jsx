import { useEffect, useState } from "react";

export default function ImageViewer({ images, startIndex = 0, onClose, onDelete }) {
  const [idx,           setIdx]          = useState(startIndex);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const prev = () => { setConfirmDelete(false); setIdx(i => (i - 1 + images.length) % images.length); };
  const next = () => { setConfirmDelete(false); setIdx(i => (i + 1) % images.length); };

  const handleDelete = () => {
    const newImages = images.filter((_, i) => i !== idx);
    if (newImages.length === 0) {
      onDelete(newImages);
      onClose();
    } else {
      const newIdx = Math.min(idx, newImages.length - 1);
      onDelete(newImages);
      setIdx(newIdx);
      setConfirmDelete(false);
    }
  };

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") {
        if (confirmDelete) setConfirmDelete(false);
        else onClose();
      }
      if (e.key === "ArrowLeft")  { setConfirmDelete(false); setIdx(i => (i - 1 + images.length) % images.length); }
      if (e.key === "ArrowRight") { setConfirmDelete(false); setIdx(i => (i + 1) % images.length); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [images.length, onClose, confirmDelete]);

  const btnStyle = {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "50%", width: "40px", height: "40px",
    color: "#f0f0f0", fontSize: "18px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s",
    zIndex: 1,
  };

  return (
    // Backdrop
    <div
      onClick={() => { if (confirmDelete) setConfirmDelete(false); else onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        background: "rgba(0,0,0,0.88)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Counter */}
      <div style={{
        position: "absolute", top: "16px", left: "50%", transform: "translateX(-50%)",
        fontSize: "12px", color: "#888890", fontWeight: 600,
        background: "rgba(0,0,0,0.5)", padding: "4px 12px", borderRadius: "9999px",
      }}>
        {idx + 1} / {images.length}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: "14px", right: "18px",
          background: "none", border: "none",
          color: "#888890", fontSize: "22px", cursor: "pointer",
          lineHeight: 1, padding: "4px",
        }}
      >
        ✕
      </button>

      {/* Main image */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: "relative", maxWidth: "90vw", maxHeight: "80vh", display: "flex", alignItems: "center" }}
      >
        {/* Delete button — above top-left of image */}
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
            style={{
              position: "absolute", bottom: "calc(100% + 8px)", left: 0,
              background: "#4A1B1B", border: "1px solid #943636",
              borderRadius: "7px", color: "#FF6B6B",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
              padding: "5px 14px", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: "6px",
              zIndex: 2,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            Delete Image
          </button>
        )}
        {images.length > 1 && (
          <button onClick={e => { e.stopPropagation(); prev(); }} style={{ ...btnStyle, left: "-52px" }}>‹</button>
        )}

        <img
          src={images[idx]}
          alt={`Image ${idx + 1}`}
          style={{
            maxWidth: "100%", maxHeight: "80vh",
            objectFit: "contain", borderRadius: "8px",
            display: "block",
          }}
        />

        {images.length > 1 && (
          <button onClick={e => { e.stopPropagation(); next(); }} style={{ ...btnStyle, right: "-52px" }}>›</button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", gap: "8px", marginTop: "16px",
            maxWidth: "90vw", overflowX: "auto", padding: "4px 0",
          }}
        >
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Thumb ${i + 1}`}
              onClick={() => { setConfirmDelete(false); setIdx(i); }}
              style={{
                width: "52px", height: "52px", objectFit: "cover",
                borderRadius: "5px", cursor: "pointer", flexShrink: 0,
                border: `2px solid ${i === idx ? "#4ADE80" : "transparent"}`,
                opacity: i === idx ? 1 : 0.5,
                transition: "opacity 0.15s, border-color 0.15s",
              }}
            />
          ))}
        </div>
      )}

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", inset: 0, zIndex: 10,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            background: "#2c2c2c", border: "1px solid #3a3a3a",
            borderRadius: "12px", padding: "24px 28px",
            width: "280px", textAlign: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f0f0f0", marginBottom: "8px" }}>
              Delete image?
            </div>
            <div style={{ fontSize: "13px", color: "#888890", marginBottom: "20px", lineHeight: 1.5 }}>
              This image will be permanently removed from the task.
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  background: "none", border: "1px solid #3a3a3a", borderRadius: "7px",
                  cursor: "pointer", color: "#888890", fontSize: "13px",
                  padding: "7px 18px", fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  background: "#4A1B1B", border: "1px solid #943636", borderRadius: "7px",
                  cursor: "pointer", color: "#FF6B6B", fontSize: "13px",
                  fontWeight: 600, padding: "7px 18px", fontFamily: "inherit",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
