// ─── dataService.js ───────────────────────────────────────────────────────────
// All data is stored in Firestore under users/{uid}/data/{type}.
// Each type (tasks, projects, reminders, completions) is a single document
// containing an { items: [...] } array.
//
// Data is scoped per user — each user only ever reads/writes their own data.
// ─────────────────────────────────────────────────────────────────────────────

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { IS_DEMO_MODE, loadDemoCollection, saveDemoCollection } from "../demoMode";

const userDataDoc = (type) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  return doc(db, "users", uid, "data", type);
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const loadProjects = async () => {
  if (IS_DEMO_MODE) return loadDemoCollection("projects");
  // Errors propagate to the caller — never silently return [] on failure,
  // as that would cause the save effect to overwrite real data with nothing.
  const snap = await getDoc(userDataDoc("projects"));
  return snap.exists() ? snap.data().items : [];
};

export const saveProjects = async (projects) => {
  if (IS_DEMO_MODE) return saveDemoCollection("projects", projects);
  // Errors propagate to the caller so they can be shown to the user.
  await setDoc(userDataDoc("projects"), { items: projects });
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const loadTasks = async () => {
  if (IS_DEMO_MODE) return loadDemoCollection("tasks");
  const snap = await getDoc(userDataDoc("tasks"));
  return snap.exists() ? snap.data().items : [];
};

export const saveTasks = async (tasks) => {
  if (IS_DEMO_MODE) return saveDemoCollection("tasks", tasks);
  await setDoc(userDataDoc("tasks"), { items: tasks });
};

// ── Reminders ─────────────────────────────────────────────────────────────────

export const loadReminders = async () => {
  if (IS_DEMO_MODE) return loadDemoCollection("reminders");
  try {
    const snap = await getDoc(userDataDoc("reminders"));
    return snap.exists() ? snap.data().items : [];
  } catch { return []; }
};

export const saveReminders = async (reminders) => {
  if (IS_DEMO_MODE) return saveDemoCollection("reminders", reminders);
  try {
    await setDoc(userDataDoc("reminders"), { items: reminders });
  } catch { /* ignore */ }
};

// ── Reminder Completions ───────────────────────────────────────────────────────

export const loadCompletions = async () => {
  if (IS_DEMO_MODE) return loadDemoCollection("completions");
  try {
    const snap = await getDoc(userDataDoc("completions"));
    return snap.exists() ? snap.data().items : [];
  } catch { return []; }
};

export const saveCompletions = async (completions) => {
  if (IS_DEMO_MODE) return saveDemoCollection("completions", completions);
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const pruned = completions.filter(c => c.date >= cutoffStr);
    await setDoc(userDataDoc("completions"), { items: pruned });
  } catch { /* ignore */ }
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
