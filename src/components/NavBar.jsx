import { useState } from "react";

const OPTIONS = ["Dashboard", "Tasks", "Projects"];

export default function NavBar({ onNavigate, currentPage }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      display:      "flex",
      background:   "#111",
      padding:      "3px",
      borderRadius: "4px",
      gap:          "2px",
    }}>
      {OPTIONS.map(option => {
        const isActive = currentPage === option;
        const isHov    = hovered === option && !isActive;
        return (
          <button
            key={option}
            onClick={() => onNavigate(option)}
            onMouseEnter={() => setHovered(option)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background:     isActive ? "#2DB86A" : isHov ? "rgba(255,255,255,0.04)" : "transparent",
              border:         "none",
              borderRadius:   "2px",
              cursor:         "pointer",
              color:          isActive ? "#111" : isHov ? "#aaa" : "#666",
              fontSize:       "10px",
              fontWeight:     900,
              textTransform:  "uppercase",
              letterSpacing:  "0.5px",
              padding:        "6px 16px",
              fontFamily:     "inherit",
              transition:     "background 0.2s, color 0.2s",
              whiteSpace:     "nowrap",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
