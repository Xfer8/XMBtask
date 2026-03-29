// ─── aiService.js ─────────────────────────────────────────────────────────────
// Uses the Groq API via groq-sdk.
// API key is stored in .env (VITE_GROQ_API_KEY) and never committed to git.
// ─────────────────────────────────────────────────────────────────────────────

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Statuses that mean a task is finished — excluded from duplicate checks.
const DONE_STATUSES = new Set(["Done", "Completed", "Complete", "Closed"]);

export const getOpenTasks = (tasks) =>
  tasks.filter(t => !DONE_STATUSES.has(t.status));

// ── analyzeTextForTasks ───────────────────────────────────────────────────────
// Returns an array of suggested tasks:
// [{
//   title:                 string,
//   description:           string | null,
//   suggestedProjectId:    string | null,
//   priority:              "Low" | "Medium" | "High" | null,
//   dueDate:               "YYYY-MM-DD" | null,
//   potentialDuplicateIds: string[],
// }]
export async function analyzeTextForTasks(text, projects, allTasks) {
  const openTasks      = getOpenTasks(allTasks);
  const activeProjects = projects.filter(p => p.status === "Active");
  const today          = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const prompt = `You are a task extraction assistant for a project management app called XMBtask.
Today's date is ${today}.

Analyze the text below and extract every actionable task that is mentioned or clearly implied.

For each task:
1. Write a clear, concise title (max 80 characters)
2. Optionally add a brief description if context is helpful
3. Suggest a project from the list below if it's a good match (use the project ID)
4. Set priority based on urgency language: "High" for urgent/ASAP/critical, "Low" for low-priority/whenever, "Medium" otherwise — use null if no signal
5. Set dueDate if a deadline is mentioned (e.g. "by Friday", "next week", "end of month") — resolve to an exact YYYY-MM-DD date relative to today. Use null if no date mentioned.
6. Identify existing open tasks that might be duplicates or closely related (use their IDs)

PROJECTS AVAILABLE (match tasks to these if relevant):
${activeProjects.length > 0
    ? activeProjects.map(p =>
        `  - ID: "${p.id}" | Name: "${p.title}" | Description: "${p.description || "No description provided"}"`
      ).join("\n")
    : "  (No projects defined yet)"}

EXISTING OPEN TASKS (identify potential duplicates from these):
${openTasks.length > 0
    ? openTasks.map(t =>
        `  - ID: "${t.id}" | Title: "${t.title}"${t.projectId ? ` | Project: "${t.projectId}"` : ""}`
      ).join("\n")
    : "  (No existing open tasks)"}

TEXT TO ANALYZE:
"""
${text}
"""

Rules:
- Extract only genuinely actionable tasks (not observations or background info)
- Task titles must be clear and concise (max 80 characters), written as action items
- For suggestedProjectId: use an exact project ID from the list above, or null
- For priority: "High", "Medium", or "Low" only — or null if the text gives no signal
- For dueDate: an exact YYYY-MM-DD string, or null if no deadline is mentioned
- For potentialDuplicateIds: list IDs of existing tasks that could be the same task or closely overlap — be conservative, only flag strong matches
- Return an empty array [] if no actionable tasks are found

Return ONLY a valid JSON object with a "tasks" array, no explanation, no markdown fences:
{
  "tasks": [
    {
      "title": "string",
      "description": "string or null",
      "suggestedProjectId": "string or null",
      "priority": "High" | "Medium" | "Low" | null,
      "dueDate": "YYYY-MM-DD" | null,
      "potentialDuplicateIds": ["taskId", ...]
    }
  ]
}`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw    = response.choices[0]?.message?.content ?? '{"tasks":[]}';
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.tasks)) return parsed.tasks;
  return [];
}
