import { Activity, ListChecks } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  ALL_FILTER,
  DashboardView,
  DetailView,
  ListView,
  type FilterValue,
} from "./RunnerViews";
import {
  SEED_RECENTLY_ADVANCED,
  SEED_TODOS,
  buildSpawnedCards,
  uid,
  type ResolutionKind,
  type RunnerTodo,
  type TodoStatus,
} from "./runnerData";

type View = "dashboard" | "list" | "detail";

export default function Runner({ headerSlot }: { headerSlot?: ReactNode } = {}) {
  const [todos, setTodos] = useState<RunnerTodo[]>(() => SEED_TODOS);
  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>(ALL_FILTER);
  const previousViewRef = useRef<View>("dashboard");

  const selectedTodo = useMemo(
    () => todos.find((t) => t.id === selectedId) ?? null,
    [todos, selectedId],
  );

  const openTodo = (id: string) => {
    previousViewRef.current = view;
    setSelectedId(id);
    setView("detail");
  };

  const backFromDetail = () => {
    setView(previousViewRef.current === "list" ? "list" : "dashboard");
    setSelectedId(null);
  };

  const archiveTodo = (id: string) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              status: "archived" as TodoStatus,
              icon: "waiting",
              resolvedAt: "Just now",
              resolutionKind: "archived",
            }
          : todo,
      ),
    );
  };

  const togglePauseMonitor = (id: string) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? { ...todo, paused: !todo.paused, updatedAt: "Just now" }
          : todo,
      ),
    );
  };

  const addTodo = (title: string) => {
    const newTodo: RunnerTodo = {
      id: uid("todo"),
      title,
      status: "needs-you",
      icon: "attention",
      labelOrigin: "unlabeled",
      runnerStatus: "New — tell Runner what you want to happen here.",
      nextAction: "Add context or first action",
      consequence: "Runner doesn't know enough yet to surface a consequence.",
      timeSensitivity: "none",
      createdAt: "Just now",
      updatedAt: "Just now",
      cards: [],
    };
    setTodos((current) => [newTodo, ...current]);
  };

  const [recentlySpawnedId, setRecentlySpawnedId] = useState<string | null>(null);

  const resolveCard = (
    todoId: string,
    cardId: string,
    kind: ResolutionKind,
    note?: string,
  ) => {
    const spawned = buildSpawnedCards({ todoId, cardId, kind, note });
    setTodos((current) => {
      let affectedIdx = -1;
      const updated = current.map((todo, idx) => {
        if (todo.id !== todoId) return todo;
        affectedIdx = idx;
        const resolvedCards = todo.cards.map((card) =>
          card.id === cardId
            ? {
                ...card,
                state: "resolved" as const,
                resolution: {
                  kind,
                  at: "Just now",
                  note,
                },
              }
            : card,
        );

        const cards = [...resolvedCards, ...spawned];

        // Re-derive todo status from remaining open cards
        const hasOpen = cards.some((c) => c.state === "open");
        const hasInProgress = cards.some((c) => c.state === "in-progress");
        let status: TodoStatus = todo.status;
        let icon = todo.icon;
        if (!hasOpen) {
          if (hasInProgress) {
            status = "runner-working";
            icon = "waiting";
          } else {
            status = "runner-working";
            icon = "waiting";
          }
        }
        return {
          ...todo,
          status,
          icon,
          cards,
          updatedAt: "Just now",
          lastAdvancedNote: note ?? todo.lastAdvancedNote,
        };
      });

      // When spawning happened, move the affected todo to the top so it lands
      // at the top of the In progress rail (and the highlight is unmistakable).
      if (spawned.length > 0 && affectedIdx > 0) {
        const [item] = updated.splice(affectedIdx, 1);
        updated.unshift(item);
      }
      return updated;
    });

    // Briefly mark this todo as "just spawned" so the rail group can highlight,
    // even if it was already in the rail (no fresh entering animation).
    if (spawned.length > 0) {
      setRecentlySpawnedId(todoId);
      setTimeout(() => {
        setRecentlySpawnedId((curr) => (curr === todoId ? null : curr));
      }, 900);
    }
  };

  const sendChat = (_todoId: string, _prompt: string) => {
    // Visual-only — DetailView holds the local chat log. This hook is a no-op
    // for now and exists so future versions can spawn cards from a redirect.
  };

  return (
    <div className={`runner-shell ${view === "detail" ? "is-detail" : ""}`}>
      {view !== "detail" && (
        <header className="runner-top">
          {headerSlot}
          <ViewToggle view={view} onChange={setView} />
        </header>
      )}

      <div className="runner-content">
        {view === "dashboard" && (
          <DashboardView
            todos={todos}
            recentlyAdvanced={SEED_RECENTLY_ADVANCED}
            recentlySpawnedId={recentlySpawnedId}
            onOpen={openTodo}
            onArchive={archiveTodo}
            onResolveCard={resolveCard}
            onFilterByProject={(project) => {
              previousViewRef.current = "dashboard";
              setFilter(project);
              setView("list");
            }}
          />
        )}

        {view === "list" && (
          <ListView
            todos={todos}
            filter={filter}
            onFilterChange={setFilter}
            onOpen={openTodo}
            onArchive={archiveTodo}
            onAddTodo={addTodo}
            onTogglePauseMonitor={togglePauseMonitor}
          />
        )}

        {view === "detail" && selectedTodo && (
          <DetailView
            todo={selectedTodo}
            onBack={backFromDetail}
            backLabel={previousViewRef.current === "list" ? "Back to list" : "Back to dashboard"}
            onResolveCard={resolveCard}
            onChat={sendChat}
            onArchive={archiveTodo}
            onTogglePauseMonitor={togglePauseMonitor}
          />
        )}
      </div>
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const activeIndex = view === "list" ? 1 : 0;
  return (
    <div className="mode-toggle runner-view-toggle" data-active={activeIndex}>
      <span className="mode-toggle-slider" aria-hidden="true" />
      <button
        type="button"
        className={`mode-toggle-option ${view === "dashboard" ? "is-active" : ""}`}
        onClick={() => onChange("dashboard")}
      >
        <Activity size={13} aria-hidden="true" /> Dashboard
      </button>
      <button
        type="button"
        className={`mode-toggle-option ${view === "list" ? "is-active" : ""}`}
        onClick={() => onChange("list")}
      >
        <ListChecks size={13} aria-hidden="true" /> List
      </button>
    </div>
  );
}
