import { useEffect, useRef, useState } from "react";
import NavBar from "./components/NavBar";
import SettingsMenu from "./components/SettingsMenu";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Login from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";
import { loadProjects, saveProjects, loadTasks, saveTasks } from "./services/dataService";
import { subscribeToRequests } from "./services/requestsService";
import { subscribeToFeatureFlags, setFeatureFlag } from "./services/featureFlagsService";
import { subscribeToFeedback, deleteFeedback } from "./services/feedbackService";
import RequestsModal from "./components/RequestsModal";
import FeedbackModal from "./components/FeedbackModal";
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

const PAGE_ORDER  = ["Dashboard", "Tasks", "Projects"];
const PAGE_HASHES = { Dashboard: "#dashboard", Tasks: "#tasks", Projects: "#projects" };
const HASH_PAGES  = { "#dashboard": "Dashboard", "#tasks": "Tasks", "#projects": "Projects" };
const pageFromHash = () => HASH_PAGES[window.location.hash] ?? "Dashboard";

const IS_DEV_SITE = window.location.hostname.includes("xmbtask-dev");

function NotAuthorized() {
  const { signOutUser } = useAuth();
  return (
    <div style={{
      minHeight: "100vh", background: "#212121",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#2a2a2a", border: "1px solid #444450", borderRadius: "14px",
        padding: "40px 48px", maxWidth: "400px", textAlign: "center",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
      }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#f0f0f0", marginBottom: "8px" }}>
          <span style={{ color: "#2DB86A" }}>XMB</span>task Dev
        </div>
        <div style={{ fontSize: "13px", color: "#888890", lineHeight: 1.6, marginBottom: "24px" }}>
          This environment is restricted to administrators only.
        </div>
        <button
          onClick={signOutUser}
          style={{
            background: "none", border: "1px solid #444450", borderRadius: "7px",
            cursor: "pointer", color: "#888890", fontSize: "13px",
            padding: "8px 20px", fontFamily: "inherit",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { user, isAdmin } = useAuth();

  // Still checking auth state — show nothing to avoid flash
  if (user === undefined) return null;

  // Not signed in — show login screen
  if (user === null) return <Login />;

  // Dev site is admin-only
  if (IS_DEV_SITE && !isAdmin) return <NotAuthorized />;

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { isAdmin } = useAuth();
  const [currentPage,   setCurrentPage]   = useState(pageFromHash);
  const [slideDir,      setSlideDir]      = useState("right");
  const currentPageRef = useRef(currentPage);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  const [projects,      setProjects]      = useState([]);
  const [tasks,         setTasks]         = useState([]);
  const [storageReady,  setStorageReady]  = useState(false);
  const [loadError,     setLoadError]     = useState(false);
  const [saveStatus,    setSaveStatus]    = useState("idle"); // "idle"|"saving"|"saved"|"error"
  const [showExportChoice, setShowExportChoice] = useState(false);
  const [pendingImport,    setPendingImport]    = useState(null); // { projects, tasks, fileType }
  const [importError,      setImportError]      = useState(null);
  const [requests,         setRequests]         = useState([]);
  const [showRequests,     setShowRequests]     = useState(false);
  const [featureFlags,     setFeatureFlags]     = useState({ scratchPadEnabled: false });
  const [showFeedback,     setShowFeedback]     = useState(false);
  const fileInputRef   = useRef(null);
  // Always-current refs for use inside async feedback processing
  const projectsRef    = useRef([]);
  const tasksRef       = useRef([]);
  useEffect(() => { projectsRef.current = projects; }, [projects]);
  useEffect(() => { tasksRef.current    = tasks;    }, [tasks]);

  // ── Sync page with URL hash (back/forward + direct links) ──────────────────
  useEffect(() => {
    const onHashChange = () => {
      const page = pageFromHash();
      setSlideDir(PAGE_ORDER.indexOf(page) >= PAGE_ORDER.indexOf(currentPageRef.current) ? "right" : "left");
      setCurrentPage(page);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // ── Load from storage on mount ──────────────────────────────────────────────
  // IMPORTANT: storageReady must only become true if the load SUCCEEDS.
  // If it were set true after a failed load (which returns []), the save
  // effects below would immediately overwrite Firestore with empty arrays.
  useEffect(() => {
    const load = async () => {
      try {
        const [loadedProjects, loadedTasks] = await Promise.all([
          loadProjects(),
          loadTasks(),
        ]);
        setProjects(loadedProjects);
        setTasks(loadedTasks);
        setStorageReady(true);
      } catch (err) {
        console.error("Failed to load data from Firestore:", err);
        setLoadError(true); // storageReady stays false — saves are blocked
      }
    };
    load();
  }, []);

  // ── Subscribe to access requests (admin only) ───────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    return subscribeToRequests(setRequests);
  }, [isAdmin]);

  // ── Subscribe to feature flags ───────────────────────────────────────────────
  useEffect(() => {
    return subscribeToFeatureFlags(setFeatureFlags);
  }, []);

  // ── Subscribe to feedback + auto-convert to tasks (admin only) ───────────────
  useEffect(() => {
    if (!isAdmin || !storageReady) return;
    return subscribeToFeedback(async (items) => {
      if (items.length === 0) return;

      const TYPE_LABELS = {
        "bug-report":       "Bug Report",
        "new-feature":      "New Feature",
        "existing-feature": "Existing Feature",
        "general":          "General Feedback",
        "other":            "Other",
      };

      let currentProjects = [...projectsRef.current];
      let currentTasks    = [...tasksRef.current];

      // Find or create "Feature Requests" project
      let featProj = currentProjects.find(p => p.title === "Feature Requests");
      if (!featProj) {
        featProj = {
          title:       "Feature Requests",
          description: "User-submitted feedback and feature requests.",
          status:      "Active",
          color:       "green",
        };
        const newId = generateProjectId(currentProjects);
        featProj = { ...featProj, id: newId };
        currentProjects = [...currentProjects, featProj];
        setProjects(currentProjects);
      }

      // Build one task per feedback item
      const newTasks = items.map(fb => {
        const typeLabel = TYPE_LABELS[fb.type] ?? fb.type;
        const short     = fb.description.length > 60
          ? fb.description.slice(0, 60) + "…"
          : fb.description;
        const task = {
          id:          generateTaskId(currentTasks),
          title:       `${typeLabel}: ${short}`,
          description: `${fb.description}\n\nSubmitted by: ${fb.userName} (${fb.userEmail})`,
          status:      "Not Started",
          priority:    "Medium",
          dueDate:     null,
          owner:       "",
          projectId:   featProj.id,
          images:      fb.images ?? [],
          updates:     [],
          subtasks:    [],
          links:       [],
        };
        currentTasks = [...currentTasks, task]; // keep IDs unique across batch
        return task;
      });

      setTasks(ts => [...ts, ...newTasks]);
      await Promise.all(items.map(fb => deleteFeedback(fb.id)));
    });
  }, [isAdmin, storageReady]);

  // ── Persist on change (debounced to prevent concurrent-write race conditions) ─
  // Without debouncing, rapid successive changes fire multiple simultaneous
  // Firestore writes. If they complete out of order, an older write (with less
  // data) can land after a newer one, silently discarding recent changes.
  // The debounce ensures only one write is in flight at a time, always with
  // the latest snapshot of state.
  const saveTimerRef  = useRef(null);
  const savedStatusTimerRef = useRef(null);

  // Tracks which data types are waiting for the debounce timer to fire.
  // Keyed by "tasks" | "projects" so that a projects change doesn't evict a
  // pending tasks save (and vice-versa) when both change within the 600 ms window.
  const pendingSaveRef = useRef(null); // { tasks?: [...], projects?: [...] }

  const executePendingSave = async () => {
    const pending = pendingSaveRef.current;
    if (!pending) return;
    pendingSaveRef.current = null;
    const ops = [];
    if (pending.tasks     !== undefined) ops.push(saveTasks(pending.tasks));
    if (pending.projects  !== undefined) ops.push(saveProjects(pending.projects));
    await Promise.all(ops);
  };

  const scheduleSave = (key, data) => {
    // Merge this type into the pending batch
    pendingSaveRef.current = { ...(pendingSaveRef.current ?? {}), [key]: data };
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      saveTimerRef.current = null;
      try {
        await executePendingSave();
        setSaveStatus("saved");
        if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
        savedStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (err) {
        console.error("Firestore save failed:", err);
        setSaveStatus("error");
      }
    }, 600);
  };

  // Flush any pending debounced save immediately when the tab becomes hidden
  // (covers tab close, browser close, Alt+Tab away on mobile, power loss after
  // the OS has had a chance to fire the event).
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      if (!saveTimerRef.current) return; // nothing pending
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      executePendingSave().catch(() => {}); // best-effort; offline persistence will retry
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!storageReady) return;
    scheduleSave("projects", projects);
  }, [projects, storageReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!storageReady) return;
    scheduleSave("tasks", tasks);
  }, [tasks, storageReady]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Floating header — outer wrapper matches page content column (680px, 20px padding) */}
      <div style={{
        width:      "100%",
        maxWidth:   "680px",
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
        background:  "#2a2a2a",
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
          <NavBar
            onNavigate={(page) => {
              setSlideDir(PAGE_ORDER.indexOf(page) >= PAGE_ORDER.indexOf(currentPage) ? "right" : "left");
              setCurrentPage(page);
              window.location.hash = PAGE_HASHES[page];
            }}
            currentPage={currentPage}
          />
        </div>

        {/* Save status + Cog — right */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:"10px" }}>
          {saveStatus === "saving" && (
            <span style={{ fontSize:"10px", color:"#555560", letterSpacing:"0.03em" }}>Saving…</span>
          )}
          {saveStatus === "saved" && (
            <span style={{ fontSize:"10px", color:"#4ADE80", letterSpacing:"0.03em" }}>✓ Saved</span>
          )}
          {saveStatus === "error" && (
            <span
              title="Changes may not have been saved. Check your connection and try again."
              style={{ fontSize:"10px", color:"#FF6B6B", letterSpacing:"0.03em", cursor:"help" }}
            >
              ⚠ Save failed
            </span>
          )}
          <SettingsMenu
            onImport={handleImport}
            onExport={handleExport}
            requestCount={isAdmin ? requests.length : 0}
            onRequests={() => setShowRequests(true)}
            onFeedback={() => setShowFeedback(true)}
          />
        </div>
      </div>
      </div>

      {/* Load error — shown if Firestore failed to load on startup */}
      {loadError && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 700,
          background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#2c2c2c", border: "1px solid #943636", borderRadius: "14px",
            padding: "32px 36px", maxWidth: "380px", textAlign: "center",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>⚠️</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f0f0f0", marginBottom: "8px" }}>
              Failed to load your data
            </div>
            <div style={{ fontSize: "13px", color: "#888890", lineHeight: 1.6, marginBottom: "24px" }}>
              Could not connect to the database. Your data is safe — nothing has been changed.
              Check your connection and reload the page.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#4ADE80", border: "none", borderRadius: "8px",
                color: "#0a1a0f", fontSize: "13px", fontWeight: 700,
                padding: "10px 24px", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )}

      {/* Page content */}
      <div style={{ flex: 1, width: "100%" }}>
        <div key={currentPage} className={slideDir === "right" ? "slide-from-right" : "slide-from-left"}>
          {currentPage === "Dashboard" && (
            <Dashboard
              tasks={tasks}
              projects={projects}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              scratchPadEnabled={featureFlags.scratchPadEnabled ?? false}
              onToggleScratchPad={(val) => setFeatureFlag("scratchPadEnabled", val)}
            />
          )}
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

      {/* Requests modal (admin only) */}
      {showRequests && (
        <RequestsModal
          requests={requests}
          onClose={() => setShowRequests(false)}
        />
      )}

      {/* Feedback modal */}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
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
