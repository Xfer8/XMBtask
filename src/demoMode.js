export const IS_DEMO_MODE = import.meta.env.MODE === "demo";

const STORAGE_PREFIX = "xmbtask:demo:v1:";
let demoPayloadPromise;

const clone = (value) => JSON.parse(JSON.stringify(value));

const getDemoPayload = async () => {
  if (!IS_DEMO_MODE) throw new Error("Demo data is only available in demo mode.");

  demoPayloadPromise ??= import("../demo/demo-data.xmbtask?raw")
    .then(({ default: raw }) => JSON.parse(raw));

  return demoPayloadPromise;
};

export const loadDemoCollection = async (type) => {
  const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${type}`);
  if (saved) return JSON.parse(saved);

  const payload = await getDemoPayload();
  return clone(payload[type] ?? []);
};

export const saveDemoCollection = async (type, items) => {
  window.localStorage.setItem(`${STORAGE_PREFIX}${type}`, JSON.stringify(items));
};

export const resetDemoData = () => {
  ["projects", "tasks", "reminders", "completions", "featureFlags"]
    .forEach((type) => window.localStorage.removeItem(`${STORAGE_PREFIX}${type}`));
};
