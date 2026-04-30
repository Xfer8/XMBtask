// ─── Theme Tokens ─────────────────────────────────────────────────────────────
// Semantic app-level tokens. Import these instead of hardcoding hex values.
export const THEME = {
  // Layout
  headerBg:      "#252525",
  headerBorder:  "#2a2a2e",
  pageBg:        "#212121",
  cardBg:        "#2A2A2A",
  cardBorder:    "#444450",

  // Text scale (lightest → dimmest)
  textPrimary:   "#f0f0f0",  // headings, titles
  textLight:     "#c8c8d0",  // description, subtask, update body
  textFaint:     "#aaaab4",  // completed section label, softer UI
  textSecondary: "#888890",  // labels, secondary info
  textDim:       "#666666",  // timestamps, "LAST UPDATE" label
  textGhost:     "#aaaaaa",  // calendar nav, very muted elements
  textMuted:     "#55555e",  // placeholder-level text

  // Brand
  logoPrimary:   "#2DB86A",
  logoSecondary: "#f0f0f0",

  // Nav
  navContainerBg: "#111111",
  navSliderBg:    "#2DB86A",
  navSliderText:  "#d0d0d0",
};

// ─── Status & Priority Color Keys ────────────────────────────────────────────
// Values are keys into COLOR_PALETTES in colors.js — pass to getPalette().
export const STATUS_COLORS = {
  "Not Started": "gray",
  "In Progress": "blue",
  "Needs Review": "orange",
  "Done": "green",
};

export const PRIORITY_COLORS = {
  Low:    "green",
  Medium: "yellow",
  High:   "red",
};

// ─── Options Arrays ───────────────────────────────────────────────────────────
export const STATUS_OPTIONS   = ["Not Started", "In Progress", "Needs Review", "Done"];
export const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
export const PROJECT_COLORS   = ["blue", "green", "teal", "purple", "pink", "orange", "red", "yellow"];
