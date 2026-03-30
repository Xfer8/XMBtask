import { useState, useRef, useEffect } from "react";
import { uploadImage, deleteStorageImage } from "../../../services/storageService";

// Helper: works for both legacy base64 strings and new { url, storagePath } objects
const imgSrc = img => typeof img === "string" ? img : img?.url ?? "";

const ImageIcon = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="5.5" cy="5.5" r="1.2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1.5 10.5l3.5-3 3 3 2-2 3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ImagePasteZone({ images, onChange }) {
  const ref            = useRef(null);
  const imagesRef      = useRef(images);
  const onChangeRef    = useRef(onChange);
  const [focused,    setFocused]    = useState(false);
  const [uploading,  setUploading]  = useState(0); // count of in-progress uploads

  // Keep refs current so the paste handler doesn't close over stale values
  useEffect(() => { imagesRef.current   = images;   }, [images]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = async e => {
      const items = Array.from(e.clipboardData?.items ?? []).filter(i => i.type.startsWith("image/"));
      if (!items.length) return;
      e.preventDefault();
      const blobs = items.map(item => item.getAsFile());
      setUploading(v => v + blobs.length);
      try {
        const results = await Promise.allSettled(blobs.map(blob => uploadImage(blob)));
        const newImgs = results
          .filter(r => r.status === "fulfilled")
          .map(r => r.value);
        onChangeRef.current([...imagesRef.current, ...newImgs]);
      } finally {
        setUploading(v => v - blobs.length);
      }
    };
    el.addEventListener("paste", h);
    return () => el.removeEventListener("paste", h);
  }, []); // runs once — uses refs for fresh values

  const handleRemove = (i) => {
    const img = images[i];
    // Delete from Storage if it's a Storage object (not a legacy base64 string)
    if (img && typeof img !== "string" && img.storagePath) {
      deleteStorageImage(img.storagePath).catch(() => {});
    }
    onChange(images.filter((_, j) => j !== i));
  };

  return (
    <div>
      <div
        ref={ref} tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          minHeight:"56px", borderRadius:"8px", padding:"10px 12px",
          border:`1.5px dashed ${focused ? "#38BDF8" : "#3a3a3a"}`,
          outline:"none", transition:"border-color 0.15s", cursor:"text",
          display:"flex", flexWrap:"wrap", gap:"8px", alignItems:"center",
        }}
      >
        {images.length === 0 && uploading === 0 && (
          <span style={{ fontSize:"12px", color:"#55555e", display:"flex", alignItems:"center", gap:"6px" }}>
            <ImageIcon size={14}/>
            Click here, then paste an image (Ctrl+V)
          </span>
        )}
        {images.map((img, i) => (
          <div key={i} style={{ position:"relative" }}>
            <img
              src={imgSrc(img)} alt=""
              style={{ width:"72px", height:"72px", objectFit:"cover", borderRadius:"6px", display:"block" }}
            />
            <button
              onClick={() => handleRemove(i)}
              style={{
                position:"absolute", top:"-6px", right:"-6px",
                width:"18px", height:"18px", borderRadius:"50%",
                background:"#FF6B6B", border:"none", color:"#2A2A2A",
                cursor:"pointer", fontSize:"10px", fontWeight:700,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >✕</button>
          </div>
        ))}
        {/* Loading placeholders while upload is in progress */}
        {uploading > 0 && Array.from({ length: uploading }).map((_, i) => (
          <div
            key={`up-${i}`}
            style={{
              width:"72px", height:"72px", borderRadius:"6px",
              background:"#222", border:"1px dashed #3a3a3a",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            <span style={{ fontSize:"10px", color:"#55555e" }}>⏳</span>
          </div>
        ))}
      </div>
      {images.length > 0 && (
        <div style={{ fontSize:"10px", color:"#55555e", marginTop:"4px" }}>
          Images are not included in exports.
        </div>
      )}
    </div>
  );
}
