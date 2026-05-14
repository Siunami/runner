import {
  Activity,
  AlertCircle,
  AlertOctagon,
  Archive,
  ChevronDown,
  ChevronRight,
  Eye,
  ListChecks,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ALL_FILTER, DetailView, ListView, type FilterValue } from "./RunnerViews";
import {
  SEED_TODOS,
  buildSpawnedCards,
  uid,
  type ResolutionKind,
  type RunnerActionCard,
  type RunnerTodo,
  type TodoStatus,
} from "./runnerData";
import {
  CALLOUT_SYNTHESES,
  SEED_SUBSCRIPTIONS,
  SUBSCRIPTION_EXTRA_TODOS,
  applyCardReplacements,
  applyConversionSuggestions,
  applyMonitorHistory,
  applyMonitorMetadata,
  applyTagOverlay,
  monitorsInSubscription,
  todosInSubscription,
  type DashboardSubscription,
} from "./subscriptionData";

type View = "dashboard" | "list" | "subscription" | "detail";

export default function RunnerSubscriptions({
  headerSlot,
}: { headerSlot?: ReactNode } = {}) {
  const [todos, setTodos] = useState<RunnerTodo[]>(() =>
    applyConversionSuggestions(
      applyMonitorMetadata(
        applyTagOverlay(
          applyCardReplacements(
            applyMonitorHistory([...SEED_TODOS, ...SUBSCRIPTION_EXTRA_TODOS]),
          ),
        ),
      ),
    ),
  );
  const [subscriptions, setSubscriptions] = useState<DashboardSubscription[]>(
    () => SEED_SUBSCRIPTIONS,
  );
  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>(ALL_FILTER);
  const [subFilter, setSubFilter] = useState<FilterValue>(ALL_FILTER);
  const [showArchived, setShowArchived] = useState(false);
  const previousViewRef = useRef<View>("dashboard");

  const selectedTodo = useMemo(
    () => todos.find((t) => t.id === selectedId) ?? null,
    [todos, selectedId],
  );

  const activeSubscription = useMemo(
    () =>
      activeSubId
        ? subscriptions.find((s) => s.id === activeSubId) ?? null
        : null,
    [activeSubId, subscriptions],
  );

  const subscriptionsByTodoId = useMemo(() => {
    const map: Record<string, DashboardSubscription[]> = {};
    subscriptions
      .filter((s) => !s.archived)
      .forEach((s) => {
        (s.members ?? []).forEach((todoId) => {
          (map[todoId] ??= []).push(s);
        });
      });
    return map;
  }, [subscriptions]);

  const openTodo = (id: string) => {
    previousViewRef.current = view;
    setSelectedId(id);
    setView("detail");
  };

  const openSubscription = (subId: string, todoId?: string) => {
    setActiveSubId(subId);
    setSubFilter(ALL_FILTER);
    if (todoId) {
      previousViewRef.current = "subscription";
      setSelectedId(todoId);
      setView("detail");
    } else {
      previousViewRef.current = view;
      setView("subscription");
    }
  };

  const backFromDetail = () => {
    const prior = previousViewRef.current;
    setView(prior === "list" || prior === "subscription" ? prior : "dashboard");
    setSelectedId(null);
  };

  const backFromSubscription = () => {
    setView("dashboard");
    setActiveSubId(null);
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

  const resolveCard = (
    todoId: string,
    cardId: string,
    kind: ResolutionKind,
    note?: string,
  ) => {
    // Special case: the "convert to monitor?" approval card spawns a new
    // monitoring todo when accepted. The source todo's card resolves as usual.
    if (
      cardId === "card-toronto-convert-suggest" &&
      kind === "accepted"
    ) {
      const newId = uid("mon");
      const newMonitor: RunnerTodo = {
        id: newId,
        title: "Tracking SFO → YYZ fares (post-booking)",
        status: "monitoring",
        icon: "waiting",
        project: "Travel",
        projectKey: "travel",
        labelOrigin: "manual",
        tags: ["Travel"],
        consequence:
          "Catches refund-and-rebook windows after the Toronto dates lock.",
        timeSensitivity: "none",
        runnerStatus: "Watching SFO → YYZ hourly. Alerts on drops > 15%.",
        nextAction: "Wait — I'll surface drops > 15%",
        source: "Spawned from Toronto trip — May 11",
        createdAt: "Just now",
        updatedAt: "Just now",
        trigger: "hourly",
        triggerKind: "time",
        nextTrigger: "Top of hour",
        cards: [
          {
            id: uid("card"),
            type: "informational",
            state: "in-progress",
            title: "Watching SFO → YYZ · alert on drops > 15%",
            why: "Toronto fares ratchet after a dip — early catches save $80–120.",
            createdAt: "Just now",
          },
        ],
      };
      setTodos((current) => [newMonitor, ...current]);
    }

    const spawned = buildSpawnedCards({ todoId, cardId, kind, note });
    setTodos((current) =>
      current.map((todo) => {
        if (todo.id !== todoId) return todo;
        const cardBeingResolved = todo.cards.find((c) => c.id === cardId);
        const resolvedCards = todo.cards.map((card) =>
          card.id === cardId
            ? {
                ...card,
                state: "resolved" as const,
                resolution: { kind, at: "Just now", note },
              }
            : card,
        );
        // If a monitoring todo's approval card is accepted, spawn the live
        // settings card (the in-progress watch).
        const monitorSettings: RunnerActionCard[] =
          todo.status === "monitoring" &&
          kind === "accepted" &&
          cardBeingResolved?.type === "approval"
            ? [
                {
                  id: uid("card"),
                  type: "informational",
                  state: "in-progress",
                  title: `Watching · ${todo.trigger ?? "running"}`,
                  why: todo.consequence ?? "Live watch.",
                  whatHappens: todo.nextTrigger
                    ? `Next check: ${todo.nextTrigger}`
                    : undefined,
                  createdAt: "Just now",
                },
              ]
            : [];
        const cards = [...resolvedCards, ...spawned, ...monitorSettings];
        const hasOpen = cards.some((c) => c.state === "open");
        let status: TodoStatus = todo.status;
        let icon = todo.icon;
        if (!hasOpen && todo.status !== "monitoring") {
          status = "runner-working";
          icon = "waiting";
        }
        if (todo.status === "monitoring" && !hasOpen) {
          // Quiet monitor; keep the eye icon (waiting maps to clock — better)
          icon = "waiting";
        }
        return {
          ...todo,
          status,
          icon,
          cards,
          updatedAt: "Just now",
          lastAdvancedNote: note ?? todo.lastAdvancedNote,
        };
      }),
    );
  };

  const sendChat = (_todoId: string, _prompt: string) => {
    // Visual-only — DetailView holds the local chat log.
  };

  const goToDashboard = () => setView("dashboard");
  const goToList = () => setView("list");

  const archiveSubscription = (id: string) => {
    setSubscriptions((current) =>
      current.map((s) => (s.id === id ? { ...s, archived: true } : s)),
    );
  };

  const restoreSubscription = (id: string) => {
    setSubscriptions((current) =>
      current.map((s) => (s.id === id ? { ...s, archived: false } : s)),
    );
  };

  const createSubscriptionFromPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const STOP = new Set([
      "a", "an", "the", "and", "or", "to", "of", "for", "with", "in", "on",
      "i", "want", "watch", "watching", "around", "about", "my", "me",
      "stuff", "things", "all", "any", "is", "are", "track", "tracking",
      "keep", "top", "up", "out", "on", "what", "thats", "that's", "lately",
    ]);
    const tokens = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t));

    const score = (todo: RunnerTodo): number => {
      if (todo.status === "archived") return -1;
      const haystack = [
        todo.title,
        todo.project ?? "",
        ...(todo.tags ?? []),
        todo.source ?? "",
      ]
        .join(" ")
        .toLowerCase();
      let s = 0;
      tokens.forEach((t) => {
        if (haystack.includes(t)) s += 1;
      });
      return s;
    };

    const ranked = todos
      .map((t) => ({ todo: t, s: score(t) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s);

    const memberPool = ranked.slice(0, 4).map((r) => r.todo.id);
    const candidatePool = ranked.slice(4, 9).map((r) => r.todo.id);

    const firstSentence = trimmed.split(/[.!?]/)[0].trim();
    const titleSource = firstSentence.length > 0 ? firstSentence : trimmed;
    const title =
      titleSource.length > 38
        ? titleSource.slice(0, 38).trim() + "…"
        : titleSource;
    const name = title.charAt(0).toUpperCase() + title.slice(1);

    const summary =
      ranked.length > 0
        ? `Started from "${trimmed}". Runner pulled ${memberPool.length} item${memberPool.length === 1 ? "" : "s"} that look related and queued more as suggestions.`
        : `Started from "${trimmed}". Runner didn't find existing items yet — add from a todo's detail view.`;

    const newSub: DashboardSubscription = {
      id: uid("sub"),
      name,
      projects: [],
      summary,
      members: memberPool,
      candidates: candidatePool,
    };
    setSubscriptions((current) => [...current, newSub]);
    setActiveSubId(newSub.id);
    previousViewRef.current = "dashboard";
    setView("subscription");
  };

  const removeMember = (subId: string, todoId: string) => {
    setSubscriptions((current) =>
      current.map((s) =>
        s.id === subId
          ? { ...s, members: (s.members ?? []).filter((m) => m !== todoId) }
          : s,
      ),
    );
  };

  const acceptCandidate = (subId: string, todoId: string) => {
    setSubscriptions((current) =>
      current.map((s) => {
        if (s.id !== subId) return s;
        const members = s.members ?? [];
        if (members.includes(todoId)) return s;
        return {
          ...s,
          members: [...members, todoId],
          candidates: (s.candidates ?? []).filter((c) => c !== todoId),
        };
      }),
    );
  };

  const dismissCandidate = (subId: string, todoId: string) => {
    setSubscriptions((current) =>
      current.map((s) =>
        s.id === subId
          ? { ...s, candidates: (s.candidates ?? []).filter((c) => c !== todoId) }
          : s,
      ),
    );
  };

  return (
    <div className={`runner-shell ${view === "detail" ? "is-detail" : ""}`}>
      {view !== "detail" && (
        <header className="runner-top">
          {headerSlot}
          <ViewToggle
            view={view}
            onDashboard={goToDashboard}
            onList={goToList}
          />
        </header>
      )}

      <div className="runner-content">
        {view === "dashboard" && (
          <SubscriptionDashboardView
            subscriptions={subscriptions}
            todos={todos}
            showArchived={showArchived}
            onOpenSubscription={openSubscription}
            onArchiveSubscription={archiveSubscription}
            onRestoreSubscription={restoreSubscription}
            onToggleArchived={() => setShowArchived((v) => !v)}
            onCreateFromPrompt={createSubscriptionFromPrompt}
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
            showLabels={false}
            groupingMode="time-buckets"
            showCapture={true}
            subscriptionsByTodoId={subscriptionsByTodoId}
          />
        )}

        {view === "subscription" && activeSubscription && (
          <SubscriptionDetailView
            subscription={activeSubscription}
            todos={todos}
            filter={subFilter}
            onFilterChange={setSubFilter}
            onBack={backFromSubscription}
            onOpenTodo={openTodo}
            onArchiveTodo={archiveTodo}
            onAddTodo={addTodo}
            onAcceptCandidate={acceptCandidate}
            onDismissCandidate={dismissCandidate}
            onRemoveMember={removeMember}
            onArchiveSubscription={archiveSubscription}
          />
        )}

        {view === "detail" && selectedTodo && (
          <DetailView
            todo={selectedTodo}
            onBack={backFromDetail}
            backLabel={
              previousViewRef.current === "list"
                ? "Back to list"
                : previousViewRef.current === "subscription"
                  ? `Back to ${activeSubscription?.name ?? "subscription"}`
                  : "Back to dashboard"
            }
            onResolveCard={resolveCard}
            onChat={sendChat}
            onArchive={archiveTodo}
            subscriptionsForTodo={subscriptionsByTodoId[selectedTodo.id] ?? []}
            availableSubscriptions={subscriptions.filter((s) => !s.archived)}
            onAddTodoToSubscription={(subId) => acceptCandidate(subId, selectedTodo.id)}
            onRemoveTodoFromSubscription={(subId) => removeMember(subId, selectedTodo.id)}
          />
        )}
      </div>

    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// View toggle
// ──────────────────────────────────────────────────────────────────────────────
function ViewToggle({
  view,
  onDashboard,
  onList,
}: {
  view: View;
  onDashboard: () => void;
  onList: () => void;
}) {
  const activeIndex = view === "list" ? 1 : 0;
  return (
    <div className="mode-toggle runner-view-toggle" data-active={activeIndex}>
      <span className="mode-toggle-slider" aria-hidden="true" />
      <button
        type="button"
        className={`mode-toggle-option ${view === "dashboard" ? "is-active" : ""}`}
        onClick={onDashboard}
      >
        <Activity size={13} aria-hidden="true" /> Dashboard
      </button>
      <button
        type="button"
        className={`mode-toggle-option ${view === "list" ? "is-active" : ""}`}
        onClick={onList}
      >
        <ListChecks size={13} aria-hidden="true" /> List
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SubscriptionDashboardView — active + archived sections.
// ──────────────────────────────────────────────────────────────────────────────
function SubscriptionDashboardView({
  subscriptions,
  todos,
  showArchived,
  onOpenSubscription,
  onArchiveSubscription,
  onRestoreSubscription,
  onToggleArchived,
  onCreateFromPrompt,
}: {
  subscriptions: DashboardSubscription[];
  todos: RunnerTodo[];
  showArchived: boolean;
  onOpenSubscription: (subId: string, todoId?: string) => void;
  onArchiveSubscription: (id: string) => void;
  onRestoreSubscription: (id: string) => void;
  onToggleArchived: () => void;
  onCreateFromPrompt: (prompt: string) => void;
}) {
  const active = subscriptions.filter((s) => !s.archived);
  const archived = subscriptions.filter((s) => s.archived);
  return (
    <div className="subscriptions-dashboard">
      <SubscriptionPrompt onSubmit={onCreateFromPrompt} />

      {active.length === 0 ? (
        <div className="subscriptions-empty">
          <p>No subscriptions yet.</p>
          <p className="subscriptions-empty-hint">
            Tell Runner what to keep on top of using the box above.
          </p>
        </div>
      ) : (
        <ul className="subscription-list">
          {active.map((sub) => (
            <li key={sub.id}>
              <SubscriptionCard
                subscription={sub}
                todos={todos}
                onOpen={onOpenSubscription}
                onArchive={onArchiveSubscription}
              />
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <section className="subscriptions-archived">
          <button
            type="button"
            className="subscriptions-archived-toggle"
            onClick={onToggleArchived}
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
            <ul className="subscriptions-archived-list">
              {archived.map((sub) => (
                <li key={sub.id} className="subscriptions-archived-row">
                  <span className="subscriptions-archived-name">{sub.name}</span>
                  <button
                    type="button"
                    className="subscriptions-restore-btn"
                    onClick={() => onRestoreSubscription(sub.id)}
                  >
                    <RotateCcw size={12} aria-hidden="true" />
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function SubscriptionPrompt({
  onSubmit,
}: {
  onSubmit: (prompt: string) => void;
}) {
  const [value, setValue] = useState("");
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };
  return (
    <form className="subscriptions-prompt" onSubmit={handleSubmit}>
      <Sparkles size={16} aria-hidden="true" />
      <input
        type="text"
        className="subscriptions-prompt-input"
        placeholder="What do you want to keep on top of?"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label="Describe a new subscription"
      />
      <button
        type="submit"
        className="subscriptions-prompt-submit"
        disabled={value.trim().length === 0}
      >
        Create
      </button>
    </form>
  );
}

function memberHint(todo: RunnerTodo): string {
  const openCards = todo.cards.filter((c) => c.state === "open");
  if (openCards.length >= 2 && CALLOUT_SYNTHESES[todo.id]) {
    return CALLOUT_SYNTHESES[todo.id];
  }
  if (openCards.length > 0) return openCards[0].title;
  if (todo.nextAction) return todo.nextAction;
  if (todo.status === "blocked") return "Blocked";
  return todo.runnerStatus;
}

function calloutPriority(t: RunnerTodo): number {
  if (t.status === "blocked") return 0;
  if (t.status === "needs-you" && t.timeSensitivity === "today") return 1;
  if (t.status === "needs-you") return 2;
  return 3;
}

function SubscriptionCard({
  subscription,
  todos,
  onOpen,
  onArchive,
}: {
  subscription: DashboardSubscription;
  todos: RunnerTodo[];
  onOpen: (subId: string, todoId?: string) => void;
  onArchive: (id: string) => void;
}) {
  const subTodos = useMemo(
    () => todosInSubscription(subscription, todos),
    [subscription, todos],
  );

  const callouts = useMemo(() => {
    const attention = subTodos
      .filter((t) => t.status === "needs-you" || t.status === "blocked")
      .sort((a, b) => calloutPriority(a) - calloutPriority(b));
    const monitorReviews = monitorsInSubscription(subscription, todos).filter(
      (m) => {
        const latest = m.cards[m.cards.length - 1];
        return latest?.state === "open";
      },
    );
    const seen = new Set<string>();
    const combined: RunnerTodo[] = [];
    [...attention, ...monitorReviews].forEach((t) => {
      if (seen.has(t.id)) return;
      seen.add(t.id);
      combined.push(t);
    });
    return combined.slice(0, 3);
  }, [subTodos, subscription, todos]);

  const latelyText = useMemo(() => {
    if (subscription.latelyNote) return subscription.latelyNote;
    const withNotes = subTodos.filter((t) => t.lastAdvancedNote);
    if (withNotes.length === 0) return null;
    return withNotes[0].lastAdvancedNote ?? null;
  }, [subscription.latelyNote, subTodos]);

  const isEmpty = subTodos.length === 0;
  const handleCardClick = () => onOpen(subscription.id);
  const stop = (event: React.SyntheticEvent) => event.stopPropagation();

  return (
    <article
      className={`subscription-card is-clickable ${isEmpty ? "is-empty" : ""}`}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardClick();
        }
      }}
    >
      <header className="subscription-header">
        <div className="subscription-header-main">
          <span className="subscription-name">{subscription.name}</span>
          {callouts.length > 0 && (
            <span className="subscription-badge">
              <AlertCircle size={11} aria-hidden="true" />
              {callouts.length} need{callouts.length === 1 ? "s" : ""} you
            </span>
          )}
        </div>
        <button
          type="button"
          className="subscription-dismiss"
          aria-label={`Archive ${subscription.name}`}
          onClick={(event) => {
            stop(event);
            onArchive(subscription.id);
          }}
        >
          <Archive size={13} aria-hidden="true" />
        </button>
      </header>

      {callouts.length > 0 ? (
        <ul className="subscription-callouts">
          {callouts.map((todo) => {
            const openCount = todo.cards.filter((c) => c.state === "open").length;
            const hint = memberHint(todo);
            const isMonitor = todo.status === "monitoring";
            return (
              <li key={todo.id}>
                <button
                  type="button"
                  className={`subscription-callout ${todo.status === "blocked" ? "is-blocked" : ""}`}
                  onClick={(event) => {
                    stop(event);
                    onOpen(subscription.id, todo.id);
                  }}
                >
                  <span className="subscription-callout-icon" aria-hidden="true">
                    {todo.status === "blocked" ? (
                      <AlertOctagon size={13} />
                    ) : isMonitor ? (
                      <Eye size={13} />
                    ) : (
                      <AlertCircle size={13} />
                    )}
                  </span>
                  <span className="subscription-callout-body">
                    <span className="subscription-callout-title">{todo.title}</span>
                    <span className="subscription-callout-hint">{hint}</span>
                  </span>
                  {openCount > 0 && (
                    <span
                      className={`subscription-callout-count ${openCount >= 3 ? "is-busy" : ""}`}
                      aria-label={`${openCount} open ${openCount === 1 ? "action" : "actions"}`}
                    >
                      {openCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="subscription-quiet">
          {isEmpty ? "No items yet." : "Nothing needs you right now."}
        </p>
      )}

      {latelyText && (
        <p className="subscription-lately">
          <span className="subscription-lately-label">Lately</span>
          <span className="subscription-lately-text">{latelyText}</span>
        </p>
      )}
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SubscriptionDetailView — expanded playlist: filtered list + suggestions.
// ──────────────────────────────────────────────────────────────────────────────
function SubscriptionDetailView({
  subscription,
  todos,
  filter,
  onFilterChange,
  onBack,
  onOpenTodo,
  onArchiveTodo,
  onAddTodo,
  onAcceptCandidate,
  onDismissCandidate,
  onRemoveMember,
  onArchiveSubscription,
}: {
  subscription: DashboardSubscription;
  todos: RunnerTodo[];
  filter: FilterValue;
  onFilterChange: (v: FilterValue) => void;
  onBack: () => void;
  onOpenTodo: (id: string) => void;
  onArchiveTodo: (id: string) => void;
  onAddTodo: (title: string) => void;
  onAcceptCandidate: (subId: string, todoId: string) => void;
  onDismissCandidate: (subId: string, todoId: string) => void;
  onRemoveMember: (subId: string, todoId: string) => void;
  onArchiveSubscription: (id: string) => void;
}) {
  const memberTodos = useMemo(
    () => todosInSubscription(subscription, todos),
    [subscription, todos],
  );

  const candidateTodos = useMemo(() => {
    const ids = subscription.candidates ?? [];
    return ids
      .map((id) => todos.find((t) => t.id === id))
      .filter((t): t is RunnerTodo => Boolean(t));
  }, [subscription.candidates, todos]);

  return (
    <div className="sub-detail">
      <header className="sub-detail-header">
        <button
          type="button"
          className="sub-detail-back"
          onClick={onBack}
          aria-label="Back to dashboard"
        >
          <ChevronRight
            size={14}
            aria-hidden="true"
            style={{ transform: "rotate(180deg)" }}
          />
          <span>Dashboard</span>
        </button>
        <div className="sub-detail-title-row">
          <h2 className="sub-detail-title">{subscription.name}</h2>
          <span className="sub-detail-count">
            {memberTodos.length} item{memberTodos.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="sub-detail-archive"
            onClick={() => {
              onArchiveSubscription(subscription.id);
              onBack();
            }}
            aria-label={`Archive ${subscription.name}`}
          >
            <Archive size={13} aria-hidden="true" />
            <span>Archive</span>
          </button>
        </div>
        <p className="sub-detail-summary">{subscription.summary}</p>
      </header>

      <ListView
        todos={memberTodos}
        filter={filter}
        onFilterChange={onFilterChange}
        onOpen={onOpenTodo}
        onArchive={onArchiveTodo}
        onAddTodo={onAddTodo}
        showLabels={false}
        groupingMode="time-buckets"
        showCapture={false}
        rowAction={(todo) => (
          <button
            type="button"
            className="sub-row-remove"
            aria-label={`Remove ${todo.title} from ${subscription.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onRemoveMember(subscription.id, todo.id);
            }}
          >
            <X size={12} aria-hidden="true" />
          </button>
        )}
        emptyMessage="No items yet. Add some from the suggestions below."
      />

      <section className="sub-detail-suggest">
        <header className="sub-detail-suggest-heading">
          <Sparkles size={13} aria-hidden="true" />
          <span>Suggested by Runner</span>
          {candidateTodos.length > 0 && (
            <span className="dashboard-section-count">{candidateTodos.length}</span>
          )}
        </header>
        {candidateTodos.length > 0 ? (
          <ul className="sub-suggest-list">
            {candidateTodos.map((todo) => (
              <li key={todo.id} className="sub-suggest-row">
                <div className="sub-suggest-body">
                  <span className="sub-suggest-title">{todo.title}</span>
                  <span className="sub-suggest-hint">{memberHint(todo)}</span>
                </div>
                <div className="sub-suggest-actions">
                  <button
                    type="button"
                    className="sub-suggest-add"
                    onClick={() => onAcceptCandidate(subscription.id, todo.id)}
                  >
                    <Plus size={11} aria-hidden="true" />
                    Add
                  </button>
                  <button
                    type="button"
                    className="sub-suggest-skip"
                    onClick={() => onDismissCandidate(subscription.id, todo.id)}
                    aria-label={`Dismiss ${todo.title}`}
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sub-suggest-empty">
            No more suggestions for now. Runner will surface more as new todos come in.
          </p>
        )}
      </section>
    </div>
  );
}
