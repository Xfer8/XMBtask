import { useRef, useLayoutEffect } from "react";
import TaskCard from "../TaskCard";

// ── AnimatedTaskList ────────────────────────────────────────────────────────────
// Renders a sorted list of TaskCards and animates reordering using the FLIP
// technique (First-Last-Invert-Play).
//
// Positions are measured RELATIVE to the container (not absolute viewport).
// This prevents double-translation when AnimatedGroupList is simultaneously
// animating the parent group container — if the whole group moves as a unit,
// each task's position relative to the container stays the same (dy = 0),
// so no task-level animation fires. Only genuine internal reorders animate.

export default function AnimatedTaskList({ tasks, projects, onEdit, onUpdate, gap = "10px" }) {
  const containerRef = useRef(null);
  const wrappers     = useRef({});  // task id → wrapper DOM element
  const prevY        = useRef({});  // task id → relative top from last render

  useLayoutEffect(() => {
    const W = wrappers.current;
    const P = prevY.current;

    // ── Step 1: measure positions relative to this container ─────────────
    const containerTop = containerRef.current?.getBoundingClientRect().top ?? 0;
    const nextY = {};
    Object.entries(W).forEach(([id, el]) => {
      if (el) nextY[id] = el.getBoundingClientRect().top - containerTop;
    });

    // ── Step 2 & 3: FLIP any item that moved within the list ─────────────
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

    // ── Step 4: store relative positions for the next render ─────────────
    prevY.current = nextY;
  });

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap }}>
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
