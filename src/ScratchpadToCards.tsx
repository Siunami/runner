import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from "react";
import {
  Activity,
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Repeat,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Chip,
  DSRoot,
  Eyebrow,
  Heading,
  Meta,
  Row,
  SourceCluster,
  Stack,
  Text,
  type ChipTone,
} from "./design-system/primitives";

type SourceKind =
  | "calendar"
  | "email"
  | "slack"
  | "linear"
  | "linkedin"
  | "google-doc"
  | "google-sheet"
  | "google-slides"
  | "figma"
  | "browser"
  | "obsidian"
  | "person"
  | "phone"
  | "spreadsheet";
import "./design-system/primitives.css";
import "./ScratchpadToCards.css";

/*
 * /scratchpad-to-cards
 *
 * Combines /scratchpad (outline + triage chip-drop) with /triage-flow
 * (bullet → card morph), applied across all the items at once, and
 * pointed at the three card families from /triaged-cards.
 *
 * Three stages:
 *   0  Outline     — raw bullets, some with children
 *   1  Triaged     — chips drop on each top-level item, stripe extends
 *                    down through the children, stagger per row
 *   2  Cards       — each item promotes to its card family in place.
 *                    Titles refine via per-letter scramble. Lightweight
 *                    items keep their children as a list; operational
 *                    + recurring items pull in card content below.
 *
 * The chip is the throughline: it lands inline-right in stage 1, then
 * the inline chip fades while the header chip fades in at top-left of
 * the new card. They share identity (same color, icon, label), so the
 * eye reads it as one chip moving.
 */

type Theme = "light" | "dark";
type Stage = 0 | 1 | 2;
type CardType = "operational" | "recurring";

interface ChildItem {
  outlineText: string;
  cardText: string;
}

interface SeedItem {
  id: string;
  outlineText: string;
  cardTitle: string;
  cardType: CardType;
  children?: ChildItem[];
  recurring?: {
    headline: string;
    summary: string;
    nextRun: string;
  };
  operational?: {
    /**
     * Intermediate states Runner cycles through after the card forms,
     * before settling into the final state. Each entry plays for ~1s.
     * The sequence simulates "starting → gathering context → working".
     */
    progress?: string[];
    /**
     * The settled state — what the card shows once Runner has actually
     * done some work. Sources and needsYou only appear at this phase.
     */
    state: string;
    sources: Array<{ kind: SourceKind; label: string }>;
    needsYou?: string;
  };
}

// Seed is the same flavor as /scratchpad — a real-feeling brain dump.
// AI triage defaults: every item lands as Task or Automate. Lightweight
// stays available as a manual override in the chip dropdown, but
// nothing here defaults to it — the premise is Runner can take on, or
// schedule, every brain-dump line. Each item also carries a "polished"
// card title that the morph animation transitions into on promotion.
const SEED: SeedItem[] = [
  {
    id: "n1",
    outlineText: "Post-OG summit follow-ups",
    cardTitle: "Post-summit relationship work",
    cardType: "operational",
    children: [
      {
        outlineText: "Chat with Casey about FOG allocation",
        cardText: "Casey — FOG allocation chat",
      },
      {
        outlineText: "Get Molly involved — advisory + investing?",
        cardText: "Molly — advisory + invest invitation",
      },
      {
        outlineText: "Add OG attendees on LinkedIn",
        cardText: "Add summit attendees on LinkedIn",
      },
    ],
    operational: {
      progress: [
        "Starting…",
        "Pulling OG attendee list and your past intro patterns…",
        "Drafting Casey ping; queuing LinkedIn outreach for 12 attendees…",
      ],
      state:
        "Drafted Casey ping, drafted Molly invite (holding for your framing), queued 12 OG attendees for LinkedIn.",
      sources: [
        { kind: "linkedin", label: "OG · 12 attendees" },
        { kind: "person", label: "Casey" },
        { kind: "person", label: "Molly" },
      ],
      needsYou: "Pick a framing for Molly's invite",
    },
  },
  {
    id: "n10",
    outlineText: "Personal card optimization",
    cardTitle: "Credit card audit",
    cardType: "operational",
    children: [
      { outlineText: "Cancel AMEX Business", cardText: "Cancel AMEX Business" },
      {
        outlineText: "Apply for United Club membership",
        cardText: "Apply: United MileagePlus Club",
      },
      {
        outlineText: "Decide on AMEX Gold (barely using)",
        cardText: "Decide: AMEX Gold (unused)",
      },
    ],
    operational: {
      progress: [
        "Starting…",
        "Authenticating with AMEX, Chase, United…",
        "Pulling YTD spend across all three cards…",
      ],
      state:
        "Pulled YTD spend across all three cards. AMEX Gold is $30/mo with $4 in rewards. United Club application drafted.",
      sources: [
        { kind: "browser", label: "AMEX dashboard" },
        { kind: "browser", label: "Chase · United Club app" },
        { kind: "spreadsheet", label: "Card spend YTD" },
      ],
      needsYou: "Confirm Gold cancel + Club apply",
    },
  },
  {
    id: "n21",
    outlineText: "Morning briefing",
    cardTitle: "Morning attention brief",
    cardType: "recurring",
    recurring: {
      headline: "Runs weekdays 8:30 AM",
      summary: "Checks calendar, email, active items, and monitors",
      nextRun: "Tomorrow · 8:30 AM",
    },
  },
  {
    id: "n22",
    outlineText: "Weekly memory review",
    cardTitle: "/memory-review",
    cardType: "recurring",
    recurring: {
      headline: "Runs nightly · 10 PM",
      summary: "Audits memory store for staleness and gaps",
      nextRun: "Tonight · 10 PM",
    },
  },
  {
    id: "n30",
    outlineText: "Book flights SFO → YYZ, May 18-20",
    cardTitle: "Toronto trip · SFO ↔ YYZ",
    cardType: "operational",
    operational: {
      progress: [
        "Starting…",
        "Pulling flight history and travel preferences…",
        "Comparing May 18 and 19 United options; watching UA 1238…",
      ],
      state:
        "Compared May 18 and 19 United options; watching UA 1238 for a price drop. Holding on points-vs-cash.",
      sources: [
        { kind: "email", label: "Gmail · flight history" },
        { kind: "browser", label: "United · SFO→YYZ search" },
        { kind: "obsidian", label: "Travel points guide" },
      ],
      needsYou: "Lock in Wed AM, $899 RT?",
    },
  },
  {
    id: "n40",
    outlineText: "Home admin",
    cardTitle: "Spring home admin",
    cardType: "operational",
    children: [
      { outlineText: "Oura ring sizing for Laura", cardText: "Oura sizing for Laura" },
      { outlineText: "Schedule May gardener", cardText: "Book May gardener" },
    ],
    operational: {
      progress: [
        "Starting…",
        "Checking Oura sizing guide and gardener availability…",
        "Booking gardener for May 14…",
      ],
      state:
        "Compared Oura sizes (Laura's measurements suggest M). Gardener booked for May 14, 9 AM.",
      sources: [
        { kind: "browser", label: "Oura sizing guide" },
        { kind: "email", label: "Gardener · confirmation" },
      ],
    },
  },
  {
    id: "n50",
    outlineText: "Research SF engineers, 5+ yrs, blue-check startups",
    cardTitle: "Recruiting · SF engineers",
    cardType: "operational",
    operational: {
      progress: [
        "Starting…",
        "Running LinkedIn search · SF, 5y+, blue-check…",
        "Drafting personalized outreach notes…",
      ],
      state:
        "Drafted 5 personalized LinkedIn notes from your SF, 5-year, blue-check search. Awaiting review.",
      sources: [
        { kind: "linkedin", label: "LinkedIn · 12 results" },
        { kind: "person", label: "Mitt Mehta" },
        { kind: "person", label: "Debbie Cohen Rosler" },
      ],
      needsYou: "Review 5 LinkedIn outreach drafts",
    },
  },
  {
    id: "n60",
    outlineText: "Reply to Lucas about pricing",
    cardTitle: "Lucas pricing follow-up",
    cardType: "operational",
    operational: {
      progress: [
        "Starting…",
        "Reading the thread; checking your past replies for tone…",
        "Drafting nudge…",
      ],
      state:
        "Thread has been quiet 3 days. Drafted a friendly nudge tuned to your past replies, ready to send.",
      sources: [{ kind: "email", label: "Re: pricing follow-up" }],
      needsYou: "Send as-is or edit?",
    },
  },
  {
    id: "n70",
    outlineText: "Daily email triage",
    cardTitle: "Daily email triage",
    cardType: "recurring",
    recurring: {
      headline: "Runs weekdays 7 AM",
      summary: "Sorts inbox, drafts replies, flags anything needing you",
      nextRun: "Tomorrow · 7 AM",
    },
  },
  {
    id: "n80",
    outlineText: "OG Summit deck — final pass",
    cardTitle: "OG Summit deck — final pass",
    cardType: "operational",
    operational: {
      progress: [
        "Starting…",
        "Opening the deck and your talk outline notes…",
        "Reviewing slide 6, slide 23, and the title page…",
      ],
      state:
        "Edited slides 6, 23, and the title page from your notes. Three decisions left before export.",
      sources: [
        { kind: "google-slides", label: "OG Summit 2026" },
        { kind: "obsidian", label: "Talk outline" },
      ],
      needsYou: "Confirm slide 23 title + drop CYOA slide?",
    },
  },
];

const STAGE_LABEL: Record<Stage, string> = {
  0: "Outline",
  1: "Triaged",
  2: "Cards",
};

const STAGE_NARRATION: Record<Stage, { eyebrow: string; body: string }> = {
  0: {
    eyebrow: "Step 1 · Raw",
    body: "Brain-dump bullets. Two levels of nesting. Runner hasn't decided what kind of work each item is yet.",
  },
  1: {
    eyebrow: "Step 2 · Triaged · your turn",
    body: "Runner labels each top-level item — Task or Automate. Click any label to flip it if Runner picked wrong. When the labels look right, accept to promote.",
  },
  2: {
    eyebrow: "Step 3 · Promoted",
    body: "Each item grows into the right kind of card in place — so you can read which bullet became which card. A beat later, the cards migrate into Tasks and Automations sections.",
  },
};

// Each seed item declares its intended (AI-picked) label. The user can
// override at stage 1 via the chip dropdown. We keep the override map
// flat so it's easy to reset and easy to read in render.
const INITIAL_LABELS: Record<string, CardType> = SEED.reduce(
  (acc, item) => {
    acc[item.id] = item.cardType;
    return acc;
  },
  {} as Record<string, CardType>,
);

export default function ScratchpadToCards() {
  const [theme, setTheme] = useState<Theme>("light");
  const [stage, setStage] = useState<Stage>(0);
  const [labels, setLabels] = useState<Record<string, CardType>>(INITIAL_LABELS);
  // Tracks which items have had their AI label revealed during the
  // staggered triage animation. Index-based: row 0 reveals first, then 1,
  // etc. We don't need the labels themselves here — those come from the
  // `labels` state — just the per-item gate that flips on when its turn
  // arrives.
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  // Per-operational-item phase. 0 = first progress entry, N = settled
  // (where N = progress.length). Recurring items don't progress; they
  // sit at their schedule immediately.
  const [phases, setPhases] = useState<Record<string, number>>({});
  // Stage-2 sub-phase. Cards form in their original outline order first
  // (so the user can read "this bullet became this card" without
  // disorientation). After they settle, `sorted` flips to true and the
  // cards FLIP-migrate into Tasks / Automations sections.
  const [sorted, setSorted] = useState(false);

  // Refs for the FLIP migration. We record each article's bounding rect
  // right before we flip the `sorted` flag, then in a layout effect we
  // measure the new position, apply the inverse delta, and animate to
  // zero. Headers are new DOM, so they just fade in via CSS keyframes —
  // FLIP only runs on the items that already existed.
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const prevRects = useRef<Map<string, DOMRect>>(new Map());
  const setItemRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }, []);

  const triggerSort = useCallback(() => {
    prevRects.current.clear();
    itemRefs.current.forEach((el, id) => {
      prevRects.current.set(id, el.getBoundingClientRect());
    });
    setSorted(true);
  }, []);

  useLayoutEffect(() => {
    if (!sorted) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    itemRefs.current.forEach((el, id) => {
      const prev = prevRects.current.get(id);
      if (!prev) return;
      const next = el.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      // Invert: place the element back at its old position with no
      // transition, then on the next frame let it animate to its new
      // position.
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 540ms cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.transform = "";
      });
      window.setTimeout(() => {
        // Clear inline styles so the article goes back to CSS-driven
        // behavior (so Back / Reset don't carry stale transforms).
        el.style.transition = "";
        el.style.transform = "";
      }, 620);
    });
  }, [sorted]);

  // Stage 2 entrance — kick off the reshuffle after the cards have
  // visually finished forming in place. This is part two of a two-beat
  // promotion: cards form in their outline positions first (no order
  // change, no disorientation), then a beat later they migrate into
  // Tasks / Automations sections so the user can read the grouping.
  useEffect(() => {
    if (stage !== 2) {
      setSorted(false);
      return;
    }
    // Card form-up runs ~140ms × index + ~700ms tail. With the seed
    // size we have, the last card settles around 2s. Wait a brief beat
    // after that before triggering the migration.
    const t = window.setTimeout(triggerSort, 2200);
    return () => window.clearTimeout(t);
  }, [stage, triggerSort]);

  // Stage 2: simulate Runner working. Each operational card starts at
  // phase 0 ("Starting…") and advances through its `progress` array
  // toward the settled state. NeedsYou and sources only land at the
  // settled phase, so cards genuinely look like they're starting work
  // and growing into their final shape. Reset when leaving stage 2.
  useEffect(() => {
    if (stage !== 2) {
      setPhases({});
      return;
    }
    setPhases(
      SEED.reduce<Record<string, number>>((acc, item) => {
        if (item.cardType === "operational") acc[item.id] = 0;
        return acc;
      }, {}),
    );
    const timers: number[] = [];
    const PHASE_MS = 1100;
    const STAGGER_MS = 140;
    SEED.forEach((item, i) => {
      if (item.cardType !== "operational" || !item.operational?.progress) return;
      const total = item.operational.progress.length;
      // Advance phase 0 → 1 → … → total (where `total` is the settled
      // state index). Each step is one timer.
      for (let p = 1; p <= total; p++) {
        const t = window.setTimeout(
          () => {
            setPhases((prev) => ({ ...prev, [item.id]: p }));
          },
          i * STAGGER_MS + p * PHASE_MS,
        );
        timers.push(t);
      }
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [stage]);

  // Stage 0 → 1: stagger the chip reveals so it reads as Runner working
  // through the list one item at a time. Stage 1 → 2 is gated on an
  // explicit "Accept & promote" click so the user can review and edit
  // labels in between.
  useEffect(() => {
    if (stage !== 1) {
      setRevealed(new Set());
      return;
    }
    // If we're jumping straight to stage 1 (e.g. via the dot), reveal
    // everything immediately. Otherwise stagger.
    const timers: number[] = [];
    SEED.forEach((item, i) => {
      const t = window.setTimeout(() => {
        setRevealed((prev) => {
          if (prev.has(item.id)) return prev;
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
      }, 60 + i * 240);
      timers.push(t);
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [stage]);

  const reset = () => {
    setStage(0);
    setLabels(INITIAL_LABELS);
    setRevealed(new Set());
    setSorted(false);
  };

  const triage = () => setStage(1);

  const accept = () => setStage(2);

  const back = () => {
    if (stage === 2) setStage(1);
    else if (stage === 1) setStage(0);
  };

  const jumpTo = (s: Stage) => {
    if (s === 0) reset();
    else setStage(s);
  };

  const flipLabel = (id: string) => {
    setLabels((prev) => ({
      ...prev,
      [id]: prev[id] === "operational" ? "recurring" : "operational",
    }));
  };

  return (
    <DSRoot theme={theme} className="stc">
      <div className="stc__inner">
        <header className="stc__header">
          <Stack gap="snug">
            <Eyebrow>Runner · Scratchpad → Cards</Eyebrow>
            <Heading size="xl" as="h1">
              Bullets become the right kind of card
            </Heading>
            <Text tone="muted">
              Triage picks a label for each item — Task or Automate. You review, flip a label if
              Runner picked wrong, then accept. Each item grows into the right kind of card and
              the titles polish themselves on the way through.
            </Text>
          </Stack>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>

        <section className="stc__stage-wrap" data-stage={stage}>
          <div className="stc__toolbar">
            <Row className="stc__toolbar-status">
              <Eyebrow>{STAGE_LABEL[stage]}</Eyebrow>
              <Chip tone="neutral">{SEED.length}</Chip>
              {stage === 1 && (
                <Text size="sm" tone="muted">
                  Click any label to flip between Task and Automate.
                </Text>
              )}
            </Row>
            <div className="stc__toolbar-action">
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

          <div className="stc__list" data-sorted={sorted ? "true" : "false"}>
            {renderList({
              sorted,
              labels,
              stage,
              revealed,
              phases,
              flipLabel,
              setItemRef,
            })}
          </div>
        </section>

        <StageNarration stage={stage} />

        <section className="stc__controls">
          <Row className="stc__controls-row">
            <div className="stc__dots" role="tablist" aria-label="Stage">
              {([0, 1, 2] as Stage[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={s === stage}
                  className={`stc__dot ${s === stage ? "is-active" : ""}`}
                  onClick={() => jumpTo(s)}
                >
                  <span className="stc__dot-index">{s + 1}</span>
                  <span className="stc__dot-label">{STAGE_LABEL[s]}</span>
                </button>
              ))}
            </div>
            <Row className="stc__buttons">
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
          <div className="stc__rail" aria-hidden="true">
            <div className="stc__rail-fill" style={{ width: `${(stage / 2) * 100}%` }} />
          </div>
        </section>
      </div>
    </DSRoot>
  );
}

/* ────────────────────────── List rendering ────────────────────────── */

/* Two render modes share the same `<ItemView>` children — React keys are
 * the item ids, so re-ordering them doesn't unmount anything. That's what
 * lets the FLIP migration work: the same DOM nodes get reparented in a
 * new order, and the layout effect on `sorted` measures the position
 * delta and animates it. */
function renderList({
  sorted,
  labels,
  stage,
  revealed,
  phases,
  flipLabel,
  setItemRef,
}: {
  sorted: boolean;
  labels: Record<string, CardType>;
  stage: Stage;
  revealed: Set<string>;
  phases: Record<string, number>;
  flipLabel: (id: string) => void;
  setItemRef: (id: string, el: HTMLElement | null) => void;
}) {
  // We always pass the SEED index (regardless of render order) so the
  // `--item-card-delay` CSS var stays pinned to each card's identity. If
  // it changed when items reshuffled, any unfinished card-formation
  // transition would re-animate at a different cadence.
  const seedIndex = (id: string) => SEED.findIndex((it) => it.id === id);
  const renderItem = (item: SeedItem) => (
    <ItemView
      key={item.id}
      item={item}
      stage={stage}
      index={seedIndex(item.id)}
      label={labels[item.id]}
      revealed={stage >= 1 && revealed.has(item.id)}
      phase={phases[item.id] ?? 0}
      onFlipLabel={() => flipLabel(item.id)}
      articleRef={(el) => setItemRef(item.id, el)}
    />
  );

  if (!sorted) {
    return SEED.map(renderItem);
  }

  const ops = SEED.filter((it) => labels[it.id] === "operational");
  const recs = SEED.filter((it) => labels[it.id] === "recurring");

  return (
    <>
      {ops.length > 0 && (
        <SectionHeader
          key="hdr-tasks"
          label="Tasks"
          count={ops.length}
          tone="accent"
          Icon={Activity}
        />
      )}
      {ops.map(renderItem)}
      {recs.length > 0 && (
        <SectionHeader
          key="hdr-automations"
          label="Automations"
          count={recs.length}
          tone="info"
          Icon={Repeat}
          extraGap
        />
      )}
      {recs.map(renderItem)}
    </>
  );
}

function SectionHeader({
  label,
  count,
  tone,
  Icon,
  extraGap,
}: {
  label: string;
  count: number;
  tone: "accent" | "info";
  Icon: typeof Activity;
  extraGap?: boolean;
}) {
  return (
    <div
      className={`stc-section ${extraGap ? "stc-section--gap" : ""}`}
      data-tone={tone}
    >
      <Icon size={12} className="stc-section__icon" />
      <span className="stc-section__label">{label}</span>
      <span className="stc-section__count">{count}</span>
    </div>
  );
}

/* ────────────────────────── Item ────────────────────────── */

function ItemView({
  item,
  stage,
  index,
  label,
  revealed,
  phase,
  onFlipLabel,
  articleRef,
}: {
  item: SeedItem;
  stage: Stage;
  index: number;
  label: CardType;
  revealed: boolean;
  phase: number;
  onFlipLabel: () => void;
  articleRef?: Ref<HTMLElement>;
}) {
  // Triaged stays true once we've moved past stage 0, so the stripe and
  // chip don't snap back to their pre-triage state during the 1 → 2
  // promotion. Stage 1 itself gates on the per-item revealed flag so the
  // chip-drop staggers in.
  const isTriaged = stage >= 2 || revealed;
  const isCard = stage === 2;
  // Editable only while we're paused at the triage stage — once promoted
  // the user is past the review gate.
  const editable = stage === 1;

  // Stagger card formation only. Triage reveal is driven by the parent's
  // revealed-set timing, not CSS delays, so each chip pops in cleanly
  // when its turn arrives.
  const cardDelayMs = index * 140;

  const styleVars = {
    "--item-card-delay": `${cardDelayMs}ms`,
  } as CSSProperties;

  const headlineText = item.cardTitle ?? item.outlineText;
  // Runner only "needs you" once it has settled — until then it's still
  // gathering context and working. The settled phase is the index after
  // the last progress entry.
  const opProgressLen = item.operational?.progress?.length ?? 0;
  const isSettled = phase >= opProgressLen;
  const showNeedsYou =
    label === "operational" && !!item.operational?.needsYou && isSettled;
  const showSchedule = label === "recurring" && !!item.recurring;

  return (
    <article
      ref={articleRef}
      className={[
        "stc-item",
        `stc-item--${label}`,
        isTriaged && "stc-item--triaged",
        isCard && "stc-item--card",
        editable && "stc-item--editable",
      ]
        .filter(Boolean)
        .join(" ")}
      style={styleVars}
    >
      {/* Stripe — drops down through the group when triaged, fades when promoted to card. */}
      <span className="stc-item__stripe" aria-hidden="true" />

      {/* Header chip (visible only in card stage, anchored at top-left of card). */}
      <div className="stc-item__header-chip">
        <LabelChip type={label} />
        {showNeedsYou && (
          <span className="stc-item__needs-chip">
            <Chip tone="info">
              <AlertCircle size={11} />
              Needs you
            </Chip>
          </span>
        )}
        {showSchedule && item.recurring && (
          <span className="stc-item__schedule-chip">
            <Chip tone="outline">
              <Calendar size={11} />
              {item.recurring.headline.replace(/^Runs\s+/, "")}
            </Chip>
          </span>
        )}
      </div>

      {/* Head row: bullet + title + inline chip (the outline-stage layout). */}
      <div className="stc-item__head">
        <span className="stc-item__bullet" aria-hidden="true" />
        <h3 className="stc-item__title">
          <MorphText
            from={item.outlineText}
            to={headlineText}
            active={isCard}
          />
        </h3>
        {/* Chip only mounts once triage has reached this item — at stage
            0 there's no chip in DOM at all. With just two options, the
            chip is a coin flip: click it to toggle. Both faces are
            stacked inside a 3D flipper so the chip literally rotates
            between Task and Automate on click. */}
        {isTriaged && (
          <span className="stc-item__chip-wrap">
            <button
              type="button"
              className="stc-item__inline-chip"
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
                className={[
                  "stc-item__chip-flipper",
                  label === "recurring" && "is-flipped",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="stc-item__chip-face stc-item__chip-face--front">
                  <LabelChip type="operational" />
                </span>
                <span className="stc-item__chip-face stc-item__chip-face--back">
                  <LabelChip type="recurring" />
                </span>
              </span>
            </button>
          </span>
        )}
      </div>

      {/* Children — render in all stages. Operational cards keep them
          as tighter subtask rows; recurring cards collapse them away
          (a schedule has no subtasks). The child text polishes through
          the same MorphText so the language refines in step with the
          title. */}
      {item.children && item.children.length > 0 && (
        <ul className="stc-item__children">
          {item.children.map((child, i) => {
            const morphChild = isCard && label === "operational";
            return (
              <li
                key={i}
                className="stc-item__child"
                style={{ "--child-index": i } as CSSProperties}
              >
                <span className="stc-item__child-bullet" aria-hidden="true" />
                <span className="stc-item__child-text">
                  <MorphText
                    from={child.outlineText}
                    to={morphChild ? child.cardText : child.outlineText}
                    active={morphChild}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Card extras — content shape depends on the chosen label. */}
      <div className="stc-item__extra">
        <div className="stc-item__extra-inner">
          {label === "recurring" && item.recurring && (
            <RecurringExtra meta={item.recurring} />
          )}
          {label === "operational" && item.operational && (
            <OperationalExtra meta={item.operational} phase={phase} />
          )}
        </div>
      </div>
    </article>
  );
}

/* ────────────────────────── Card-type extras ────────────────────────── */

function RecurringExtra({
  meta,
}: {
  meta: { headline: string; summary: string; nextRun: string };
}) {
  return (
    <div className="stc-extra stc-extra--recurring">
      <p className="stc-extra__summary">{meta.summary}</p>
      <p className="stc-extra__next">
        <Clock size={12} />
        <span>Next run · {meta.nextRun}</span>
      </p>
    </div>
  );
}

function OperationalExtra({
  meta,
  phase,
}: {
  meta: {
    progress?: string[];
    state: string;
    sources: Array<{ kind: SourceKind; label: string }>;
    needsYou?: string;
  };
  phase: number;
}) {
  // `phase` indexes the progress array; once it reaches progress.length
  // we're at the settled state. Sources only appear from phase 1 onward
  // — phase 0 is pure "starting…" with no context yet.
  const progress = meta.progress ?? [];
  const isSettled = phase >= progress.length;
  const stateText = isSettled
    ? meta.state
    : progress[Math.min(phase, progress.length - 1)];
  const showSources = phase >= 1;
  return (
    <div className="stc-extra stc-extra--operational">
      <p className={`stc-extra__state ${isSettled ? "" : "stc-extra__state--live"}`}>
        {!isSettled && (
          <span className="stc-extra__pulse" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        )}
        <span className="stc-extra__state-text">{stateText}</span>
      </p>
      {showSources && (
        <div className="stc-extra__cluster">
          <Meta className="stc-extra__cluster-label">Looking at</Meta>
          <SourceCluster sources={meta.sources} max={4} />
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── Label chip ────────────────────────── */

const LABEL_META: Record<CardType, { name: string; tone: ChipTone; icon: typeof Activity }> = {
  operational: { name: "Task", tone: "accent", icon: Activity },
  recurring: { name: "Automate", tone: "info", icon: Repeat },
};

function LabelChip({ type }: { type: CardType }) {
  const { name, tone, icon: Icon } = LABEL_META[type];
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
 * the new text fades in. No layout flash because the swap happens at
 * opacity 0; no letter-by-letter motion.
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
    // Fade the current text out, then swap and let the CSS transition
    // fade the new text back in.
    setVisible(false);
    const t = window.setTimeout(() => {
      setDisplay(target);
      setVisible(true);
    }, 220);
    return () => window.clearTimeout(t);
  }, [target, display]);

  return (
    <span
      className="stc-morph"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {display}
    </span>
  );
}

/* ────────────────────────── Narration + theme toggle ────────────────────────── */

function StageNarration({ stage }: { stage: Stage }) {
  const { eyebrow, body } = STAGE_NARRATION[stage];
  return (
    <div className="stc-narration" key={stage}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text size="sm" tone="muted">
        {body}
      </Text>
    </div>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <Row className="stc__theme">
      <Eyebrow>Theme</Eyebrow>
      <div className="stc__theme-toggle">
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
