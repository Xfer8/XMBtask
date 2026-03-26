import { useState, useRef, useEffect } from "react";
import "./SettingsMenu.css";

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

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
    console.log("Import clicked");
    setIsOpen(false);
  };

  const handleExport = () => {
    console.log("Export clicked");
    setIsOpen(false);
  };

  const handleSettings = () => {
    console.log("Settings clicked");
    setIsOpen(false);
  };

  return (
    <div className="settings-menu-container" ref={menuRef}>
      <button
        className="settings-icon-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Settings"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
        </svg>
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
        </div>
      )}
    </div>
  );
}
