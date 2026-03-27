import { useState } from "react";
import { COLOR_PALETTES } from "../../colors";

// ── SplitBadge ────────────────────────────────────────────────────────────────
// A two-section "hard split" badge: dark label on the left, colored value on
// the right, separated by a vertical divider. Designed for link-type badges
// like Sherlock IDs.
//
// Props:
//   label      — left section text (e.g. "Sherlock")
//   value      — right section text (e.g. "10349549")
//   colorKey   — palette key from COLOR_PALETTES (default: "orange")
//   href       — if provided, the whole badge is a clickable link
//   onClick    — optional click handler (called in addition to href nav)
//
// Uses the glow variant for border/hover and the solid variant for the
// right (value) section background.

export default function SplitBadge({ label, value, colorKey = "orange", href, onClick }) {
  const [hov, setHov] = useState(false);

  const glow  = COLOR_PALETTES[colorKey]?.glow  ?? COLOR_PALETTES.orange.glow;
  const solid = COLOR_PALETTES[colorKey]?.solid  ?? COLOR_PALETTES.orange.solid;

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
      {/* Left: label section — dark bg, muted text */}
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

      {/* Right: value section — subtle color tint, brightens on hover */}
      <span style={{
        background: hov ? `${glow.border}44` : `${glow.border}22`,
        color: glow.text ?? "#c8c8d0",
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
