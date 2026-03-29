import { useState, useRef, useEffect } from "react";
import CogIcon from "./CogIcon";
import { useAuth } from "../contexts/AuthContext";
import "./SettingsMenu.css";

export default function SettingsMenu({ onImport, onExport, requestCount = 0, onRequests, onFeedback }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { signOutUser, isAdmin } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImport = () => {
    setIsOpen(false);
    onImport?.();
  };

  const handleExport = () => {
    setIsOpen(false);
    onExport?.();
  };

  const handleSettings = () => {
    setIsOpen(false);
  };

  const handleSignOut = () => {
    setIsOpen(false);
    signOutUser();
  };

  return (
    <div className="settings-menu-container" ref={menuRef}>
      <button
        className="settings-icon-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Settings"
      >
        <CogIcon size={20} />
      </button>

      {isOpen && (
        <div className="settings-dropdown">
          <button className="settings-dropdown-item" onClick={handleImport}>
            Import
          </button>
          <button className="settings-dropdown-item" onClick={handleExport}>
            Export
          </button>
          <button className="settings-dropdown-item" onClick={handleSettings}>
            Settings
          </button>
          {onFeedback && (
            <button
              className="settings-dropdown-item"
              onClick={() => { setIsOpen(false); onFeedback(); }}
            >
              Feedback
            </button>
          )}
          {isAdmin && onRequests && (
            <button
              className="settings-dropdown-item"
              onClick={() => { setIsOpen(false); onRequests(); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                {/* Shield icon */}
                <svg width="11" height="12" viewBox="0 0 11 12" fill="none" style={{ flexShrink: 0, opacity: 0.7 }}>
                  <path d="M5.5 0.5L1 2.5V6C1 8.5 3 10.7 5.5 11.5C8 10.7 10 8.5 10 6V2.5L5.5 0.5Z"
                    stroke="#4ADE80" strokeWidth="1.2" strokeLinejoin="round" fill="rgba(74,222,128,0.1)"/>
                </svg>
                <span style={{ color: "#4ADE80" }}>Requests</span>
              </span>
              {requestCount > 0 && (
                <span style={{
                  background: "#4ADE80", color: "#0a1a0f",
                  fontSize: "10px", fontWeight: 700,
                  borderRadius: "999px", padding: "1px 7px",
                  lineHeight: "16px", minWidth: "18px", textAlign: "center",
                }}>
                  {requestCount}
                </span>
              )}
            </button>
          )}
          <div className="settings-dropdown-divider" />
          <button className="settings-dropdown-item settings-dropdown-item--danger" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
