import { useState, useRef, useEffect } from "react";
import "./NavBar.css";

export default function NavBar({ onNavigate, currentPage }) {
  const [selected, setSelected] = useState(currentPage || "Dashboard");
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 });
  const buttonRefs = useRef({});
  const sliderRef = useRef(null);

  const options = ["Dashboard", "Tasks", "Projects"];

  const updatePillPosition = () => {
    const activeButton = buttonRefs.current[selected];
    if (activeButton && sliderRef.current) {
      const buttonWidth = activeButton.offsetWidth;
      const buttonLeft = activeButton.offsetLeft;
      setPillStyle({ width: buttonWidth, left: buttonLeft });
    }
  };

  useEffect(() => {
    updatePillPosition();
    window.addEventListener("resize", updatePillPosition);
    return () => window.removeEventListener("resize", updatePillPosition);
  }, [selected]);

  const handleSelect = (page) => {
    setSelected(page);
    onNavigate(page);
  };

  return (
    <div className="navbar-container">
      <div className="navbar-slider" ref={sliderRef}>
        <div className="navbar-pill" style={{ width: `${pillStyle.width}px`, left: `${pillStyle.left}px` }}></div>
        {options.map((option) => (
          <button
            key={option}
            ref={(el) => buttonRefs.current[option] = el}
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
