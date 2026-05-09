import { CheckSquare, Circle, Clock, Folder, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  SPLIT_PROJECT_ORDER,
  SPLIT_TODOS,
  SplitBucket,
  SplitTodo,
} from "./data";
import { useTaskDetailModal } from "./useTaskDetailModal";

const TIME_SENSITIVE = "Time sensitive";
const NEW_TAB = "new";
const EVERYTHING = "Everything";

type TabId = string;

const bucketLabels: Record<SplitBucket, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  "this-week": "This week",
  "next-week": "Next week",
  "this-month": "This month",
};

const bucketOrder: SplitBucket[] = [
  "today",
  "tomorrow",
  "this-week",
  "next-week",
  "this-month",
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

export default function TabView() {
  const [openTabs, setOpenTabs] = useState<TabId[]>([
    TIME_SENSITIVE,
    "OG Guild",
    NEW_TAB,
  ]);
  const [activeTab, setActiveTab] = useState<TabId>(TIME_SENSITIVE);
  const [recent, setRecent] = useState<TabId[]>([
    "Hiring",
    "Investor update",
    "Housing",
  ]);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const { open: openDetail, modalElement } = useTaskDetailModal(SPLIT_TODOS);

  const toggleChecked = (id: string) =>
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const counts = useMemo(() => {
    const map = new Map<TabId, number>();
    map.set(
      TIME_SENSITIVE,
      SPLIT_TODOS.filter((todo) => todo.bucket).length,
    );
    for (const project of SPLIT_PROJECT_ORDER) {
      map.set(
        project,
        SPLIT_TODOS.filter(
          (todo) => (todo.project ?? EVERYTHING) === project,
        ).length,
      );
    }
    return map;
  }, []);

  const switchTo = (tabId: TabId) => {
    if (tabId === activeTab) return;
    if (activeTab !== NEW_TAB) {
      setRecent((current) => {
        const filtered = current.filter((id) => id !== activeTab);
        return [activeTab, ...filtered].slice(0, 6);
      });
    }
    setActiveTab(tabId);
  };

  const openCategory = (tabId: TabId) => {
    if (!openTabs.includes(tabId)) {
      setOpenTabs((current) => {
        const lastIsNew = current[current.length - 1] === NEW_TAB;
        if (lastIsNew) {
          return [...current.slice(0, -1), tabId, NEW_TAB];
        }
        return [...current, tabId];
      });
    }
    switchTo(tabId);
  };

  const closeTab = (tabId: TabId) => {
    const idx = openTabs.indexOf(tabId);
    if (idx === -1) return;
    const remaining = openTabs.filter((id) => id !== tabId);
    setOpenTabs(remaining);

    if (activeTab === tabId) {
      const fallback =
        remaining[idx - 1] ?? remaining[idx] ?? remaining[0] ?? null;
      if (fallback) {
        setActiveTab(fallback);
      } else {
        setOpenTabs([NEW_TAB]);
        setActiveTab(NEW_TAB);
      }
    }
  };

  const openNewTab = () => {
    if (!openTabs.includes(NEW_TAB)) {
      setOpenTabs((current) => [...current, NEW_TAB]);
    }
    switchTo(NEW_TAB);
  };

  return (
    <div className="app-shell tab-shell">
      <header className="tab-bar" aria-label="Open category tabs">
        <div className="tab-bar-scroll">
          {openTabs.map((tabId) => (
            <TabPill
              key={tabId}
              tabId={tabId}
              isActive={tabId === activeTab}
              count={tabId === NEW_TAB ? undefined : counts.get(tabId) ?? 0}
              onClick={() => switchTo(tabId)}
              onClose={() => closeTab(tabId)}
            />
          ))}
        </div>
        <button
          type="button"
          className="tab-new-button"
          aria-label="Open new tab"
          onClick={openNewTab}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </header>

      <main className="tab-content">
        {activeTab === NEW_TAB ? (
          <NewTabPage
            openTabs={openTabs}
            recent={recent}
            counts={counts}
            onOpen={openCategory}
          />
        ) : activeTab === TIME_SENSITIVE ? (
          <TimeSensitiveTab
            checked={checked}
            onToggle={toggleChecked}
            onProjectClick={openCategory}
            onOpenDetail={openDetail}
          />
        ) : (
          <ProjectTab
            project={activeTab}
            checked={checked}
            onToggle={toggleChecked}
            onOpenDetail={openDetail}
          />
        )}
      </main>
      {modalElement}
    </div>
  );
}

function TabPill({
  tabId,
  isActive,
  count,
  onClick,
  onClose,
}: {
  tabId: TabId;
  isActive: boolean;
  count?: number;
  onClick: () => void;
  onClose: () => void;
}) {
  const label = tabId === NEW_TAB ? "New tab" : tabId;
  const Icon = tabId === TIME_SENSITIVE ? Clock : Folder;
  return (
    <div className={`tab-pill ${isActive ? "is-active" : ""}`}>
      <button
        type="button"
        className="tab-pill-main"
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
      >
        {tabId !== NEW_TAB && (
          <Icon size={13} aria-hidden="true" className="tab-pill-icon" />
        )}
        <span className="tab-pill-label">{label}</span>
        {typeof count === "number" && (
          <span className="tab-pill-count">{count}</span>
        )}
      </button>
      <button
        type="button"
        className="tab-pill-close"
        aria-label={`Close ${label}`}
        onClick={onClose}
      >
        <X size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

function NewTabPage({
  openTabs,
  recent,
  counts,
  onOpen,
}: {
  openTabs: TabId[];
  recent: TabId[];
  counts: Map<TabId, number>;
  onOpen: (tabId: TabId) => void;
}) {
  const recentVisible = recent.filter((id) => id !== NEW_TAB);
  const timeTotal = counts.get(TIME_SENSITIVE) ?? 0;
  const bucketBreakdown = bucketOrder
    .map((bucket) => ({
      key: bucket,
      label: bucketLabels[bucket],
      count: SPLIT_TODOS.filter((todo) => todo.bucket === bucket).length,
    }))
    .filter((b) => b.count > 0);

  return (
    <div className="tab-page new-tab-page">
      <button
        type="button"
        className="time-hero"
        onClick={() => onOpen(TIME_SENSITIVE)}
        aria-label="Open Time sensitive"
      >
        <div className="time-hero-head">
          <Clock
            size={18}
            aria-hidden="true"
            className="time-hero-icon"
          />
          <span className="time-hero-title">Time sensitive</span>
          <span className="time-hero-total">{timeTotal} items</span>
        </div>
        <div className="time-hero-buckets">
          {bucketBreakdown.map((bucket) => (
            <div key={bucket.key} className="time-hero-bucket">
              <span className="time-hero-bucket-count">{bucket.count}</span>
              <span className="time-hero-bucket-label">{bucket.label}</span>
            </div>
          ))}
        </div>
      </button>

      <section className="category-section">
        <h3 className="split-heading">Projects</h3>
        <ul className="category-list">
          {SPLIT_PROJECT_ORDER.map((project) => {
            const isOpen = openTabs.includes(project);
            return (
              <li key={project}>
                <button
                  type="button"
                  className={`category-row ${isOpen ? "is-open" : ""}`}
                  onClick={() => onOpen(project)}
                >
                  <Folder
                    size={16}
                    aria-hidden="true"
                    className="category-row-icon"
                  />
                  <span className="category-row-name">{project}</span>
                  <span className="category-row-meta">
                    <span className="category-row-total">
                      {counts.get(project) ?? 0}
                    </span>
                    <span>open</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {recentVisible.length > 0 && (
        <div className="recent-section">
          <h3 className="split-heading">Recently viewed</h3>
          <div className="recent-row">
            {recentVisible.map((tabId) => {
              const Icon = tabId === TIME_SENSITIVE ? Clock : Folder;
              return (
                <button
                  key={tabId}
                  type="button"
                  className="recent-chip"
                  onClick={() => onOpen(tabId)}
                >
                  <Icon size={13} aria-hidden="true" />
                  <span>{tabId}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeSensitiveTab({
  checked,
  onToggle,
  onProjectClick,
  onOpenDetail,
}: {
  checked: Set<string>;
  onToggle: (id: string) => void;
  onProjectClick: (project: string) => void;
  onOpenDetail: (id: string, trigger: HTMLElement) => void;
}) {
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

  return (
    <div className="tab-page">
      {bucketOrder.map((bucket) => {
        const items = sortByTime(byBucket.get(bucket) ?? []);
        if (items.length === 0) return null;
        return (
          <section key={bucket} className="tab-section">
            <h3 className="split-heading">{bucketLabels[bucket]}</h3>
            <ul className="split-list">
              {items.map((todo) => (
                <TabRow
                  key={todo.id}
                  todo={todo}
                  checked={checked.has(todo.id)}
                  onToggle={() => onToggle(todo.id)}
                  onOpen={(trigger) => onOpenDetail(todo.id, trigger)}
                  showProject
                  onProjectClick={onProjectClick}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ProjectTab({
  project,
  checked,
  onToggle,
  onOpenDetail,
}: {
  project: string;
  checked: Set<string>;
  onToggle: (id: string) => void;
  onOpenDetail: (id: string, trigger: HTMLElement) => void;
}) {
  const items = useMemo(
    () =>
      SPLIT_TODOS.filter(
        (todo) => (todo.project ?? EVERYTHING) === project,
      ),
    [project],
  );

  const subsections = projectSectionOrder
    .map((section) => ({
      ...section,
      items: sortByTime(
        items.filter((todo) => matchesSection(todo, section.key)),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="tab-page">
      <h2 className="tab-project-title">{project}</h2>
      {subsections.length === 0 ? (
        <p className="tab-empty">Nothing here yet.</p>
      ) : (
        subsections.map((section) => (
          <section key={section.key} className="tab-section">
            <h3 className="split-heading">{section.label}</h3>
            <ul className="split-list">
              {section.items.map((todo) => (
                <TabRow
                  key={todo.id}
                  todo={todo}
                  checked={checked.has(todo.id)}
                  onToggle={() => onToggle(todo.id)}
                  onOpen={(trigger) => onOpenDetail(todo.id, trigger)}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function TabRow({
  todo,
  checked,
  onToggle,
  onOpen,
  showBucket = false,
  showProject = false,
  onProjectClick,
}: {
  todo: SplitTodo;
  checked: boolean;
  onToggle: () => void;
  onOpen: (trigger: HTMLElement) => void;
  showBucket?: boolean;
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
        <div className="tab-row-headline">
          <span className="split-title">{todo.title}</span>
          {todo.time && (
            <span className="tab-time-pill">{formatTime(todo.time)}</span>
          )}
          {showBucket && todo.bucket && (
            <span className="tab-bucket-pill">{bucketLabels[todo.bucket]}</span>
          )}
          {showProjectPill && (
            <button
              type="button"
              className="tab-project-pill"
              onClick={(event) => {
                event.stopPropagation();
                onProjectClick?.(todo.project!);
              }}
              aria-label={`Open ${todo.project} tab`}
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
