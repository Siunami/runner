import {
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  HelpCircle,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Tag,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { ArtifactView } from "./Artifact";
import type {
  ActionCardType,
  ProgressMicroEvent,
  ResolutionKind,
  RunnerActionCard as Card,
} from "./runnerData";

type ResolveFn = (cardId: string, kind: ResolutionKind, note?: string) => void;

const typeMeta: Record<ActionCardType, { label: string; Icon: typeof Info }> = {
  decision: { label: "Decision", Icon: GitBranch },
  approval: { label: "Approval", Icon: CheckCircle2 },
  clarification: { label: "Clarification", Icon: HelpCircle },
  "metadata-suggestion": { label: "Suggestion", Icon: Tag },
  informational: { label: "Update", Icon: Info },
  progress: { label: "In progress", Icon: Loader2 },
  failure: { label: "Stuck", Icon: AlertOctagon },
  "follow-up": { label: "Follow-up", Icon: Plus },
};

const resolutionLabel: Record<ResolutionKind, string> = {
  accepted: "Accepted",
  rejected: "Rejected",
  modified: "Modified",
  dismissed: "Dismissed",
  superseded: "Superseded",
  cancelled: "Cancelled",
  added: "Added",
};

export function RunnerActionCard({
  card,
  onResolve,
  compact,
}: {
  card: Card;
  onResolve: ResolveFn;
  onChat?: (prompt: string) => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const meta = typeMeta[card.type];
  const Icon = meta.Icon;

  if (card.state === "resolved") {
    return (
      <ResolvedCard card={card} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
    );
  }

  const isInProgress = card.state === "in-progress";
  const isFailure = card.type === "failure";
  const hasInputs = (card.inputs?.length ?? 0) > 0;
  const allInputsFilled =
    !hasInputs ||
    (card.inputs ?? []).every((field) => (inputValues[field.key] ?? "").trim().length > 0);
  const isSelectableOptions =
    card.type === "decision" && card.artifact?.kind === "options";
  const selectedOption =
    isSelectableOptions && card.artifact?.kind === "options"
      ? (card.artifact.options.find((o) => o.id === selectedOptionId) ?? null)
      : null;

  return (
    <div
      className={`runner-action-card type-${card.type} ${
        isInProgress ? "is-in-progress" : "is-open"
      } ${isFailure ? "is-failure" : ""} ${compact ? "is-compact" : ""}`}
    >
      <header className="runner-action-card-header">
        <span className="runner-action-card-eyebrow">
          <Icon
            size={12}
            aria-hidden="true"
            className={isInProgress ? "spin" : ""}
          />
          <span>{meta.label}</span>
        </span>
      </header>

      <h4 className="runner-action-card-title">{card.title}</h4>

      {!compact && <p className="runner-action-card-why">{card.why}</p>}

      {card.progress && (
        <div className="runner-progress">
          <div className="runner-progress-bar">
            <div
              className="runner-progress-fill"
              style={{ width: `${card.progress.percent}%` }}
            />
          </div>
          <p className="runner-progress-step">
            <span className="runner-progress-step-main">
              <Loader2 size={11} aria-hidden="true" className="spin" />
              <span>{card.progress.step}</span>
            </span>
            {card.progress.elapsed && (
              <span className="runner-progress-elapsed">{card.progress.elapsed}</span>
            )}
          </p>
          {card.progress.currently && (
            <div className="runner-currently" aria-live="polite">
              <span className="runner-currently-dot" aria-hidden="true" />
              <span className="runner-currently-text">
                <span className="runner-currently-label">currently:</span>{" "}
                {card.progress.currently}
              </span>
            </div>
          )}
          {card.progress.events && card.progress.events.length > 0 && (
            <ul className="runner-log-list" aria-label="Recent events">
              {card.progress.events.slice(0, 3).map((ev) => (
                <li key={ev.id} className="runner-log-item">
                  <CheckCircle2 size={11} aria-hidden="true" />
                  <span className="runner-log-text">{ev.text}</span>
                  <span className="runner-log-ago">{ev.ago}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {card.artifact && (
        <div className="runner-action-card-body">
          <ArtifactView
            artifact={
              isSelectableOptions && card.artifact.kind === "options"
                ? { ...card.artifact, selectedOptionId: selectedOptionId ?? undefined }
                : card.artifact
            }
            onSelectOption={
              isSelectableOptions ? (id) => setSelectedOptionId(id) : undefined
            }
            readOnly={!isSelectableOptions}
          />
        </div>
      )}

      {hasInputs && (
        <div className="runner-card-form">
          {card.inputs!.map((field) => (
            <label key={field.key} className="runner-card-field">
              <span className="runner-card-field-label">{field.label}</span>
              <input
                type={field.type ?? "text"}
                className="runner-card-field-input"
                placeholder={field.placeholder}
                value={inputValues[field.key] ?? ""}
                autoComplete="off"
                onChange={(event) =>
                  setInputValues((v) => ({
                    ...v,
                    [field.key]: event.target.value,
                  }))
                }
              />
              {field.helper && (
                <span className="runner-card-field-helper">{field.helper}</span>
              )}
            </label>
          ))}
        </div>
      )}

      {!compact && !hasInputs && (card.evidence || card.whatHappens) && (
        <p className="runner-action-card-aside">
          {card.whatHappens ?? card.evidence}
        </p>
      )}

      {!compact && card.progress?.events && card.progress.events.length > 0 && (
        <ProgressLog
          events={card.progress.events}
          open={logOpen}
          onToggle={() => setLogOpen((v) => !v)}
        />
      )}

      <CardActions
        card={card}
        onResolve={onResolve}
        hasInputs={hasInputs}
        inputsFilled={allInputsFilled}
        selectedOptionTitle={selectedOption?.title}
      />
    </div>
  );
}

function CardActions({
  card,
  onResolve,
  hasInputs,
  inputsFilled,
  selectedOptionTitle,
}: {
  card: Card;
  onResolve: ResolveFn;
  hasInputs?: boolean;
  inputsFilled?: boolean;
  selectedOptionTitle?: string;
}) {
  if (card.type === "decision") {
    const isOptionsArtifact = card.artifact?.kind === "options";
    return (
      <div className="runner-action-buttons">
        {card.options ? (
          card.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={opt.primary ? "primary-button" : "secondary-button"}
              onClick={() => onResolve(card.id, "accepted", opt.label)}
            >
              {opt.label}
            </button>
          ))
        ) : card.artifact?.kind === "decision" ? (
          card.artifact.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className="primary-button"
              onClick={() => onResolve(card.id, "accepted", choice.label)}
            >
              {choice.label}
            </button>
          ))
        ) : isOptionsArtifact ? (
          <button
            type="button"
            className="primary-button"
            disabled={!selectedOptionTitle}
            onClick={() =>
              selectedOptionTitle &&
              onResolve(card.id, "accepted", selectedOptionTitle)
            }
          >
            <CheckCircle2 size={13} aria-hidden="true" />{" "}
            {selectedOptionTitle ? `Confirm ${selectedOptionTitle}` : "Confirm"}
          </button>
        ) : null}
        <button
          type="button"
          className="ghost-button"
          onClick={() => onResolve(card.id, "rejected", "Not this — wait for me to clarify")}
        >
          <X size={13} aria-hidden="true" /> Reject all
        </button>
      </div>
    );
  }

  if (card.type === "approval") {
    return (
      <div className="runner-action-buttons">
        <button
          type="button"
          className="primary-button"
          onClick={() => onResolve(card.id, "accepted", "Approved")}
        >
          <ThumbsUp size={13} aria-hidden="true" /> Approve
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onResolve(card.id, "rejected", "Rejected")}
        >
          <ThumbsDown size={13} aria-hidden="true" /> Reject
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => onResolve(card.id, "modified", "Sent back for changes")}
        >
          Modify
        </button>
      </div>
    );
  }

  if (card.type === "clarification") {
    return (
      <div className="runner-action-buttons">
        {card.options?.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={opt.primary ? "primary-button" : "secondary-button"}
            onClick={() => onResolve(card.id, "accepted", opt.label)}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          className="ghost-button"
          onClick={() => onResolve(card.id, "dismissed", "Skipped — will ask later")}
        >
          Skip for now
        </button>
      </div>
    );
  }

  if (card.type === "metadata-suggestion") {
    return (
      <div className="runner-action-buttons">
        {card.options?.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={opt.primary ? "primary-button" : "secondary-button"}
            onClick={() =>
              onResolve(
                card.id,
                opt.id === "accept"
                  ? "accepted"
                  : opt.id === "change"
                    ? "modified"
                    : "dismissed",
                opt.label,
              )
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (card.type === "informational") {
    return (
      <div className="runner-action-buttons">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onResolve(card.id, "accepted", "Acknowledged")}
        >
          <CheckCircle2 size={13} aria-hidden="true" /> Got it
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => onResolve(card.id, "added", "Added a follow-up card")}
        >
          <Plus size={13} aria-hidden="true" /> Add follow-up
        </button>
      </div>
    );
  }

  if (card.type === "progress") {
    return (
      <div className="runner-action-buttons">
        <button
          type="button"
          className="ghost-button"
          onClick={() => onResolve(card.id, "cancelled", "Paused")}
        >
          Pause
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => onResolve(card.id, "modified", "Redirected mid-flight")}
        >
          Modify
        </button>
        <button
          type="button"
          className="ghost-button danger"
          onClick={() => onResolve(card.id, "cancelled", "Cancelled")}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (card.type === "failure") {
    const primaryLabel = hasInputs
      ? (card.submitLabel ?? "Submit")
      : "Resume manually";
    const primaryNote = hasInputs ? "Submitted manually" : "Resumed manually";
    return (
      <div className="runner-action-buttons">
        <button
          type="button"
          className="primary-button"
          disabled={hasInputs && !inputsFilled}
          onClick={() => onResolve(card.id, "accepted", primaryNote)}
        >
          <RefreshCw size={13} aria-hidden="true" /> {primaryLabel}
        </button>
        {!hasInputs && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => onResolve(card.id, "modified", "Reconnected the integration")}
          >
            Reconnect
          </button>
        )}
        <button
          type="button"
          className="ghost-button danger"
          onClick={() => onResolve(card.id, "cancelled", "Cancelled")}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (card.type === "follow-up") {
    return (
      <div className="runner-action-buttons">
        <button
          type="button"
          className="primary-button"
          onClick={() => onResolve(card.id, "added", "Added as next card")}
        >
          <Plus size={13} aria-hidden="true" /> Add card
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onResolve(card.id, "dismissed", "Not now")}
        >
          Not now
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => onResolve(card.id, "dismissed", "Ignored")}
        >
          Ignore
        </button>
      </div>
    );
  }

  return null;
}

function ProgressLog({
  events,
  open,
  onToggle,
}: {
  events: ProgressMicroEvent[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`runner-log ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="runner-log-toggle"
        onClick={onToggle}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown size={12} aria-hidden="true" />
        ) : (
          <ChevronRight size={12} aria-hidden="true" />
        )}
        <span className="runner-log-count">{events.length}</span>
        <span className="runner-log-label">Steps Completed</span>
      </button>
      {open && (
        <ul className="runner-log-list">
          {events.map((event) => (
            <li key={event.id} className="runner-log-item">
              <CheckCircle2 size={11} aria-hidden="true" />
              <span className="runner-log-text">{event.text}</span>
              <span className="runner-log-ago">{event.ago}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResolvedCard({
  card,
  expanded,
  onToggle,
}: {
  card: Card;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = typeMeta[card.type];
  const Icon = meta.Icon;
  const resolution = card.resolution;
  const kind = resolution?.kind ?? "accepted";
  return (
    <div
      className={`runner-action-card type-${card.type} is-resolved kind-${kind}`}
    >
      <button
        type="button"
        className="runner-resolved-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="runner-action-card-eyebrow muted">
          <Icon size={12} aria-hidden="true" />
          <span>{meta.label}</span>
        </span>
        <span className="runner-resolved-title">{card.title}</span>
        <span className={`runner-resolution-tag kind-${kind}`}>
          {resolutionLabel[kind]}
          {resolution?.at && <span className="runner-resolution-at"> · {resolution.at}</span>}
        </span>
        <span className="runner-resolved-chevron" aria-hidden="true">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {expanded && (
        <div className="runner-resolved-body">
          <ResolvedMetaBlock label="Why" value={card.why} />
          {card.evidence && <ResolvedMetaBlock label="Evidence" value={card.evidence} />}
          {resolution?.note && (
            <ResolvedMetaBlock label="Outcome" value={resolution.note} />
          )}
          {card.artifact && (
            <div className="runner-action-card-body">
              <ArtifactView artifact={card.artifact} readOnly />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResolvedMetaBlock({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p className="resolved-meta">
      <span className="resolved-meta-label">{label}</span>
      <span>{value}</span>
    </p>
  );
}
