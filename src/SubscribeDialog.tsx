import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

export function SubscribeDialog({
  defaultName,
  onCancel,
  onSubmit,
}: {
  defaultName: string;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}) {
  const [value, setValue] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    setValue(defaultName);
  }, [defaultName]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = value.trim();
    if (!name) return;
    onSubmit(name);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="subscribe-dialog" role="dialog" aria-labelledby="subscribe-dialog-title">
      <form className="subscribe-dialog-form" onSubmit={handleSubmit}>
        <header className="subscribe-dialog-head">
          <h3 id="subscribe-dialog-title">New subscription</h3>
          <button
            type="button"
            className="subscribe-dialog-close"
            aria-label="Cancel"
            onClick={onCancel}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </header>
        <p className="subscribe-dialog-summary">
          A subscription is a curated playlist of todos. Runner will suggest items it
          thinks belong, and you decide what's in.
        </p>
        <label className="subscribe-dialog-label">
          <span>Name</span>
          <input
            ref={inputRef}
            type="text"
            className="subscribe-dialog-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Subscription name"
          />
        </label>
        <footer className="subscribe-dialog-actions">
          <button
            type="button"
            className="subscribe-dialog-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="subscribe-dialog-submit"
            disabled={value.trim().length === 0}
          >
            <Plus size={12} aria-hidden="true" />
            Create
          </button>
        </footer>
      </form>
    </div>
  );
}
