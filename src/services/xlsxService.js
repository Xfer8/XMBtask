import * as XLSX from "xlsx";

// ── Export ────────────────────────────────────────────────────────────────────
// Produces an .xlsx file with 5 sheets: Projects, Tasks, TaskUpdates,
// TaskSubtasks, TaskLinks. Images are intentionally excluded (data URLs
// are too large for a spreadsheet backup).
export function exportToXlsx(projects, tasks) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Projects ──────────────────────────────────────────────────────
  const projectRows = projects.map(p => ({
    id:          p.id,
    title:       p.title,
    description: p.description ?? "",
    status:      p.status,
    color:       p.color ?? "",
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(projectRows.length ? projectRows : [{ id:"", title:"", description:"", status:"", color:"" }]),
    "Projects"
  );

  // ── Sheet 2: Tasks ─────────────────────────────────────────────────────────
  const taskRows = tasks.map(t => ({
    id:          t.id,
    title:       t.title,
    description: t.description ?? "",
    projectId:   t.projectId ?? "",
    dueDate:     t.dueDate ?? "",
    priority:    t.priority,
    status:      t.status,
    owner:       t.owner ?? "",
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(taskRows.length ? taskRows : [{ id:"", title:"", description:"", projectId:"", dueDate:"", priority:"", status:"", owner:"" }]),
    "Tasks"
  );

  // ── Sheet 3: TaskUpdates (flattened) ───────────────────────────────────────
  const updateRows = tasks.flatMap(t =>
    (t.updates ?? []).map(u => ({
      taskId:    t.id,
      text:      u.text ?? "",
      createdAt: u.createdAt ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(updateRows.length ? updateRows : [{ taskId:"", text:"", createdAt:"" }]),
    "TaskUpdates"
  );

  // ── Sheet 4: TaskSubtasks (flattened) ─────────────────────────────────────
  const subtaskRows = tasks.flatMap(t =>
    (t.subtasks ?? []).map(s => ({
      taskId:     t.id,
      id:         s.id ?? "",
      title:      s.title ?? "",
      status:     s.status ?? "",
      url:        s.url ?? "",
      urlDisplay: s.urlDisplay ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(subtaskRows.length ? subtaskRows : [{ taskId:"", id:"", title:"", status:"", url:"", urlDisplay:"" }]),
    "TaskSubtasks"
  );

  // ── Sheet 5: TaskLinks (flattened) ────────────────────────────────────────
  const linkRows = tasks.flatMap(t =>
    (t.links ?? []).map(l => ({
      taskId:  t.id,
      id:      l.id ?? "",
      url:     l.url ?? "",
      display: l.display ?? "",
      type:    l.type ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(linkRows.length ? linkRows : [{ taskId:"", id:"", url:"", display:"", type:"" }]),
    "TaskLinks"
  );

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `XMBtask-backup-${date}.xlsx`);
}

// ── Import ────────────────────────────────────────────────────────────────────
// Reads an .xlsx file produced by exportToXlsx and returns { projects, tasks }.
// Images are not restored (not stored in export).
export function importFromXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });

        // ── Projects ─────────────────────────────────────────────────────────
        const pSheet   = wb.Sheets["Projects"];
        const projects = pSheet
          ? XLSX.utils.sheet_to_json(pSheet).filter(r => r.id).map(r => ({
              id:          String(r.id),
              title:       r.title ?? "",
              description: r.description ?? "",
              status:      r.status ?? "Active",
              color:       r.color ?? "blue",
            }))
          : [];

        // ── Tasks base rows ───────────────────────────────────────────────────
        const tSheet   = wb.Sheets["Tasks"];
        const taskRows = tSheet ? XLSX.utils.sheet_to_json(tSheet).filter(r => r.id) : [];

        // ── Related rows (keyed by taskId) ────────────────────────────────────
        const uSheet     = wb.Sheets["TaskUpdates"];
        const updateRows = uSheet ? XLSX.utils.sheet_to_json(uSheet) : [];

        const sSheet      = wb.Sheets["TaskSubtasks"];
        const subtaskRows = sSheet ? XLSX.utils.sheet_to_json(sSheet) : [];

        const lSheet    = wb.Sheets["TaskLinks"];
        const linkRows  = lSheet ? XLSX.utils.sheet_to_json(lSheet) : [];

        // ── Assemble tasks ────────────────────────────────────────────────────
        const tasks = taskRows.map(r => {
          const id = String(r.id);
          return {
            id,
            title:       r.title ?? "",
            description: r.description ?? "",
            projectId:   r.projectId || null,
            dueDate:     r.dueDate   || null,
            priority:    r.priority  ?? "Medium",
            status:      r.status    ?? "Not Started",
            owner:       r.owner     ?? "",
            images:   [],
            updates:  updateRows .filter(u => String(u.taskId) === id).map(u => ({ text: u.text ?? "", createdAt: u.createdAt ?? "" })),
            subtasks: subtaskRows.filter(s => String(s.taskId) === id).map(s => ({ id: String(s.id ?? ""), title: s.title ?? "", status: s.status ?? "open", url: s.url ?? "", urlDisplay: s.urlDisplay ?? "" })),
            links:    linkRows   .filter(l => String(l.taskId) === id).map(l => ({ id: String(l.id ?? ""), url: l.url ?? "", display: l.display ?? "", type: l.type ?? "" })),
          };
        });

        resolve({ projects, tasks });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}
