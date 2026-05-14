import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Code2,
  FileText,
  Mail,
  Pause,
  RotateCcw,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Artifact } from "./data";

export function ArtifactView({
  artifact,
  onSelectOption,
  onChoose,
  onEmailChange,
  readOnly,
}: {
  artifact: Artifact;
  onSelectOption?: (optionId: string) => void;
  onChoose?: (choiceId: string) => void;
  onEmailChange?: (field: "to" | "subject" | "body", value: string) => void;
  readOnly?: boolean;
}) {
  if (artifact.kind === "email") {
    return (
      <div className="artifact email-artifact">
        <header className="artifact-header">
          <Mail size={14} aria-hidden="true" />
          <span>Email draft</span>
        </header>
        <div className="email-form">
          <label>
            <span>To</span>
            <input
              value={artifact.to ?? ""}
              readOnly={readOnly}
              onChange={(event) => onEmailChange?.("to", event.target.value)}
            />
          </label>
          <label>
            <span>Subject</span>
            <input
              value={artifact.subject}
              readOnly={readOnly}
              onChange={(event) => onEmailChange?.("subject", event.target.value)}
            />
          </label>
          <label>
            <span>Body</span>
            <textarea
              value={artifact.body}
              readOnly={readOnly}
              onChange={(event) => onEmailChange?.("body", event.target.value)}
            />
          </label>
        </div>
      </div>
    );
  }

  if (artifact.kind === "options") {
    return (
      <div className="artifact">
        {artifact.intro && <p className="artifact-intro">{artifact.intro}</p>}
        <div className="option-list">
          {artifact.options.map((option) => (
            <label
              key={option.id}
              className={`option-row ${
                artifact.selectedOptionId === option.id ? "is-selected" : ""
              }`}
            >
              <input
                type="radio"
                name={`opts-${option.id}`}
                checked={artifact.selectedOptionId === option.id}
                disabled={readOnly}
                onChange={() => onSelectOption?.(option.id)}
              />
              <div>
                <div className="option-row-head">
                  <strong>{option.title}</strong>
                  {option.meta && <span>{option.meta}</span>}
                </div>
                {option.notes && <p>{option.notes}</p>}
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (artifact.kind === "decision") {
    return (
      <div className="artifact">
        <p className="artifact-intro">{artifact.question}</p>
        <div className="decision-grid">
          {artifact.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={`decision-choice ${
                artifact.chosen === choice.id ? "is-chosen" : ""
              }`}
              disabled={readOnly}
              onClick={() => onChoose?.(choice.id)}
            >
              <strong>{choice.label}</strong>
              {choice.rationale && <span>{choice.rationale}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (artifact.kind === "note") {
    return (
      <div className="artifact note-artifact">
        <p>{artifact.body}</p>
      </div>
    );
  }

  if (artifact.kind === "checklist") {
    return (
      <ul className="checklist-artifact">
        {artifact.items.map((item, index) => (
          <li key={index} className={item.checked ? "is-checked" : ""}>
            <span aria-hidden="true">
              {item.checked ? <Check size={13} /> : <Circle size={13} />}
            </span>
            <span className="checklist-item-body">
              <span className="checklist-item-label">{item.label}</span>
              {!item.checked && item.pendingMeta && (
                <span className="checklist-pending-meta">{item.pendingMeta}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (artifact.kind === "attachments") {
    return (
      <ul className="attachments-artifact">
        {artifact.items.map((item, index) => (
          <li key={index}>
            <FileText size={14} aria-hidden="true" />
            <div>
              <strong>{item.label}</strong>
              {item.meta && <small>{item.meta}</small>}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (artifact.kind === "metrics") {
    return (
      <table className="metrics-artifact">
        <tbody>
          {artifact.rows.map((row, index) => (
            <tr key={index}>
              <th scope="row">{row.label}</th>
              <td>
                <strong>{row.value}</strong>
                {row.trend && <small>{row.trend}</small>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (artifact.kind === "people") {
    return (
      <ul className="people-artifact">
        {artifact.entries.map((entry, index) => (
          <li key={index}>
            <Users size={13} aria-hidden="true" />
            <div>
              <strong>{entry.name}</strong>
              {entry.meta && <small>{entry.meta}</small>}
              {entry.note && <p>{entry.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (artifact.kind === "drafts") {
    return <DraftsArtifact artifact={artifact} readOnly={readOnly} />;
  }

  if (artifact.kind === "paused") {
    return (
      <div className="paused-artifact">
        <Pause size={14} aria-hidden="true" />
        <div>
          <strong>{artifact.reason}</strong>
          <small>Awaiting: {artifact.awaiting}</small>
        </div>
      </div>
    );
  }

  if (artifact.kind === "code") {
    return (
      <div className="code-artifact">
        <header>
          <Code2 size={14} aria-hidden="true" />
          <span>{artifact.summary}</span>
        </header>
        <ul>
          {artifact.changes.map((change, index) => (
            <li key={index}>
              <code>{change.label}</code>
              {change.meta && <small>{change.meta}</small>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

type DraftStatus = "pending" | "sent" | "discarded";

function DraftsArtifact({
  artifact,
  readOnly,
}: {
  artifact: Extract<Artifact, { kind: "drafts" }>;
  readOnly?: boolean;
}) {
  const total = artifact.entries.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ccBccOpen, setCcBccOpen] = useState(false);

  const [from, setFrom] = useState<string>(
    () => artifact.entries[0]?.from ?? artifact.defaultFrom ?? "you@runner.now",
  );
  const [tos, setTos] = useState<string[]>(() =>
    artifact.entries.map((e) => e.to ?? deriveTo(e.recipient)),
  );
  const [subjects, setSubjects] = useState<string[]>(() =>
    artifact.entries.map((e) => e.subject ?? deriveSubject(artifact.intro, e)),
  );
  const [bodies, setBodies] = useState<string[]>(() =>
    artifact.entries.map((e) => e.body),
  );
  const [ccs, setCcs] = useState<string[]>(() =>
    artifact.entries.map((e) => (e.cc ?? []).join(", ")),
  );
  const [bccs, setBccs] = useState<string[]>(() =>
    artifact.entries.map((e) => (e.bcc ?? []).join(", ")),
  );
  const [statuses, setStatuses] = useState<DraftStatus[]>(() =>
    artifact.entries.map(() => "pending"),
  );
  const [edited, setEdited] = useState<boolean[]>(() =>
    artifact.entries.map(() => false),
  );

  const pendingCount = statuses.filter((s) => s === "pending").length;
  const sentCount = statuses.filter((s) => s === "sent").length;
  const discardedCount = statuses.filter((s) => s === "discarded").length;
  const allHandled = pendingCount === 0;

  const status = statuses[currentIndex];
  const entry = artifact.entries[currentIndex];
  const fieldsDisabled = readOnly || status !== "pending";

  const findNextPending = (fromIdx: number): number => {
    for (let i = fromIdx + 1; i < total; i++) {
      if (statuses[i] === "pending") return i;
    }
    for (let i = 0; i < fromIdx; i++) {
      if (statuses[i] === "pending") return i;
    }
    return -1;
  };

  const markEdited = (i: number) => {
    setEdited((prev) => {
      if (prev[i]) return prev;
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  const updateField = <T,>(
    setter: (updater: (prev: T[]) => T[]) => void,
    i: number,
    value: T,
  ) => {
    setter((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
    markEdited(i);
  };

  const setStatusAt = (i: number, s: DraftStatus) => {
    setStatuses((prev) => prev.map((v, idx) => (idx === i ? s : v)));
  };

  const handleSend = () => {
    setStatusAt(currentIndex, "sent");
    const next = findNextPending(currentIndex);
    if (next !== -1) setCurrentIndex(next);
  };

  const handleDiscard = () => {
    setStatusAt(currentIndex, "discarded");
    const next = findNextPending(currentIndex);
    if (next !== -1) setCurrentIndex(next);
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(total - 1, i + 1));
  };

  const handleSendAll = () => {
    setStatuses((prev) => prev.map((v) => (v === "pending" ? "sent" : v)));
  };

  const handleReset = () => {
    setStatuses(artifact.entries.map(() => "pending"));
    setEdited(artifact.entries.map(() => false));
    setCurrentIndex(0);
  };

  return (
    <div className="artifact drafts-stager">
      <header className="drafts-stager-head">
        <span className="drafts-stager-head-main">
          <Mail size={14} aria-hidden="true" />
          <strong>{total}</strong>
          <span>drafts</span>
          {artifact.channel && <small>· {artifact.channel}</small>}
        </span>
        <span className="drafts-stager-remaining">
          {allHandled ? "All handled" : `${pendingCount} remaining`}
        </span>
      </header>

      <ol className="drafts-queue" role="tablist" aria-label="Drafts">
        {artifact.entries.map((e, i) => {
          const s = statuses[i];
          const isActive = i === currentIndex;
          const first = e.recipient.split(" ")[0];
          return (
            <li key={i} className="drafts-queue-item">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`drafts-queue-chip is-${s} ${isActive ? "is-active" : ""}`}
                onClick={() => setCurrentIndex(i)}
              >
                <span className="drafts-queue-avatar">
                  {e.recipient.charAt(0).toUpperCase()}
                </span>
                <span className="drafts-queue-name">{first}</span>
                <span className="drafts-queue-status" aria-hidden="true">
                  {s === "sent" ? (
                    <Check size={11} />
                  ) : s === "discarded" ? (
                    <X size={11} />
                  ) : (
                    <span className="drafts-queue-dot" />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {allHandled ? (
        <div className="drafts-done-state">
          <strong>All {total} drafts handled</strong>
          <span className="drafts-done-tally">
            {sentCount > 0 && (
              <span className="tally-sent">
                <Check size={11} aria-hidden="true" /> {sentCount} sent
              </span>
            )}
            {discardedCount > 0 && (
              <span className="tally-discarded">
                <X size={11} aria-hidden="true" /> {discardedCount} discarded
              </span>
            )}
          </span>
          {!readOnly && (
            <button
              type="button"
              className="drafts-action-ghost"
              onClick={handleReset}
            >
              <RotateCcw size={12} aria-hidden="true" /> Reset
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="drafts-composer">
            <div className="drafts-field">
              <label htmlFor="drafts-from">From</label>
              <input
                id="drafts-from"
                type="text"
                value={from}
                disabled={fieldsDisabled}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>

            <div className="drafts-field drafts-field-to">
              <label htmlFor={`drafts-to-${currentIndex}`}>To</label>
              <input
                id={`drafts-to-${currentIndex}`}
                type="text"
                value={tos[currentIndex]}
                disabled={fieldsDisabled}
                onChange={(event) =>
                  updateField(setTos, currentIndex, event.target.value)
                }
              />
              {!fieldsDisabled && (
                <button
                  type="button"
                  className="drafts-cc-bcc-toggle"
                  onClick={() => setCcBccOpen((v) => !v)}
                  aria-expanded={ccBccOpen}
                >
                  Cc Bcc
                </button>
              )}
            </div>

            {ccBccOpen && (
              <>
                <div className="drafts-field">
                  <label htmlFor={`drafts-cc-${currentIndex}`}>Cc</label>
                  <input
                    id={`drafts-cc-${currentIndex}`}
                    type="text"
                    value={ccs[currentIndex]}
                    disabled={fieldsDisabled}
                    onChange={(event) =>
                      updateField(setCcs, currentIndex, event.target.value)
                    }
                  />
                </div>
                <div className="drafts-field">
                  <label htmlFor={`drafts-bcc-${currentIndex}`}>Bcc</label>
                  <input
                    id={`drafts-bcc-${currentIndex}`}
                    type="text"
                    value={bccs[currentIndex]}
                    disabled={fieldsDisabled}
                    onChange={(event) =>
                      updateField(setBccs, currentIndex, event.target.value)
                    }
                  />
                </div>
              </>
            )}

            <div className="drafts-field drafts-field-subject">
              <label htmlFor={`drafts-subject-${currentIndex}`}>Subject</label>
              <input
                id={`drafts-subject-${currentIndex}`}
                type="text"
                value={subjects[currentIndex]}
                disabled={fieldsDisabled}
                onChange={(event) =>
                  updateField(setSubjects, currentIndex, event.target.value)
                }
              />
              {edited[currentIndex] && status === "pending" && (
                <span className="drafts-edited-flag">Edited</span>
              )}
            </div>

            <div className="drafts-field drafts-field-body">
              <textarea
                aria-label="Message body"
                value={bodies[currentIndex]}
                disabled={fieldsDisabled}
                onChange={(event) =>
                  updateField(setBodies, currentIndex, event.target.value)
                }
                rows={Math.min(10, Math.max(4, bodies[currentIndex].split("\n").length + 1))}
              />
            </div>

            {status !== "pending" && (
              <div className={`drafts-current-status status-${status}`}>
                {status === "sent" ? (
                  <>
                    <Check size={12} aria-hidden="true" /> Sent
                  </>
                ) : (
                  <>
                    <X size={12} aria-hidden="true" /> Discarded
                  </>
                )}
              </div>
            )}
            {entry.recipientMeta && (
              <p className="drafts-recipient-meta">{entry.recipientMeta}</p>
            )}
          </div>

          {!readOnly && (
            <footer className="drafts-composer-footer">
              <div className="drafts-composer-footer-row">
                <button
                  type="button"
                  className="drafts-action-ghost is-destructive"
                  onClick={handleDiscard}
                  disabled={status !== "pending"}
                >
                  <Trash2 size={13} aria-hidden="true" /> Discard
                </button>
                <div className="drafts-composer-nav">
                  <button
                    type="button"
                    className="drafts-nav-btn"
                    aria-label="Previous draft"
                    disabled={currentIndex === 0}
                    onClick={handlePrev}
                  >
                    <ChevronLeft size={14} aria-hidden="true" />
                  </button>
                  <span className="drafts-composer-position">
                    {currentIndex + 1} of {total}
                  </span>
                  <button
                    type="button"
                    className="drafts-nav-btn"
                    aria-label="Next draft"
                    disabled={currentIndex === total - 1}
                    onClick={handleNext}
                  >
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  className="drafts-action-primary"
                  onClick={handleSend}
                  disabled={status !== "pending"}
                >
                  <Send size={13} aria-hidden="true" /> Send
                </button>
              </div>
              <div className="drafts-composer-footer-row drafts-composer-tally-row">
                <span className="drafts-composer-tally">
                  {sentCount > 0 && (
                    <span className="tally-sent">
                      <Check size={11} aria-hidden="true" /> {sentCount} sent
                    </span>
                  )}
                  {discardedCount > 0 && (
                    <span className="tally-discarded">
                      <X size={11} aria-hidden="true" /> {discardedCount} discarded
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="drafts-action-ghost drafts-send-all"
                  onClick={handleSendAll}
                  disabled={pendingCount === 0}
                >
                  <Send size={12} aria-hidden="true" /> Send all {pendingCount}
                </button>
              </div>
            </footer>
          )}
        </>
      )}
    </div>
  );
}

function deriveTo(recipient: string): string {
  const first = recipient.split(" ")[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "friend";
  const last = recipient.split(" ").slice(1).join("").toLowerCase().replace(/[^a-z]/g, "");
  const local = last ? `${first}.${last}` : first;
  return `${local}@example.com`;
}

function deriveSubject(intro: string | undefined, entry: { recipient: string }): string {
  if (intro) {
    const cleaned = intro.replace(/—.*$/, "").trim();
    if (cleaned.length > 0 && cleaned.length < 60) return `Re: ${cleaned}`;
  }
  return `Note for ${entry.recipient.split(" ")[0]}`;
}
