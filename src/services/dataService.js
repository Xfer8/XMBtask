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
  projects: 'xmbtask:projects',
  tasks:    'xmbtask:tasks',
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
