import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ArtifactView } from "./Artifact";
import type { SplitBucket, SplitTodo } from "./data";
import { TASK_ENTRIES } from "./taskEntries";

const bucketLabels: Record<SplitBucket, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  "this-week": "This week",
  "next-week": "Next week",
  "this-month": "This month",
};

export function TaskDetailModal({
  todo,
  onClose,
}: {
  todo: SplitTodo;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const entries = TASK_ENTRIES[todo.id] ?? [];

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="task-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="task-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <button
          ref={closeRef}
          type="button"
          className="task-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <header className="task-modal-header">
          {(todo.bucket || todo.project) && (
            <div className="task-modal-pills">
              {todo.bucket && (
                <span className="task-modal-bucket-pill">
                  {bucketLabels[todo.bucket]}
                </span>
              )}
              {todo.project && (
                <span className="task-modal-project-pill">{todo.project}</span>
              )}
              {todo.time && (
                <span className="task-modal-time-pill">{todo.time}</span>
              )}
            </div>
          )}
          <h2 id="task-modal-title" className="task-modal-title">
            {todo.title}
          </h2>
          {todo.note && <p className="task-modal-note">{todo.note}</p>}
        </header>

        <section className="task-modal-history">
          <p className="eyebrow">History</p>
          {entries.length === 0 ? (
            <p className="task-modal-empty">Nothing tracked here yet.</p>
          ) : (
            <ol className="task-entry-rail">
              {entries.map((entry, index) => {
                const isLast = index === entries.length - 1;
                return (
                  <li key={entry.id} className="task-entry">
                    <span
                      className={`task-entry-node ${
                        isLast ? "is-current" : ""
                      }`}
                      aria-hidden="true"
                    />
                    <div className="task-entry-card">
                      <div className="task-entry-head">
                        <strong>{entry.label}</strong>
                        {entry.timestamp && <span>{entry.timestamp}</span>}
                      </div>
                      <ArtifactView artifact={entry.artifact} readOnly />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
