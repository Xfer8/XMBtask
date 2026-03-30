import { useRef, useLayoutEffect, Children } from "react";

// ── AnimatedGroupList ─────────────────────────────────────────────────────────
// Same FLIP technique as AnimatedTaskList, but applied to project group
// containers. Tracks each child's absolute viewport position so that when
// one group shrinks (task completed/removed), the groups below it slide
// smoothly rather than snapping.
//
// Uses absolute getBoundingClientRect positions (not relative) because group
// containers sit at the top of the FLIP hierarchy — nothing above them is
// also FLIP-animating.

export default function AnimatedGroupList({ children, gap = "40px", animated = true }) {
  const wrappers = useRef({});
  const prevY    = useRef({});

  useLayoutEffect(() => {
    if (!animated) return;           // FLIP disabled — skip entirely

    const W = wrappers.current;
    const P = prevY.current;

    const nextY = {};
    Object.entries(W).forEach(([id, el]) => {
      if (el) nextY[id] = el.getBoundingClientRect().top;
    });

    Object.entries(W).forEach(([id, el]) => {
      if (!el || P[id] === undefined) return;
      const dy = P[id] - nextY[id];
      if (Math.abs(dy) < 1) return;

      el.style.transition = "none";
      el.style.transform  = `translateY(${dy}px)`;
      el.getBoundingClientRect(); // force layout flush

      requestAnimationFrame(() => {
        el.style.transition = "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
        el.style.transform  = "";
      });
    });

    prevY.current = nextY;
  });

  // Children.toArray normalises the children array and drops null/false entries
  const items = Children.toArray(children);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {items.map(child => (
        <div
          key={child.key}
          ref={el => {
            if (el) wrappers.current[child.key] = el;
            else    delete wrappers.current[child.key];
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
