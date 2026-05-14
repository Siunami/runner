import {
  AlertCircle,
  AlertOctagon,
  ArchiveX,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Inbox,
  PauseCircle,
  PlayCircle,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { RunnerActionCard } from "./RunnerActionCard";
import type {
  MonitorTriggerKind,
  ProjectKey,
  ResolutionKind,
  RunnerActionCard as Card,
  RunnerTodo,
  TimeSensitivity,
  VisibleIcon,
} from "./runnerData";

// ──────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────────────────────────────────────

const projectKeyByLabel: Record<string, ProjectKey> = {
  "Investor update": "investor",
  Travel: "travel",
  Platform: "platform",
  Personal: "personal",
  Inbox: "inbox",
  Sales: "sales",
  "Board Prep": "board",
  "749 Guerrero": "rent",
  Analytics: "platform",
};

export const ALL_FILTER = "__all__";
export const UNLABELED_FILTER = "__unlabeled__";

export type FilterValue = string;

function StateIcon({ icon, size = 16 }: { icon: VisibleIcon; size?: number }) {
  if (icon === "attention") {
    return (
      <span className="runner-state-icon attention" aria-label="Needs your attention">
        <AlertCircle size={size} aria-hidden="true" />
      </span>
    );
  }
  if (icon === "blocked") {
    return (
      <span className="runner-state-icon blocked" aria-label="Stuck">
        <AlertOctagon size={size} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="runner-state-icon waiting" aria-label="Runner is working">
      <Clock size={size} aria-hidden="true" />
    </span>
  );
}

function ProjectPill({
  project,
  projectKey,
  size = "md",
  onClick,
}: {
  project?: string;
  projectKey?: ProjectKey;
  size?: "sm" | "md";
  onClick?: (value: string) => void;
}) {
  if (!project) {
    if (onClick) {
      return (
        <button
          type="button"
          className={`project-pill kind-unlabeled size-${size} is-clickable`}
          onClick={(event) => {
            event.stopPropagation();
            onClick(UNLABELED_FILTER);
          }}
        >
          Unlabeled
        </button>
      );
    }
    return <span className={`project-pill kind-unlabeled size-${size}`}>Unlabeled</span>;
  }
  const key = projectKey ?? projectKeyByLabel[project] ?? "personal";
  if (onClick) {
    return (
      <button
        type="button"
        className={`project-pill kind-${key} size-${size} is-clickable`}
        onClick={(event) => {
          event.stopPropagation();
          onClick(project);
        }}
      >
        {project}
      </button>
    );
  }
  return <span className={`project-pill kind-${key} size-${size}`}>{project}</span>;
}

const timeSensitivityLabel: Record<Exclude<TimeSensitivity, "none">, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  "this-week": "This week",
  "next-week": "Next week",
  "this-month": "This month",
};

function TimeMeta({ value }: { value?: TimeSensitivity }) {
  if (!value || value === "none") return null;
  return (
    <span className={`runner-time-meta kind-${value}`}>
      {timeSensitivityLabel[value]}
    </span>
  );
}

export function TriggerIcon({
  kind,
  size = 12,
}: {
  kind?: MonitorTriggerKind;
  size?: number;
}) {
  if (kind === "calendar") {
    return (
      <CalendarClock
        size={size}
        aria-hidden="true"
        className="runner-trigger-icon"
      />
    );
  }
  if (kind === "event") {
    return (
      <Bell size={size} aria-hidden="true" className="runner-trigger-icon" />
    );
  }
  return (
    <Clock size={size} aria-hidden="true" className="runner-trigger-icon" />
  );
}

function applyFilter(todos: RunnerTodo[], filter: FilterValue): RunnerTodo[] {
  if (filter === ALL_FILTER) return todos;
  if (filter === UNLABELED_FILTER) return todos.filter((t) => !t.project);
  return todos.filter((t) => t.project === filter);
}

type TimeBucketKey = "today" | "tasks" | "later";

const TIME_BUCKETS: Array<{ key: TimeBucketKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "tasks", label: "Tasks" },
  { key: "later", label: "Later" },
];

function matchesTimeBucket(todo: RunnerTodo, key: TimeBucketKey): boolean {
  const ts = todo.timeSensitivity;
  if (key === "today") return ts === "today";
  if (key === "tasks") return !ts || ts === "none";
  if (key === "later") {
    return ts !== undefined && ts !== "none" && ts !== "today";
  }
  return false;
}

const laterOrder: Record<Exclude<TimeSensitivity, "none" | "today">, number> = {
  tomorrow: 0,
  "this-week": 1,
  "next-week": 2,
  "this-month": 3,
};

function laterPriority(a: RunnerTodo, b: RunnerTodo): number {
  const ai = laterOrder[a.timeSensitivity as Exclude<TimeSensitivity, "none" | "today">] ?? 99;
  const bi = laterOrder[b.timeSensitivity as Exclude<TimeSensitivity, "none" | "today">] ?? 99;
  if (ai !== bi) return ai - bi;
  return rowPriority(a, b);
}

// Today is 2026-05-11. Derive a plausible date for items whose deadline isn't
// in the seed data, so the user has something concrete for orientation.
const TODAY = new Date(2026, 4, 11);
function deriveDate(todo: RunnerTodo): Date | null {
  const ts = todo.timeSensitivity;
  if (!ts || ts === "none" || ts === "today") return null;
  let hash = 0;
  for (let i = 0; i < todo.id.length; i++) hash = (hash * 31 + todo.id.charCodeAt(i)) >>> 0;
  const offsets: Record<Exclude<TimeSensitivity, "none" | "today">, [number, number]> = {
    tomorrow: [1, 1],
    "this-week": [2, 6],
    "next-week": [8, 14],
    "this-month": [16, 28],
  };
  const [min, max] = offsets[ts];
  const offset = min + (hash % (max - min + 1));
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return d;
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dueLabelFor(todo: RunnerTodo): string | undefined {
  if (todo.deadline) return todo.deadline;
  const d = deriveDate(todo);
  if (!d) return undefined;
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
}

// Within a time bucket: blocked first, then needs-you, then runner-working /
// monitoring / stale. Keeps the most urgent item near the top of each section.
function rowPriority(a: RunnerTodo, b: RunnerTodo): number {
  const order: Record<string, number> = {
    blocked: 0,
    "needs-you": 1,
    "runner-working": 2,
    monitoring: 3,
    stale: 4,
  };
  return (order[a.status] ?? 5) - (order[b.status] ?? 5);
}

function EmptyState({ icon: Icon, message }: { icon: typeof Inbox; message: string }) {
  return (
    <div className="runner-empty-state">
      <Icon size={18} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// usePhasedList — tracks "entering" and "leaving" so the row can animate in/out.
// Caller renders these entries and applies CSS based on phase. Departed items
// stay in the returned list for `duration` ms so the exit animation can play.
// ──────────────────────────────────────────────────────────────────────────────
type Phase = "active" | "entering" | "leaving";

function usePhasedList<T extends { id: string }>(
  items: T[],
  duration = 450,
): Array<{ item: T; phase: Phase }> {
  type Entry = { item: T; phase: Phase };
  const [phased, setPhased] = useState<Entry[]>(() =>
    items.map((item) => ({ item, phase: "active" as const })),
  );

  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id));

    setPhased((prev) => {
      const activeIds = new Set(
        prev.filter((p) => p.phase !== "leaving").map((p) => p.item.id),
      );

      const next: Entry[] = [];

      items.forEach((item) => {
        const wasActive = activeIds.has(item.id);
        next.push({ item, phase: wasActive ? "active" : "entering" });
      });

      prev.forEach((p) => {
        if (currentIds.has(p.item.id)) return;
        if (p.phase === "leaving") {
          next.push(p);
        } else {
          next.push({ item: p.item, phase: "leaving" });
        }
      });

      return next;
    });
  }, [items]);

  useEffect(() => {
    if (!phased.some((p) => p.phase === "entering" || p.phase === "leaving")) {
      return;
    }
    const timer = setTimeout(() => {
      setPhased((prev) =>
        prev
          .filter((p) => p.phase !== "leaving")
          .map((p) => (p.phase === "entering" ? { ...p, phase: "active" } : p)),
      );
    }, duration);
    return () => clearTimeout(timer);
  }, [phased, duration]);

  return phased;
}

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────────────────────────────────────

export function DashboardView({
  todos,
  recentlyAdvanced,
  recentlySpawnedId,
  onOpen,
  onArchive,
  onResolveCard,
  onFilterByProject,
}: {
  todos: RunnerTodo[];
  recentlyAdvanced: { id: string; title: string; note: string; ago: string }[];
  recentlySpawnedId?: string | null;
  onOpen: (id: string) => void;
  onArchive: (id: string) => void;
  onResolveCard: (
    todoId: string,
    cardId: string,
    kind: ResolutionKind,
    note?: string,
  ) => void;
  onFilterByProject: (project: string) => void;
}) {
  const visibleTodos = useMemo(
    () => todos.filter((t) => t.status !== "archived"),
    [todos],
  );

  // Dashboard inbox: today, blocked, or untriaged (no date).
  // This-week items live only in the list view.
  const inboxItems = useMemo(
    () =>
      visibleTodos
        .filter((t) => {
          if (t.status === "blocked") return true;
          if (t.status !== "needs-you") return false;
          const s = t.timeSensitivity ?? "none";
          return s === "today" || s === "none";
        })
        .sort((a, b) => inboxPriority(a) - inboxPriority(b)),
    [visibleTodos],
  );

  const inFlight = useMemo(
    () =>
      visibleTodos.filter(
        (t) =>
          t.status === "runner-working" ||
          t.status === "monitoring" ||
          t.cards.some((c) => c.state === "in-progress"),
      ),
    [visibleTodos],
  );

  const phasedInbox = usePhasedList(inboxItems);
  const phasedInFlight = usePhasedList(inFlight);

  return (
    <div className="dashboard">
      <section className="inbox">
        <header className="inbox-heading">
          <h2>Inbox</h2>
          <span className="inbox-count">{inboxItems.length}</span>
        </header>
        {phasedInbox.length === 0 ? (
          <EmptyState icon={CheckCircle2} message="Inbox zero." />
        ) : (
          <ul className="inbox-list">
            {phasedInbox.map(({ item: todo, phase }) => (
              <InboxRow
                key={todo.id}
                todo={todo}
                phase={phase}
                onOpen={onOpen}
                onArchive={onArchive}
                onProjectClick={onFilterByProject}
                onResolveCard={onResolveCard}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="dashboard-rails">
        <section className="rail">
          <header className="rail-heading">
            <h3>In progress</h3>
            <span className="rail-count">{inFlight.length}</span>
          </header>
          {phasedInFlight.length === 0 ? (
            <p className="rail-empty">Nothing in progress.</p>
          ) : (
            <ul className="rail-list">
              {phasedInFlight.map(({ item: todo, phase }) => (
                <RailGroupRow
                  key={todo.id}
                  todo={todo}
                  phase={phase}
                  isRecentlySpawned={recentlySpawnedId === todo.id}
                  onOpen={onOpen}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="rail">
          <header className="rail-heading">
            <h3>Lately</h3>
            <span className="rail-count">{recentlyAdvanced.length}</span>
          </header>
          <ul className="rail-list">
            {recentlyAdvanced.map((entry) => (
              <li key={entry.id} className="advance-row">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span className="advance-row-title">{entry.title}</span>
                <span className="advance-row-note">{entry.note}</span>
                <span className="advance-row-ago">{entry.ago}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// RailGroupRow — a todo title + the in-progress cards beneath it.
// Each card gets a pulsing dot. The whole group animates in/out via phase.
// ──────────────────────────────────────────────────────────────────────────────
function RailGroupRow({
  todo,
  phase,
  isRecentlySpawned,
  onOpen,
}: {
  todo: RunnerTodo;
  phase: Phase;
  isRecentlySpawned?: boolean;
  onOpen: (id: string) => void;
}) {
  const inProgressCards = todo.cards.filter((c) => c.state === "in-progress");
  const phasedActions = usePhasedList(inProgressCards, 480);

  // Only apply the "just spawned" highlight when the group ISN'T already
  // doing its entering animation (which already highlights).
  const shouldHighlight = isRecentlySpawned && phase !== "entering";

  return (
    <li
      className={`rail-row-host ${phase === "entering" ? "is-entering" : ""} ${phase === "leaving" ? "is-leaving" : ""} ${shouldHighlight ? "is-just-spawned" : ""}`}
    >
      <div className="rail-group">
        <button
          type="button"
          className="rail-group-header"
          onClick={() => onOpen(todo.id)}
        >
          <StateIcon icon={todo.icon} size={13} />
          <span className="rail-group-title">{todo.title}</span>
          {inProgressCards.length > 0 && (
            <span className="rail-group-count">
              {inProgressCards.length} {inProgressCards.length === 1 ? "action" : "actions"}
            </span>
          )}
        </button>
        {phasedActions.length === 0 ? (
          <p className="rail-group-empty">{todo.runnerStatus}</p>
        ) : (
          <ul className="rail-group-actions">
            {phasedActions.map(({ item: card, phase: cardPhase }) => (
              <li
                key={card.id}
                className={`rail-action ${cardPhase === "entering" ? "is-entering" : ""} ${cardPhase === "leaving" ? "is-leaving" : ""}`}
              >
                <span className="rail-action-dot" aria-hidden="true" />
                <div className="rail-action-body">
                  <span className="rail-action-text">{card.title}</span>
                  {card.progress?.currently && (
                    <span className="rail-action-currently">
                      {card.progress.currently}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

// Inbox priority: today first, then blocked, then untriaged.
function inboxPriority(t: RunnerTodo): number {
  if (t.timeSensitivity === "today") return 0;
  if (t.status === "blocked") return 1;
  return 2;
}

function InboxRow({
  todo,
  phase,
  onOpen,
  onArchive,
  onProjectClick,
  onResolveCard,
}: {
  todo: RunnerTodo;
  phase: Phase;
  onOpen: (id: string) => void;
  onArchive: (id: string) => void;
  onProjectClick?: (project: string) => void;
  onResolveCard: (
    todoId: string,
    cardId: string,
    kind: ResolutionKind,
    note?: string,
  ) => void;
}) {
  const [resolving, setResolving] = useState<{ note?: string } | null>(null);

  // If the row's underlying todo gets a new open card after a resolve (multi-card
  // todos), clear the flash so the next card renders.
  useEffect(() => {
    if (!resolving) return;
    const stillHasOpenCards = todo.cards.some((c) => c.state === "open");
    if (!stillHasOpenCards) return;
    const t = setTimeout(() => setResolving(null), 600);
    return () => clearTimeout(t);
  }, [resolving, todo.cards]);

  const handleResolve = (cardId: string, kind: ResolutionKind, note?: string) => {
    setResolving({ note });
    setTimeout(() => onResolveCard(todo.id, cardId, kind, note), 320);
  };

  const openCards = todo.cards.filter((c) => c.state === "open");
  const inProgressCount = todo.cards.filter((c) => c.state === "in-progress").length;
  const primaryCard = openCards[0];
  const moreCount = Math.max(0, openCards.length - 1);

  const isLeaving = phase === "leaving";
  const isEntering = phase === "entering";

  return (
    <li
      className={`inbox-row ${isLeaving ? "is-leaving" : ""} ${isEntering ? "is-entering" : ""} ${resolving ? "is-resolving" : ""}`}
    >
      <header className="inbox-row-header">
        <StateIcon icon={todo.icon} size={16} />
        <button
          type="button"
          className="inbox-row-title-button"
          onClick={() => onOpen(todo.id)}
          disabled={isLeaving}
        >
          <span className="inbox-row-title">{todo.title}</span>
        </button>
        {inProgressCount > 0 && (
          <button
            type="button"
            className="inbox-row-inflight"
            onClick={() => onOpen(todo.id)}
            disabled={isLeaving}
            aria-label={`${inProgressCount} in progress on this todo`}
            title="Runner is working on this todo — click to view"
          >
            <span className="inbox-row-inflight-dot" aria-hidden="true" />
            <span className="inbox-row-inflight-text">
              {inProgressCount} in progress
            </span>
          </button>
        )}
        <ProjectPill
          project={todo.project}
          projectKey={todo.projectKey}
          size="sm"
          onClick={isLeaving ? undefined : onProjectClick}
        />
        <TimeMeta value={todo.timeSensitivity} />
        <button
          type="button"
          className="inbox-row-archive"
          aria-label={`Archive ${todo.title}`}
          onClick={() => onArchive(todo.id)}
          disabled={isLeaving}
        >
          <ArchiveX size={13} aria-hidden="true" />
        </button>
      </header>

      <div className="inbox-row-content">
        {resolving ? (
          <div className="inbox-row-confirmation" role="status">
            <CheckCircle2 size={14} aria-hidden="true" />
            <span className="inbox-row-confirmation-label">
              {resolving.note ?? "Done"}
            </span>
            <span className="inbox-row-confirmation-hint">moving to In progress</span>
          </div>
        ) : primaryCard ? (
          <div className="inbox-row-card">
            <RunnerActionCard
              card={primaryCard}
              onResolve={handleResolve}
              compact
            />
          </div>
        ) : (
          todo.consequence && (
            <p
              className={`inbox-row-consequence ${
                todo.status === "blocked" ? "is-blocked" : ""
              }`}
            >
              {todo.consequence}
            </p>
          )
        )}
      </div>

      <footer className="inbox-row-footer">
        {moreCount > 0 && !resolving && (
          <button
            type="button"
            className="inbox-row-more"
            onClick={() => onOpen(todo.id)}
            disabled={isLeaving}
          >
            + {moreCount} more {moreCount === 1 ? "card" : "cards"}
          </button>
        )}
        <button
          type="button"
          className="inbox-row-detail"
          onClick={() => onOpen(todo.id)}
          disabled={isLeaving}
        >
          View details
          <ArrowRight size={12} aria-hidden="true" />
        </button>
      </footer>
    </li>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// List
// ──────────────────────────────────────────────────────────────────────────────

type GroupingMode = "time-buckets" | "by-date";

const dateOrderIndex: Record<Exclude<TimeSensitivity, "none">, number> = {
  today: 0,
  tomorrow: 1,
  "this-week": 2,
  "next-week": 3,
  "this-month": 4,
};

function DateBadge({ todo }: { todo: RunnerTodo }) {
  const label =
    todo.deadline ??
    (todo.timeSensitivity && todo.timeSensitivity !== "none"
      ? timeSensitivityLabel[todo.timeSensitivity]
      : null);
  if (!label) return null;
  const kind =
    todo.timeSensitivity && todo.timeSensitivity !== "none"
      ? todo.timeSensitivity
      : "none";
  return (
    <span className={`runner-row-date kind-${kind}`}>{label}</span>
  );
}

export function ListView({
  todos,
  filter,
  onFilterChange,
  onOpen,
  onArchive,
  onAddTodo,
  onTogglePauseMonitor,
  showLabels = true,
  watchingRail,
  filterSlot,
  subscribeCta,
  groupingMode = "time-buckets",
  showCapture = true,
  subscriptionsByTodoId,
  rowAction,
  emptyMessage,
}: {
  todos: RunnerTodo[];
  filter: FilterValue;
  onFilterChange: (v: FilterValue) => void;
  onOpen: (id: string) => void;
  onArchive: (id: string) => void;
  onAddTodo: (title: string) => void;
  onTogglePauseMonitor?: (id: string) => void;
  showLabels?: boolean;
  watchingRail?: ReactNode;
  filterSlot?: ReactNode;
  subscribeCta?: ReactNode;
  groupingMode?: GroupingMode;
  showCapture?: boolean;
  subscriptionsByTodoId?: Record<string, { id: string; name: string }[]>;
  rowAction?: (todo: RunnerTodo) => ReactNode;
  emptyMessage?: string;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [captureInput, setCaptureInput] = useState("");

  const filtered = useMemo(
    () => (groupingMode === "by-date" ? todos : applyFilter(todos, filter)),
    [todos, filter, groupingMode],
  );

  const active = filtered.filter((t) => t.status !== "archived");
  const archived = filtered.filter((t) => t.status === "archived");

  // Monitors live in their own footer section, not in the main flow.
  const nonMonitorActive = useMemo(
    () => active.filter((t) => t.status !== "monitoring"),
    [active],
  );

  // Build a title map so child todos can show "From {monitor.title}" attribution.
  const monitorTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    todos.forEach((t) => {
      if (t.status === "monitoring") map[t.id] = t.title;
    });
    return map;
  }, [todos]);

  // Count unresolved spawned children per monitor for the footer badge.
  const activeChildrenByMonitorId = useMemo(() => {
    const counts: Record<string, number> = {};
    nonMonitorActive.forEach((t) => {
      if (t.spawnedFromMonitorId) {
        counts[t.spawnedFromMonitorId] = (counts[t.spawnedFromMonitorId] ?? 0) + 1;
      }
    });
    return counts;
  }, [nonMonitorActive]);

  const monitors = useMemo(() => {
    const ms = active.filter((t) => t.status === "monitoring");
    return ms.sort((a, b) => {
      const aChildren = activeChildrenByMonitorId[a.id] ?? 0;
      const bChildren = activeChildrenByMonitorId[b.id] ?? 0;
      // active-with-child first, then active, then paused last
      const aRank = a.paused ? 2 : aChildren > 0 ? 0 : 1;
      const bRank = b.paused ? 2 : bChildren > 0 ? 0 : 1;
      return aRank - bRank;
    });
  }, [active, activeChildrenByMonitorId]);

  const monitorsWithUpdates = monitors.reduce(
    (sum, m) => sum + (activeChildrenByMonitorId[m.id] ?? 0),
    0,
  );

  const timeBuckets = useMemo(() => {
    if (groupingMode !== "time-buckets") return [];
    return TIME_BUCKETS.map((bucket) => {
      const items = nonMonitorActive.filter((todo) =>
        matchesTimeBucket(todo, bucket.key),
      );
      items.sort(bucket.key === "later" ? laterPriority : rowPriority);
      return { ...bucket, items };
    }).filter((bucket) => bucket.items.length > 0);
  }, [nonMonitorActive, groupingMode]);

  const byDateSplit = useMemo(() => {
    if (groupingMode !== "by-date") return { dated: [], anytime: [] };
    const dated: RunnerTodo[] = [];
    const anytime: RunnerTodo[] = [];
    nonMonitorActive.forEach((t) => {
      if (t.timeSensitivity && t.timeSensitivity !== "none") dated.push(t);
      else anytime.push(t);
    });
    dated.sort((a, b) => {
      const ai = dateOrderIndex[a.timeSensitivity as Exclude<TimeSensitivity, "none">] ?? 99;
      const bi = dateOrderIndex[b.timeSensitivity as Exclude<TimeSensitivity, "none">] ?? 99;
      if (ai !== bi) return ai - bi;
      return rowPriority(a, b);
    });
    anytime.sort(rowPriority);
    return { dated, anytime };
  }, [nonMonitorActive, groupingMode]);

  const handleCapture = (event: FormEvent) => {
    event.preventDefault();
    const title = captureInput.trim();
    if (!title) return;
    onAddTodo(title);
    setCaptureInput("");
  };

  const isFiltered = groupingMode === "time-buckets" && filter !== ALL_FILTER;
  const filterLabel = filter === UNLABELED_FILTER ? "Unlabeled" : filter;

  const handleProjectClick = (project: string) => {
    onFilterChange(filter === project ? ALL_FILTER : project);
  };

  return (
    <div className="runner-list">
      {showCapture && (
        <form className="runner-fast-capture" onSubmit={handleCapture}>
          <Plus size={14} aria-hidden="true" />
          <input
            type="text"
            className="runner-fast-capture-input"
            placeholder="Add a todo…"
            value={captureInput}
            onChange={(event) => setCaptureInput(event.target.value)}
            aria-label="Capture a new todo"
          />
          <button
            type="submit"
            className="runner-fast-capture-submit"
            disabled={captureInput.trim().length === 0}
          >
            Add
          </button>
        </form>
      )}

      {filterSlot}
      {subscribeCta}

      {isFiltered && (
        <div className="list-filter-banner">
          <span>
            Filtered by <strong>{filterLabel}</strong>
          </span>
          <button
            type="button"
            className="list-filter-clear"
            onClick={() => onFilterChange(ALL_FILTER)}
          >
            Clear
          </button>
        </div>
      )}

      {watchingRail}

      {groupingMode === "time-buckets" ? (
        timeBuckets.length === 0 ? (
          <EmptyState icon={Inbox} message={emptyMessage ?? "Nothing to show."} />
        ) : (
          timeBuckets.map((bucket) => (
            <section key={bucket.key} className="runner-list-group">
              <header className="runner-list-group-heading">
                <span>{bucket.label}</span>
                <span className="dashboard-section-count">{bucket.items.length}</span>
              </header>
              <div className="runner-rows">
                {bucket.items.map((todo) => (
                  <RunnerRow
                    key={todo.id}
                    todo={todo}
                    onOpen={onOpen}
                    onArchive={onArchive}
                    onProjectClick={handleProjectClick}
                    subscriptions={subscriptionsByTodoId?.[todo.id]}
                    customAction={rowAction?.(todo)}
                    dueLabel={bucket.key === "later" ? dueLabelFor(todo) : undefined}
                    fromMonitorLabel={
                      todo.spawnedFromMonitorId
                        ? monitorTitleById[todo.spawnedFromMonitorId]
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          ))
        )
      ) : byDateSplit.dated.length === 0 && byDateSplit.anytime.length === 0 ? (
        <EmptyState icon={Inbox} message={emptyMessage ?? "Nothing to show."} />
      ) : (
        <>
          {byDateSplit.dated.length > 0 && (
            <section className="runner-list-group">
              <header className="runner-list-group-heading">
                <span>Tasks</span>
                <span className="dashboard-section-count">
                  {byDateSplit.dated.length}
                </span>
              </header>
              <div className="runner-rows">
                {byDateSplit.dated.map((todo) => (
                  <RunnerRow
                    key={todo.id}
                    todo={todo}
                    onOpen={onOpen}
                    onArchive={onArchive}
                    onProjectClick={showLabels ? handleProjectClick : undefined}
                    showLabels={showLabels}
                    dateBadge={<DateBadge todo={todo} />}
                    subscriptions={subscriptionsByTodoId?.[todo.id]}
                    customAction={rowAction?.(todo)}
                    fromMonitorLabel={
                      todo.spawnedFromMonitorId
                        ? monitorTitleById[todo.spawnedFromMonitorId]
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )}
          {byDateSplit.anytime.length > 0 && (
            <section className="runner-list-group">
              <header className="runner-list-group-heading">
                <span>Anytime</span>
                <span className="dashboard-section-count">
                  {byDateSplit.anytime.length}
                </span>
              </header>
              <div className="runner-rows">
                {byDateSplit.anytime.map((todo) => (
                  <RunnerRow
                    key={todo.id}
                    todo={todo}
                    onOpen={onOpen}
                    onArchive={onArchive}
                    onProjectClick={showLabels ? handleProjectClick : undefined}
                    showLabels={showLabels}
                    subscriptions={subscriptionsByTodoId?.[todo.id]}
                    customAction={rowAction?.(todo)}
                    fromMonitorLabel={
                      todo.spawnedFromMonitorId
                        ? monitorTitleById[todo.spawnedFromMonitorId]
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {monitors.length > 0 && (
        <section className="runner-list-group">
          <button
            type="button"
            className="runner-list-group-heading is-toggle"
            onClick={() => setShowMonitoring((v) => !v)}
            aria-expanded={showMonitoring}
          >
            {showMonitoring ? (
              <ChevronDown size={14} aria-hidden="true" />
            ) : (
              <ChevronRight size={14} aria-hidden="true" />
            )}
            <Eye size={13} aria-hidden="true" className="runner-list-group-eye" />
            <span>Monitoring</span>
            <span className="dashboard-section-count">{monitors.length}</span>
            {monitorsWithUpdates > 0 && (
              <span className="runner-monitoring-updates">
                {monitorsWithUpdates} update{monitorsWithUpdates > 1 ? "s" : ""}
              </span>
            )}
          </button>
          {showMonitoring && (
            <div className="runner-rows">
              {monitors.map((todo) => (
                <RunnerRow
                  key={todo.id}
                  todo={todo}
                  onOpen={onOpen}
                  onArchive={onArchive}
                  onProjectClick={showLabels ? handleProjectClick : undefined}
                  showLabels={showLabels}
                  monitorIcon
                  nextTriggerLabel={todo.nextTrigger}
                  paused={todo.paused}
                  activeChildCount={activeChildrenByMonitorId[todo.id] ?? 0}
                  onTogglePauseMonitor={onTogglePauseMonitor}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {archived.length > 0 && (
        <section className="runner-list-group">
          <button
            type="button"
            className="runner-list-group-heading is-toggle"
            onClick={() => setShowArchived((v) => !v)}
            aria-expanded={showArchived}
          >
            {showArchived ? (
              <ChevronDown size={14} aria-hidden="true" />
            ) : (
              <ChevronRight size={14} aria-hidden="true" />
            )}
            <span>Archived</span>
            <span className="dashboard-section-count">{archived.length}</span>
          </button>
          {showArchived && (
            <div className="runner-rows">
              {archived.map((todo) => (
                <RunnerRow
                  key={todo.id}
                  todo={todo}
                  onOpen={onOpen}
                  onArchive={onArchive}
                  archived
                  showLabels={showLabels}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function RunnerRow({
  todo,
  onOpen,
  onArchive,
  onProjectClick,
  archived,
  showLabels = true,
  dateBadge,
  monitorIcon = false,
  subscriptions,
  customAction,
  dueLabel,
  nextTriggerLabel,
  paused,
  activeChildCount = 0,
  fromMonitorLabel,
  onTogglePauseMonitor,
}: {
  todo: RunnerTodo;
  onOpen: (id: string) => void;
  onArchive: (id: string) => void;
  onProjectClick?: (project: string) => void;
  archived?: boolean;
  showLabels?: boolean;
  dateBadge?: ReactNode;
  monitorIcon?: boolean;
  subscriptions?: { id: string; name: string }[];
  customAction?: ReactNode;
  dueLabel?: string;
  nextTriggerLabel?: string;
  paused?: boolean;
  activeChildCount?: number;
  fromMonitorLabel?: string;
  onTogglePauseMonitor?: (id: string) => void;
}) {
  const isMonitor = monitorIcon;
  const rowClasses = [
    "runner-row",
    "is-clickable",
    archived ? "is-archived" : "",
    isMonitor && paused ? "is-monitor-paused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rowClasses}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(todo.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(todo.id);
        }
      }}
    >
      <StateIcon icon={archived ? "waiting" : todo.icon} />
      {dateBadge}
      <div className="runner-row-body">
        <div className="runner-row-headline">
          {monitorIcon && (
            <span className="runner-row-monitor-icon" aria-hidden="true">
              <Eye size={13} />
            </span>
          )}
          <span className="runner-row-title">{todo.title}</span>
          {showLabels && (
            <ProjectPill
              project={todo.project}
              projectKey={todo.projectKey}
              size="sm"
              onClick={archived ? undefined : onProjectClick}
            />
          )}
          {fromMonitorLabel && (
            <span className="runner-row-from-monitor" title={`From ${fromMonitorLabel}`}>
              <Eye size={10} aria-hidden="true" />
              From {fromMonitorLabel}
            </span>
          )}
          {activeChildCount > 0 && (
            <span className="runner-row-child-badge">
              {activeChildCount} update{activeChildCount > 1 ? "s" : ""}
            </span>
          )}
          {subscriptions && subscriptions.length > 0 && (
            <span className="runner-row-subs">
              {subscriptions.map((sub) => (
                <span key={sub.id} className="runner-row-sub-chip">
                  {sub.name}
                </span>
              ))}
            </span>
          )}
          {dueLabel && (
            <span className="runner-row-due">
              <CalendarClock size={11} aria-hidden="true" />
              {dueLabel}
            </span>
          )}
          {isMonitor && nextTriggerLabel && !paused && (
            <span className="runner-row-next-check">
              <CalendarClock size={11} aria-hidden="true" />
              Next check: {nextTriggerLabel}
            </span>
          )}
          {isMonitor && paused && (
            <span className="runner-row-paused-label">Paused</span>
          )}
        </div>
        <span className="runner-row-status">{todo.runnerStatus}</span>
      </div>
      {customAction ??
        (!archived &&
          (isMonitor && onTogglePauseMonitor ? (
            <button
              type="button"
              className="runner-archive-btn"
              aria-label={`${paused ? "Resume" : "Pause"} ${todo.title}`}
              title={paused ? "Resume monitor" : "Pause monitor"}
              onClick={(event) => {
                event.stopPropagation();
                onTogglePauseMonitor(todo.id);
              }}
            >
              {paused ? (
                <PlayCircle size={14} aria-hidden="true" />
              ) : (
                <PauseCircle size={14} aria-hidden="true" />
              )}
            </button>
          ) : (
            <button
              type="button"
              className="runner-archive-btn"
              aria-label={`Archive ${todo.title}`}
              onClick={(event) => {
                event.stopPropagation();
                onArchive(todo.id);
              }}
            >
              <ArchiveX size={14} aria-hidden="true" />
            </button>
          )))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Detail
// ──────────────────────────────────────────────────────────────────────────────

export function DetailView({
  todo,
  onBack,
  backLabel,
  onResolveCard,
  onChat,
  onArchive,
  onTogglePauseMonitor,
  subscriptionsForTodo,
  availableSubscriptions,
  onAddTodoToSubscription,
  onRemoveTodoFromSubscription,
}: {
  todo: RunnerTodo;
  onBack: () => void;
  backLabel: string;
  onResolveCard: (todoId: string, cardId: string, kind: ResolutionKind, note?: string) => void;
  onChat: (todoId: string, prompt: string) => void;
  onArchive: (id: string) => void;
  onTogglePauseMonitor?: (id: string) => void;
  subscriptionsForTodo?: { id: string; name: string }[];
  availableSubscriptions?: { id: string; name: string }[];
  onAddTodoToSubscription?: (subId: string) => void;
  onRemoveTodoFromSubscription?: (subId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeAnchorRef = useRef<HTMLDivElement | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ id: string; role: "user" | "runner"; body: string }[]>([]);
  const [subPickerOpen, setSubPickerOpen] = useState(false);
  const subPickerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!subPickerOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!subPickerRef.current) return;
      if (!subPickerRef.current.contains(event.target as Node)) {
        setSubPickerOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [subPickerOpen]);
  const memberIds = new Set((subscriptionsForTodo ?? []).map((s) => s.id));

  const orderedCards = useMemo(() => {
    const resolved = todo.cards.filter((c) => c.state === "resolved");
    const inProgress = todo.cards.filter((c) => c.state === "in-progress");
    const open = todo.cards.filter((c) => c.state === "open");
    return { resolved, inProgress, open };
  }, [todo.cards]);

  useLayoutEffect(() => {
    if (!scrollRef.current || !activeAnchorRef.current) return;
    scrollRef.current.scrollTop = activeAnchorRef.current.offsetTop - 24;
  }, [todo.id]);

  const handleChat = (event: FormEvent) => {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const userId = `msg-u-${Date.now()}`;
    const runnerId = `msg-r-${Date.now() + 1}`;
    setChatLog((prev) => [
      ...prev,
      { id: userId, role: "user", body: text },
      {
        id: runnerId,
        role: "runner",
        body: "Got it — I'll surface a new card if I need to redirect.",
      },
    ]);
    onChat(todo.id, text);
    setChatInput("");
  };

  const handleCardResolve = (cardId: string, kind: ResolutionKind, note?: string) => {
    onResolveCard(todo.id, cardId, kind, note);
  };

  const handleCardChat = (cardId: string) => (prompt: string) => {
    onChat(todo.id, `[Re: ${cardLabel(todo.cards, cardId)}] ${prompt}`);
    setChatLog((prev) => [
      ...prev,
      { id: `msg-u-${Date.now()}`, role: "user", body: prompt },
      {
        id: `msg-r-${Date.now() + 1}`,
        role: "runner",
        body: "Got it — adjusting that card.",
      },
    ]);
  };

  return (
    <div className="runner-detail">
      <button
        type="button"
        className="runner-detail-back"
        onClick={onBack}
        aria-label={backLabel}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        <span>{backLabel}</span>
      </button>

      {todo.status === "monitoring" && onTogglePauseMonitor ? (
        <button
          type="button"
          className="runner-detail-archive"
          onClick={() => {
            onTogglePauseMonitor(todo.id);
          }}
          aria-label={todo.paused ? "Resume monitor" : "Pause monitor"}
        >
          {todo.paused ? (
            <PlayCircle size={13} aria-hidden="true" />
          ) : (
            <PauseCircle size={13} aria-hidden="true" />
          )}
          <span>{todo.paused ? "Resume" : "Pause"}</span>
        </button>
      ) : (
        <button
          type="button"
          className="runner-detail-archive"
          onClick={() => {
            onArchive(todo.id);
            onBack();
          }}
          aria-label="Archive"
        >
          <ArchiveX size={13} aria-hidden="true" />
          <span>Archive</span>
        </button>
      )}

      <header className="runner-detail-top">
        <div className="runner-detail-eyebrow">
          <StateIcon icon={todo.icon} size={12} />
          <button
            type="button"
            className={`runner-detail-eyebrow-label ${todo.project ? "" : "is-empty"}`}
            aria-label={todo.project ? `Edit label (${todo.project})` : "Add label"}
            title={todo.project ? "Edit label" : "Add label"}
          >
            {todo.project ? (
              <span>{todo.project}</span>
            ) : (
              <>
                <Plus size={11} aria-hidden="true" />
                <span>Add label</span>
              </>
            )}
            {todo.project && <ChevronDown size={11} aria-hidden="true" />}
          </button>
          {todo.status === "monitoring" && (
            <span className="runner-detail-eyebrow-monitoring">
              <Eye size={11} aria-hidden="true" />
              <span>Monitoring</span>
            </span>
          )}
          {todo.timeSensitivity && todo.timeSensitivity !== "none" && (
            <span
              className={`runner-detail-eyebrow-time kind-${todo.timeSensitivity}`}
            >
              {todo.timeSensitivity === "today" ? "Today" : "This week"}
            </span>
          )}
          {todo.labelOrigin === "suggested" && (
            <span className="runner-detail-eyebrow-tag">Runner suggested</span>
          )}
          {(subscriptionsForTodo?.length ?? 0) > 0 &&
            subscriptionsForTodo!.map((sub) => (
              <span key={sub.id} className="runner-detail-sub-chip">
                {sub.name}
              </span>
            ))}
          {availableSubscriptions && availableSubscriptions.length > 0 && (
            <div className="runner-detail-sub-picker-wrap" ref={subPickerRef}>
              <button
                type="button"
                className="runner-detail-sub-add"
                onClick={() => setSubPickerOpen((v) => !v)}
                aria-expanded={subPickerOpen}
                aria-label="Add to subscription"
              >
                <Plus size={11} aria-hidden="true" />
                <span>Add to subscription</span>
              </button>
              {subPickerOpen && (
                <div className="runner-detail-sub-picker" role="menu">
                  <div className="runner-detail-sub-picker-heading">
                    Add to subscription
                  </div>
                  {availableSubscriptions.map((sub) => {
                    const isIn = memberIds.has(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        className={`runner-detail-sub-picker-row ${isIn ? "is-in" : ""}`}
                        role="menuitem"
                        onClick={() => {
                          if (isIn) {
                            onRemoveTodoFromSubscription?.(sub.id);
                          } else {
                            onAddTodoToSubscription?.(sub.id);
                          }
                        }}
                      >
                        <span
                          className={`runner-detail-sub-picker-check ${isIn ? "is-checked" : ""}`}
                          aria-hidden="true"
                        >
                          {isIn ? <CheckCircle2 size={12} /> : <Plus size={12} />}
                        </span>
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <h2 className="runner-detail-title">{todo.title}</h2>
        {todo.status === "monitoring" && todo.trigger && (
          <p className="runner-detail-trigger">
            <TriggerIcon kind={todo.triggerKind} />
            <span className="runner-detail-trigger-text">{todo.trigger}</span>
            {todo.nextTrigger && (
              <span className="runner-detail-trigger-next">
                · next: {todo.nextTrigger}
              </span>
            )}
          </p>
        )}
      </header>

      <div className="runner-detail-layout">
        <div className="runner-detail-main">
          <div className="runner-detail-scroll" ref={scrollRef}>
            <section className="runner-detail-summary">
              <p className="runner-detail-summary-body">{todo.runnerStatus}</p>
              {todo.consequence && (
                <p className="runner-detail-consequence">{todo.consequence}</p>
              )}
              {todo.source && (
                <p className="runner-detail-source">{todo.source}</p>
              )}
            </section>

            <div ref={activeAnchorRef} />

            {orderedCards.open.length > 0 ? (
              <CardSection label="Needs you" count={orderedCards.open.length} emphasis>
                {orderedCards.open.map((card) => (
                  <RunnerActionCard
                    key={card.id}
                    card={card}
                    onResolve={handleCardResolve}
                    onChat={handleCardChat(card.id)}
                  />
                ))}
              </CardSection>
            ) : todo.status === "archived" ? (
              <CardSection label="Complete" count={0} emphasis>
                <div className="runner-action-card all-clear">
                  <div className="all-clear-head">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    <span>
                      {todo.resolvedAt
                        ? `Wrapped — ${todo.resolvedAt}.`
                        : "Wrapped."}
                    </span>
                  </div>
                </div>
              </CardSection>
            ) : (
              <CardSection label="Clear" count={0} emphasis>
                <div className="runner-action-card all-clear">
                  <div className="all-clear-head">
                    <Sparkles size={14} aria-hidden="true" />
                    <span>Nothing waiting.</span>
                  </div>
                </div>
              </CardSection>
            )}

            {orderedCards.inProgress.length > 0 && (
              <CardSection label="In progress" count={orderedCards.inProgress.length}>
                {orderedCards.inProgress.map((card) => (
                  <RunnerActionCard
                    key={card.id}
                    card={card}
                    onResolve={handleCardResolve}
                    onChat={handleCardChat(card.id)}
                  />
                ))}
              </CardSection>
            )}

            {orderedCards.resolved.length > 0 && (
              <CardSection label="History" count={orderedCards.resolved.length} muted>
                {orderedCards.resolved.map((card) => (
                  <RunnerActionCard
                    key={card.id}
                    card={card}
                    onResolve={handleCardResolve}
                    onChat={handleCardChat(card.id)}
                  />
                ))}
              </CardSection>
            )}
          </div>
        </div>

        <aside className="runner-detail-chat" aria-label="Chat with Runner">
          <header className="runner-detail-chat-head">
            <h3>Chat</h3>
          </header>
          <div className="runner-detail-chat-log">
            {chatLog.length === 0 ? (
              <div className="runner-detail-chat-empty">
                <ul>
                  <ChatSuggestion
                    onClick={() => sendQuickPrompt("What changed since yesterday?")}
                  >
                    What changed since yesterday?
                  </ChatSuggestion>
                  <ChatSuggestion
                    onClick={() => sendQuickPrompt("Add a card to follow up Friday.")}
                  >
                    Add a follow-up Friday
                  </ChatSuggestion>
                  <ChatSuggestion onClick={() => sendQuickPrompt("Why this consequence?")}>
                    Why this consequence?
                  </ChatSuggestion>
                </ul>
              </div>
            ) : (
              <ul>
                {chatLog.map((msg) => (
                  <li key={msg.id} className={`runner-chat-bubble is-${msg.role}`}>
                    <span>{msg.body}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <form className="runner-detail-chat-input-row" onSubmit={handleChat}>
            <input
              type="text"
              className="runner-chat-input"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Message…"
              aria-label="Intervene"
              onKeyDown={preventBackspaceNav}
            />
            <button
              type="submit"
              className="runner-chat-send"
              disabled={chatInput.trim().length === 0}
              aria-label="Send"
            >
              <Send size={14} aria-hidden="true" />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );

  function sendQuickPrompt(prompt: string) {
    setChatLog((prev) => [
      ...prev,
      { id: `msg-u-${Date.now()}`, role: "user", body: prompt },
      {
        id: `msg-r-${Date.now() + 1}`,
        role: "runner",
        body: "Got it — I'll fold that into the next card if needed.",
      },
    ]);
    onChat(todo.id, prompt);
  }
}

function ChatSuggestion({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" className="runner-chat-suggestion" onClick={onClick}>
        {children}
      </button>
    </li>
  );
}

function CardSection({
  label,
  count,
  children,
  muted,
  emphasis,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
  muted?: boolean;
  emphasis?: boolean;
}) {
  return (
    <section
      className={`runner-card-section ${muted ? "is-muted" : ""} ${
        emphasis ? "is-emphasis" : ""
      }`}
    >
      <header className="runner-card-section-heading">
        <span>{label}</span>
        <span className="dashboard-section-count">{count}</span>
      </header>
      <div className="runner-card-stack">{children}</div>
    </section>
  );
}

function cardLabel(cards: Card[], id: string) {
  return cards.find((c) => c.id === id)?.title ?? "card";
}

function preventBackspaceNav(event: ReactKeyboardEvent<HTMLInputElement>) {
  if (event.key === "Backspace" && event.currentTarget.value === "") {
    event.stopPropagation();
  }
}
