import { useState } from "react";
import { COLOR_PALETTES } from "../../colors";

// ── MutedBadge ────────────────────────────────────────────────────────────────
// A toned-down two-section badge: dark muted label on the left, subtle
// color-tinted value on the right. Intended for supporting metadata that
// shouldn't compete visually with primary UI elements (e.g. link references).
//
// Props:
//   label    — left section text (e.g. "Sherlock", "Jira")
//   value    — right section text (e.g. an ID or display name)
//   colorKey — palette key from COLOR_PALETTES (default: "gray")
//   href     — if provided, the whole badge becomes a clickable link
//   onClick  — optional click handler

export default function MutedBadge({ label, value, colorKey = "gray", href, onClick }) {
  const [hov, setHov] = useState(false);

  const glow = COLOR_PALETTES[colorKey]?.glow ?? COLOR_PALETTES.gray.glow;

  const Wrapper = href ? "a" : "div";
  const wrapperProps = href
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${hov ? glow.border : "rgba(255,255,255,0.08)"}`,
        borderRadius: "4px",
        overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        transition: "border-color 0.2s ease",
        fontFamily: "inherit",
        flexShrink: 0,
      }}
    >
      {/* Left: label — dark bg, muted text */}
      <span style={{
        background: "#1e1e1e",
        color: "#888890",
        padding: "3px 8px",
        fontWeight: 600,
        fontSize: "10px",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>

      {/* Right: value — subtle color tint, brightens on hover */}
      <span style={{
        background: hov ? `${glow.border}44` : `${glow.border}22`,
        color: glow.text,
        padding: "3px 8px",
        fontWeight: 600,
        fontSize: "11px",
        whiteSpace: "nowrap",
        transition: "background 0.2s ease",
      }}>
        {value}
      </span>
    </Wrapper>
  );
}
