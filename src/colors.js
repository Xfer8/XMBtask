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
};

// ─── Helper ───────────────────────────────────────────────────────────────────
// getPalette("blue")          → blue glow palette
// getPalette("green", "solid") → green solid palette
// Aliases: "neutral" → gray, "lightgreen" → green
export const getPalette = (color, variant = "glow") => {
  const key = color === "neutral" ? "gray" : color === "lightgreen" ? "green" : color;
  return COLOR_PALETTES[key]?.[variant] ?? COLOR_PALETTES.gray.glow;
};
