import { useEffect, useRef, useState } from "react";
import NavBar from "./components/NavBar";
import SettingsMenu from "./components/SettingsMenu";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import { loadProjects, saveProjects, loadTasks, saveTasks } from "./services/dataService";
import { exportToXlsx, importFromXlsx } from "./services/xlsxService";
import { exportBackup, importBackup } from "./services/backupService";

const generateTaskId = (tasks) => {
  const max = tasks.reduce((m, t) => Math.max(m, parseInt(t.id.replace("XMB-T", "")) || 0), 0);
  return `XMB-T${String(max + 1).padStart(3, "0")}`;
};

const generateProjectId = (projects) => {
  const max = projects.reduce((m, p) => Math.max(m, parseInt(p.id.replace("XMB-P", "")) || 0), 0);
  return `XMB-P${String(max + 1).padStart(3, "0")}`;
};

// ── Export choice modal ────────────────────────────────────────────────────────
function ExportChoiceModal({ onExcel, onBackup, onCancel }) {
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
        <div style={{ fontSize:"15px", fontWeight:700, color:"#f0f0f0", marginBottom:"8px" }}>
          Export data
        </div>
        <div style={{ fontSize:"13px", color:"#888890", lineHeight:1.5, marginBottom:"20px" }}>
          Choose an export format.
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"22px" }}>
          <button onClick={onExcel} style={{
            background:"#1e1e1e", border:"1px solid #3a3a3a", borderRadius:"8px",
            cursor:"pointer", color:"#f0f0f0", fontSize:"13px",
            padding:"14px 16px", fontFamily:"inherit", textAlign:"left",
          }}>
            <div style={{ fontWeight:600, marginBottom:"3px" }}>Excel spreadsheet (.xlsx)</div>
            <div style={{ fontSize:"12px", color:"#888890" }}>Human-readable. Images are not included.</div>
          </button>
          <button onClick={onBackup} style={{
            background:"#1e1e1e", border:"1px solid #3a3a3a", borderRadius:"8px",
            cursor:"pointer", color:"#f0f0f0", fontSize:"13px",
            padding:"14px 16px", fontFamily:"inherit", textAlign:"left",
          }}>
            <div style={{ fontWeight:600, marginBottom:"3px" }}>Full backup (.xmbtask)</div>
            <div style={{ fontSize:"12px", color:"#888890" }}>Complete restore file. Includes all images.</div>
          </button>
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{
            background:"none", border:"1px solid #3a3a3a", borderRadius:"7px",
            cursor:"pointer", color:"#888890", fontSize:"13px",
            padding:"7px 18px", fontFamily:"inherit",
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Import confirmation modal ──────────────────────────────────────────────────
function ImportConfirmModal({ preview, fileType, onConfirm, onCancel }) {
  const isBackup = fileType === "xmbtask";
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
          {isBackup ? "Restore from backup?" : "Import from Excel?"}
        </div>
        <div style={{ fontSize:"13px", color:"#888890", lineHeight:1.6, marginBottom:"4px" }}>
          This will <span style={{ color:"#FF6B6B", fontWeight:600 }}>replace all existing data</span> with
          the contents of the selected file. This action cannot be undone.
        </div>
        {!isBackup && (
          <div style={{ fontSize:"12px", color:"#666670", marginBottom:"12px" }}>
            Note: images are not stored in Excel exports and will not be restored.
          </div>
        )}
        {isBackup && <div style={{ marginBottom:"12px" }} />}

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
  const [showExportChoice, setShowExportChoice] = useState(false);
  const [pendingImport,    setPendingImport]    = useState(null); // { projects, tasks, fileType }
  const [importError,      setImportError]      = useState(null);
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
    setShowExportChoice(true);
  };

  const handleExportExcel = () => {
    setShowExportChoice(false);
    exportToXlsx(projects, tasks);
  };

  const handleExportBackup = () => {
    setShowExportChoice(false);
    exportBackup(projects, tasks);
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

    const isBackup = file.name.endsWith(".xmbtask");

    try {
      const data = isBackup
        ? await importBackup(file)
        : await importFromXlsx(file);
      setPendingImport({ ...data, fileType: isBackup ? "xmbtask" : "xlsx" });
    } catch {
      setImportError(
        isBackup
          ? "Could not read the file. Make sure it's a valid XMBtask backup (.xmbtask)."
          : "Could not read the file. Make sure it's a valid XMBtask export (.xlsx)."
      );
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
        accept=".xlsx,.xls,.xmbtask"
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

      {/* Export choice modal */}
      {showExportChoice && (
        <ExportChoiceModal
          onExcel={handleExportExcel}
          onBackup={handleExportBackup}
          onCancel={() => setShowExportChoice(false)}
        />
      )}

      {/* Import confirmation modal */}
      {pendingImport && (
        <ImportConfirmModal
          preview={{ projects: pendingImport.projects.length, tasks: pendingImport.tasks.length }}
          fileType={pendingImport.fileType}
          onConfirm={handleImportConfirm}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}
