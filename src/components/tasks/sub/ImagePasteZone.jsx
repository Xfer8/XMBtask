import { useState, useRef, useEffect } from "react";

const ImageIcon = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="5.5" cy="5.5" r="1.2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1.5 10.5l3.5-3 3 3 2-2 3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ImagePasteZone({ images, onChange }) {
  const ref     = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = e => {
      const items = Array.from(e.clipboardData?.items ?? []).filter(i => i.type.startsWith("image/"));
      if (!items.length) return;
      items.forEach(item => {
        const blob   = item.getAsFile();
        const reader = new FileReader();
        reader.onload = evt => onChange([...images, evt.target.result]);
        reader.readAsDataURL(blob);
      });
      e.preventDefault();
    };
    el.addEventListener("paste", h);
    return () => el.removeEventListener("paste", h);
  }, [images, onChange]);

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
        {images.length === 0 && (
          <span style={{ fontSize:"12px", color:"#55555e", display:"flex", alignItems:"center", gap:"6px" }}>
            <ImageIcon size={14}/>
            Click here, then paste an image (Ctrl+V)
          </span>
        )}
        {images.map((img, i) => (
          <div key={i} style={{ position:"relative" }}>
            <img src={img} alt="" style={{ width:"72px", height:"72px", objectFit:"cover", borderRadius:"6px", display:"block" }}/>
            <button
              onClick={() => onChange(images.filter((_, j) => j !== i))}
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
      </div>
      {images.length > 0 && (
        <div style={{ fontSize:"10px", color:"#55555e", marginTop:"4px" }}>
          Images are not included in exports.
        </div>
      )}
    </div>
  );
}
