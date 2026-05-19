import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Activity,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Repeat,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  AskRow,
  Button,
  Chip,
  DSRoot,
  Eyebrow,
  Field,
  Heading,
  Meta,
  Row,
  SourceCluster,
  Stack,
  Text,
  type ChipTone,
  type SourceKind,
} from "./design-system/primitives";
import "./design-system/primitives.css";
import {
  CalendarSlotCard,
  FlightDecisionCard,
  HotelPickCard,
  OutreachDraftsCard,
} from "./ActionCardDetail";
import "./RunnerFlow.css";

/*
 * /runner-flow — end-to-end demo of the system elements
 *
 * Stages:
 *   0  outline    raw brain-dump bullets
 *   1  triaged    Task / Automate chips drop on each row
 *   2  card       items morph IN PLACE into cards — same DOM node, CSS
 *                 transitions the chrome from row to card. Order is still
 *                 outline-seed.
 *   2 sorted      after the morph settles, cards translate/reshuffle
 *                 into Tasks + Automations sections (FLIP). Cards are
 *                 expandable from this point.
 *
 * The same `ItemView` component handles all stages. Chrome morph
 * relies on the parent container staying constant across stages 0–2
 * (`rf__list`); the sort step swaps the parent to `rf__board` and
 * uses FLIP to animate the position change.
 */

type Theme = "light" | "dark";
type Stage = 0 | 1 | 2;
type PromotePhase = "none" | "promoting" | "sorted";
type CardKind = "task" | "automate";
type DetailKind = "flights" | "calendar" | "hotel" | "outreach";

interface AutomateMeta {
  cadenceShort: string;
  cadenceLong: string;
  nextRun: string;
  lastRun: string;
  summary: string;
  runs: string;
  checks: string;
  produces: string;
  approvalBoundary?: string;
}

interface FlowItem {
  id: string;
  outlineText: string;
  cardTitle: string;
  kind: CardKind;
  detail?: DetailKind;
  state?: string;
  sources?: Array<{ kind: SourceKind; label: string }>;
  needsYou?: boolean;
  automate?: AutomateMeta;
}

const SEED: FlowItem[] = [
  {
    id: "f1",
    outlineText: "Morning briefing",
    cardTitle: "Morning attention brief",
    kind: "automate",
    automate: {
      cadenceShort: "Weekdays · 8:30 AM",
      cadenceLong: "Runs weekdays 8:30 AM",
      nextRun: "Tomorrow · 8:30 AM",
      lastRun: "Today · 8:30 AM",
      summary: "Checks calendar, email, active items, and monitors.",
      runs: "Every weekday morning at 8:30 AM local.",
      checks:
        "Your calendar for the day, unread inbox, active work items, and any monitors firing.",
      produces:
        "A one-page brief at the top of your inbox: what's on, what needs you first, what Runner moved overnight.",
      approvalBoundary:
        "Read-only. Never drafts replies or moves items without you.",
    },
  },
  {
    id: "f2",
    outlineText: "Book flights SFO → YYZ, May 18-20",
    cardTitle: "Toronto trip · SFO ↔ YYZ",
    kind: "task",
    detail: "flights",
    state:
      "Compared May 18 and 19 United options; watching UA 1238 for a price drop. Holding on points-vs-cash.",
    sources: [
      { kind: "email", label: "Gmail · flight history" },
      { kind: "browser", label: "United · SFO→YYZ search" },
      { kind: "obsidian", label: "Travel points guide" },
    ],
    needsYou: true,
  },
  {
    id: "f3",
    outlineText: "Pick a time for the Sam K. intro",
    cardTitle: "Sam K. intro call",
    kind: "task",
    detail: "calendar",
    state:
      "Compared both calendars; 3 conflict-free slots on Thu and Fri. Sam's calendly already attached.",
    sources: [
      { kind: "calendar", label: "Your calendar" },
      { kind: "email", label: "Sam · calendly link" },
    ],
    needsYou: true,
  },
  {
    id: "f4",
    outlineText: "Weekly memory review",
    cardTitle: "/memory-review",
    kind: "automate",
    automate: {
      cadenceShort: "Nightly · 10 PM",
      cadenceLong: "Runs nightly 10 PM",
      nextRun: "Tonight · 10 PM",
      lastRun: "Last night · 10 PM",
      summary: "Audits memory store for staleness and gaps.",
      runs: "Every night at 10 PM local.",
      checks:
        "Long-term memory entries for staleness, contradictions, and gaps based on recent activity.",
      produces:
        "A short digest of facts archived, contradictions surfaced, and missing entries Runner asks you to fill.",
      approvalBoundary:
        "Never archives high-confidence facts without flagging them for review first.",
    },
  },
  {
    id: "f5",
    outlineText: "Book a stay near OG Summit",
    cardTitle: "Stay near OG Summit",
    kind: "task",
    detail: "hotel",
    state:
      "Pulled 3 hotels within a 10-min walk of LondonHouse. Marriott (Bonvoy hits) is Runner's pick.",
    sources: [
      { kind: "browser", label: "Marriott · Bonvoy" },
      { kind: "browser", label: "Boutique inventory" },
      { kind: "map", label: "Loop · venue area" },
    ],
    needsYou: true,
  },
  {
    id: "f6",
    outlineText: "Outreach drafts · senior SF engineers",
    cardTitle: "Recruiting · SF engineers",
    kind: "task",
    detail: "outreach",
    state:
      "Drafted 5 personalized LinkedIn notes from your SF, 5-year, blue-check search. Awaiting review.",
    sources: [
      { kind: "linkedin", label: "LinkedIn · 12 results" },
      { kind: "person", label: "Mitt M." },
      { kind: "person", label: "Debbie R." },
    ],
    needsYou: true,
  },
];

const TASKS = SEED.filter((i) => i.kind === "task");
const AUTOMATIONS = SEED.filter((i) => i.kind === "automate");

const STAGE_LABEL: Record<Stage, string> = {
  0: "Outline",
  1: "Triage",
  2: "Cards",
};

const STAGE_NARRATION: Record<Stage, { eyebrow: string; body: string }> = {
  0: {
    eyebrow: "Step 1 · Raw",
    body: "Brain-dump bullets. Runner hasn't decided what kind of work each item is yet.",
  },
  1: {
    eyebrow: "Step 2 · Triaged · your turn",
    body: "Runner labels each item — Task or Automate. Click any chip to flip it if Runner picked wrong. Accept to promote.",
  },
  2: {
    eyebrow: "Step 3 · Promoted",
    body: "Each bullet morphs in place into the right kind of card, then settles into its family. Click any card to see how Runner is handing the decision back to you.",
  },
};

const INITIAL_LABELS: Record<string, CardKind> = SEED.reduce(
  (acc, item) => {
    acc[item.id] = item.kind;
    return acc;
  },
  {} as Record<string, CardKind>,
);

/** Delay between the in-place card morph completing and the sort kick-off. */
const PROMOTE_TO_SORT_MS = 950;

export default function RunnerFlow() {
  const [theme, setTheme] = useState<Theme>("light");
  const [stage, setStage] = useState<Stage>(0);
  const [promotePhase, setPromotePhase] = useState<PromotePhase>("none");
  const [labels, setLabels] = useState<Record<string, CardKind>>(INITIAL_LABELS);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmedItems, setConfirmedItems] = useState<Set<string>>(new Set());

  const setItemConfirmed = (id: string, confirmed: boolean) => {
    setConfirmedItems((prev) => {
      const hadIt = prev.has(id);
      if (hadIt === confirmed) return prev;
      const next = new Set(prev);
      if (confirmed) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // FLIP refs — used only for the promoting → sorted transition.
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const snapshotsRef = useRef<Map<string, DOMRect>>(new Map());

  // Stage 1: stagger the chip reveals like Runner working down the list.
  useEffect(() => {
    if (stage !== 1) {
      setRevealed(new Set());
      return;
    }
    const timers: number[] = [];
    SEED.forEach((item, i) => {
      const t = window.setTimeout(() => {
        setRevealed((prev) => {
          if (prev.has(item.id)) return prev;
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
      }, 60 + i * 220);
      timers.push(t);
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [stage]);

  // Stage 2 promoting → sorted: after the chrome morph finishes, snapshot
  // each card's position in the flat list, then advance promotePhase so
  // the layout swaps to sections. useLayoutEffect below FLIPs the move.
  useEffect(() => {
    if (stage !== 2) return;
    if (promotePhase !== "promoting") return;
    const t = window.setTimeout(() => {
      const snapshots = new Map<string, DOMRect>();
      itemRefs.current.forEach((el, id) => {
        snapshots.set(id, el.getBoundingClientRect());
      });
      snapshotsRef.current = snapshots;
      setPromotePhase("sorted");
    }, PROMOTE_TO_SORT_MS);
    return () => window.clearTimeout(t);
  }, [stage, promotePhase]);

  // FLIP: when promotePhase becomes "sorted", new DOM positions are in
  // place. Translate each card back to its promoting position with no
  // transition, then on the next frame clear the transform with the
  // transition enabled so it slides into its sorted slot.
  useLayoutEffect(() => {
    if (promotePhase !== "sorted") return;
    if (snapshotsRef.current.size === 0) return;

    const snapshots = snapshotsRef.current;
    snapshotsRef.current = new Map();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    itemRefs.current.forEach((el, id) => {
      const old = snapshots.get(id);
      if (!old) return;
      const next = el.getBoundingClientRect();
      const dy = old.top - next.top;
      const dx = old.left - next.left;
      if (dy === 0 && dx === 0) return;
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    requestAnimationFrame(() => {
      itemRefs.current.forEach((el) => {
        el.style.transition = "";
        el.style.transform = "";
      });
    });
  }, [promotePhase]);

  const reset = () => {
    setStage(0);
    setPromotePhase("none");
    setLabels(INITIAL_LABELS);
    setRevealed(new Set());
    setExpanded(new Set());
    setConfirmedItems(new Set());
  };

  const triage = () => setStage(1);

  const accept = () => {
    // No FLIP setup here — the morph happens in place via CSS within
    // the same `rf__list` parent. The sort step that follows does FLIP.
    setStage(2);
    setPromotePhase("promoting");
  };

  const back = () => {
    if (stage === 2) {
      setStage(1);
      setPromotePhase("none");
    } else if (stage === 1) setStage(0);
  };

  const jumpTo = (s: Stage) => {
    if (s === 0) reset();
    else if (s === 2) accept();
    else {
      setStage(s);
      setPromotePhase("none");
    }
  };

  const flipLabel = (id: string) => {
    setLabels((prev) => ({
      ...prev,
      [id]: prev[id] === "task" ? "automate" : "task",
    }));
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const registerRef = (id: string) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  };

  const sorted = promotePhase === "sorted";

  const renderItem = (item: FlowItem, index: number) => (
    <ItemView
      key={item.id}
      ref={registerRef(item.id)}
      item={item}
      index={index}
      stage={stage}
      label={labels[item.id]}
      revealed={stage === 1 && revealed.has(item.id)}
      editable={stage === 1}
      expanded={expanded.has(item.id)}
      confirmed={confirmedItems.has(item.id)}
      onFlipLabel={() => flipLabel(item.id)}
      onToggle={() => toggleExpanded(item.id)}
      onConfirmedChange={(c) => setItemConfirmed(item.id, c)}
    />
  );

  return (
    <DSRoot theme={theme} className="rf">
      <div className="rf__inner">
        <header className="rf__header">
          <Stack gap="snug">
            <Eyebrow>Runner · Full flow</Eyebrow>
            <Heading size="xl" as="h1">
              From scratchpad to handed-back decisions
            </Heading>
            <Text tone="muted">
              Brain-dump bullets get triaged, morph in place into the right
              kind of card, settle into Tasks and Automations, and hand back
              live decision UI. One route, the whole system end-to-end.
            </Text>
          </Stack>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>

        <section
          className="rf__stage"
          data-stage={stage}
          data-phase={promotePhase}
        >
          {stage < 2 && (
            <div className="rf__toolbar">
              <Row className="rf__toolbar-status">
                <Eyebrow>{STAGE_LABEL[stage]}</Eyebrow>
                <Chip tone="neutral">{SEED.length}</Chip>
                {stage === 1 && (
                  <Text size="sm" tone="muted">
                    Click any label to flip between Task and Automate.
                  </Text>
                )}
              </Row>
              <div className="rf__toolbar-action">
                {stage === 0 && (
                  <Button variant="primary" onClick={triage}>
                    <Sparkles size={13} />
                    Triage
                  </Button>
                )}
                {stage === 1 && (
                  <Button variant="primary" onClick={accept}>
                    <Check size={13} />
                    Accept &amp; promote
                  </Button>
                )}
              </div>
            </div>
          )}

          {!sorted ? (
            <div className="rf__list">{SEED.map((item, i) => renderItem(item, i))}</div>
          ) : (
            <div className="rf__board">
              <FamilySection
                title="Tasks"
                caption="Operational packets Runner is actively carrying — each ready to hand a decision back to you."
                count={TASKS.length}
              >
                {TASKS.map((item) =>
                  renderItem(
                    item,
                    SEED.findIndex((s) => s.id === item.id),
                  ),
                )}
              </FamilySection>

              <FamilySection
                title="Automations"
                caption="Standing procedures Runner runs on a cadence. No custody to negotiate — they just keep going."
                count={AUTOMATIONS.length}
              >
                {AUTOMATIONS.map((item) =>
                  renderItem(
                    item,
                    SEED.findIndex((s) => s.id === item.id),
                  ),
                )}
              </FamilySection>
            </div>
          )}
        </section>

        <StageNarration stage={stage} />

        <section className="rf__controls">
          <Row className="rf__controls-row">
            <div className="rf__dots" role="tablist" aria-label="Stage">
              {([0, 1, 2] as Stage[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={s === stage}
                  className={`rf__dot ${s === stage ? "is-active" : ""}`}
                  onClick={() => jumpTo(s)}
                >
                  <span className="rf__dot-index">{s + 1}</span>
                  <span className="rf__dot-label">{STAGE_LABEL[s]}</span>
                </button>
              ))}
            </div>
            <Row className="rf__buttons">
              <Button variant="ghost" onClick={reset}>
                <RotateCcw size={13} />
                Reset
              </Button>
              {stage > 0 && (
                <Button variant="outline" onClick={back}>
                  <ChevronLeft size={13} />
                  Back
                </Button>
              )}
            </Row>
          </Row>
          <div className="rf__rail" aria-hidden="true">
            <div
              className="rf__rail-fill"
              style={{ width: `${(stage / 2) * 100}%` }}
            />
          </div>
        </section>
      </div>
    </DSRoot>
  );
}

/* ────────────────────────── Family section ────────────────────────── */

function FamilySection({
  title,
  caption,
  count,
  children,
}: {
  title: string;
  caption: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="rf-family">
      <header className="rf-family__header">
        <Stack gap="tight">
          <Row className="rf-family__title-row">
            <Heading size="lg" as="h2">
              {title}
            </Heading>
            <Chip tone="neutral">{count}</Chip>
          </Row>
          <Text size="sm" tone="muted">
            {caption}
          </Text>
        </Stack>
      </header>
      <Stack gap="loose">{children}</Stack>
    </section>
  );
}

/* ────────────────────────── Unified item ──────────────────────────
 *
 * One component renders all stages. The same DOM element morphs from
 * an outline row into a card via CSS transitions — same parent,
 * same identity. Visual elements are always in DOM; CSS controls
 * which are visible at each stage.
 */

interface ItemViewProps {
  item: FlowItem;
  index: number;
  stage: Stage;
  label: CardKind;
  revealed: boolean;
  editable: boolean;
  expanded: boolean;
  confirmed: boolean;
  onFlipLabel: () => void;
  onToggle: () => void;
  onConfirmedChange: (c: boolean) => void;
  ref?: React.Ref<HTMLElement>;
}

function ItemView({
  item,
  index,
  stage,
  label,
  revealed,
  editable,
  expanded,
  confirmed,
  onFlipLabel,
  onToggle,
  onConfirmedChange,
  ref,
}: ItemViewProps) {
  const isTriaged = stage >= 1 && (stage === 2 || revealed);
  const isCard = stage === 2;
  const isAutomate = label === "automate";
  const meta = item.automate;

  const styleVars = {
    "--item-card-delay": `${index * 110}ms`,
    "--item-stripe-delay": `${index * 60}ms`,
  } as CSSProperties;

  const showNeedsYou = isCard && label === "task" && item.needsYou && !confirmed;
  const showDone = isCard && confirmed;
  const showLooking =
    isCard && label === "task" && !!item.sources && item.sources.length > 0 && !expanded;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!isCard) return;
    if (expanded) return;
    if ((e.target as HTMLElement).closest("button, a, input")) return;
    onToggle();
  };

  return (
    <article
      ref={ref}
      className={[
        "rf-item",
        `rf-item--${label}`,
        isTriaged && "rf-item--triaged",
        isCard && "rf-item--card",
        expanded && "is-expanded",
        showDone && "rf-item--done",
        editable && "rf-item--editable",
      ]
        .filter(Boolean)
        .join(" ")}
      style={styleVars}
      onClick={handleClick}
    >
      {/* Strip-minimal — only rendered for automate items. Height grows
          in at card stage so it folds out from the top edge. */}
      {isAutomate && meta && (
        <div
          className="rf-item__strip"
          aria-label={`Schedule · ${meta.cadenceShort}`}
        >
          <Clock size={11} className="rf-item__strip-icon" />
          <span className="rf-item__strip-label">{meta.cadenceShort}</span>
        </div>
      )}

      <div className="rf-item__body">
        {/* Left stripe — drops in at triaged, fades at card stage. */}
        <span className="rf-item__stripe" aria-hidden="true" />

        <div className="rf-item__head">
          {/* Bullet — shrinks/fades at card stage so the title aligns
              with the card body. */}
          <span className="rf-item__bullet" aria-hidden="true" />

          <h3 className="rf-item__title">
            <MorphText
              from={item.outlineText}
              to={item.cardTitle}
              active={isCard}
            />
          </h3>

          {/* Inline chip flipper — only at triaged, fades when the
              section header takes over the type signal at card stage. */}
          {isTriaged && (
            <span className="rf-item__chip-wrap">
              <button
                type="button"
                className="rf-item__chip-flipper"
                onClick={editable ? onFlipLabel : undefined}
                disabled={!editable}
                aria-label={
                  editable
                    ? `Flip label (currently ${LABEL_META[label].name})`
                    : undefined
                }
                title={editable ? "Click to flip" : undefined}
              >
                <span
                  className={`rf-item__chip-faces ${isAutomate ? "is-flipped" : ""}`}
                >
                  <span className="rf-item__chip-face rf-item__chip-face--front">
                    <LabelChip kind="task" />
                  </span>
                  <span className="rf-item__chip-face rf-item__chip-face--back">
                    <LabelChip kind="automate" />
                  </span>
                </span>
              </button>
            </span>
          )}

          {/* Needs-you / Done pill — only at card stage. */}
          {showNeedsYou && (
            <span className="rf-item__needs">
              <Chip tone="info">
                <AlertCircle size={11} />
                Needs you
              </Chip>
            </span>
          )}
          {showDone && (
            <span className="rf-item__needs rf-item__done">
              <Chip tone="success">
                <Check size={11} strokeWidth={2.5} />
                Done
              </Chip>
            </span>
          )}

          {/* Expand button — only at card stage. */}
          {isCard && (
            <button
              type="button"
              className="rf-item__expand"
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse" : "Expand"}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
        </div>

        {/* Extras — appear at card stage. Grid-template-rows trick
            animates the height from 0 to auto. */}
        <div className="rf-item__extra">
          <div className="rf-item__extra-inner">
            {label === "task" && item.state && (
              <p className="rf-item__state">{item.state}</p>
            )}
            {showLooking && item.sources && (
              <div className="rf-item__looking">
                <Meta className="rf-item__looking-label">Looking at</Meta>
                <SourceCluster sources={item.sources} max={4} />
              </div>
            )}
            {isAutomate && meta && (
              <>
                <p className="rf-item__summary">{meta.summary}</p>
                <p className="rf-item__next">
                  <Clock size={12} />
                  <span>Next run · {meta.nextRun}</span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Expanded body. */}
        {isCard && expanded && label === "task" && item.detail && (
          <div className="rf-item__embed">
            <DetailEmbed
              kind={item.detail}
              onConfirmedChange={onConfirmedChange}
            />
          </div>
        )}
        {isCard && expanded && isAutomate && meta && (
          <div className="rf-item__automate-body">
            <Stack>
              <Field label="Runs">{meta.runs}</Field>
              <Field label="Runner checks">{meta.checks}</Field>
              <Field label="Produces">{meta.produces}</Field>
              <Field label="Last run">{meta.lastRun}</Field>
              <Field label="Next run">{meta.nextRun}</Field>
              {meta.approvalBoundary && (
                <Field label="Approval boundary">{meta.approvalBoundary}</Field>
              )}
              <AskRow
                placeholder="Run now, pause, change the cadence, or ask Runner something…"
                suggestions={["Run now", "Pause", "Change schedule", "View last run"]}
                onSubmit={(text) => console.log("ask runner", item.id, text)}
              />
            </Stack>
          </div>
        )}
      </div>
    </article>
  );
}

/* ────────────────────────── Detail embed ────────────────────────── */

function DetailEmbed({
  kind,
  onConfirmedChange,
}: {
  kind: DetailKind;
  onConfirmedChange?: (confirmed: boolean) => void;
}) {
  switch (kind) {
    case "flights":
      return <FlightDecisionCard onConfirmedChange={onConfirmedChange} embedded />;
    case "calendar":
      return <CalendarSlotCard onConfirmedChange={onConfirmedChange} embedded />;
    case "hotel":
      return <HotelPickCard onConfirmedChange={onConfirmedChange} embedded />;
    case "outreach":
      return <OutreachDraftsCard onConfirmedChange={onConfirmedChange} embedded />;
  }
}

/* ────────────────────────── Label chip ────────────────────────── */

const LABEL_META: Record<CardKind, { name: string; tone: ChipTone; icon: typeof Activity }> = {
  task: { name: "Task", tone: "accent", icon: Activity },
  automate: { name: "Automate", tone: "info", icon: Repeat },
};

function LabelChip({ kind }: { kind: CardKind }) {
  const { name, tone, icon: Icon } = LABEL_META[kind];
  return (
    <Chip tone={tone}>
      <Icon size={11} />
      {name}
    </Chip>
  );
}

/* ────────────────────────── Morph text ──────────────────────────
 * Crossfade between two strings. When `active` flips, the current text
 * fades out, the displayed string swaps under cover of opacity 0, then
 * the new text fades in. Same pattern as /scratchpad-to-cards.
 */

function MorphText({
  from,
  to,
  active,
}: {
  from: string;
  to: string;
  active: boolean;
}) {
  const target = active ? to : from;
  const [display, setDisplay] = useState<string>(target);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (display === target) return;
    setVisible(false);
    const t = window.setTimeout(() => {
      setDisplay(target);
      setVisible(true);
    }, 220);
    return () => window.clearTimeout(t);
  }, [target, display]);

  return (
    <span className="rf-morph" style={{ opacity: visible ? 1 : 0 }}>
      {display}
    </span>
  );
}

/* ────────────────────────── Narration + theme toggle ────────────────────────── */

function StageNarration({ stage }: { stage: Stage }) {
  const { eyebrow, body } = STAGE_NARRATION[stage];
  return (
    <div className="rf-narration" key={stage}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text size="sm" tone="muted">
        {body}
      </Text>
    </div>
  );
}

function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  return (
    <Row className="rf__theme">
      <Eyebrow>Theme</Eyebrow>
      <div className="rf__theme-toggle">
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
