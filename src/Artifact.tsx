import { Check, Circle, Code2, FileText, Mail, Pause, Users } from "lucide-react";
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
            <span>{item.label}</span>
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
