import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Archive,
  ArrowRight,
  ArrowUp,
  Bookmark,
  Calendar,
  CalendarPlus,
  CalendarX,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  ListChecks,
  Mic,
  Minus,
  Plus,
  Repeat,
  Sparkles,
  Square,
  SquareCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  CSSProperties,
  FormEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SessionState = "idle" | "running" | "requires_action";

type SessionMeta = {
  id: string;
  name: string;
  description?: string;
  preview?: string;
  sessionState?: SessionState;
  isProcessing?: boolean;
  hasPendingPrompt?: boolean;
  isArchived?: boolean;
  etlFailed?: boolean;
  label?: string;
  scheduledAt?: number;
  recurring?: boolean;
  isCompletedToday?: boolean;
  lastMessageAt?: number;
  lastDescriptionAt?: number;
};

type StateKind = "archived" | "running" | "attention" | "blocked" | "idle";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const now = Date.now();

// Build a fixed reference "today" so the rendered times read predictably.
const todayBase = new Date();
todayBase.setHours(0, 0, 0, 0);
const at = (hours: number, minutes = 0, dayOffset = 0) =>
  todayBase.getTime() + dayOffset * DAY_MS + hours * HOUR_MS + minutes * 60_000;

const SEED_SESSIONS: SessionMeta[] = [
  // Today (1 in progress)
  {
    id: "today-1",
    name: "Workshop the Series-B keynote deck",
    description:
      "Rebuilding slides 5–8 around the 'capability overhang' framing. Three layout options queued.",
    sessionState: "running",
    isProcessing: true,
    scheduledAt: at(15, 0),
    lastMessageAt: now - 4 * 60 * 1000,
    label: "decks",
  },
  // Tasks — varied themes mirroring Charlie's distribution
  {
    id: "task-1",
    name: "Triage today's inbox to zero",
    description:
      "37 emails left. 6 need drafted replies, 3 have calendar invites pending, 2 awaiting your direction.",
    hasPendingPrompt: true,
    sessionState: "requires_action",
    label: "inbox-zero",
  },
  {
    id: "task-2",
    name: "Draft reply to Sam with mutual cal slots",
    description:
      "Pulled her calendly + your free/busy. 3 mutual windows Tue–Thu afternoons. Draft ready to send.",
    hasPendingPrompt: true,
    sessionState: "requires_action",
  },
  {
    id: "task-3",
    name: "Find SFO → JFK flights May 22, return May 24",
    description:
      "Direct only, arriving before 4 PM ET. Three nonstops at $480-$640. Comparison chart ready.",
    hasPendingPrompt: true,
    sessionState: "requires_action",
  },
  {
    id: "task-4",
    name: "Compare hotel options near the offsite venue",
    description:
      "Three shortlisted within walking distance. Two-night totals + walk times ready for review.",
    label: "travel",
  },
  {
    id: "task-5",
    name: "Research 3 attendees from last night's operator dinner",
    description:
      "LinkedIn + recent press for each. One angel-invests in CRM tools, two run BizOps for D2C brands.",
    label: "people",
  },
  {
    id: "task-6",
    name: "Slack Riley about the 1200×1200 OAuth icon",
    description:
      "Draft DM ready. Reminder needs your sign-off — Shopify rejects anything ≥1MB.",
    hasPendingPrompt: true,
    sessionState: "requires_action",
  },
  {
    id: "task-7",
    name: "Triage Linear bugs older than 2 weeks",
    description:
      "14 stale tickets. 5 are duplicates; 4 need owners. Cluster summary + dedupe plan attached.",
    label: "linear-triage",
  },
  {
    id: "task-8",
    name: "Order Mediterranean takeout for the team — 4 people, 8 PM",
    description:
      "Lamb salad, 2 chicken bowls (one dry, no cheese), 1 grain bowl. Total $112 before tip.",
    hasPendingPrompt: true,
    sessionState: "requires_action",
  },
  {
    id: "task-9",
    name: "Cancel the unused premium card, apply for the airline card",
    description:
      "Cancellation request drafted. New-card app needs your employer field + 4-digit referral code.",
    hasPendingPrompt: true,
    sessionState: "requires_action",
  },
  {
    id: "task-10",
    name: "Pull Linear tickets shipped in the last 48 hours",
    description:
      "12 tickets across 3 projects. 4 had user-reported origins — re-engagement emails staged.",
  },
  {
    id: "task-11",
    name: "Send Mon 5 PM PT cal invite to Alex with agenda",
    description:
      "Drafted invite + dial-in. Holding on send until you confirm the room is booked.",
    hasPendingPrompt: true,
    sessionState: "requires_action",
    scheduledAt: at(14, 0),
  },
  {
    id: "task-12",
    name: "SaaS-vs-Energy breakdown across NASDAQ + S&P 500",
    description:
      "38% SaaS-flavored, 22% energy, rest mixed. Draft macro POV one-pager ready.",
  },
  {
    id: "task-13",
    name: "Reschedule investor sync with Vega → Friday",
    description:
      "Pulled both calendars. 4 PM PT slot looks open. Stuck — their assistant hasn't replied.",
    etlFailed: true,
    scheduledAt: at(11, 0) - 18 * HOUR_MS,
  },
  {
    id: "task-14",
    name: "Follow up with Marco about the May gardener no-show",
    description:
      "Drafted a check-in for the group thread + new visit date proposal.",
    hasPendingPrompt: true,
    sessionState: "requires_action",
  },
  {
    id: "task-15",
    name: "Reply to Mira with a Friday slot she'll like",
    description:
      "Read her cal; found her preferred 11 AM ET window. Draft reply queued.",
    hasPendingPrompt: true,
    sessionState: "requires_action",
    scheduledAt: at(11, 0),
  },
  {
    id: "task-16",
    name: "Morning Briefing — yesterday's recap (stale)",
    description: "Compiled yesterday's calendar, overnight inbox, and Slack diff. Open for last-day catch-up.",
    label: "morning-briefing",
    scheduledAt: now - 30 * HOUR_MS,
  },
  {
    id: "task-17",
    name: "Email Triage — yesterday 8:30 AM",
    description: "Cleared 42 emails to zero. No threads left flagged. Archive when ready.",
    label: "inbox-zero",
    scheduledAt: now - 30 * HOUR_MS,
  },
  // Recurring (automations)
  {
    id: "rec-1",
    name: "Morning Briefing",
    description: "Calendar, overnight inbox, Slack diffs. Weekdays at 8:00 AM.",
    recurring: true,
    label: "morning-briefing",
  },
  {
    id: "rec-2",
    name: "Email Triage — Inbox Zero",
    description: "Archives, replies, snoozes the AM batch. Weekdays at 8:30 AM.",
    recurring: true,
    label: "inbox-zero",
  },
  {
    id: "rec-3",
    name: "Linear Triage",
    description: "Daily bug + feature sweep. Pulls overdue tickets, surfaces unassigned. 9:00 AM weekdays.",
    recurring: true,
    label: "linear-triage",
  },
  {
    id: "rec-4",
    name: "EA Bot",
    description: "Hourly inbox check — drafts replies, flags time-sensitive items. 9 AM–7 PM.",
    recurring: true,
    label: "ea-bot",
  },
  {
    id: "rec-5",
    name: "Heartbeat Check",
    description: "System and connector health. Every 4 hours.",
    recurring: true,
    label: "heartbeat",
  },
  {
    id: "rec-6",
    name: "Memory Review",
    description: "Consolidates recent activity into long-term memory. Twice daily.",
    recurring: true,
    label: "memory-review",
  },
  // Completed
  {
    id: "done-1",
    name: "Enrich attendee CRM with LinkedIn bios + emails",
    description: "30 profiles enriched and uploaded as a CSV. Opened in Finder.",
    isArchived: true,
    label: "people",
  },
  {
    id: "done-2",
    name: "Apply the deck design system to slides 3–8",
    description: "Pulled the design reference, rebuilt the affected slides. Light mode, on-theme.",
    isArchived: true,
    label: "decks",
  },
];

const RECURRING_LABELS = new Set([
  "morning-briefing",
  "inbox-zero",
  "linear-triage",
  "ea-bot",
  "heartbeat",
  "memory-review",
]);

const LABEL_NAMES: Record<string, string> = {
  "morning-briefing": "Morning Briefing",
  "inbox-zero": "Inbox Zero",
  "linear-triage": "Linear Triage",
  "ea-bot": "EA Bot",
  heartbeat: "Heartbeat",
  "memory-review": "Memory Review",
  travel: "Travel",
  decks: "Decks",
  people: "People",
};

function stateKindFromMeta(meta: SessionMeta): StateKind {
  if (meta.isArchived) return "archived";
  if (meta.etlFailed) return "blocked";
  if (meta.isProcessing || meta.sessionState === "running") return "running";
  if (meta.hasPendingPrompt || meta.sessionState === "requires_action")
    return "attention";
  return "idle";
}

const STATE_LABEL: Record<StateKind, string> = {
  archived: "Done — click to restore",
  running: "Runner is working",
  attention: "Needs your input",
  blocked: "Stuck",
  idle: "Mark done",
};

function StateIcon({
  kind,
  onClick,
  actionLabel,
}: {
  kind: StateKind;
  onClick?: (event: ReactMouseEvent) => void;
  actionLabel?: string;
}) {
  const Icon =
    kind === "archived"
      ? SquareCheck
      : kind === "running"
        ? Clock
        : kind === "blocked"
          ? AlertOctagon
          : Square;
  const label = actionLabel ?? STATE_LABEL[kind];

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`agt-state-btn agt-state-${kind}`}
        data-stop-row-open
      >
        <Icon size={16} aria-hidden="true" />
      </button>
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      className={`agt-state-icon agt-state-${kind}`}
    >
      <Icon size={16} aria-hidden="true" />
    </span>
  );
}

function LabelPill({
  label,
  recurring,
  onClick,
}: {
  label: string;
  recurring?: boolean;
  onClick?: (event: ReactMouseEvent) => void;
}) {
  const className = `agt-label-pill ${recurring ? "is-recurring" : ""} ${
    onClick ? "is-clickable" : ""
  }`;
  const content = (
    <>
      {recurring ? (
        <Repeat size={10} aria-hidden="true" className="agt-label-icon" />
      ) : (
        <span className="agt-label-dot" aria-hidden="true" />
      )}
      <span>{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        data-stop-row-open
      >
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
}

function formatScheduleLabel(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();
  const time = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  if (sameDay) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  const sameYear = date.getFullYear() === today.getFullYear();
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

function secondaryTextFromMeta(meta: SessionMeta): {
  text: string;
  isStale: boolean;
} {
  if (meta.description) {
    const isStale =
      meta.lastDescriptionAt != null &&
      meta.lastMessageAt != null &&
      meta.lastDescriptionAt < meta.lastMessageAt;
    return { text: meta.description, isStale };
  }
  if (meta.preview) return { text: meta.preview, isStale: false };
  if (meta.etlFailed)
    return { text: "Could not load session — open to retry.", isStale: false };
  if (meta.hasPendingPrompt || meta.sessionState === "requires_action")
    return { text: "Waiting on your input.", isStale: false };
  if (meta.sessionState === "running" || meta.isProcessing)
    return { text: "Runner is working…", isStale: false };
  return { text: "Idle.", isStale: false };
}

function TodoRow({
  meta,
  onOpen,
  onToggleArchive,
  onLabelClick,
  highlighted,
  staging,
  isStaged,
  onToggleStaging,
}: {
  meta: SessionMeta;
  onOpen: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onLabelClick?: (labelId: string) => void;
  highlighted?: boolean;
  staging?: BulkStaging | null;
  isStaged?: boolean;
  onToggleStaging?: (id: string) => void;
}) {
  const stateKind = stateKindFromMeta(meta);
  const { text: secondaryText, isStale } = secondaryTextFromMeta(meta);
  const title = meta.name?.trim() || "Untitled";
  const scheduledAt = meta.scheduledAt ?? null;
  const chipLabel = scheduledAt != null ? formatScheduleLabel(scheduledAt) : null;
  const isOverdue =
    scheduledAt != null && scheduledAt < Date.now() && !meta.isArchived;
  const canToggle = stateKind !== "running" && stateKind !== "blocked";
  const labelId = meta.label;
  const labelDisplay = labelId ? LABEL_NAMES[labelId] ?? labelId : undefined;
  const recurring = labelId ? RECURRING_LABELS.has(labelId) : false;

  const isRowTarget = (event: ReactMouseEvent) => {
    const target = event.target as HTMLElement | null;
    return target != null && !target.closest("button, [data-stop-row-open]");
  };

  const stopRowOpen = (event: ReactMouseEvent) => {
    event.stopPropagation();
  };

  const handleToggle = canToggle
    ? (event: ReactMouseEvent) => {
        event.stopPropagation();
        onToggleArchive(meta.id);
      }
    : undefined;

  // --- Staging diff ---------------------------------------------------------
  const inStagingMode = !!staging;
  const stagedKind = inStagingMode && isStaged ? staging!.kind : null;
  const isClearingSchedule =
    stagedKind === "schedule" && staging?.clearSchedule === true;
  const willReplaceChip =
    stagedKind === "schedule" && !isClearingSchedule && scheduledAt != null;
  const willClearChip = isClearingSchedule && scheduledAt != null;
  const willArchive = stagedKind === "archive" || stagedKind === "delete";

  const previewChip = (() => {
    if (!isStaged || !staging) return null;
    const k = staging.kind;
    if (k === "schedule") {
      if (staging.clearSchedule && scheduledAt != null) {
        return { text: "no schedule", kind: "unschedule" as const };
      }
      if (!staging.clearSchedule && staging.scheduledAt != null) {
        return {
          text: formatScheduleLabel(staging.scheduledAt),
          kind: "schedule" as const,
        };
      }
      return null;
    }
    if (k === "archive") {
      return { text: "→ Completed", kind: "archive" as const };
    }
    if (k === "delete") {
      return { text: "→ Delete", kind: "delete" as const };
    }
    if (k === "addToProject" && staging.projectId) {
      const project = PROJECTS.find((p) => p.id === staging.projectId);
      return {
        text: `→ ${project?.name ?? "Project"}`,
        kind: "project" as const,
      };
    }
    return null;
  })();

  const handleRowClick = (event: ReactMouseEvent) => {
    if (!isRowTarget(event)) return;
    if (inStagingMode && onToggleStaging) {
      onToggleStaging(meta.id);
      return;
    }
    onOpen(meta.id);
  };

  return (
    <div
      className={`agt-row ${meta.isArchived ? "is-archived" : ""} ${
        highlighted ? "is-highlighted" : ""
      } ${inStagingMode ? "is-staging-mode" : ""} ${
        inStagingMode && isStaged ? "is-staged" : ""
      } ${inStagingMode && !isStaged ? "is-not-staged" : ""}`}
      onClick={inStagingMode ? handleRowClick : undefined}
      role={inStagingMode ? "checkbox" : undefined}
      aria-checked={inStagingMode ? !!isStaged : undefined}
      tabIndex={inStagingMode ? 0 : undefined}
    >
      <div
        role={inStagingMode ? undefined : "button"}
        tabIndex={inStagingMode ? -1 : 0}
        onClick={inStagingMode ? undefined : handleRowClick}
        className="agt-row-main"
      >
        {inStagingMode ? (
          <button
            type="button"
            className={`agt-stage-check ${isStaged ? "is-on" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleStaging?.(meta.id);
            }}
            aria-pressed={!!isStaged}
            aria-label={isStaged ? "Remove from operation" : "Add to operation"}
            data-stop-row-open
          >
            {isStaged ? (
              <Check size={12} aria-hidden="true" />
            ) : (
              <Plus size={12} aria-hidden="true" />
            )}
          </button>
        ) : (
          <StateIcon
            kind={stateKind}
            onClick={handleToggle}
            actionLabel={
              meta.isArchived
                ? "Restore session"
                : canToggle
                  ? "Mark done"
                  : undefined
            }
          />
        )}
        <div className="agt-row-content">
          <div className="agt-row-title-line">
            <span
              className={`agt-row-title ${willArchive ? "is-struck" : ""}`}
            >
              {title}
            </span>
            {labelId && (
              <LabelPill
                label={labelDisplay ?? labelId}
                recurring={recurring}
                onClick={
                  onLabelClick
                    ? (event) => {
                        event.stopPropagation();
                        onLabelClick(labelId);
                      }
                    : undefined
                }
              />
            )}
            {chipLabel &&
              (inStagingMode ? (
                <span
                  className={`agt-schedule-chip ${isOverdue ? "is-overdue" : ""} ${
                    willReplaceChip || willClearChip ? "is-struck" : ""
                  }`}
                  aria-label={
                    isOverdue ? `Overdue: ${chipLabel}` : `Scheduled ${chipLabel}`
                  }
                >
                  {isOverdue ? (
                    <AlertTriangle size={11} aria-hidden="true" />
                  ) : (
                    <Calendar size={11} aria-hidden="true" />
                  )}
                  <span>{chipLabel}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={stopRowOpen}
                  aria-label={
                    isOverdue
                      ? `Overdue: ${chipLabel}. Edit schedule.`
                      : "Edit schedule"
                  }
                  data-stop-row-open
                  className={`agt-schedule-chip ${isOverdue ? "is-overdue" : ""}`}
                >
                  {isOverdue ? (
                    <AlertTriangle size={11} aria-hidden="true" />
                  ) : (
                    <Calendar size={11} aria-hidden="true" />
                  )}
                  <span>{chipLabel}</span>
                </button>
              ))}
            {previewChip && (
              <span className={`agt-preview-chip is-${previewChip.kind}`}>
                <ArrowRight size={10} aria-hidden="true" />
                <span>{previewChip.text}</span>
              </span>
            )}
          </div>
          <span className={`agt-row-secondary ${isStale ? "is-stale" : ""}`}>
            {secondaryText}
            {isStale && (
              <span className="agt-stale-tag"> (may be outdated)</span>
            )}
          </span>
        </div>
      </div>
      <div className="agt-row-actions">
        {inStagingMode && isStaged ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleStaging?.(meta.id);
            }}
            aria-label="Remove from operation"
            data-stop-row-open
            className="agt-row-action is-remove"
          >
            <Minus size={14} aria-hidden="true" />
          </button>
        ) : !inStagingMode ? (
          <>
            <button
              type="button"
              onClick={stopRowOpen}
              aria-label={
                scheduledAt != null ? "Edit schedule" : "Set schedule"
              }
              data-stop-row-open
              className="agt-row-action"
            >
              <Clock size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={stopRowOpen}
              aria-label="Add to subscription"
              data-stop-row-open
              className="agt-row-action"
            >
              <Bookmark size={14} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function TodoListSection({
  label,
  count,
  collapsible = false,
  defaultExpanded = true,
  leading,
  children,
}: {
  label: string;
  count: number;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  leading?: ReactNode;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isExpanded = collapsible ? expanded : true;

  const heading = (
    <>
      {collapsible &&
        (isExpanded ? (
          <ChevronDown size={14} aria-hidden="true" className="agt-section-chev" />
        ) : (
          <ChevronRight size={14} aria-hidden="true" className="agt-section-chev" />
        ))}
      {leading}
      <span>{label}</span>
      {count > 0 && <span className="agt-section-count">{count}</span>}
    </>
  );

  return (
    <section className="agt-section">
      <div className="agt-section-head">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={isExpanded}
            className="agt-section-toggle"
          >
            {heading}
          </button>
        ) : (
          <div className="agt-section-static">{heading}</div>
        )}
      </div>
      {isExpanded && <div className="agt-section-body">{children}</div>}
    </section>
  );
}

function CreateRecurringRow({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="agt-create-row"
      aria-label="Create recurring task"
    >
      <span className="agt-create-row-icon" aria-hidden="true">
        <Plus size={14} />
      </span>
      <span className="agt-create-row-text">Create recurring task</span>
    </button>
  );
}

function AddTodoInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState("");
  const canSubmit = value.trim().length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(value.trim());
    setValue("");
  };

  return (
    <form className="agt-add-form" onSubmit={handleSubmit}>
      <input
        className="agt-add-input"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Add a todo…"
        aria-label="Add a todo"
      />
      <button
        type="button"
        className="agt-add-btn agt-add-mic"
        disabled
        aria-label="Voice dictation (coming soon)"
        title="Voice dictation (coming soon)"
      >
        <Mic size={14} aria-hidden="true" />
      </button>
      <button
        type="submit"
        className="agt-add-btn agt-add-send"
        disabled={!canSubmit}
        aria-label="Send"
      >
        <ArrowUp size={16} aria-hidden="true" />
      </button>
    </form>
  );
}

type Bucket = {
  key: string;
  label: string;
  collapsible: boolean;
  defaultExpanded: boolean;
  leading?: ReactNode;
  items: SessionMeta[];
};

function partitionSessions(sessions: SessionMeta[]): Bucket[] {
  const today: SessionMeta[] = [];
  const tasks: SessionMeta[] = [];
  const recurring: SessionMeta[] = [];
  const completed: SessionMeta[] = [];

  const startOfTomorrow = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d.getTime();
  })();

  for (const meta of sessions) {
    if (meta.isArchived) {
      completed.push(meta);
      continue;
    }
    if (meta.recurring) {
      recurring.push(meta);
      continue;
    }
    if (meta.isProcessing || meta.sessionState === "running") {
      today.push(meta);
      continue;
    }
    if (meta.scheduledAt != null && meta.scheduledAt < startOfTomorrow) {
      today.push(meta);
      continue;
    }
    tasks.push(meta);
  }

  return [
    {
      key: "today",
      label: "Today",
      collapsible: false,
      defaultExpanded: true,
      items: today,
    },
    {
      key: "tasks",
      label: "Tasks",
      collapsible: true,
      defaultExpanded: true,
      items: tasks,
    },
    {
      key: "recurring",
      label: "Recurring tasks",
      collapsible: true,
      defaultExpanded: false,
      leading: (
        <Repeat
          size={12}
          aria-hidden="true"
          className="agt-section-leading-icon agt-section-leading-success"
        />
      ),
      items: recurring,
    },
    {
      key: "completed",
      label: "Completed",
      collapsible: true,
      defaultExpanded: false,
      leading: (
        <SquareCheck
          size={12}
          aria-hidden="true"
          className="agt-section-leading-icon"
        />
      ),
      items: completed,
    },
  ];
}

// --- Bulk operations (bunny CRUD) -----------------------------------------

type BulkKind = "schedule" | "addToProject" | "archive" | "delete";

const PROJECTS: Array<{ id: string; name: string }> = [
  { id: "travel", name: "Travel" },
  { id: "pitch-prep", name: "Pitch Prep" },
  { id: "decks", name: "Decks" },
  { id: "personal-admin", name: "Personal Admin" },
  { id: "engineering", name: "Engineering" },
];

const KIND_LABEL: Record<BulkKind, string> = {
  schedule: "Schedule",
  addToProject: "Project",
  archive: "Archive",
  delete: "Delete",
};

type BulkSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  kind: BulkKind;
  Icon: typeof CalendarPlus;
  matches: (session: SessionMeta) => boolean;
  defaultScheduledAt?: number;
  /** If true, the suggestion lands in 'clear schedule' state on schedule kind. */
  defaultClearSchedule?: boolean;
};

type BulkStaging = {
  suggestion: BulkSuggestion;
  /** The active operation kind. Starts from suggestion.kind; user can switch. */
  kind: BulkKind;
  itemIds: Set<string>;
  scheduledAt?: number;
  /** When kind=schedule and this is true, apply will clear scheduledAt on items. */
  clearSchedule?: boolean;
  projectId?: string;
  /** Y offset (px) where the bubble visually originated, for slide-up animation. */
  sourceOffset?: number;
  /** Override for the bubble label — used so NL queries show what the user typed. */
  bubbleTitle?: string;
  /** Override for the bubble icon — used so NL queries always read as user-asked. */
  bubbleIcon?: typeof Sparkles;
};

// --- Schedule helpers (ported from cambridge quick-schedule.ts) -----------

const EOD_HOUR = 17;

type QuickScheduleOption = "today" | "tomorrow" | "day-after";

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function advanceOverWeekend(date: Date): Date {
  const result = new Date(date);
  while (isWeekend(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

function setEod(date: Date): Date {
  const result = new Date(date);
  result.setHours(EOD_HOUR, 0, 0, 0);
  return result;
}

function isQuickOptionAvailable(
  option: QuickScheduleOption,
  now = new Date(),
): boolean {
  if (option !== "today") return true;
  return now.getHours() < EOD_HOUR;
}

function quickScheduleTimestamp(
  option: QuickScheduleOption,
  now = new Date(),
): number {
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  if (option === "today") return setEod(base).getTime();
  if (option === "tomorrow") {
    base.setDate(base.getDate() + 1);
    return setEod(advanceOverWeekend(base)).getTime();
  }
  // day-after: start from tomorrow's adjusted date, then +1 day (weekend-skip
  // again so we don't land on Sat/Sun). Guarantees a different day than
  // tomorrow even when both naive dates fall on a weekend.
  const tomorrowTs = quickScheduleTimestamp("tomorrow", now);
  const next = new Date(tomorrowTs);
  next.setDate(next.getDate() + 1);
  return setEod(advanceOverWeekend(next)).getTime();
}

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

function quickOptionLabel(
  option: QuickScheduleOption,
  now = new Date(),
): string {
  if (option === "today") return "Today";
  if (option === "tomorrow") {
    const ts = quickScheduleTimestamp("tomorrow", now);
    const date = new Date(ts);
    const literalTomorrow = new Date(now);
    literalTomorrow.setDate(literalTomorrow.getDate() + 1);
    if (
      date.getDate() === literalTomorrow.getDate() &&
      date.getMonth() === literalTomorrow.getMonth()
    ) {
      return "Tomorrow";
    }
    return weekdayFormatter.format(date);
  }
  const ts = quickScheduleTimestamp("day-after", now);
  return weekdayFormatter.format(new Date(ts));
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toDateInputValue(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toTimeInputValue(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function combineDateAndTime(dateStr: string, timeStr: string): number {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const result = new Date();
  result.setFullYear(y ?? result.getFullYear(), (mo ?? 1) - 1, d ?? 1);
  result.setHours(h ?? 0, mi ?? 0, 0, 0);
  return result.getTime();
}

function today5pm(): number {
  return quickScheduleTimestamp("today");
}

function todayLateAfternoon(): number {
  const d = new Date();
  if (d.getHours() >= 16) {
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
  } else {
    d.setHours(16, 0, 0, 0);
  }
  return d.getTime();
}

function SchedulePickerPopover({
  value,
  onChange,
  onClear,
  onClose,
}: {
  value: number | undefined;
  onChange: (ts: number) => void;
  onClear?: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const fallback = value ?? today5pm();
  const [dateStr, setDateStr] = useState(toDateInputValue(fallback));
  const [timeStr, setTimeStr] = useState(toTimeInputValue(fallback));

  useEffect(() => {
    const click = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (ref.current && target && !ref.current.contains(target)) onClose();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, [onClose]);

  const now = new Date();
  const quickOptions: Array<{
    option: QuickScheduleOption;
    label: string;
    available: boolean;
  }> = [
    {
      option: "today",
      label: quickOptionLabel("today", now),
      available: isQuickOptionAvailable("today", now),
    },
    {
      option: "tomorrow",
      label: quickOptionLabel("tomorrow", now),
      available: true,
    },
    {
      option: "day-after",
      label: quickOptionLabel("day-after", now),
      available: true,
    },
  ];

  const handleQuick = (option: QuickScheduleOption) => {
    onChange(quickScheduleTimestamp(option));
    onClose();
  };

  const handleSave = () => {
    onChange(combineDateAndTime(dateStr, timeStr));
    onClose();
  };

  const handleReset = () => {
    const fresh = today5pm();
    setDateStr(toDateInputValue(fresh));
    setTimeStr(toTimeInputValue(fresh));
    onChange(fresh);
  };

  const minDate = toDateInputValue(Date.now());

  return (
    <div className="agt-sched-pop" ref={ref} role="dialog" aria-label="Pick a time">
      <div className="agt-sched-quick">
        {quickOptions.map(({ option, label, available }) => (
          <button
            key={option}
            type="button"
            disabled={!available}
            title={available ? `${label} at 5:00 PM` : "Past 5pm — pick a custom time"}
            onClick={() => handleQuick(option)}
            className="agt-sched-quick-btn"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="agt-sched-divider">
        <span className="agt-sched-divider-line" />
        <span className="agt-sched-divider-text">OR</span>
        <span className="agt-sched-divider-line" />
      </div>
      <label className="agt-sched-field">
        <span>Date</span>
        <input
          type="date"
          value={dateStr}
          min={minDate}
          onChange={(event) => setDateStr(event.target.value)}
        />
      </label>
      <label className="agt-sched-field">
        <span>Time</span>
        <input
          type="time"
          value={timeStr}
          onChange={(event) => setTimeStr(event.target.value)}
        />
      </label>
      <div className="agt-sched-actions">
        {onClear && (
          <button
            type="button"
            className="agt-sched-clear"
            onClick={onClear}
          >
            <CalendarX size={12} aria-hidden="true" />
            Clear schedule
          </button>
        )}
        <button
          type="button"
          className="agt-sched-reset"
          onClick={handleReset}
        >
          Reset to 5 PM
        </button>
        <button
          type="button"
          className="agt-sched-save"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function buildSuggestions(sessions: SessionMeta[]): BulkSuggestion[] {
  const matchPrioritize = (s: SessionMeta) =>
    !s.isArchived &&
    !s.recurring &&
    !s.isProcessing &&
    s.sessionState !== "running" &&
    s.scheduledAt == null;

  const matchCleanup = (s: SessionMeta) =>
    !s.isArchived &&
    !s.recurring &&
    (s.label === "morning-briefing" ||
      s.label === "inbox-zero" ||
      s.label === "linear-triage") &&
    s.scheduledAt != null &&
    s.scheduledAt < Date.now();

  const matchOverdue = (s: SessionMeta) =>
    !s.isArchived &&
    !s.recurring &&
    s.scheduledAt != null &&
    s.scheduledAt < Date.now();

  const matchClearAll = (s: SessionMeta) =>
    !s.isArchived && !s.recurring && s.scheduledAt != null;

  const prioritizeCount = sessions.filter(matchPrioritize).length;
  const cleanupCount = sessions.filter(matchCleanup).length;
  const overdueCount = sessions.filter(matchOverdue).length;
  const clearCount = sessions.filter(matchClearAll).length;

  const all: BulkSuggestion[] = [
    {
      id: "prioritize-day",
      title: "Help me prioritize my day",
      subtitle: `Mark ${prioritizeCount} unscheduled task${prioritizeCount === 1 ? "" : "s"} due 5 PM today`,
      kind: "schedule",
      Icon: Sparkles,
      matches: matchPrioritize,
      defaultScheduledAt: today5pm(),
    },
    {
      id: "cleanup",
      title: "Clean up my todos",
      subtitle: `Archive ${cleanupCount} stale briefing${cleanupCount === 1 ? "" : "s"} from earlier today`,
      kind: "archive",
      Icon: Archive,
      matches: matchCleanup,
    },
    {
      id: "pull-overdue",
      title: "Pull overdue into the afternoon",
      subtitle: `Reschedule ${overdueCount} overdue item${overdueCount === 1 ? "" : "s"} for later today`,
      kind: "schedule",
      Icon: ArrowRight,
      matches: matchOverdue,
      defaultScheduledAt: todayLateAfternoon(),
    },
    {
      id: "clear-schedules",
      title: "Clear all schedules",
      subtitle: `Remove the schedule from ${clearCount} item${clearCount === 1 ? "" : "s"}`,
      kind: "schedule",
      Icon: CalendarX,
      matches: matchClearAll,
      defaultClearSchedule: true,
    },
  ];

  // Only surface suggestions that have ≥1 affected row — empty ones are noise.
  return all.filter((suggestion) => sessions.some(suggestion.matches));
}


// Very small natural-language router for the bunny query input. Maps a free-
// form query to one of the known suggestion ids based on a few keyword hints.
// Prototype-level only — production would parse with the LLM and build a
// custom staging plan.
function routeQuery(
  query: string,
  suggestions: BulkSuggestion[],
): BulkSuggestion | null {
  const q = query.toLowerCase();
  const find = (id: string) => suggestions.find((s) => s.id === id);

  if (/(clean|archive|delete|trash|tidy)/.test(q)) {
    return find("cleanup") ?? null;
  }
  if (/(overdue|late|behind)/.test(q)) {
    return find("pull-overdue") ?? null;
  }
  if (/(clear|remove|wipe|reset).*(schedul|time)/.test(q)) {
    return find("clear-schedules") ?? null;
  }
  if (/(prioritize|priorit|focus|today|5\s*pm|evening|due)/.test(q)) {
    return find("prioritize-day") ?? null;
  }
  // No keyword match — let the caller handle it (custom staging with user's text).
  return null;
}

/** Synthetic suggestion used when an NL query doesn't match any built-in. */
const CUSTOM_QUERY_SUGGESTION: BulkSuggestion = {
  id: "_custom-query",
  title: "Custom request",
  subtitle: "",
  kind: "schedule",
  Icon: Sparkles,
  matches: () => false,
};

function BunnyMenu({
  suggestions,
  onPick,
  onPickKind,
  onClose,
  onQuery,
}: {
  suggestions: BulkSuggestion[];
  onPick: (suggestion: BulkSuggestion, sourceOffset: number) => void;
  onPickKind: (kind: BulkKind, sourceOffset: number) => void;
  onClose: () => void;
  onQuery: (query: string, sourceOffset: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (ref.current && target && !ref.current.contains(target)) {
        onClose();
      }
    };
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    // Focus on next frame so animations don't steal focus.
    const focusId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
      window.clearTimeout(focusId);
    };
  }, [onClose]);

  const sourceOffsetFromIndex = (index: number) => {
    const node = itemRefs.current[index];
    return node ? node.offsetTop : index * 50;
  };

  const handlePick = (suggestion: BulkSuggestion, index: number) => {
    onPick(suggestion, sourceOffsetFromIndex(index));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const offset = formRef.current
      ? formRef.current.offsetTop
      : suggestions.length * 50;
    onQuery(trimmed, offset);
    setQuery("");
  };

  const kindActionsRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="agt-bunny-bubbles" ref={ref} role="menu">
      <div
        ref={kindActionsRef}
        className="agt-bunny-kinds"
        style={{ animationDelay: "0ms" }}
      >
        {KIND_OPTIONS.map((option) => (
          <button
            key={option.kind}
            type="button"
            className="agt-bunny-kind"
            onClick={() => {
              const offset = kindActionsRef.current
                ? kindActionsRef.current.offsetTop
                : 0;
              onPickKind(option.kind, offset);
            }}
          >
            <span className="agt-bunny-kind-icon">
              <option.Icon size={12} aria-hidden="true" />
            </span>
            <span>{KIND_LABEL[option.kind]}</span>
          </button>
        ))}
      </div>
      <ul className="agt-bunny-bubble-list">
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className="agt-bunny-bubble-item"
            style={{ animationDelay: `${(index + 1) * 40}ms` }}
          >
            <button
              type="button"
              role="menuitem"
              className="agt-bunny-bubble"
              onClick={() => handlePick(suggestion, index)}
            >
              <span className="agt-bunny-bubble-icon">
                <suggestion.Icon size={12} aria-hidden="true" />
              </span>
              <span className="agt-bunny-bubble-title">{suggestion.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <form ref={formRef} className="agt-bunny-query" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="agt-bunny-query-input"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask bunny something…"
          aria-label="Ask bunny"
        />
        <button
          type="submit"
          className="agt-bunny-query-send"
          disabled={query.trim().length === 0}
          aria-label="Send"
        >
          <ArrowUp size={14} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

const KIND_OPTIONS: Array<{ kind: BulkKind; Icon: typeof CalendarPlus }> = [
  { kind: "schedule", Icon: CalendarPlus },
  { kind: "addToProject", Icon: Bookmark },
  { kind: "archive", Icon: Archive },
  { kind: "delete", Icon: Trash2 },
];

function ProjectPickerPopover({
  value,
  onChange,
  onClose,
}: {
  value: string | undefined;
  onChange: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const click = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (ref.current && target && !ref.current.contains(target)) onClose();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, [onClose]);

  return (
    <div className="agt-project-pop" ref={ref} role="listbox" aria-label="Pick a project">
      {PROJECTS.map((project) => {
        const isActive = value === project.id;
        return (
          <button
            key={project.id}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => onChange(project.id)}
            className={`agt-project-option ${isActive ? "is-active" : ""}`}
          >
            <Bookmark size={12} aria-hidden="true" />
            <span>{project.name}</span>
            {isActive && <Check size={12} aria-hidden="true" className="agt-project-option-check" />}
          </button>
        );
      })}
    </div>
  );
}

function StagingPanel({
  staging,
  onParamChange,
  onClearSchedule,
  onProjectChange,
  onCancel,
  onApply,
}: {
  staging: BulkStaging;
  onParamChange: (next: number) => void;
  onClearSchedule: () => void;
  onProjectChange: (projectId: string) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const count = staging.itemIds.size;
  const kind = staging.kind;
  const Icon = staging.bubbleIcon ?? staging.suggestion.Icon;
  const bubbleTitle = staging.bubbleTitle ?? staging.suggestion.title;

  const hasTarget = kind === "schedule" || kind === "addToProject";
  const itemsLabel = `${count} ${count === 1 ? "item" : "items"}`;

  const scheduleLabel = staging.clearSchedule
    ? "Clear schedule"
    : staging.scheduledAt != null
      ? formatScheduleLabel(staging.scheduledAt)
      : "Pick a time";

  const projectIdActive = staging.projectId ?? PROJECTS[0]?.id;
  const activeProject = PROJECTS.find((p) => p.id === projectIdActive);

  const slideFrom = staging.sourceOffset ?? 0;
  const bubbleStyle: CSSProperties = {
    "--agt-slide-from": `${slideFrom}px`,
  } as CSSProperties;

  return (
    <div className="agt-staging" role="region" aria-label="Bulk operation">
      <div className="agt-staging-bubble" style={bubbleStyle}>
        <span className="agt-staging-bubble-icon">
          <Icon size={14} aria-hidden="true" />
        </span>
        <span className="agt-staging-bubble-title">{bubbleTitle}</span>
        <button
          type="button"
          className="agt-staging-bubble-close"
          onClick={onCancel}
          aria-label="Cancel bulk edit"
          title="Cancel"
        >
          <X size={12} aria-hidden="true" />
        </button>
      </div>
      <div className="agt-staging-panel">
        <div className="agt-staging-row">
          <div className="agt-staging-target-block">
            <span className="agt-staging-count">{itemsLabel}</span>
            {hasTarget && <span className="agt-staging-prep">to</span>}
            {hasTarget && kind === "schedule" && (
              <div className="agt-staging-target">
                <button
                  type="button"
                  onClick={() => setPickerOpen((open) => !open)}
                  className={`agt-staging-chip ${pickerOpen ? "is-open" : ""}`}
                  aria-haspopup="dialog"
                  aria-expanded={pickerOpen}
                >
                  <Calendar size={12} aria-hidden="true" />
                  <span>{scheduleLabel}</span>
                  <ChevronDown size={12} aria-hidden="true" />
                </button>
                {pickerOpen && (
                  <SchedulePickerPopover
                    value={staging.scheduledAt}
                    onChange={onParamChange}
                    onClear={() => {
                      onClearSchedule();
                      setPickerOpen(false);
                    }}
                    onClose={() => setPickerOpen(false)}
                  />
                )}
              </div>
            )}
            {hasTarget && kind === "addToProject" && (
              <div className="agt-staging-target">
                <button
                  type="button"
                  onClick={() => setProjectPickerOpen((open) => !open)}
                  className={`agt-staging-chip ${projectPickerOpen ? "is-open" : ""}`}
                  aria-haspopup="listbox"
                  aria-expanded={projectPickerOpen}
                >
                  <Bookmark size={12} aria-hidden="true" />
                  <span>{activeProject?.name ?? "Pick a project"}</span>
                  <ChevronDown size={12} aria-hidden="true" />
                </button>
                {projectPickerOpen && (
                  <ProjectPickerPopover
                    value={projectIdActive}
                    onChange={(id) => {
                      onProjectChange(id);
                      setProjectPickerOpen(false);
                    }}
                    onClose={() => setProjectPickerOpen(false)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        {count === 0 && (
          <p className="agt-staging-hint">
            Tap rows below to include them.
          </p>
        )}
      </div>
      <div className="agt-staging-action-bubbles">
        <button
          type="button"
          onClick={onCancel}
          className="agt-staging-action-bubble"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={count === 0}
          className={`agt-staging-action-bubble is-primary ${kind === "delete" ? "is-destructive" : ""}`}
          aria-label={kind === "delete" ? "Delete" : "Apply"}
        >
          {kind === "delete" ? (
            <>
              <Trash2 size={13} aria-hidden="true" />
              <span>Delete</span>
            </>
          ) : (
            <>
              <Check size={13} aria-hidden="true" />
              <span>Apply</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

type RailView = "dashboard" | "list";

function VerticalRail({
  view,
  onViewChange,
  bunnyMenuOpen,
  onToggleBunnyMenu,
  suggestions,
  onPickSuggestion,
  onPickKind,
  onBunnyQuery,
  staging,
  onParamChange,
  onClearSchedule,
  onProjectChange,
  onCancelStaging,
  onApplyStaging,
}: {
  view: RailView;
  onViewChange: (next: RailView) => void;
  bunnyMenuOpen: boolean;
  onToggleBunnyMenu: () => void;
  suggestions: BulkSuggestion[];
  onPickSuggestion: (suggestion: BulkSuggestion, sourceOffset: number) => void;
  onPickKind: (kind: BulkKind, sourceOffset: number) => void;
  onBunnyQuery: (query: string, sourceOffset: number) => void;
  staging: BulkStaging | null;
  onParamChange: (next: number) => void;
  onClearSchedule: () => void;
  onProjectChange: (projectId: string) => void;
  onCancelStaging: () => void;
  onApplyStaging: () => void;
}) {
  const items: Array<{ id: RailView; label: string; Icon: typeof Activity }> = [
    { id: "dashboard", label: "Dashboard", Icon: Activity },
    { id: "list", label: "List", Icon: ListChecks },
  ];
  const activeIndex = items.findIndex((item) => item.id === view);

  const hasStagedOp = !!staging;

  return (
    <div className="agt-rail" role="navigation" aria-label="Home view">
      <button
        type="button"
        className={`agt-rail-sprite ${
          bunnyMenuOpen || hasStagedOp ? "is-active" : ""
        }`}
        aria-label={hasStagedOp ? "Cancel bulk edit" : "Bunny suggestions"}
        title={hasStagedOp ? "Cancel bulk edit" : "Bunny suggestions"}
        aria-haspopup="menu"
        aria-expanded={bunnyMenuOpen || hasStagedOp}
        onClick={hasStagedOp ? onCancelStaging : onToggleBunnyMenu}
      >
        <img
          src={`${import.meta.env.BASE_URL}bunny/idle_1.gif`}
          alt=""
          aria-hidden="true"
        />
        <span className="agt-rail-sprite-dot" aria-hidden="true" />
      </button>
      {staging ? (
        <StagingPanel
          staging={staging}
          onParamChange={onParamChange}
          onClearSchedule={onClearSchedule}
          onProjectChange={onProjectChange}
          onCancel={onCancelStaging}
          onApply={onApplyStaging}
        />
      ) : (
        bunnyMenuOpen && (
          <BunnyMenu
            suggestions={suggestions}
            onPick={onPickSuggestion}
            onPickKind={onPickKind}
            onClose={onToggleBunnyMenu}
            onQuery={onBunnyQuery}
          />
        )
      )}
      <div
        className="agt-rail-pill"
        role="tablist"
        aria-orientation="vertical"
        aria-label="View"
      >
        <span
          className="agt-rail-indicator"
          aria-hidden="true"
          style={{ transform: `translateY(${activeIndex * 28}px)` }}
        />
        {items.map((item) => {
          const isActive = item.id === view;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
              title={item.label}
              onClick={() => onViewChange(item.id)}
              className={`agt-rail-btn ${isActive ? "is-active" : ""}`}
            >
              <item.Icon size={16} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AgentTodolist() {
  const [sessions, setSessions] = useState<SessionMeta[]>(SEED_SESSIONS);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [railView, setRailView] = useState<RailView>("list");
  const [bunnyMenuOpen, setBunnyMenuOpen] = useState(false);
  const [staging, setStaging] = useState<BulkStaging | null>(null);
  const [calloutDismissed, setCalloutDismissed] = useState(false);

  const suggestions = useMemo(() => buildSuggestions(sessions), [sessions]);
  const buckets = useMemo(() => partitionSessions(sessions), [sessions]);

  const handleOpen = (id: string) => {
    setHighlightedId((current) => (current === id ? null : id));
  };

  const handleToggleArchive = (id: string) => {
    setSessions((current) =>
      current.map((session) =>
        session.id === id
          ? { ...session, isArchived: !session.isArchived }
          : session,
      ),
    );
  };

  const handleAdd = (text: string) => {
    const fresh: SessionMeta = {
      id: `new-${Math.random().toString(36).slice(2, 8)}`,
      name: text,
      sessionState: "idle",
    };
    setSessions((current) => [fresh, ...current]);
  };

  const handleCreateRecurring = () => {
    const name = window.prompt("Name this recurring task", "New recurring task");
    if (!name || !name.trim()) return;
    const fresh: SessionMeta = {
      id: `new-rec-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      description: "Runs daily at 9:00 AM. Edit the schedule to customize.",
      recurring: true,
      sessionState: "idle",
    };
    setSessions((current) => [...current, fresh]);
  };

  const handlePickSuggestion = (
    suggestion: BulkSuggestion,
    sourceOffset = 0,
    bubbleOverride?: { title: string; icon: typeof Sparkles },
  ) => {
    // Pre-populate from the suggestion's matcher so the user sees the proposed
    // diff immediately. They can still toggle rows in/out before applying.
    const matched = sessions.filter(suggestion.matches);
    setStaging({
      suggestion,
      kind: suggestion.kind,
      itemIds: new Set(matched.map((s) => s.id)),
      scheduledAt: suggestion.defaultScheduledAt,
      clearSchedule: suggestion.defaultClearSchedule,
      sourceOffset,
      bubbleTitle: bubbleOverride?.title,
      bubbleIcon: bubbleOverride?.icon,
    });
    setBunnyMenuOpen(false);
  };

  const handlePickKind = (kind: BulkKind, sourceOffset = 0) => {
    // Direct entry — start a fresh staging with the chosen kind and no
    // pre-populated items. User picks rows themselves.
    const synthetic: BulkSuggestion = {
      id: `_direct-${kind}`,
      title:
        kind === "schedule"
          ? "Schedule items"
          : kind === "addToProject"
            ? "Add to project"
            : kind === "archive"
              ? "Archive items"
              : "Delete items",
      subtitle: "",
      kind,
      Icon:
        kind === "schedule"
          ? CalendarPlus
          : kind === "addToProject"
            ? Bookmark
            : kind === "archive"
              ? Archive
              : Trash2,
      matches: () => false,
      defaultScheduledAt: kind === "schedule" ? today5pm() : undefined,
    };
    setStaging({
      suggestion: synthetic,
      kind,
      itemIds: new Set(),
      scheduledAt: synthetic.defaultScheduledAt,
      projectId: kind === "addToProject" ? PROJECTS[0]?.id : undefined,
      sourceOffset,
    });
    setBunnyMenuOpen(false);
  };

  const handleBunnyQuery = (query: string, sourceOffset = 0) => {
    const routed = routeQuery(query, suggestions);
    if (routed) {
      // Match found — pre-populate based on the routed suggestion but show the
      // user's typed text in the bubble so they recognize what they asked.
      handlePickSuggestion(routed, sourceOffset, {
        title: query,
        icon: Sparkles,
      });
      return;
    }
    // No keyword match — open a generic staging with 0 items selected and the
    // user's query as the bubble. They pick rows + the action kind themselves.
    setStaging({
      suggestion: CUSTOM_QUERY_SUGGESTION,
      kind: "schedule",
      itemIds: new Set(),
      scheduledAt: today5pm(),
      sourceOffset,
      bubbleTitle: query,
      bubbleIcon: Sparkles,
    });
    setBunnyMenuOpen(false);
  };

  const handleToggleStaging = (id: string) => {
    setStaging((current) => {
      if (!current) return current;
      const next = new Set(current.itemIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...current, itemIds: next };
    });
  };

  const handleCancelStaging = () => {
    setStaging(null);
    setBunnyMenuOpen(false);
  };

  const handleApplyStaging = () => {
    if (!staging || staging.itemIds.size === 0) return;
    const { kind, scheduledAt, clearSchedule, projectId, itemIds } = staging;

    if (kind === "delete") {
      setSessions((current) => current.filter((s) => !itemIds.has(s.id)));
      setStaging(null);
      return;
    }

    setSessions((current) =>
      current.map((session) => {
        if (!itemIds.has(session.id)) return session;
        if (kind === "schedule") {
          if (clearSchedule) return { ...session, scheduledAt: undefined };
          return { ...session, scheduledAt };
        }
        if (kind === "archive") return { ...session, isArchived: true };
        if (kind === "addToProject" && projectId) {
          return { ...session, label: projectId };
        }
        return session;
      }),
    );
    setStaging(null);
  };

  const handleParamChange = (next: number) => {
    setStaging((current) =>
      current
        ? { ...current, scheduledAt: next, clearSchedule: false }
        : current,
    );
  };

  const handleClearSchedule = () => {
    setStaging((current) =>
      current ? { ...current, clearSchedule: true } : current,
    );
  };

  const handleProjectChange = (projectId: string) => {
    setStaging((current) =>
      current ? { ...current, projectId } : current,
    );
  };

  const showCallout = !bunnyMenuOpen && !staging && !calloutDismissed;

  return (
    <div className={`agt-shell ${staging ? "is-bulk-staging" : ""}`}>
      {showCallout && (
        <div className="agt-callout" role="note">
          <span className="agt-callout-icon" aria-hidden="true">
            <Sparkles size={14} />
          </span>
          <div className="agt-callout-body">
            <p className="agt-callout-title">Click the bunny →</p>
            <p className="agt-callout-desc">
              Bulk-handle your todos — schedule, add to a project, archive, or
              delete multiple items at once.
            </p>
          </div>
          <button
            type="button"
            className="agt-callout-close"
            onClick={() => setCalloutDismissed(true)}
            aria-label="Dismiss"
            title="Dismiss"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="agt-scroll">
        <div className="agt-content">
          {buckets.map((bucket) => {
            // Always render the recurring section so the "Create recurring task"
            // affordance stays available, even when there are no recurring items.
            if (bucket.items.length === 0 && bucket.key !== "recurring") return null;
            return (
              <TodoListSection
                key={bucket.key}
                label={bucket.label}
                count={bucket.items.length}
                collapsible={bucket.collapsible}
                defaultExpanded={bucket.defaultExpanded}
                leading={bucket.leading}
              >
                {bucket.key === "recurring" && (
                  <CreateRecurringRow onCreate={handleCreateRecurring} />
                )}
                {bucket.items.map((meta) => (
                  <TodoRow
                    key={meta.id}
                    meta={meta}
                    onOpen={handleOpen}
                    onToggleArchive={handleToggleArchive}
                    highlighted={highlightedId === meta.id}
                    staging={staging}
                    isStaged={staging?.itemIds.has(meta.id) ?? false}
                    onToggleStaging={handleToggleStaging}
                  />
                ))}
              </TodoListSection>
            );
          })}
        </div>
      </div>
      <div className="agt-footer">
        <div className="agt-footer-inner">
          <AddTodoInput onSubmit={handleAdd} />
        </div>
      </div>
      <VerticalRail
        view={railView}
        onViewChange={setRailView}
        bunnyMenuOpen={bunnyMenuOpen}
        onToggleBunnyMenu={() => setBunnyMenuOpen((open) => !open)}
        suggestions={suggestions}
        onPickSuggestion={handlePickSuggestion}
        onPickKind={handlePickKind}
        onBunnyQuery={handleBunnyQuery}
        staging={staging}
        onParamChange={handleParamChange}
        onClearSchedule={handleClearSchedule}
        onProjectChange={handleProjectChange}
        onCancelStaging={handleCancelStaging}
        onApplyStaging={handleApplyStaging}
      />
    </div>
  );
}
