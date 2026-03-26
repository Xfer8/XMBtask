import { useState, useRef, useEffect } from "react";
import CogIcon from "./CogIcon";
import "./SettingsMenu.css";

export default function SettingsMenu({ onImport, onExport }) {
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
        </div>
      )}
    </div>
  );
}
