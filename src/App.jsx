import { useEffect, useRef, useState } from "react";
import NavBar from "./components/NavBar";
import SettingsMenu from "./components/SettingsMenu";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import { loadProjects, saveProjects, loadTasks, saveTasks } from "./services/dataService";
import { exportToXlsx, importFromXlsx } from "./services/xlsxService";

const generateTaskId = (tasks) => {
  const max = tasks.reduce((m, t) => Math.max(m, parseInt(t.id.replace("XMB-T", "")) || 0), 0);
  return `XMB-T${String(max + 1).padStart(3, "0")}`;
};

const generateProjectId = (projects) => {
  const max = projects.reduce((m, p) => Math.max(m, parseInt(p.id.replace("XMB-P", "")) || 0), 0);
  return `XMB-P${String(max + 1).padStart(3, "0")}`;
};

// ── Import confirmation modal ──────────────────────────────────────────────────
function ImportConfirmModal({ preview, onConfirm, onCancel }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:600,
      background:"rgba(0,0,0,0.75)",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        background:"#2c2c2c", border:"1px solid #3a3a3a", borderRadius:"14px",
        padding:"28px 32px", width:"360px",
        boxShadow:"0 16px 48px rgba(0,0,0,0.6)",
      }}>
        <div style={{ fontSize:"15px", fontWeight:700, color:"#f0f0f0", marginBottom:"10px" }}>
          Import backup?
        </div>
        <div style={{
          fontSize:"13px", color:"#888890", lineHeight:1.6, marginBottom:"16px",
        }}>
          This will <span style={{ color:"#FF6B6B", fontWeight:600 }}>replace all existing data</span> with
          the contents of the selected file. This action cannot be undone.
        </div>

        {/* Preview counts */}
        <div style={{
          background:"#1e1e1e", border:"1px solid #3a3a3a", borderRadius:"8px",
          padding:"12px 16px", marginBottom:"22px",
          display:"flex", gap:"24px",
        }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"20px", fontWeight:700, color:"#f0f0f0" }}>{preview.projects}</div>
            <div style={{ fontSize:"11px", color:"#888890", textTransform:"uppercase", letterSpacing:"0.06em" }}>Projects</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"20px", fontWeight:700, color:"#f0f0f0" }}>{preview.tasks}</div>
            <div style={{ fontSize:"11px", color:"#888890", textTransform:"uppercase", letterSpacing:"0.06em" }}>Tasks</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{
            background:"none", border:"1px solid #3a3a3a", borderRadius:"7px",
            cursor:"pointer", color:"#888890", fontSize:"13px",
            padding:"7px 18px", fontFamily:"inherit",
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            background:"#4A1B1B", border:"1px solid #943636", borderRadius:"7px",
            cursor:"pointer", color:"#FF6B6B", fontSize:"13px",
            fontWeight:600, padding:"7px 18px", fontFamily:"inherit",
          }}>
            Replace All Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage,   setCurrentPage]   = useState("Dashboard");
  const [projects,      setProjects]      = useState([]);
  const [tasks,         setTasks]         = useState([]);
  const [storageReady,  setStorageReady]  = useState(false);
  const [pendingImport, setPendingImport] = useState(null); // { projects, tasks }
  const [importError,   setImportError]   = useState(null);
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
    exportToXlsx(projects, tasks);
  };

  // ── Import — step 1: open file picker ─────────────────────────────────────
  const handleImport = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  // ── Import — step 2: parse file, show confirmation ────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so same file can be re-selected
    if (!file) return;

    try {
      const data = await importFromXlsx(file);
      setPendingImport(data);
    } catch {
      setImportError("Could not read the file. Make sure it's a valid XMBtask backup (.xlsx).");
    }
  };

  // ── Import — step 3: confirmed, replace all data ──────────────────────────
  const handleImportConfirm = () => {
    if (!pendingImport) return;
    setProjects(pendingImport.projects);
    setTasks(pendingImport.tasks);
    setPendingImport(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#212121" }}>

      {/* Top mask — fixed strip that hides content scrolling into the header gap */}
      <div style={{
        position:   "fixed",
        top:        0,
        left:       0,
        right:      0,
        height:     "20px",
        background: "#212121",
        zIndex:     99,
      }} />

      {/* Floating header — outer wrapper matches page content column (720px, 20px padding) */}
      <div style={{
        width:      "100%",
        maxWidth:   "720px",
        margin:     "20px auto 0",
        padding:    "0 20px",
        boxSizing:  "border-box",
        position:   "sticky",
        top:        "20px",
        zIndex:     100,
        background: "#212121", // fills the padding on each side, masking rounded-corner gaps
      }}>
      {/* Inner floating pill fills the padded column, matching task card width */}
      <div style={{
        width:       "100%",
        background:  "#222228",
        height:      "48px",
        display:     "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems:  "center",
        padding:     "0 20px",
        borderRadius:"6px",
        border:      "1px solid rgba(255,255,255,0.05)",
        boxShadow:   "0 10px 40px rgba(0,0,0,0.5)",
        boxSizing:   "border-box",
      }}>
        {/* Logo — left */}
        <div style={{ display:"flex", alignItems:"center", fontSize:"18px", fontWeight:700, letterSpacing:"-0.3px" }}>
          <span style={{ color:"#2DB86A" }}>XMB</span>
          <span style={{ color:"#f0f0f0" }}>task</span>
        </div>

        {/* Nav — center */}
        <div style={{ display:"flex", alignItems:"center" }}>
          <NavBar onNavigate={setCurrentPage} currentPage={currentPage} />
        </div>

        {/* Cog — right */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end" }}>
          <SettingsMenu onImport={handleImport} onExport={handleExport} />
        </div>
      </div>
      </div>

      {/* Page content */}
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
        onChange={handleFileChange}
      />

      {/* Import error toast */}
      {importError && (
        <div style={{
          position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)",
          background:"#4A1B1B", border:"1px solid #943636", borderRadius:"8px",
          padding:"10px 20px", color:"#FF6B6B", fontSize:"13px",
          zIndex:700, cursor:"pointer",
        }} onClick={() => setImportError(null)}>
          {importError}
        </div>
      )}

      {/* Import confirmation modal */}
      {pendingImport && (
        <ImportConfirmModal
          preview={{ projects: pendingImport.projects.length, tasks: pendingImport.tasks.length }}
          onConfirm={handleImportConfirm}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}
