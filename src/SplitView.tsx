import { CheckSquare, Circle, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  SPLIT_PROJECT_ORDER,
  SPLIT_TODOS,
  SplitBucket,
  SplitTodo,
} from "./data";
import { useTaskDetailModal } from "./useTaskDetailModal";

const EVERYTHING = "Everything";

const bucketSections: Array<{ key: SplitBucket; label: string }> = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "this-week", label: "This week" },
  { key: "next-week", label: "Next week" },
  { key: "this-month", label: "This month" },
];

type ProjectSectionKey = SplitBucket | "tasks";

const projectSectionOrder: Array<{ key: ProjectSectionKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "tasks", label: "Tasks" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "this-week", label: "This week" },
  { key: "next-week", label: "Next week" },
  { key: "this-month", label: "This month" },
];

const sortByTime = (items: SplitTodo[]) =>
  [...items].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });

const formatTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const display = ((h + 11) % 12) + 1;
  return m === 0
    ? `${display} ${period}`
    : `${display}:${m.toString().padStart(2, "0")} ${period}`;
};

const matchesSection = (todo: SplitTodo, key: ProjectSectionKey) =>
  key === "tasks" ? !todo.bucket : todo.bucket === key;

export default function SplitView() {
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [pivotProject, setPivotProject] = useState<string | null>(null);
  const { open: openDetail, modalElement } = useTaskDetailModal(SPLIT_TODOS);

  const toggle = (id: string) =>
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const byBucket = useMemo(() => {
    const map = new Map<SplitBucket, SplitTodo[]>();
    for (const todo of SPLIT_TODOS) {
      if (!todo.bucket) continue;
      const list = map.get(todo.bucket) ?? [];
      list.push(todo);
      map.set(todo.bucket, list);
    }
    return map;
  }, []);

  const byProject = useMemo(() => {
    const map = new Map<string, SplitTodo[]>();
    for (const todo of SPLIT_TODOS) {
      const key = todo.project ?? EVERYTHING;
      const list = map.get(key) ?? [];
      list.push(todo);
      map.set(key, list);
    }
    return map;
  }, []);

  if (pivotProject !== null) {
    const projectItems = byProject.get(pivotProject) ?? [];
    return (
      <div className="app-shell">
        <main className="workspace">
          <section
            className="split-pivot-view"
            aria-label={`${pivotProject} project view`}
          >
            <header className="split-pivot-header">
              <h2 className="split-pivot-title">{pivotProject}</h2>
              <button
                type="button"
                className="split-pivot-close"
                aria-label="Back to split view"
                onClick={() => setPivotProject(null)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>
            <div className="split-pivot-body">
              {projectSectionOrder.map((section) => {
                const items = sortByTime(
                  projectItems.filter((todo) =>
                    matchesSection(todo, section.key),
                  ),
                );
                if (items.length === 0) return null;
                return (
                  <section key={section.key} className="split-section">
                    <h3 className="split-heading">{section.label}</h3>
                    <ul className="split-list">
                      {items.map((todo) => (
                        <SplitRow
                          key={`pivot-${todo.id}`}
                          todo={todo}
                          checked={checked.has(todo.id)}
                          onToggle={() => toggle(todo.id)}
                          onOpen={(trigger) => openDetail(todo.id, trigger)}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </section>
        </main>
        {modalElement}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="workspace">
        <section className="split-view" aria-label="Split todo view">
          <div className="split-column" aria-label="By time">
            {bucketSections.map((section) => {
              const items = sortByTime(byBucket.get(section.key) ?? []);
              if (items.length === 0) return null;
              return (
                <section key={section.key} className="split-section">
                  <h3 className="split-heading">{section.label}</h3>
                  <ul className="split-list">
                    {items.map((todo) => (
                      <SplitRow
                        key={`time-${todo.id}`}
                        todo={todo}
                        checked={checked.has(todo.id)}
                        onToggle={() => toggle(todo.id)}
                        onOpen={(trigger) => openDetail(todo.id, trigger)}
                        showProject
                        onProjectClick={setPivotProject}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="split-column" aria-label="By project">
            {SPLIT_PROJECT_ORDER.map((project) => {
              const projectItems = byProject.get(project) ?? [];
              if (projectItems.length === 0) return null;
              const subsections = projectSectionOrder
                .map((section) => ({
                  ...section,
                  items: sortByTime(
                    projectItems.filter((todo) =>
                      matchesSection(todo, section.key),
                    ),
                  ),
                }))
                .filter((section) => section.items.length > 0);
              if (subsections.length === 0) return null;
              return (
                <section key={project} className="split-section">
                  <h3 className="split-heading">{project}</h3>
                  {subsections.map((section) => (
                    <div key={section.key} className="split-subsection">
                      <h4 className="split-subheading">{section.label}</h4>
                      <ul className="split-list">
                        {section.items.map((todo) => (
                          <SplitRow
                            key={`proj-${project}-${section.key}-${todo.id}`}
                            todo={todo}
                            checked={checked.has(todo.id)}
                            onToggle={() => toggle(todo.id)}
                            onOpen={(trigger) => openDetail(todo.id, trigger)}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        </section>
      </main>
      {modalElement}
    </div>
  );
}

function SplitRow({
  todo,
  checked,
  onToggle,
  onOpen,
  showProject = false,
  onProjectClick,
}: {
  todo: SplitTodo;
  checked: boolean;
  onToggle: () => void;
  onOpen: (trigger: HTMLElement) => void;
  showProject?: boolean;
  onProjectClick?: (project: string) => void;
}) {
  const showProjectPill =
    showProject && !!todo.project && todo.project !== EVERYTHING;
  return (
    <li
      className={`split-row is-clickable ${checked ? "is-checked" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${todo.title}`}
      onClick={(event) => onOpen(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(event.currentTarget);
        }
      }}
    >
      <button
        type="button"
        className="split-check"
        aria-pressed={checked}
        aria-label={checked ? "Mark as not done" : "Mark as done"}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        {checked ? (
          <CheckSquare size={14} aria-hidden="true" />
        ) : (
          <Circle size={14} aria-hidden="true" />
        )}
      </button>
      <div className="split-text">
        <div className="split-row-headline">
          <span className="split-title">{todo.title}</span>
          {todo.time && (
            <span className="split-time-pill">{formatTime(todo.time)}</span>
          )}
          {showProjectPill && (
            <button
              type="button"
              className="split-project-pill"
              onClick={(event) => {
                event.stopPropagation();
                onProjectClick?.(todo.project!);
              }}
              aria-label={`Open ${todo.project} project view`}
            >
              {todo.project}
            </button>
          )}
        </div>
        {todo.note && <span className="split-note">{todo.note}</span>}
      </div>
    </li>
  );
}
