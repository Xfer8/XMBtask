import { useRef, useLayoutEffect } from "react";
import TaskCard from "../TaskCard";

// ── AnimatedTaskList ────────────────────────────────────────────────────────────
// Renders a sorted list of TaskCards and animates reordering using the FLIP
// technique (First-Last-Invert-Play):
//
//  1. After every React commit, measure each item's new natural position.
//  2. Compare to the positions stored from the previous render.
//  3. For items that moved, snap them back to their old position via a
//     translateY transform (no transition), then remove the transform with
//     a CSS transition so they smoothly slide to their new position.
//  4. Save the current positions for the next render.
//
// Because useLayoutEffect runs before the browser paints, the user never
// sees the element in the "wrong" position — they only see the animation.

export default function AnimatedTaskList({ tasks, projects, onEdit, onUpdate, gap = "10px" }) {
  const wrappers = useRef({});  // task id → wrapper DOM element
  const prevY    = useRef({});  // task id → natural top from last render

  useLayoutEffect(() => {
    const W = wrappers.current;
    const P = prevY.current;

    // ── Step 1: measure natural (post-commit) positions ──────────────────
    const nextY = {};
    Object.entries(W).forEach(([id, el]) => {
      if (el) nextY[id] = el.getBoundingClientRect().top;
    });

    // ── Step 2 & 3: FLIP any item whose position changed ─────────────────
    Object.entries(W).forEach(([id, el]) => {
      if (!el || P[id] === undefined) return;   // new item — no old position
      const dy = P[id] - nextY[id];
      if (Math.abs(dy) < 1) return;             // didn't move — skip

      // Invert: snap element back to its old visual position
      el.style.transition = "none";
      el.style.transform  = `translateY(${dy}px)`;
      el.getBoundingClientRect();               // force layout flush

      // Play: animate to the natural (new) position on the next frame
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
        el.style.transform  = "";
      });
    });

    // ── Step 4: store positions for the next render ───────────────────────
    prevY.current = nextY;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {tasks.map(task => (
        <div
          key={task.id}
          ref={el => {
            if (el) wrappers.current[task.id] = el;
            else    delete wrappers.current[task.id];
          }}
        >
          <TaskCard
            task={task}
            projects={projects}
            onEdit={onEdit}
            onUpdate={onUpdate}
          />
        </div>
      ))}
    </div>
  );
}
