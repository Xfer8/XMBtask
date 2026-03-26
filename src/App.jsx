import { useEffect, useRef, useState } from "react";
import NavBar from "./components/NavBar";
import SettingsMenu from "./components/SettingsMenu";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import { loadProjects, saveProjects, loadTasks, saveTasks } from "./services/dataService";

const generateTaskId = (tasks) => {
  const max = tasks.reduce((m, t) => Math.max(m, parseInt(t.id.replace("XMB-T", "")) || 0), 0);
  return `XMB-T${String(max + 1).padStart(3, "0")}`;
};

const generateProjectId = (projects) => {
  const max = projects.reduce((m, p) => Math.max(m, parseInt(p.id.replace("XMB-P", "")) || 0), 0);
  return `XMB-P${String(max + 1).padStart(3, "0")}`;
};

export default function App() {
  const [currentPage,   setCurrentPage]   = useState("Dashboard");
  const [projects,      setProjects]      = useState([]);
  const [tasks,         setTasks]         = useState([]);
  const [storageReady,  setStorageReady]  = useState(false);
  const fileInputRef = useRef(null);

  // ── Load from storage on mount ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setProjects(await loadProjects());
      setTasks(await loadTasks());
      setStorageReady(true);
    };
    load();
  }, []);

  // ── Persist on change ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!storageReady) return;
    saveProjects(projects);
  }, [projects, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    saveTasks(tasks);
  }, [tasks, storageReady]);

  // ── Project CRUD ────────────────────────────────────────────────────────────
  const addProject    = (p)  => setProjects(ps => [...ps, { ...p, id: generateProjectId(ps) }]);
  const updateProject = (p)  => setProjects(ps => ps.map(x => x.id === p.id ? p : x));
  const deleteProject = (id) => setProjects(ps => ps.filter(x => x.id !== id));

  // ── Task CRUD ───────────────────────────────────────────────────────────────
  const addTask    = (t)  => setTasks(ts => [...ts, t]); // ID pre-generated in Tasks.jsx
  const updateTask = (t)  => setTasks(ts => ts.map(x => x.id === t.id ? t : x));
  const deleteTask = (id) => setTasks(ts => ts.filter(x => x.id !== id));

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    // Full XLSX export will be wired here once the xlsx package is added
    alert("Export coming soon.");
  };

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleImport = () => fileInputRef.current?.click();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#212121" }}>

      {/* Full-width sticky header */}
      <div style={{
        width: "100%", backgroundColor: "#252525",
        padding: "0 20px", height: "48px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>
          <span style={{ color: "#2DB86A" }}>XMB</span>
          <span style={{ color: "#f0f0f0" }}>task</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <NavBar onNavigate={setCurrentPage} currentPage={currentPage} />
          <SettingsMenu onImport={handleImport} onExport={handleExport} />
        </div>
      </div>

      {/* Page content — full width, no max-width constraint here */}
      <div style={{ flex: 1, width: "100%" }}>
        {currentPage === "Dashboard" && <Dashboard />}
        {currentPage === "Tasks" && (
          <Tasks
            tasks={tasks}
            projects={projects}
            onAdd={addTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        )}
        {currentPage === "Projects" && (
          <Projects
            projects={projects}
            tasks={tasks}
            onAdd={addProject}
            onUpdate={updateProject}
            onDelete={deleteProject}
          />
        )}
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={() => alert("Import coming soon.")}
      />
    </div>
  );
}
