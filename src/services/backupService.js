// ── backupService.js ───────────────────────────────────────────────────────────
// Full-fidelity backup format (.xmbtask). Stores the complete app state as JSON,
// including base64-encoded images. Intended for restore-only use — not human-readable.
// ─────────────────────────────────────────────────────────────────────────────

const BACKUP_VERSION = 1;

// ── Export ────────────────────────────────────────────────────────────────────
export function exportBackup(projects, tasks) {
  const payload = JSON.stringify({
    version:    BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    projects,
    tasks,
  });

  const blob = new Blob([payload], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `XMBtask-backup-${new Date().toISOString().slice(0, 10)}.xmbtask`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import ────────────────────────────────────────────────────────────────────
export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.projects) || !Array.isArray(data.tasks)) {
          throw new Error("Invalid backup: missing projects or tasks.");
        }
        resolve({ projects: data.projects, tasks: data.tasks });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}
