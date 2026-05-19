import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Activity, CheckSquare2, RotateCcw, Repeat } from "lucide-react";
import {
  Button,
  Chip,
  DSRoot,
  Eyebrow,
  Heading,
  Row,
  Stack,
  Text,
  type ChipTone,
} from "./design-system/primitives";
import "./design-system/primitives.css";
import "./Outliner.css";

type Theme = "light" | "dark";
type Depth = 0 | 1;
type Label = "task" | "automate" | "todo";

interface Node {
  id: string;
  text: string;
  depth: Depth;
  label?: Label;
  pending?: boolean; // mid-AI-thinking on this row
}

const MAX_DEPTH: Depth = 1;

// Seeded from Charlie's prompt traffic. Top-level items are the real "thing on
// my mind" — children are the substeps that came out of the same thought.
const SEED: Node[] = [
  { id: "n1", text: "Post-OG summit follow-ups", depth: 0 },
  { id: "n2", text: "Chat with Casey about FOG allocation", depth: 1 },
  { id: "n3", text: "Get Molly involved — advisory + investing?", depth: 1 },
  { id: "n4", text: "Add OG attendees on LinkedIn", depth: 1 },

  { id: "n10", text: "Personal card optimization", depth: 0 },
  { id: "n11", text: "Cancel AMEX Business", depth: 1 },
  { id: "n12", text: "Apply for United Club membership", depth: 1 },
  { id: "n13", text: "Decide on AMEX Gold (barely using)", depth: 1 },

  { id: "n20", text: "Daily email triage", depth: 0 },
  { id: "n21", text: "Morning briefing", depth: 0 },
  { id: "n22", text: "Weekly memory review", depth: 0 },

  { id: "n30", text: "Book flights SFO → YYZ, May 18-20", depth: 0 },
  { id: "n31", text: "Add Jai to strategic-round investor list", depth: 0 },

  { id: "n40", text: "Home admin", depth: 0 },
  { id: "n41", text: "Oura ring sizing for Laura", depth: 1 },
  { id: "n42", text: "Schedule May gardener", depth: 1 },

  { id: "n50", text: "Research SF engineers, 5+ yrs, blue-check startups", depth: 0 },
];

// Mock "AI" decisions for the seed — what triage would label each top-level
// item. This is the simulation: the assignment is hardcoded, only the timing
// is animated. For text outside the seed we fall back to a tiny heuristic.
const SEED_LABELS: Record<string, Label> = {
  n1: "task",
  n10: "task",
  n20: "automate",
  n21: "automate",
  n22: "automate",
  n30: "task",
  n31: "todo",
  n40: "todo",
  n50: "task",
};

function inferLabel(text: string): Label {
  const t = text.toLowerCase();
  if (/\b(daily|weekly|every|recurring|automate|brief|triage|run)\b/.test(t)) return "automate";
  if (/\b(research|draft|review|plan|book|write|build|design|find)\b/.test(t)) return "task";
  return "todo";
}

let idCounter = 100;
const makeId = () => `n${++idCounter}`;

export default function Outliner() {
  const [theme, setTheme] = useState<Theme>("light");
  const [nodes, setNodes] = useState<Node[]>(SEED);
  const [triageState, setTriageState] = useState<"idle" | "running" | "done">(() =>
    Object.keys(SEED_LABELS).length > 0 ? "idle" : "idle",
  );
  const [pendingFocus, setPendingFocus] = useState<{ id: string; caret?: "end" } | null>(null);

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const setRef = useCallback(
    (id: string) => (el: HTMLInputElement | null) => {
      if (el) inputRefs.current.set(id, el);
      else inputRefs.current.delete(id);
    },
    [],
  );

  useEffect(() => {
    if (!pendingFocus) return;
    const el = inputRefs.current.get(pendingFocus.id);
    if (el) {
      el.focus();
      if (pendingFocus.caret === "end") {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
    setPendingFocus(null);
  }, [pendingFocus, nodes]);

  // Clear stale labels on edit — once you change a row, its label is no longer
  // the AI's, so we drop it. Triage again to re-label.
  const updateText = (id: string, text: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text, label: undefined, pending: false } : n)),
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    const node = nodes[index];

    if (e.key === "Enter") {
      e.preventDefault();
      const newNode: Node = { id: makeId(), text: "", depth: node.depth };
      setNodes((prev) => [...prev.slice(0, index + 1), newNode, ...prev.slice(index + 1)]);
      setPendingFocus({ id: newNode.id });
      return;
    }

    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      if (node.depth >= MAX_DEPTH) return;
      const hasParent = nodes.slice(0, index).some((n) => n.depth === 0);
      if (!hasParent) return;
      setNodes((prev) =>
        prev.map((n, i) =>
          i === index ? { ...n, depth: (n.depth + 1) as Depth, label: undefined } : n,
        ),
      );
      setPendingFocus({ id: node.id, caret: "end" });
      return;
    }

    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      if (node.depth === 0) return;
      setNodes((prev) =>
        prev.map((n, i) =>
          i === index ? { ...n, depth: (n.depth - 1) as Depth, label: undefined } : n,
        ),
      );
      setPendingFocus({ id: node.id, caret: "end" });
      return;
    }

    if (e.key === "Backspace" && node.text === "" && nodes.length > 1) {
      e.preventDefault();
      const prevId = index > 0 ? nodes[index - 1].id : nodes[1]?.id;
      setNodes((prev) => prev.filter((_, i) => i !== index));
      if (prevId) setPendingFocus({ id: prevId, caret: "end" });
      return;
    }

    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      setPendingFocus({ id: nodes[index - 1].id, caret: "end" });
      return;
    }

    if (e.key === "ArrowDown" && index < nodes.length - 1) {
      e.preventDefault();
      setPendingFocus({ id: nodes[index + 1].id, caret: "end" });
      return;
    }
  };

  // Run a simulated AI triage one row at a time. Going sequentially lets the
  // user watch the decision land per-item, which reads more like "the AI is
  // considering this" than a single batch flash.
  const triage = async () => {
    setTriageState("running");
    setNodes((prev) => prev.map((n) => ({ ...n, label: undefined, pending: false })));

    const topLevelIds = nodes
      .filter((n) => n.depth === 0 && n.text.trim() !== "")
      .map((n) => n.id);

    for (const id of topLevelIds) {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, pending: true } : n)));
      await wait(320);
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== id) return n;
          const label = SEED_LABELS[n.id] ?? inferLabel(n.text);
          return { ...n, pending: false, label };
        }),
      );
      await wait(140);
    }

    setTriageState("done");
  };

  const reset = () => {
    setNodes((prev) => prev.map((n) => ({ ...n, label: undefined, pending: false })));
    setTriageState("idle");
  };

  // Group every depth-0 row with the depth-1 rows that immediately follow it.
  // The whole group shares one stripe — the parent's label color — which
  // extends from the parent's row down to the bottom of the last child and
  // animates in when the label is applied. Orphan depth-1 rows (no preceding
  // parent) are treated as their own single-row group.
  interface Group {
    parent: Node;
    parentIndex: number;
    children: Array<{ node: Node; index: number }>;
  }
  const groups: Group[] = [];
  let cursor = 0;
  while (cursor < nodes.length) {
    const node = nodes[cursor];
    if (node.depth === 0) {
      const children: Array<{ node: Node; index: number }> = [];
      let j = cursor + 1;
      while (j < nodes.length && nodes[j].depth === 1) {
        children.push({ node: nodes[j], index: j });
        j++;
      }
      groups.push({ parent: node, parentIndex: cursor, children });
      cursor = j;
    } else {
      groups.push({ parent: node, parentIndex: cursor, children: [] });
      cursor++;
    }
  }

  const itemCount = nodes.filter((n) => n.text.trim() !== "").length;
  const isRunning = triageState === "running";

  return (
    <DSRoot theme={theme} className="outliner">
      <div className="outliner__inner">
        <header className="outliner__header">
          <Stack gap="snug">
            <Eyebrow>Runner · Scratchpad</Eyebrow>
            <Heading size="xl" as="h1">
              Dump it. Triage later.
            </Heading>
            <Text tone="muted">
              One line per item. <Kbd>Enter</Kbd> for new, <Kbd>Tab</Kbd> to nest under the item
              above, <Kbd>Shift</Kbd>+<Kbd>Tab</Kbd> to unnest. Two levels max. When you're done,
              hit <em>Triage</em> and Runner sorts each item into Task, Automate, or Todo.
            </Text>
          </Stack>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>

        <div className="outliner__pad">
          <Row justify="between" className="outliner__pad-top">
            <Row>
              <Eyebrow>Outline</Eyebrow>
              <Chip tone="neutral">{itemCount}</Chip>
              {triageState === "done" && <Chip tone="success">Triaged</Chip>}
            </Row>
            <Row>
              {triageState === "done" ? (
                <Button variant="outline" onClick={reset} disabled={isRunning}>
                  <RotateCcw size={12} />
                  Reset labels
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={triage}
                  disabled={itemCount === 0 || isRunning}
                >
                  {isRunning ? "Triaging…" : "Triage"}
                </Button>
              )}
            </Row>
          </Row>

          <div className="outliner__list">
            {groups.map((group) => (
              <div
                key={group.parent.id}
                className="outliner__group"
                data-label={group.parent.label ?? ""}
                data-labeled={group.parent.label ? "true" : "false"}
              >
                <span className="outliner__group-stripe" aria-hidden="true" />
                <OutlineRow
                  node={group.parent}
                  inputRef={setRef(group.parent.id)}
                  onChange={(text) => updateText(group.parent.id, text)}
                  onKeyDown={(e) => onKeyDown(e, group.parentIndex)}
                  disabled={isRunning}
                />
                {group.children.map((child) => (
                  <OutlineRow
                    key={child.node.id}
                    node={child.node}
                    inputRef={setRef(child.node.id)}
                    onChange={(text) => updateText(child.node.id, text)}
                    onKeyDown={(e) => onKeyDown(e, child.index)}
                    disabled={isRunning}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <LabelLegend />
      </div>
    </DSRoot>
  );
}

/* ────────────────────────── Outline row ────────────────────────── */

function OutlineRow({
  node,
  inputRef,
  onChange,
  onKeyDown,
  disabled,
}: {
  node: Node;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (text: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={[
        "outliner__row",
        `outliner__row--depth-${node.depth}`,
        node.pending && "outliner__row--pending",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="outliner__bullet" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        value={node.text}
        placeholder={node.depth === 0 ? "Brain dump…" : "Sub-item"}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="outliner__input"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
      />
      {node.depth === 0 && (
        <span className="outliner__label-slot">
          {node.pending ? (
            <span className="outliner__thinking" aria-label="Thinking">
              <span />
              <span />
              <span />
            </span>
          ) : node.label ? (
            <LabelChip label={node.label} />
          ) : null}
        </span>
      )}
    </div>
  );
}

/* ────────────────────────── Label chip ────────────────────────── */

const LABEL_META: Record<Label, { name: string; tone: ChipTone; icon: typeof Activity }> = {
  task: { name: "Task", tone: "accent", icon: Activity },
  automate: { name: "Automate", tone: "info", icon: Repeat },
  todo: { name: "Todo", tone: "neutral", icon: CheckSquare2 },
};

function LabelChip({ label }: { label: Label }) {
  const { name, tone, icon: Icon } = LABEL_META[label];
  return (
    <span className="outliner__chip-wrap">
      <Chip tone={tone}>
        <Icon size={11} />
        {name}
      </Chip>
    </span>
  );
}

function LabelLegend() {
  return (
    <div className="outliner__legend">
      <Eyebrow>Labels</Eyebrow>
      <Row wrap>
        <LegendItem label="task" desc="Operational work Runner takes custody of" />
        <LegendItem label="automate" desc="Recurring procedure, runs on its own" />
        <LegendItem label="todo" desc="Lightweight reminder, low custody" />
      </Row>
    </div>
  );
}

function LegendItem({ label, desc }: { label: Label; desc: string }) {
  return (
    <span className="outliner__legend-item">
      <LabelChip label={label} />
      <Text size="sm" tone="muted">
        {desc}
      </Text>
    </span>
  );
}

/* ────────────────────────── Helpers ────────────────────────── */

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="outliner__kbd">{children}</kbd>;
}

function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <Row className="outliner__theme">
      <Eyebrow>Theme</Eyebrow>
      <div className="outliner__theme-toggle">
        <button
          type="button"
          className={theme === "light" ? "is-active" : ""}
          onClick={() => setTheme("light")}
        >
          Light
        </button>
        <button
          type="button"
          className={theme === "dark" ? "is-active" : ""}
          onClick={() => setTheme("dark")}
        >
          Dark
        </button>
      </div>
    </Row>
  );
}
