import { useEffect, useState } from "react";
import { BuilderComponent, builder } from "@builder.io/react";
import NavBar from "./components/NavBar";
import SettingsMenu from "./components/SettingsMenu";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import './App.css';

// Put your Public API Key from Builder Space Settings here
builder.init("76d30dc4efc8465aa381751038fbe946");

export default function App() {
  const [content, setContent] = useState(null);
  const [currentPage, setCurrentPage] = useState("Dashboard");

  useEffect(() => {
    // This tells Builder to look for a "page" model
    builder.get("page", { url: window.location.pathname })
      .promise().then(setContent);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", minHeight: "100vh", backgroundColor: "#2A2A2A" }}>
      <div style={{ width: "100%", maxWidth: "640px", minWidth: "640px", display: "flex", flexDirection: "column", color: "white", border: "2px solid rgba(74, 222, 128, 0.5)", boxSizing: "border-box" }}>
        {/* Persistent title bar */}
        <div style={{ padding: "20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #444", boxSizing: "border-box", width: "100%" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>
            <span style={{ color: "#4ADE80" }}>XMB</span>
            <span style={{ color: "white" }}>task</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <NavBar onNavigate={setCurrentPage} currentPage={currentPage} />
            <SettingsMenu />
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", overflow: "auto", width: "100%" }}>
          {currentPage === "Dashboard" && <Dashboard />}
          {currentPage === "Tasks" && <Tasks />}
          {currentPage === "Projects" && <Projects />}
        </div>
      </div>
    </div>
  );
}
