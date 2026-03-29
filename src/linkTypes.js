// ── Link type definitions ─────────────────────────────────────────────────────
// Single source of truth for link types and their color schemes.
// Import from here in both TaskCard and LinksSection to keep badges consistent.

export const LINK_TYPES = ["Source", "SLG", "RA", "Checklist", "Jira", "Email", "Link"];

export const LINK_TYPE_COLORS = {
  Source:    "yellow",
  SLG:       "orange",
  RA:        "orange",
  Checklist: "orange",
  Sherlock:  "orange", // legacy — kept so existing saved links still show orange
  Jira:      "blue",
  Email:     "purple",
  Link:      "gray",
  Other:     "gray",
};
