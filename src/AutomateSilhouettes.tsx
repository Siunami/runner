import { type CSSProperties, useState } from "react";
import { Activity, AlertCircle, Calendar, Clock, Repeat } from "lucide-react";
import {
  Chip,
  DSRoot,
  Eyebrow,
  Heading,
  Meta,
  Row,
  SourceCluster,
  Stack,
  Text,
  type SourceKind,
} from "./design-system/primitives";
import "./design-system/primitives.css";
import "./AutomateSilhouettes.css";

/*
 * /automate-silhouettes
 *
 * Comparison harness for visually differentiating Task cards from
 * Automate cards without leaning on the chip label. Four variants
 * applied to the same small sample (2 tasks, 2 automates interleaved):
 *
 *   baseline      — current look. Chip is the only signal.
 *   rail          — automates get a left schedule rail with ticks.
 *   ledger        — automates render as wide/short landscape rows.
 *   header-strip  — automates get a top tick strip with cadence label.
 *
 * Task cards never change across variants — only automate cards do.
 * That keeps the comparison clean: each silhouette is what the user
 * recognizes the *automate* by.
 */

type Theme = "light" | "dark";
type Variant = "baseline" | "rail" | "ledger" | "header-strip" | "strip-minimal";

interface TaskCard {
  type: "task";
  id: string;
  title: string;
  state: string;
  children?: string[];
  sources: Array<{ kind: SourceKind; label: string }>;
  needsYou?: boolean;
}

interface AutomateCard {
  type: "automate";
  id: string;
  title: string;
  /** e.g. "weekdays · 8:30 AM" — shown as a chip in baseline. */
  cadence: string;
  /** Short label rendered at the top of the rail / strip. */
  cadenceShort: string;
  /** Hour-of-day for the run, used to label the rail's "Next" tile. */
  timeLabel: string;
  summary: string;
  nextRun: string;
  /** Drives how many ticks render in rail/strip. 5 = weekdays, 7 = nightly. */
  ticks: number;
}

type SampleCard = TaskCard | AutomateCard;

const SAMPLE: SampleCard[] = [
  {
    type: "task",
    id: "task-1",
    title: "Post-summit relationship work",
    state:
      "Drafted Casey ping, drafted Molly invite (holding for your framing), queued 12 OG attendees for LinkedIn.",
    children: [
      "Casey — FOG allocation chat",
      "Molly — advisory + invest invitation",
      "Add summit attendees on LinkedIn",
    ],
    sources: [
      { kind: "linkedin", label: "OG · 12 attendees" },
      { kind: "person", label: "Casey" },
      { kind: "person", label: "Molly" },
    ],
    needsYou: true,
  },
  {
    type: "automate",
    id: "auto-1",
    title: "Morning attention brief",
    cadence: "weekdays · 8:30 AM",
    cadenceShort: "Mon–Fri",
    timeLabel: "8:30 AM",
    summary: "Checks calendar, email, active items, and monitors",
    nextRun: "Tomorrow · 8:30 AM",
    ticks: 5,
  },
  {
    type: "task",
    id: "task-2",
    title: "Toronto trip · SFO ↔ YYZ",
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
    type: "automate",
    id: "auto-2",
    title: "/memory-review",
    cadence: "nightly · 10 PM",
    cadenceShort: "Every night",
    timeLabel: "10 PM",
    summary: "Audits memory store for staleness and gaps",
    nextRun: "Tonight · 10 PM",
    ticks: 7,
  },
];

const VARIANTS: Array<{ key: Variant; name: string; caption: string }> = [
  {
    key: "baseline",
    name: "Baseline",
    caption: "No structural difference — chip label is the only signal.",
  },
  {
    key: "rail",
    name: "Schedule rail",
    caption:
      "Automate cards grow a left rail. The rail shows the next run as a header tile and a vertical column of tick marks for upcoming runs.",
  },
  {
    key: "ledger",
    name: "Ledger row",
    caption:
      "Automate cards flatten into a wide, short row — the silhouette is a schedule entry, not a work card. Next-run time anchors the right.",
  },
  {
    key: "header-strip",
    name: "Header strip",
    caption:
      "A thin tick strip sits above the chips on automate cards. The cadence becomes part of the card's chrome rather than a chip.",
  },
  {
    key: "strip-minimal",
    name: "Strip · minimal",
    caption:
      "Same top strip without the ticks. Task/Automate chips disappear — the strip's presence (or absence) is the type signal. Needs-you moves to a pill right of the title.",
  },
];

export default function AutomateSilhouettes() {
  const [theme, setTheme] = useState<Theme>("light");
  const [variant, setVariant] = useState<Variant>("baseline");

  const active = VARIANTS.find((v) => v.key === variant)!;

  return (
    <DSRoot theme={theme} className="as">
      <div className="as__inner">
        <header className="as__header">
          <Stack gap="snug">
            <Eyebrow>Runner · Automate silhouettes</Eyebrow>
            <Heading size="xl" as="h1">
              How should an Automate look different from a Task?
            </Heading>
            <Text tone="muted">
              The chip label tells you which is which. But the silhouette
              shouldn't have to wait for the chip. Toggle between three options
              to compare against the baseline.
            </Text>
          </Stack>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>

        <div className="as__toolbar">
          <div className="as__tabs" role="tablist" aria-label="Variant">
            {VARIANTS.map((v) => (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={v.key === variant}
                className={`as__tab ${v.key === variant ? "is-active" : ""}`}
                onClick={() => setVariant(v.key)}
              >
                {v.name}
              </button>
            ))}
          </div>
          <p className="as__caption">{active.caption}</p>
        </div>

        <section className="as__frame" data-variant={variant}>
          <div className="as__list">
            {SAMPLE.map((card) =>
              card.type === "task" ? (
                <TaskCardView key={card.id} card={card} variant={variant} />
              ) : (
                <AutomateCardView
                  key={card.id}
                  card={card}
                  variant={variant}
                />
              ),
            )}
          </div>
        </section>
      </div>
    </DSRoot>
  );
}

/* ──────────────────────────── Task card ──────────────────────────── */

function TaskCardView({ card, variant }: { card: TaskCard; variant: Variant }) {
  // In strip-minimal, the Task chip goes away and Needs-you moves to the
  // right of the title. The absence of a top strip is the type signal.
  const stripped = variant === "strip-minimal";

  return (
    <article className={`as-card as-card--task as-card--v-${variant}`}>
      {!stripped && (
        <div className="as-card__chips">
          <Chip tone="accent">
            <Activity size={11} />
            Task
          </Chip>
          {card.needsYou && (
            <Chip tone="info">
              <AlertCircle size={11} />
              Needs you
            </Chip>
          )}
        </div>
      )}
      <div className="as-card__title-row">
        <h3 className="as-card__title">{card.title}</h3>
        {stripped && card.needsYou && (
          <span className="as-card__title-needs">
            <Chip tone="info">
              <AlertCircle size={11} />
              Needs you
            </Chip>
          </span>
        )}
      </div>
      {card.children && card.children.length > 0 && (
        <ul className="as-card__children">
          {card.children.map((c) => (
            <li key={c} className="as-card__child">
              <span className="as-card__child-bullet" aria-hidden="true" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="as-card__state">{card.state}</p>
      {card.sources.length > 0 && (
        <div className="as-card__looking">
          <Meta className="as-card__looking-label">Looking at</Meta>
          <SourceCluster sources={card.sources} max={4} />
        </div>
      )}
    </article>
  );
}

/* ────────────────────────── Automate card ────────────────────────── */

function AutomateCardView({
  card,
  variant,
}: {
  card: AutomateCard;
  variant: Variant;
}) {
  if (variant === "ledger") return <AutomateLedger card={card} />;

  // strip-minimal: drop the Automate chip; the strip is the only signal.
  const stripped = variant === "strip-minimal";

  return (
    <article
      className={`as-card as-card--automate as-card--v-${variant}`}
      style={{ "--tick-count": card.ticks } as CSSProperties}
    >
      {variant === "rail" && <ScheduleRail card={card} />}
      {variant === "header-strip" && <ScheduleStrip card={card} />}
      {variant === "strip-minimal" && <ScheduleStripMinimal card={card} />}

      <div className="as-card__body">
        {!stripped && (
          <div className="as-card__chips">
            <Chip tone="info">
              <Repeat size={11} />
              Automate
            </Chip>
            {/* Cadence chip disappears in rail + header-strip — the rail/strip
                carries the cadence info as part of the card's chrome. */}
            {(variant === "baseline" || variant === "rail") && (
              <Chip tone="outline">
                <Calendar size={11} />
                {card.cadence}
              </Chip>
            )}
          </div>
        )}
        <div className="as-card__title-row">
          <h3 className="as-card__title">{card.title}</h3>
        </div>
        <p className="as-card__summary">{card.summary}</p>
        {/* The Next-run line stays put across variants so the card always
            answers "when does this run next?" in the same place. */}
        <p className="as-card__next">
          <Clock size={12} />
          <span>Next run · {card.nextRun}</span>
        </p>
      </div>
    </article>
  );
}

/* ──────── Variant: ledger (wide-short row) ──────── */

function AutomateLedger({ card }: { card: AutomateCard }) {
  return (
    <article
      className="as-card as-card--automate as-card--v-ledger"
      style={{ "--tick-count": card.ticks } as CSSProperties}
    >
      <div className="as-ledger__left">
        <div className="as-card__chips">
          <Chip tone="info">
            <Repeat size={11} />
            Automate
          </Chip>
        </div>
        <h3 className="as-card__title as-ledger__title">{card.title}</h3>
        <p className="as-ledger__summary">{card.summary}</p>
      </div>
      <div className="as-ledger__right">
        <span className="as-ledger__cadence">{card.cadence}</span>
        <span className="as-ledger__next">
          <Clock size={12} />
          {card.nextRun}
        </span>
      </div>
    </article>
  );
}

/* ──────── Variant: rail (left vertical schedule track) ──────── */

function ScheduleRail({ card }: { card: AutomateCard }) {
  return (
    <aside className="as-rail" aria-label={`Schedule · ${card.cadence}`}>
      <div className="as-rail__head">
        <Eyebrow className="as-rail__eyebrow">Next</Eyebrow>
        <span className="as-rail__time">{card.timeLabel}</span>
        <span className="as-rail__cadence-short">{card.cadenceShort}</span>
      </div>
      <div className="as-rail__ticks">
        {Array.from({ length: card.ticks }).map((_, i) => (
          <span
            key={i}
            className={`as-rail__tick ${i === 0 ? "is-next" : ""}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </aside>
  );
}

/* ──────── Variant: header-strip (top tick row) ──────── */

function ScheduleStrip({ card }: { card: AutomateCard }) {
  return (
    <div className="as-strip" aria-label={`Schedule · ${card.cadence}`}>
      <Clock size={11} className="as-strip__icon" />
      <span className="as-strip__ticks">
        {Array.from({ length: card.ticks }).map((_, i) => (
          <span
            key={i}
            className={`as-strip__tick ${i === 0 ? "is-next" : ""}`}
            aria-hidden="true"
          />
        ))}
      </span>
      <span className="as-strip__label">{card.cadence}</span>
    </div>
  );
}

/* ──────── Variant: strip-minimal (top label only, no ticks) ──────── */

function ScheduleStripMinimal({ card }: { card: AutomateCard }) {
  return (
    <div
      className="as-strip as-strip--minimal"
      aria-label={`Schedule · ${card.cadence}`}
    >
      <Clock size={11} className="as-strip__icon" />
      <span className="as-strip__label">{card.cadence}</span>
    </div>
  );
}

/* ──────────────────────────── Chrome ──────────────────────────── */

function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <Row className="as__theme">
      <Eyebrow>Theme</Eyebrow>
      <div className="as__theme-toggle">
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
