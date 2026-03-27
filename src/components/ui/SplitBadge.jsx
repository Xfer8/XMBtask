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
        border: `1px solid ${hov ? glow.hoverBorder : glow.border}`,
        borderRadius: "4px",
        overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        transition: "border-color 0.2s ease",
        fontFamily: "inherit",
        flexShrink: 0,
      }}
    >
      {/* Left: label section — dark bg, white text */}
      <span style={{
        background: solid.text,      // #2A2A2A
        color: "#FFFFFF",
        padding: "4px 10px",
        fontWeight: 700,
        fontSize: "10px",
        letterSpacing: "1px",
        textTransform: "uppercase",
        borderRight: `1px solid ${hov ? glow.hoverBorder : glow.border}`,
        whiteSpace: "nowrap",
        transition: "border-color 0.2s ease",
      }}>
        {label}
      </span>

      {/* Right: value section — brightens on hover */}
      <span style={{
        background: hov ? solid.hoverBg : solid.bg,
        color: solid.text,
        padding: "4px 10px",
        fontWeight: 800,
        fontSize: "12px",
        whiteSpace: "nowrap",
        transition: "background 0.2s ease",
      }}>
        {value}
      </span>
    </Wrapper>
  );
}
