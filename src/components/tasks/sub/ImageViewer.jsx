import { useEffect, useState } from "react";

export default function ImageViewer({ images, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   setIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight")  setIdx(i => (i + 1) % images.length);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [images.length, onClose]);

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
      onClick={onClose}
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
              onClick={() => setIdx(i)}
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
    </div>
  );
}
