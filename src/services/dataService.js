// ─── dataService.js ───────────────────────────────────────────────────────────
// Abstracts all data persistence so the storage backend can be swapped
// (e.g. localStorage → Firebase) without touching the rest of the app.
//
// All functions are async even though localStorage is synchronous.
// This keeps the calling code Firebase-ready from day one.
//
// TO MIGRATE TO FIREBASE:
//   1. Import your Firebase db instance here
//   2. Replace the localStorage calls below with Firestore/RTDB equivalents
//   3. No changes needed anywhere else in the app
// ─────────────────────────────────────────────────────────────────────────────

const KEYS = {
  projects:    'xmbtask:projects',
  tasks:       'xmbtask:tasks',
  reminders:   'xmbtask:reminders',
  completions: 'xmbtask:reminder-completions',
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const loadProjects = async () => {
  try {
    const raw = localStorage.getItem(KEYS.projects);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveProjects = async (projects) => {
  try {
    localStorage.setItem(KEYS.projects, JSON.stringify(projects));
  } catch { /* storage full or unavailable */ }
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const loadTasks = async () => {
  try {
    const raw = localStorage.getItem(KEYS.tasks);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveTasks = async (tasks) => {
  try {
    localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
  } catch { /* storage full or unavailable */ }
};

// ── Reminders ─────────────────────────────────────────────────────────────────

export const loadReminders = async () => {
  try {
    const raw = localStorage.getItem(KEYS.reminders);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const saveReminders = async (reminders) => {
  try { localStorage.setItem(KEYS.reminders, JSON.stringify(reminders)); }
  catch { /* storage full or unavailable */ }
};

// ── Reminder Completions ───────────────────────────────────────────────────────
// Each entry: { reminderId, date } where date is "YYYY-MM-DD".
// Completions older than 30 days are pruned automatically on save.

export const loadCompletions = async () => {
  try {
    const raw = localStorage.getItem(KEYS.completions);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const saveCompletions = async (completions) => {
  try {
    // Prune entries older than 30 days to keep storage tidy
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const pruned = completions.filter(c => c.date >= cutoffStr);
    localStorage.setItem(KEYS.completions, JSON.stringify(pruned));
  } catch { /* storage full or unavailable */ }
};

// ── ID Generators ──────────────────────────────────────────────────────────────

export const generateTaskId = (tasks) => {
  const max = tasks.reduce((m, t) => Math.max(m, parseInt(t.id?.replace("XMB-T", "")) || 0), 0);
  return `XMB-T${String(max + 1).padStart(4, "0")}`;
};

export const generateProjectId = (projects) => {
  const max = projects.reduce((m, p) => Math.max(m, parseInt(p.id?.replace("XMB-P", "")) || 0), 0);
  return `XMB-P${String(max + 1).padStart(3, "0")}`;
};

export const generateReminderId = (reminders) => {
  const max = reminders.reduce((m, r) => Math.max(m, parseInt(r.id?.replace("XMB-R", "")) || 0), 0);
  return `XMB-R${String(max + 1).padStart(3, "0")}`;
};

export const generateSubtaskId = (allTasks) => {
  const allSubtasks = allTasks.flatMap(t => t.subtasks ?? []);
  const max = allSubtasks.reduce((m, s) => Math.max(m, parseInt(s.id?.replace("XMB-S", "")) || 0), 0);
  return `XMB-S${String(max + 1).padStart(4, "0")}`;
};
