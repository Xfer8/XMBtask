import { useState } from "react";
import "./NavBar.css";

export default function NavBar({ onNavigate, currentPage }) {
  const [selected, setSelected] = useState(currentPage || "Dashboard");

  const handleSelect = (page) => {
    setSelected(page);
    onNavigate(page);
  };

  const options = ["Dashboard", "Tasks", "Projects"];

  return (
    <div className="navbar-container">
      <div className="navbar-slider">
        <div className="navbar-pill" style={{ "--index": options.indexOf(selected) }}></div>
        {options.map((option) => (
          <button
            key={option}
            className={`navbar-option ${selected === option ? "active" : ""}`}
            onClick={() => handleSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
