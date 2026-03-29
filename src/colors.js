// ─── Color Palettes ───────────────────────────────────────────────────────────
// Structure: COLOR_PALETTES[colorName][variant]
// variant = "glow" (dark bg, colored text) or "solid" (colored bg, dark text)
// Each entry: { text, bg, border, hoverText, hoverBg, hoverBorder }
// border / hoverBorder are null for solid variant.

export const COLOR_PALETTES = {
  yellow: {
    glow:  { text: "#FACC15", bg: "#3D3208", border: "#7D670B", hoverText: "#FFFB7D", hoverBg: "#4D400A", hoverBorder: "#FACC15" },
    solid: { text: "#3D3208", bg: "#FACC15", border: null,      hoverText: "#3D3208", hoverBg: "#FFD72E", hoverBorder: null },
  },
  orange: {
    glow:  { text: "#FB923C", bg: "#45260D", border: "#8B4E1D", hoverText: "#FFC08A", hoverBg: "#593211", hoverBorder: "#FB923C" },
    solid: { text: "#2A2A2A", bg: "#FB923C", border: null,      hoverText: "#2A2A2A", hoverBg: "#FFA85F", hoverBorder: null },
  },
  red: {
    glow:  { text: "#FF6B6B", bg: "#4A1B1B", border: "#943636", hoverText: "#FF9E9E", hoverBg: "#5F2323", hoverBorder: "#FF6B6B" },
    solid: { text: "#2A2A2A", bg: "#FF6B6B", border: null,      hoverText: "#2A2A2A", hoverBg: "#FF8585", hoverBorder: null },
  },
  pink: {
    glow:  { text: "#F472B6", bg: "#411E31", border: "#833A63", hoverText: "#F9A8D4", hoverBg: "#54263F", hoverBorder: "#F472B6" },
    solid: { text: "#2A2A2A", bg: "#F472B6", border: null,      hoverText: "#2A2A2A", hoverBg: "#F794C8", hoverBorder: null },
  },
  purple: {
    glow:  { text: "#A78BFA", bg: "#2D224D", border: "#5A449A", hoverText: "#C4B5FD", hoverBg: "#3A2C63", hoverBorder: "#A78BFA" },
    solid: { text: "#2A2A2A", bg: "#A78BFA", border: null,      hoverText: "#2A2A2A", hoverBg: "#C0ACFB", hoverBorder: null },
  },
  blue: {
    glow:  { text: "#38BDF8", bg: "#0B3547", border: "#166A8E", hoverText: "#7DD3FC", hoverBg: "#0E445C", hoverBorder: "#38BDF8" },
    solid: { text: "#2A2A2A", bg: "#38BDF8", border: null,      hoverText: "#2A2A2A", hoverBg: "#60CDFA", hoverBorder: null },
  },
  teal: {
    glow:  { text: "#2DD4BF", bg: "#0C3933", border: "#197166", hoverText: "#5EEAD4", hoverBg: "#0F4A42", hoverBorder: "#2DD4BF" },
    solid: { text: "#2A2A2A", bg: "#2DD4BF", border: null,      hoverText: "#2A2A2A", hoverBg: "#59E3D2", hoverBorder: null },
  },
  green: {
    glow:  { text: "#4ADE80", bg: "#0E3F24", border: "#1D7F48", hoverText: "#86EFAC", hoverBg: "#12512E", hoverBorder: "#4ADE80" },
    solid: { text: "#0E3F24", bg: "#4ADE80", border: null,      hoverText: "#0E3F24", hoverBg: "#6BE696", hoverBorder: null },
  },
  gray: {
    glow:  { text: "#D1D5DB", bg: "#374151", border: "#4B5563", hoverText: "#F3F4F6", hoverBg: "#475368", hoverBorder: "#D1D5DB" },
    solid: { text: "#2A2A2A", bg: "#D1D5DB", border: null,      hoverText: "#2A2A2A", hoverBg: "#E5E7EB", hoverBorder: null },
  },

  // ── Extended palette ────────────────────────────────────────────────────────
  rose: {
    glow:  { text: "#FB7185", bg: "#3B0B14", border: "#9F1239", hoverText: "#FDA4AF", hoverBg: "#4D111C", hoverBorder: "#FB7185" },
    solid: { text: "#2A2A2A", bg: "#FB7185", border: null,      hoverText: "#2A2A2A", hoverBg: "#FDA4AF", hoverBorder: null },
  },
  amber: {
    glow:  { text: "#FBBF24", bg: "#2D1E00", border: "#7A4900", hoverText: "#FCD34D", hoverBg: "#3D2800", hoverBorder: "#FBBF24" },
    solid: { text: "#2A2A2A", bg: "#FBBF24", border: null,      hoverText: "#2A2A2A", hoverBg: "#FCD34D", hoverBorder: null },
  },
  lime: {
    glow:  { text: "#A3E635", bg: "#1C2B00", border: "#3F6600", hoverText: "#BEF264", hoverBg: "#243600", hoverBorder: "#A3E635" },
    solid: { text: "#1C2B00", bg: "#A3E635", border: null,      hoverText: "#1C2B00", hoverBg: "#BEF264", hoverBorder: null },
  },
  emerald: {
    glow:  { text: "#34D399", bg: "#053B24", border: "#0D7A4C", hoverText: "#6EE7B7", hoverBg: "#074D2F", hoverBorder: "#34D399" },
    solid: { text: "#053B24", bg: "#34D399", border: null,      hoverText: "#053B24", hoverBg: "#6EE7B7", hoverBorder: null },
  },
  cyan: {
    glow:  { text: "#22D3EE", bg: "#052D37", border: "#0C6B84", hoverText: "#67E8F9", hoverBg: "#073B4A", hoverBorder: "#22D3EE" },
    solid: { text: "#052D37", bg: "#22D3EE", border: null,      hoverText: "#052D37", hoverBg: "#67E8F9", hoverBorder: null },
  },
  indigo: {
    glow:  { text: "#818CF8", bg: "#1B1944", border: "#3730A3", hoverText: "#A5B4FC", hoverBg: "#232258", hoverBorder: "#818CF8" },
    solid: { text: "#2A2A2A", bg: "#818CF8", border: null,      hoverText: "#2A2A2A", hoverBg: "#A5B4FC", hoverBorder: null },
  },
  violet: {
    glow:  { text: "#C084FC", bg: "#2A1145", border: "#6D28D9", hoverText: "#D8B4FE", hoverBg: "#36155A", hoverBorder: "#C084FC" },
    solid: { text: "#2A2A2A", bg: "#C084FC", border: null,      hoverText: "#2A2A2A", hoverBg: "#D8B4FE", hoverBorder: null },
  },
  fuchsia: {
    glow:  { text: "#E879F9", bg: "#2D0A38", border: "#86198F", hoverText: "#F0ABFC", hoverBg: "#3B0E4B", hoverBorder: "#E879F9" },
    solid: { text: "#2A2A2A", bg: "#E879F9", border: null,      hoverText: "#2A2A2A", hoverBg: "#F0ABFC", hoverBorder: null },
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
// getPalette("blue")          → blue glow palette
// getPalette("green", "solid") → green solid palette
// Aliases: "neutral" → gray, "lightgreen" → green
export const getPalette = (color, variant = "glow") => {
  const key = color === "neutral" ? "gray" : color === "lightgreen" ? "green" : color;
  return COLOR_PALETTES[key]?.[variant] ?? COLOR_PALETTES.gray.glow;
};
