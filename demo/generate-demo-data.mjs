import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputUrl = new URL("./demo-data.xmbtask", import.meta.url);
const DAY_MS = 24 * 60 * 60 * 1000;

const anchor = new Date();
anchor.setUTCHours(12, 0, 0, 0);

const addDays = (days) => new Date(anchor.getTime() + days * DAY_MS);
const isoDate = (days) => addDays(days).toISOString().slice(0, 10);
const isoTime = (days) => addDays(days).toISOString();
const selectIndices = (count, step, offset = 0) =>
  Array.from({ length: count }, (_, index) => (offset + index * step) % 67);

const projects = [
  { id: "XMB-P1", title: "Home Studio Refresh", color: "orange", status: "Active", description: "Plan a comfortable, organized space for focused creative work." },
  { id: "XMB-P2", title: "Family Trip Planning", color: "green", status: "Active", description: "Coordinate a relaxed fictional weekend trip from research through packing." },
  { id: "XMB-P3", title: "Garden & Patio", color: "yellow", status: "Active", description: "Track seasonal improvements for an imaginary outdoor space." },
  { id: "XMB-P4", title: "Digital Photo Library", color: "teal", status: "Active", description: "Organize a fictional collection of photos into a durable archive." },
  { id: "XMB-P5", title: "Community Event", color: "purple", status: "Active", description: "Demonstrate planning tasks for a small neighborhood gathering." },
  { id: "XMB-P6", title: "Personal Learning Plan", color: "pink", status: "Active", description: "Build a repeatable study routine around a made-up course." },
  { id: "XMB-P7", title: "Household Maintenance", color: "red", status: "Active", description: "Show recurring planning for ordinary home upkeep." },
  { id: "XMB-P8", title: "Recipe Collection", color: "amber", status: "Active", description: "Create and test a small fictional set of weeknight recipes." },
];

const actionTemplates = [
  "Define success criteria for",
  "Collect reference ideas for",
  "Draft the first checklist for",
  "Review the budget for",
  "Schedule the next work session for",
  "Compare available options for",
  "Complete the first milestone for",
  "Share a progress update for",
  "Close out the project notes for",
];

const statuses = [
  ...Array(23).fill("Not Started"),
  ...Array(15).fill("In Progress"),
  ...Array(29).fill("Done"),
];

const priorities = [
  ...Array(3).fill("High"),
  ...Array(2).fill("Low"),
  ...Array(62).fill("Medium"),
];

const dueDateIndices = new Set(selectIndices(18, 7, 3));
const ownerIndices = new Set(selectIndices(8, 11, 5));
const subtaskIndices = selectIndices(13, 5, 1);
const updateIndices = selectIndices(26, 9, 2);
const linkIndices = selectIndices(45, 4, 0);

const tasks = Array.from({ length: 67 }, (_, index) => {
  const project = projects[index % projects.length];
  const action = actionTemplates[Math.floor(index / projects.length)];

  return {
    id: `XMB-T${index + 1}`,
    title: `${action} ${project.title}`,
    description: index < 64
      ? `Synthetic demo task for ${project.title}. Use it to show planning, filtering, editing, and progress tracking without exposing production content.`
      : "",
    projectId: project.id,
    status: statuses[(index * 11) % statuses.length],
    priority: priorities[(index * 17) % priorities.length],
    dueDate: dueDateIndices.has(index) ? isoDate((index % 15) - 5) : null,
    owner: ownerIndices.has(index) ? "Demo Owner" : "",
    createdAt: isoTime(-90 + index),
    images: [],
    updates: [],
    subtasks: [],
    links: [],
  };
});

let subtaskId = 1;
const subtaskRefs = [];
subtaskIndices.forEach((taskIndex, featureIndex) => {
  const count = featureIndex < 7 ? 3 : 2;
  for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
    const subtask = {
      id: `XMB-S${subtaskId}`,
      title: ["Gather the inputs", "Review the draft", "Confirm the next step"][itemIndex],
      status: "open",
      url: "",
      urlDisplayName: "",
    };
    subtaskId += 1;
    tasks[taskIndex].subtasks.push(subtask);
    subtaskRefs.push({ task: tasks[taskIndex], subtask });
  }
});

subtaskRefs
  .sort((left, right) => Number(right.task.status === "Done") - Number(left.task.status === "Done"))
  .slice(0, 23)
  .forEach(({ subtask }) => { subtask.status = "complete"; });

let updateId = 1;
updateIndices.forEach((taskIndex, featureIndex) => {
  const count = featureIndex < 9 ? 2 : 1;
  for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
    tasks[taskIndex].updates.push({
      id: `XMB-U${updateId}`,
      text: itemIndex === 0
        ? "Reviewed the demo task and recorded a clear next action."
        : "Follow-up complete; the example is ready for the next workflow step.",
      timestamp: isoTime(-28 + featureIndex + itemIndex),
    });
    updateId += 1;
  }
});

const remainingLinkTypes = new Map([
  ["Jira", 20],
  ["Email", 15],
  ["Link", 9],
  ["SLG", 8],
  ["Checklist", 1],
]);
const linkTypes = [];
while (linkTypes.length < 53) {
  for (const [type, remaining] of remainingLinkTypes) {
    if (remaining > 0) {
      linkTypes.push(type);
      remainingLinkTypes.set(type, remaining - 1);
    }
  }
}

let linkId = 1;
linkIndices.forEach((taskIndex, featureIndex) => {
  const count = featureIndex < 8 ? 2 : 1;
  for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
    const type = linkTypes[linkId - 1];
    tasks[taskIndex].links.push({
      id: `XMB-L${linkId}`,
      type,
      displayName: `Demo ${type} reference`,
      url: `https://example.com/xmbtask-demo/${type.toLowerCase()}/${linkId}`,
      images: [],
    });
    linkId += 1;
  }
});

const reminders = [
  { id: "XMB-R1", text: "Review today's priorities", description: "A synthetic daily planning reminder.", displayName: "Planning note", url: "https://example.com/xmbtask-demo/reminders/1", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], time: "08:30", createdAt: isoTime(-40) },
  { id: "XMB-R2", text: "Capture end-of-day notes", description: "", displayName: "Daily notes", url: "https://example.com/xmbtask-demo/reminders/2", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], time: "16:30", createdAt: isoTime(-39) },
  { id: "XMB-R3", text: "Plan the weekly focus", description: "", displayName: "Weekly plan", url: "https://example.com/xmbtask-demo/reminders/3", days: ["Monday"], time: "09:00", createdAt: isoTime(-38) },
  { id: "XMB-R4", text: "Check the household list", description: "", displayName: "Home checklist", url: "https://example.com/xmbtask-demo/reminders/4", days: ["Tuesday"], time: "18:00", createdAt: isoTime(-37) },
  { id: "XMB-R5", text: "Water patio plants", description: "", displayName: "Garden checklist", url: "https://example.com/xmbtask-demo/reminders/5", days: ["Wednesday"], time: "07:30", createdAt: isoTime(-36) },
  { id: "XMB-R6", text: "Review learning notes", description: "", displayName: "Study notes", url: "https://example.com/xmbtask-demo/reminders/6", days: ["Thursday"], time: "19:00", createdAt: isoTime(-35) },
  { id: "XMB-R7", text: "Choose a weekend recipe", description: "", displayName: "Recipe list", url: "https://example.com/xmbtask-demo/reminders/7", days: ["Friday"], time: "17:00", createdAt: isoTime(-34) },
  { id: "XMB-R8", text: "Back up the demo photo library", description: "", displayName: "", url: "", days: ["Saturday"], time: "10:00", createdAt: isoTime(-33) },
  { id: "XMB-R9", text: "Reset the workspace for next week", description: "", displayName: "", url: "", days: ["Sunday"], time: "17:30", createdAt: isoTime(-32) },
];

const payload = {
  version: 1,
  demoDataVersion: 1,
  label: "SANITIZED DEMO DATA — NO PRODUCTION CONTENT",
  generatedAt: new Date().toISOString(),
  sanitization: {
    content: "All titles, descriptions, owners, updates, reminders, and links are synthetic.",
    identities: "No user IDs, email addresses, account metadata, or real names are included.",
    attachments: "All task and link image arrays are empty; no storage paths are included.",
    links: "All non-empty URLs use the reserved example.com domain.",
    dates: "Dates are generated relative to the day this file is rebuilt.",
  },
  sourceProfile: {
    projects: 8,
    tasks: 67,
    reminders: 9,
    completions: 0,
    note: "Only aggregate counts and feature distribution were retained from the retired dataset.",
  },
  projects,
  tasks,
  reminders,
  completions: [],
};

const countBy = (items, field) => Object.fromEntries(
  [...new Set(items.map((item) => item[field]))].map((value) => [value, items.filter((item) => item[field] === value).length]),
);

const allLinks = tasks.flatMap((task) => task.links);
const allSubtasks = tasks.flatMap((task) => task.subtasks);
const allUpdates = tasks.flatMap((task) => task.updates);
const serialized = JSON.stringify(payload);

assert.equal(projects.length, 8);
assert.equal(tasks.length, 67);
assert.equal(reminders.length, 9);
assert.deepEqual(countBy(tasks, "status"), { "Not Started": 23, "In Progress": 15, Done: 29 });
assert.deepEqual(countBy(tasks, "priority"), { High: 3, Medium: 62, Low: 2 });
assert.equal(tasks.filter((task) => task.description).length, 64);
assert.equal(tasks.filter((task) => task.dueDate).length, 18);
assert.equal(tasks.filter((task) => task.owner).length, 8);
assert.equal(tasks.filter((task) => task.subtasks.length).length, 13);
assert.equal(allSubtasks.length, 33);
assert.equal(allSubtasks.filter((subtask) => subtask.status === "complete").length, 23);
assert.equal(tasks.filter((task) => task.updates.length).length, 26);
assert.equal(allUpdates.length, 35);
assert.equal(tasks.filter((task) => task.links.length).length, 45);
assert.equal(allLinks.length, 53);
assert.deepEqual(countBy(allLinks, "type"), { Jira: 20, Email: 15, Link: 9, SLG: 8, Checklist: 1 });
assert.equal(tasks.some((task) => task.images.length || task.links.some((link) => link.images.length)), false);
assert.equal(serialized.includes("storagePath"), false);
assert.equal(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized), false);
assert.equal(allLinks.every((link) => new URL(link.url).hostname === "example.com"), true);
assert.equal(reminders.filter((reminder) => reminder.url).every((reminder) => new URL(reminder.url).hostname === "example.com"), true);

await writeFile(outputUrl, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${fileURLToPath(outputUrl)}`);
console.log(`Validated ${projects.length} projects, ${tasks.length} tasks, ${reminders.length} reminders, and zero attachment references.`);
