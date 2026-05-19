/*
 * /action-card-detail — gallery of action cards covering the decision shapes
 * Charlie hits regularly. Each card demos the same core pattern:
 *
 *   1. The options Runner researched are the action targets — click to commit.
 *      No duplicate buttons restating the choice elsewhere.
 *   2. A chat input at the bottom is the universal escape hatch — when the
 *      offered options don't fit, the user pushes back ("show other flights",
 *      "find a cheaper hotel") and Runner researches more without losing
 *      what's already on screen.
 *   3. Suggestion chips below the input give cheap one-tap redirects.
 *   4. New results stream in below the original — the existing research
 *      stays visible.
 *
 * Names and details are anonymized from real prompt traffic.
 */

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Archive,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CornerUpLeft,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DSRoot, Eyebrow, Heading, Stack, Text } from "./design-system/primitives";
import "./design-system/primitives.css";
import "./ActionCardDetail.css";

/* ────────────────────────── Shared types ────────────────────────── */

interface ChatTurn {
  id: string;
  speaker: "user" | "runner";
  text: string;
}

interface AskResult {
  reply: string;
}

interface CardNavEntry {
  id: string;
  label: string;
}

const CARD_NAV: CardNavEntry[] = [
  { id: "flight", label: "Flight booking" },
  { id: "email", label: "Inbox triage" },
  { id: "calendar", label: "Calendar slot" },
  { id: "hotel", label: "Hotel pick" },
  { id: "linear", label: "Bug triage" },
  { id: "outreach", label: "Outreach drafts" },
  { id: "cards", label: "Credit cards" },
  { id: "context", label: "Missing context" },
  { id: "monitor", label: "Reply landed" },
  { id: "investigation", label: "Investigation" },
];

/* ────────────────────────── Page ────────────────────────── */

export default function ActionCardDetail() {
  return (
    <DSRoot theme="light" className="acd">
      <div className="acd__inner">
        <header className="acd__header">
          <Stack gap="snug">
            <Eyebrow>Runner · Action cards · gallery</Eyebrow>
            <Heading size="xl" as="h1">
              Decisions Runner brings you
            </Heading>
            <Text tone="muted">
              Seven shapes of decision Runner hands back. Options Runner already researched
              are the action targets — click to commit. The chat input at the bottom of each
              card is the escape hatch: push back, ask for more, and new results stream in
              without losing what's already there.
            </Text>
          </Stack>
          <nav className="acd__nav" aria-label="Cards on this page">
            {CARD_NAV.map((entry) => (
              <a key={entry.id} href={`#${entry.id}`} className="acd__nav-link">
                {entry.label}
              </a>
            ))}
          </nav>
        </header>

        <FlightDecisionCard />
        <InboxTriageCard />
        <CalendarSlotCard />
        <HotelPickCard />
        <BugTriageCard />
        <OutreachDraftsCard />
        <CreditCardCard />
        <MissingContextCard />
        <MonitorTriggeredCard />
        <InvestigationCard />
      </div>
    </DSRoot>
  );
}

/* ────────────────────────── Shared shell + ask row ────────────────────────── */

// In the confirmed (collapsed) layer, the eyebrow swaps from "Needs you · X"
// to "Done · X" so the status reads cleanly. We extract the suffix from the
// original `kind` prop so cards don't have to declare a second string.
function kindWithoutNeedsYou(kind: string): string {
  return kind.replace(/^Needs you\s*·\s*/i, "");
}

// Embedders (RunnerFlow's expanded TaskCard, etc.) pass `onConfirmedChange`
// so the outer card can mirror the resolved state — flipping its own
// "Needs you" chip to "Done" when the inner artifact lands. When `embedded`
// is set, the inner card skips its own confirmed-layer chrome (kind chip,
// summary line, Undo button) — the outer card owns that signal — and just
// keeps showing the normal decision UI so the user can re-open and see the
// thinking after confirming.
export interface EmbeddedCardProps {
  onConfirmedChange?: (confirmed: boolean) => void;
  embedded?: boolean;
}

// Emit `confirmed` to the parent on changes, but skip the initial mount
// — otherwise collapsing-then-reopening a card would emit `false` and
// wipe the parent's persisted "Done" state.
function useEmitConfirmed(
  confirmed: boolean,
  onConfirmedChange: ((c: boolean) => void) | undefined,
) {
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    onConfirmedChange?.(confirmed);
  }, [confirmed, onConfirmedChange]);
}

interface CardShellProps {
  id: string;
  kind: string;
  title: string;
  body?: string;
  status?: ReactNode;
  children: ReactNode;
  ask?: {
    placeholder?: string;
    suggestions: string[];
    onAsk: (text: string) => AskResult;
  };
  /** Batch-style commit shelf at the bottom of the artifact column.
   * Single-pick cards (flight/slot/hotel) leave this off and use
   * in-option confirm buttons instead. */
  commit?: {
    label: string;
    note?: string;
    onConfirm: () => void;
    visible: boolean;
  };
  /** When set, the card collapses to a chrome + summary line. */
  confirmed?: boolean;
  summary?: ReactNode;
  onUndo?: () => void;
  /** When true, the card is nested inside another surface (e.g.
   * /runner-flow's expanded TaskCard). The outer surface owns the
   * confirmed signal, so skip the confirmed-layer chrome — keep
   * the normal decision UI always visible so users can re-open and
   * see the thinking. */
  embedded?: boolean;
}

function CardShell({
  id,
  kind,
  title,
  body,
  status,
  children,
  ask,
  commit,
  confirmed,
  summary,
  onUndo,
  embedded,
}: CardShellProps) {
  const effectiveConfirmed = embedded ? false : confirmed;
  return (
    <article
      className={`acd-card ${effectiveConfirmed ? "acd-card--confirmed" : ""} ${
        embedded ? "acd-card--embedded" : ""
      }`}
      id={id}
    >
      <div className="acd-card__layers">
        <div
          className="acd-card__layer acd-card__layer--normal"
          aria-hidden={effectiveConfirmed}
          inert={effectiveConfirmed || undefined}
        >
          <div className="acd-card__inner">
            <div className="acd-card__main">
              <div className="acd-card__topline">
                <span className="acd-card__kind">
                  <span className="acd-card__kind-dot" aria-hidden="true" />
                  {kind}
                </span>
                {status}
              </div>

              <div className="acd-card__head">
                <h2 className="acd-card__title">{title}</h2>
                {body && <p className="acd-card__body">{body}</p>}
              </div>

              {children}

              {commit?.visible && <CommitShelf {...commit} />}
            </div>

            {ask && (
              <aside className="acd-card__sidebar">
                <AskRow {...ask} />
              </aside>
            )}
          </div>
        </div>

        {/* Confirmed layer — only the standalone /action-card-detail
            gallery uses it. Embedded cards rely on the outer surface
            for the Done signal. */}
        {!embedded && (
          <div
            className="acd-card__layer acd-card__layer--confirmed"
            aria-hidden={!confirmed}
            inert={!confirmed || undefined}
          >
            <div className="acd-card__topline">
              <span className="acd-card__kind acd-card__kind--done">
                <Check
                  size={11}
                  strokeWidth={2.5}
                  className="acd-card__kind-check"
                  aria-hidden="true"
                />
                Done · {kindWithoutNeedsYou(kind)}
              </span>
              {onUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  className="acd-card__undo acd-card__undo--header"
                >
                  Undo
                </button>
              )}
            </div>
            <div className="acd-card__head">
              <h2 className="acd-card__title acd-card__title--done">{title}</h2>
            </div>
            <div className="acd-card__summary">
              <span className="acd-card__summary-icon" aria-hidden="true">
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="acd-card__summary-text">{summary ?? "Confirmed."}</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function CommitShelf({
  label,
  note,
  onConfirm,
}: {
  label: string;
  note?: string;
  onConfirm: () => void;
}) {
  return (
    <div className="acd-commit">
      <button type="button" className="acd-commit__btn" onClick={onConfirm}>
        <Check size={13} strokeWidth={2.5} />
        {label}
      </button>
      {note && <span className="acd-commit__note">{note}</span>}
    </div>
  );
}

function AskRow({
  placeholder = "Ask Runner to look further — or just type what you'd rather do",
  suggestions,
  onAsk,
}: {
  placeholder?: string;
  suggestions: string[];
  onAsk: (text: string) => AskResult;
}) {
  const [value, setValue] = useState("");
  const [thread, setThread] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [thread.length, busy]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setThread((prev) => [...prev, { id: `u-${Date.now()}`, speaker: "user", text: trimmed }]);
    setValue("");
    setBusy(true);
    window.setTimeout(() => {
      const result = onAsk(trimmed);
      setThread((prev) => [
        ...prev,
        { id: `r-${Date.now()}`, speaker: "runner", text: result.reply },
      ]);
      setBusy(false);
    }, 1100);
  };

  return (
    <div className="acd-ask">
      {(thread.length > 0 || busy) && (
        <div className="acd-ask__thread" ref={threadRef}>
          {thread.map((t) => (
            <div key={t.id} className={`acd-ask__turn acd-ask__turn--${t.speaker}`}>
              {t.speaker === "runner" && (
                <span className="acd-ask__turn-tag" aria-hidden="true">
                  R
                </span>
              )}
              <span className="acd-ask__turn-text">{t.text}</span>
            </div>
          ))}
          {busy && (
            <div className="acd-ask__turn acd-ask__turn--runner acd-ask__turn--busy">
              <span className="acd-ask__turn-tag" aria-hidden="true">
                R
              </span>
              <span className="acd-ask__busy-dots" aria-hidden="true">
                <span /> <span /> <span />
              </span>
              <span className="acd-ask__turn-text acd-ask__turn-text--muted">Looking into it…</span>
            </div>
          )}
        </div>
      )}

      <form
        className="acd-ask__form"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="acd-ask__input"
          autoComplete="off"
          disabled={busy}
        />
        <button
          type="submit"
          className="acd-ask__send"
          disabled={!value.trim() || busy}
          aria-label="Send"
        >
          <ArrowUp size={14} strokeWidth={2.5} />
        </button>
      </form>

      <div className="acd-ask__chips">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className="acd-ask__chip"
            disabled={busy}
            onClick={() => submit(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ tone, icon, children }: { tone: "success" | "info" | "neutral"; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`acd-card__status acd-card__status--${tone}`}>
      {icon}
      {children}
    </span>
  );
}

/* ────────────────────────── ScrubNumber ──────────────────────────
 * Bret Victor-style "Tangle" number: click and drag horizontally to
 * scrub the value. Hold Shift for 5x step, Alt for fine step.
 * Keyboard: arrow keys to nudge with the same modifiers.
 *
 * If `value` is null, renders a placeholder that on pointer-down
 * seeds the value and immediately begins scrubbing.
 * --------------------------------------------------------------- */

function ScrubNumber({
  value,
  onChange,
  seed = 10,
  min = 1,
  max = 50,
  step = 1,
  shiftMultiplier = 5,
  altDivisor = 2,
  pxPerStep = 4,
  format,
  placeholder,
  ariaLabel,
}: {
  value: number | null;
  onChange: (next: number) => void;
  seed?: number;
  min?: number;
  max?: number;
  step?: number;
  shiftMultiplier?: number;
  altDivisor?: number;
  pxPerStep?: number;
  format: (v: number) => ReactNode;
  placeholder: ReactNode;
  ariaLabel: string;
}) {
  const [scrubbing, setScrubbing] = useState(false);
  const [hinted, setHinted] = useState(false);
  const startRef = useRef<{ x: number; v: number } | null>(null);

  const clampSnap = (v: number, snap: number) => {
    const snapped = Math.round(v / snap) * snap;
    return Math.min(max, Math.max(min, snapped));
  };

  const getStep = (shift: boolean, alt: boolean) => {
    if (shift) return step * shiftMultiplier;
    if (alt) return step / altDivisor;
    return step;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startV = value ?? seed;
    if (value === null) onChange(startV);
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, v: startV };
    setScrubbing(true);
    setHinted(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const stepSize = getStep(e.shiftKey, e.altKey);
    const deltaSteps = Math.round(dx / pxPerStep);
    const next = clampSnap(startRef.current.v + deltaSteps * stepSize, stepSize);
    if (next !== value) onChange(next);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    startRef.current = null;
    setScrubbing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    const stepSize = getStep(e.shiftKey, e.altKey);
    const current = value ?? seed;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(clampSnap(current - stepSize, stepSize));
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(clampSnap(current + stepSize, stepSize));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(min);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(max);
    }
  };

  const isEmpty = value === null;

  return (
    <span
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value ?? seed}
      aria-label={ariaLabel}
      tabIndex={0}
      className={[
        "acd-scrub",
        isEmpty ? "acd-scrub--empty" : "",
        scrubbing ? "is-scrubbing" : "",
        hinted ? "is-hinted" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerEnter={() => setHinted(true)}
      onPointerLeave={() => setHinted(false)}
      onFocus={() => setHinted(true)}
      onBlur={() => setHinted(false)}
      onKeyDown={handleKeyDown}
    >
      <span className="acd-scrub__arrow acd-scrub__arrow--l" aria-hidden="true">
        <ChevronLeft size={11} strokeWidth={2.5} />
      </span>
      <span className="acd-scrub__value">{isEmpty ? placeholder : format(value!)}</span>
      <span className="acd-scrub__arrow acd-scrub__arrow--r" aria-hidden="true">
        <ChevronRight size={11} strokeWidth={2.5} />
      </span>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * 1. FLIGHT BOOKING — interactive pricing columns + alternates on demand
 * ═══════════════════════════════════════════════════════════════════════ */

interface FlightLeg {
  label: string;
  date: string;
  carrier: string;
  from: { code: string; time: string };
  to: { code: string; time: string };
  duration: string;
  stops: string;
}

interface PriceOption {
  kind: "points" | "cash";
  headline: string;
  bullets: string[];
  recommended?: boolean;
}

interface FlightOption {
  id: string;
  tag?: string;
  tagNote?: string;
  legs: FlightLeg[];
  pricing: PriceOption[];
}

const FLIGHT_INITIAL: FlightOption = {
  id: "ua-1238",
  tag: "Runner's pick",
  legs: [
    {
      label: "Outbound",
      date: "Wed · May 18",
      carrier: "United · UA 1238",
      from: { code: "SFO", time: "8:15 AM" },
      to: { code: "YYZ", time: "4:42 PM" },
      duration: "5h 27m",
      stops: "Nonstop",
    },
    {
      label: "Return",
      date: "Fri · May 20",
      carrier: "United · UA 1239",
      from: { code: "YYZ", time: "5:55 PM" },
      to: { code: "SFO", time: "8:31 PM" },
      duration: "5h 36m",
      stops: "Nonstop",
    },
  ],
  pricing: [
    {
      kind: "points",
      headline: "40,000 MP + $80",
      bullets: ["Effective 2.05¢ per point", "Saves $819 vs cash", "~½ of your MP balance"],
    },
    {
      kind: "cash",
      headline: "$899 round-trip",
      bullets: [
        "Earns 2,247 MileagePlus",
        "Preserves points for premium cabins",
        "Better year-end card balance",
      ],
      recommended: true,
    },
  ],
};

const FLIGHT_ALTERNATIVES: FlightOption[] = [
  {
    id: "aa-1180",
    tag: "Earlier outbound",
    tagNote: "+ $42 vs original",
    legs: [
      {
        label: "Outbound",
        date: "Wed · May 18",
        carrier: "American · AA 1180",
        from: { code: "SFO", time: "6:30 AM" },
        to: { code: "YYZ", time: "2:55 PM" },
        duration: "5h 25m",
        stops: "Nonstop",
      },
      {
        label: "Return",
        date: "Fri · May 20",
        carrier: "American · AA 1181",
        from: { code: "YYZ", time: "6:10 PM" },
        to: { code: "SFO", time: "8:50 PM" },
        duration: "5h 40m",
        stops: "Nonstop",
      },
    ],
    pricing: [
      {
        kind: "points",
        headline: "45,000 AAdvantage + $80",
        bullets: ["Effective 2.09¢ per point", "Saves $861 vs cash"],
      },
      {
        kind: "cash",
        headline: "$941 round-trip",
        bullets: ["Earns 2,355 AAdvantage", "Lands by 3 PM ET — well under cutoff"],
      },
    ],
  },
  {
    id: "ac-758",
    tag: "Air Canada · cheapest",
    tagNote: "− $128 vs original",
    legs: [
      {
        label: "Outbound",
        date: "Wed · May 18",
        carrier: "Air Canada · AC 758",
        from: { code: "SFO", time: "10:25 AM" },
        to: { code: "YYZ", time: "6:48 PM" },
        duration: "5h 23m",
        stops: "Nonstop",
      },
      {
        label: "Return",
        date: "Fri · May 20",
        carrier: "Air Canada · AC 759",
        from: { code: "YYZ", time: "7:20 PM" },
        to: { code: "SFO", time: "9:55 PM" },
        duration: "5h 35m",
        stops: "Nonstop",
      },
    ],
    pricing: [
      {
        kind: "points",
        headline: "Not eligible",
        bullets: ["Air Canada not in your MP partner list"],
      },
      {
        kind: "cash",
        headline: "$771 round-trip",
        bullets: ["Earns nothing in your loyalty programs", "Misses your 4 PM ET cutoff"],
      },
    ],
  },
];

type FlightSelectionKey = `${string}:${"points" | "cash"}` | null;

export function FlightDecisionCard({ onConfirmedChange, embedded }: EmbeddedCardProps = {}) {
  const [flights, setFlights] = useState<FlightOption[]>([FLIGHT_INITIAL]);
  const [selection, setSelection] = useState<FlightSelectionKey>(null);
  const [snoozed, setSnoozed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  useEmitConfirmed(confirmed, onConfirmedChange);

  const onAsk = (text: string): AskResult => {
    const lower = text.toLowerCase();
    if (lower.includes("wait") || lower.includes("drop")) {
      setSnoozed(true);
      return {
        reply:
          "Set to watch UA 1238 for any cash price below $850. I'll surface this card again if it drops.",
      };
    }
    if (
      lower.includes("premium") ||
      lower.includes("business") ||
      lower.includes("cabin") ||
      lower.includes("first class")
    ) {
      return {
        reply:
          "UA 1238 in Polaris business: 80,000 MP + $80, or $2,840 cash. Lie-flat both ways. Not eligible for the Marriott points anyway.",
      };
    }
    if (
      lower.includes("flight") ||
      lower.includes("other") ||
      lower.includes("alternative") ||
      lower.includes("earlier") ||
      lower.includes("cheap")
    ) {
      setFlights((prev) => {
        const seen = new Set(prev.map((f) => f.id));
        return [...prev, ...FLIGHT_ALTERNATIVES.filter((f) => !seen.has(f.id))];
      });
      return {
        reply:
          "Found 2 alternatives. AA 1180 lands earlier for +$42; AC 758 saves $128 but misses your 4 PM ET cutoff.",
      };
    }
    return {
      reply: "Got it — keeping the original options visible while I dig in.",
    };
  };

  const status = snoozed ? (
    <StatusBadge tone="info" icon={<Sparkles size={11} strokeWidth={2} />}>
      Watching for price drop
    </StatusBadge>
  ) : undefined;

  const summary = (() => {
    if (!selection) return null;
    const [flightId, kind] = selection.split(":") as [string, "points" | "cash"];
    const flight = flights.find((f) => f.id === flightId);
    const price = flight?.pricing.find((p) => p.kind === kind);
    if (!flight || !price) return null;
    const leg = flight.legs[0];
    return (
      <>
        Booked <strong>{leg.carrier}</strong> · {price.headline} · {leg.date}, departing{" "}
        {leg.from.time}.
      </>
    );
  })();

  return (
    <CardShell
      id="flight"
      kind="Needs you · Decision"
      title="Lock in Wed AM, $899 round-trip?"
      body="Both legs nonstop, arrival before your 4 PM ET cutoff."
      status={status}
      ask={{
        suggestions: ["Show other flights", "Earlier outbound only", "Compare premium cabin", "Wait for a price drop"],
        onAsk,
      }}
      confirmed={confirmed}
      summary={summary}
      embedded={embedded}
      onUndo={() => {
        setConfirmed(false);
        setSelection(null);
      }}
    >
      <div className="acd-card__flights">
        {flights.map((flight, idx) => (
          <FlightBlock
            key={flight.id}
            flight={flight}
            selection={selection}
            onSelect={(priceKind) => setSelection(`${flight.id}:${priceKind}`)}
            onConfirm={() => setConfirmed(true)}
            isFirst={idx === 0}
          />
        ))}
      </div>
    </CardShell>
  );
}

function FlightBlock({
  flight,
  selection,
  onSelect,
  onConfirm,
  isFirst,
}: {
  flight: FlightOption;
  selection: FlightSelectionKey;
  onSelect: (priceKind: "points" | "cash") => void;
  onConfirm: () => void;
  isFirst: boolean;
}) {
  return (
    <section className={`acd-flight ${isFirst ? "" : "acd-flight--alt"}`}>
      {flight.tag && (
        <header className="acd-flight__tag">
          <span className="acd-flight__tag-label">{flight.tag}</span>
          {flight.tagNote && <span className="acd-flight__tag-note">· {flight.tagNote}</span>}
        </header>
      )}
      <div className="acd-flight__legs">
        {flight.legs.map((leg, i) => (
          <FlightLegRow key={i} leg={leg} />
        ))}
      </div>
      <div className="acd-flight__pricing">
        {flight.pricing.map((p) => {
          const key = `${flight.id}:${p.kind}` as const;
          const selected = selection === key;
          const disabled = p.headline === "Not eligible";
          return (
            <PriceOptionCard
              key={p.kind}
              option={p}
              selected={selected}
              disabled={disabled}
              onClick={() => !disabled && onSelect(p.kind)}
              onConfirm={onConfirm}
              confirmLabel="Confirm booking"
            />
          );
        })}
      </div>
    </section>
  );
}

function FlightLegRow({ leg }: { leg: FlightLeg }) {
  return (
    <div className="acd-leg">
      <div className="acd-leg__meta">
        <span className="acd-leg__label">{leg.label}</span>
        <span className="acd-leg__dot" aria-hidden="true">·</span>
        <span>{leg.date}</span>
        <span className="acd-leg__dot" aria-hidden="true">·</span>
        <span className="acd-leg__carrier">{leg.carrier}</span>
      </div>
      <div className="acd-leg__route">
        <div className="acd-leg__endpoint">
          <span className="acd-leg__time">{leg.from.time}</span>
          <span className="acd-leg__code">{leg.from.code}</span>
        </div>
        <div className="acd-leg__path">
          <span className="acd-leg__path-dot" aria-hidden="true" />
          <span className="acd-leg__path-line" aria-hidden="true" />
          <span className="acd-leg__path-dot" aria-hidden="true" />
          <span className="acd-leg__path-meta">{leg.duration} · {leg.stops}</span>
        </div>
        <div className="acd-leg__endpoint acd-leg__endpoint--end">
          <span className="acd-leg__time">{leg.to.time}</span>
          <span className="acd-leg__code">{leg.to.code}</span>
        </div>
      </div>
    </div>
  );
}

function PriceOptionCard({
  option,
  selected,
  disabled,
  onClick,
  onConfirm,
  confirmLabel,
}: {
  option: PriceOption;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
      aria-disabled={disabled}
      className={`acd-price ${selected ? "acd-price--selected" : ""} ${
        option.recommended ? "acd-price--recommended" : ""
      } ${disabled ? "acd-price--disabled" : ""}`}
    >
      <div className="acd-price__top">
        <span className="acd-price__kind">{option.kind === "points" ? "Points" : "Cash"}</span>
        <span className="acd-price__badges">
          {option.recommended && !selected && (
            <span className="acd-price__badge">Recommended</span>
          )}
          {selected && (
            <span className="acd-price__badge acd-price__badge--selected">
              <Check size={10} strokeWidth={3} />
              Selected
            </span>
          )}
        </span>
      </div>
      <p className="acd-price__headline">{option.headline}</p>
      <ul className="acd-price__bullets">
        {option.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      {selected && onConfirm && (
        <button
          type="button"
          className="acd-inline-confirm"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
        >
          <Check size={13} strokeWidth={2.5} />
          {confirmLabel ?? "Confirm"}
        </button>
      )}
      {!disabled && !selected && (
        <span className="acd-price__hint" aria-hidden="true">
          Tap to book this
        </span>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * 2. INBOX TRIAGE — per-row inline actions across a batch of emails
 * ═══════════════════════════════════════════════════════════════════════ */

type EmailVerdict = "reply" | "archive" | "snooze" | null;

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

interface EmailItem {
  id: string;
  from: string;
  subject: string;
  preview: string;
  recommended: Exclude<EmailVerdict, null>;
  reason: string;
  /** Pre-written reply. Shown inline when the user picks Reply. */
  draft?: EmailDraft;
}

const EMAILS: EmailItem[] = [
  {
    id: "e1",
    from: "Sam K.",
    subject: "Re: intro call next week",
    preview: "Sent over my calendly — happy to grab any of the 30-min slots…",
    recommended: "reply",
    reason: "Time on her calendly · book + draft confirm",
    draft: {
      to: "sam.k@example.com",
      subject: "Re: intro call next week",
      body:
        "Hey Sam,\n\nThu May 21 at 9 AM PT (12 PM ET) works on my side — I'll send the invite shortly.\n\nLooking forward to it.\n\nBest,\nCharlie",
    },
  },
  {
    id: "e2",
    from: "Adam at Acme Support",
    subject: "Migration timeline",
    preview: "Quick check-in on the migration plan — anything blocking on your side?",
    recommended: "reply",
    reason: "Open thread · waiting on you",
    draft: {
      to: "adam@acme-support.example",
      subject: "Re: Migration timeline",
      body:
        "Hi Adam,\n\nNothing blocking on my end. We're on track for the May 30 cutover — I'll send the updated runbook by Friday.\n\nBest,\nCharlie",
    },
  },
  {
    id: "e3",
    from: "V.",
    subject: "Calendly link",
    preview: "Let me know what works on your end — I'm wide open this week…",
    recommended: "reply",
    reason: "Default: book a time first, then reply",
    draft: {
      to: "v@example.com",
      subject: "Re: Calendly link",
      body:
        "Hi V — booked the 2 PM PT slot on Wed from your calendly. Talk then.\n\nCharlie",
    },
  },
  {
    id: "e4",
    from: "Rippling",
    subject: "Your monthly billing summary",
    preview: "Your invoice for April is ready. No action needed unless…",
    recommended: "archive",
    reason: "Statement · no action needed",
  },
  {
    id: "e5",
    from: "OG Summit · Molly",
    subject: "Reminder: workshop tomorrow",
    preview: "Just a heads up that Bethany's workshop runs 2–3:30 PM in room…",
    recommended: "archive",
    reason: "Already on calendar",
  },
  {
    id: "e6",
    from: "Jai (investor)",
    subject: "Strategic round?",
    preview: "Heard you might be opening up a strategic SAFE — would love to chat…",
    recommended: "reply",
    reason: "Add to strategic round list · propose times",
    draft: {
      to: "jai@example.vc",
      subject: "Re: Strategic round?",
      body:
        "Hey Jai — yes, exploring a small strategic SAFE. Happy to walk you through it. Grabbing 30 min next week — I'll send a few times.\n\nCharlie",
    },
  },
  {
    id: "e7",
    from: "Linear · #escalations",
    subject: "Bug RUN-2105 reopened",
    preview: "Customer reports the 'sent via Runner' tagline still rendering…",
    recommended: "snooze",
    reason: "In progress · check back EOD",
  },
  {
    id: "e8",
    from: "GitHub",
    subject: "Security alert: 1 dependency",
    preview: "We detected a moderate-severity vulnerability in your dependency…",
    recommended: "archive",
    reason: "Bot · already auto-PR'd",
  },
];

type RowVerdict = Exclude<EmailVerdict, null>;

const recommendedVerdicts = (): Record<string, RowVerdict> =>
  Object.fromEntries(EMAILS.map((e) => [e.id, e.recommended]));

function InboxTriageCard() {
  const [verdicts, setVerdicts] = useState<Record<string, RowVerdict>>(recommendedVerdicts);
  const [confirmed, setConfirmed] = useState(false);

  const replied = EMAILS.filter((e) => verdicts[e.id] === "reply").length;
  const archived = EMAILS.filter((e) => verdicts[e.id] === "archive").length;
  const snoozed = EMAILS.filter((e) => verdicts[e.id] === "snooze").length;
  const overrideCount = EMAILS.filter((e) => verdicts[e.id] !== e.recommended).length;

  const onAsk = (text: string): AskResult => {
    const lower = text.toLowerCase();
    if (lower.includes("reset") || (lower.includes("all") && lower.includes("runner"))) {
      setVerdicts(recommendedVerdicts());
      return { reply: "Reset every row to Runner's pick. Override any individually before sending." };
    }
    if (lower.includes("archive all") || lower.includes("statement")) {
      setVerdicts((prev) => {
        const next = { ...prev };
        EMAILS.forEach((e) => {
          if (e.recommended === "archive") next[e.id] = "archive";
        });
        return next;
      });
      return { reply: "Locked the 3 statement-style emails for archive. Replies are still up to you." };
    }
    if (lower.includes("snooze") && lower.includes("all")) {
      setVerdicts(Object.fromEntries(EMAILS.map((e) => [e.id, "snooze" as RowVerdict])));
      return { reply: "Snoozed everything to tomorrow 9 AM. Override any back to reply before sending." };
    }
    return { reply: "Keeping the batch as-is. Tell me what to change." };
  };

  return (
    <CardShell
      id="email"
      kind="Needs you · Triage"
      title="Triage your morning inbox · 8 threads"
      body="Runner pre-classified each row and drafted replies where needed. Scan the batch — change any verdict before sending."
      ask={{
        suggestions: ["Reset to Runner's picks", "Archive statements only", "Snooze everything", "Show only ones that need a reply"],
        onAsk,
      }}
      commit={{
        label: `Send batch · ${EMAILS.length} action${EMAILS.length === 1 ? "" : "s"}`,
        note:
          overrideCount > 0
            ? `— ${overrideCount} override${overrideCount === 1 ? "" : "s"} on Runner's picks`
            : "— all on Runner's picks",
        onConfirm: () => setConfirmed(true),
        visible: true,
      }}
      confirmed={confirmed}
      summary={
        <>
          Triaged <strong>{EMAILS.length} threads</strong> · {replied} replied, {archived} archived,{" "}
          {snoozed} snoozed.
        </>
      }
      onUndo={() => {
        setConfirmed(false);
        setVerdicts(recommendedVerdicts());
      }}
    >
      <ul className="acd-email-list">
        {EMAILS.map((e) => (
          <EmailRow
            key={e.id}
            email={e}
            verdict={verdicts[e.id]}
            isOverride={verdicts[e.id] !== e.recommended}
            onOverride={(v) => setVerdicts((prev) => ({ ...prev, [e.id]: v }))}
          />
        ))}
      </ul>
    </CardShell>
  );
}

const SNOOZE_OPTIONS = ["+ 2 hours", "Tomorrow 9 AM", "EOD Friday", "Next Monday"];
const DEFAULT_SNOOZE = "Tomorrow 9 AM";

function EmailRow({
  email,
  verdict,
  isOverride,
  onOverride,
}: {
  email: EmailItem;
  verdict: RowVerdict;
  isOverride: boolean;
  onOverride: (v: RowVerdict) => void;
}) {
  const [draftOpen, setDraftOpen] = useState(true);
  const [snoozePick, setSnoozePick] = useState<string>(DEFAULT_SNOOZE);

  const draftShown = !!email.draft && verdict === "reply" && draftOpen;
  const isSnoozing = verdict === "snooze";
  const expanded = draftShown || isSnoozing;

  // Only offer "Reply" as an override when Runner actually drafted one.
  const allVerdicts: RowVerdict[] = ["reply", "archive", "snooze"];
  const overrides = allVerdicts
    .filter((v) => v !== verdict)
    .filter((v) => v !== "reply" || !!email.draft);

  return (
    <li
      className={`acd-email acd-email--${verdict} ${expanded ? "acd-email--expanded" : ""}`}
    >
      <div className="acd-email__avatar" aria-hidden="true">
        {email.from.charAt(0).toUpperCase()}
      </div>
      <div className="acd-email__body">
        <div className="acd-email__top">
          <span className="acd-email__from">{email.from}</span>
          <span className="acd-email__subject">{email.subject}</span>
        </div>
        <p className="acd-email__preview">{email.preview}</p>
        <p className="acd-email__reason">
          <span className="acd-email__reason-text">{email.reason}</span>
          {email.draft && verdict === "reply" && (
            <button
              type="button"
              className="acd-email__draft-toggle"
              onClick={() => setDraftOpen((v) => !v)}
              aria-expanded={draftShown}
              title={draftShown ? "Hide draft" : "Show draft"}
            >
              <ChevronDown
                size={11}
                strokeWidth={2.4}
                style={{
                  transform: draftShown ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease",
                }}
              />
              {draftShown ? "Hide draft" : "Show draft"}
            </button>
          )}
        </p>
      </div>
      <div className="acd-email__actions">
        <VerdictChip verdict={verdict} snoozePick={snoozePick} isOverride={isOverride} />
        {overrides.length > 0 && (
          <div className="acd-email__overrides" role="group" aria-label="Change verdict">
            <span className="acd-email__overrides-label">or</span>
            {overrides.map((v) => (
              <button
                key={v}
                type="button"
                className="acd-email__override"
                onClick={() => onOverride(v)}
                title={`Change to ${verbLabel(v)}`}
              >
                {verbLabel(v)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inline draft preview — shown only when verdict is reply and a draft exists. */}
      <div className={`acd-email__draft acd-reveal ${draftShown ? "acd-reveal--open" : ""}`}>
        <div>
          {email.draft && (
            <div className="acd-email__draft-inner">
              <div className="acd-email__draft-head">
                <span>To</span>
                <span className="acd-email__draft-head-val">{email.draft.to}</span>
              </div>
              <div className="acd-email__draft-subject">{email.draft.subject}</div>
              <div className="acd-email__draft-body">{email.draft.body}</div>
              <div className="acd-email__draft-foot">
                <button type="button">Edit draft</button>
                <button type="button">Regenerate</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Snooze-time picker — shown only when verdict is snooze. Selects the time directly. */}
      <div
        className={`acd-email__snooze-options acd-reveal ${isSnoozing ? "acd-reveal--open" : ""}`}
      >
        <div>
          <div className="acd-email__snooze-options-inner">
            {SNOOZE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`acd-email__snooze-chip ${snoozePick === opt ? "is-active" : ""}`}
                onClick={() => setSnoozePick(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

function VerdictChip({
  verdict,
  snoozePick,
  isOverride,
}: {
  verdict: RowVerdict;
  snoozePick: string;
  isOverride: boolean;
}) {
  const tone = verdict === "reply" ? "primary" : verdict === "archive" ? "neutral" : "muted";
  const icon =
    verdict === "reply" ? (
      <CornerUpLeft size={12} strokeWidth={2.2} />
    ) : verdict === "archive" ? (
      <Archive size={12} strokeWidth={2.2} />
    ) : (
      <Sparkles size={11} strokeWidth={2} />
    );
  const label =
    verdict === "snooze" ? `Snooze · ${snoozePick}` : verbLabel(verdict);
  return (
    <span
      className={`acd-email-btn acd-email-btn--${tone} is-active`}
      aria-label={isOverride ? `Your override: ${label}` : `Runner's pick: ${label}`}
      title={isOverride ? "Your override" : "Runner's pick"}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}

function verbLabel(v: RowVerdict): string {
  if (v === "reply") return "Reply";
  if (v === "archive") return "Archive";
  return "Snooze";
}

/* ════════════════════════════════════════════════════════════════════════
 * 3. CALENDAR SLOT — pick one of N time slots
 * ═══════════════════════════════════════════════════════════════════════ */

interface SlotOption {
  id: string;
  day: string;
  yourTime: string;
  theirTime: string;
  conflict?: string;
  recommended?: boolean;
  note?: string;
}

const SLOTS: SlotOption[] = [
  {
    id: "thu-am",
    day: "Thu · May 21",
    yourTime: "9:00 AM PT",
    theirTime: "12:00 PM ET",
    note: "First slot before your standup",
    recommended: true,
  },
  {
    id: "thu-pm",
    day: "Thu · May 21",
    yourTime: "2:30 PM PT",
    theirTime: "5:30 PM ET",
    conflict: "Tight — back-to-back with design review",
  },
  {
    id: "fri-am",
    day: "Fri · May 22",
    yourTime: "10:00 AM PT",
    theirTime: "1:00 PM ET",
    note: "Open both sides",
  },
];

export function CalendarSlotCard({ onConfirmedChange, embedded }: EmbeddedCardProps = {}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  useEmitConfirmed(confirmed, onConfirmedChange);

  const onAsk = (text: string): AskResult => {
    const lower = text.toLowerCase();
    if (lower.includes("later") || lower.includes("next week")) {
      return { reply: "Looking at the week of May 25 — Mon AM (your time) and Wed AM both work." };
    }
    if (lower.includes("30") || lower.includes("60")) {
      return { reply: "Duration noted. Default is 30 min; let me know if you want 60." };
    }
    return { reply: "Got it — keeping these 3 slots up. Tell me what to shift." };
  };

  const pickedSlot = SLOTS.find((s) => s.id === picked);
  const summary = pickedSlot ? (
    <>
      Sent invite for <strong>{pickedSlot.day}</strong> at {pickedSlot.yourTime} ·{" "}
      {pickedSlot.theirTime} for Sam.
    </>
  ) : null;

  return (
    <CardShell
      id="calendar"
      kind="Needs you · Scheduling"
      title="Pick a time for the Sam K. intro"
      body="Both calendars compared. These three slots work for both of you — pick one and Runner sends the invite."
      ask={{
        suggestions: ["Show later in the week", "60 min instead of 30", "Mornings only", "Avoid Thursday afternoons"],
        onAsk,
      }}
      confirmed={confirmed}
      summary={summary}
      embedded={embedded}
      onUndo={() => {
        setConfirmed(false);
        setPicked(null);
      }}
    >
      <CalendarGrid
        slots={SLOTS}
        selectedId={picked}
        onSelect={(id) => setPicked((p) => (p === id ? null : id))}
      />
      <div className="acd-slots">
        {SLOTS.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            selected={picked === slot.id}
            onClick={() => setPicked((p) => (p === slot.id ? null : slot.id))}
            onConfirm={() => setConfirmed(true)}
          />
        ))}
      </div>
    </CardShell>
  );
}

/* ────────────────────────── Calendar grid ────────────────────────── *
 * Mini 2-day calendar showing existing meetings + proposed slots so the
 * user can see how each candidate lands in context. Click a slot pill to
 * select it (syncs with the slot cards below). */

interface CalEvent {
  day: "thu" | "fri";
  start: number; // hour in float (9.5 = 9:30 AM)
  duration: number; // minutes
  title: string;
}

const EXISTING_EVENTS: CalEvent[] = [
  { day: "thu", start: 9.5, duration: 30, title: "Standup" },
  { day: "thu", start: 11, duration: 60, title: "Q3 launch review" },
  { day: "thu", start: 12, duration: 60, title: "Lunch · held" },
  { day: "thu", start: 15, duration: 90, title: "Design review" },
  { day: "fri", start: 9, duration: 30, title: "Eng standup" },
  { day: "fri", start: 12, duration: 60, title: "Lunch · held" },
];

const SLOT_POSITIONS: Record<string, { day: "thu" | "fri"; start: number; duration: number }> = {
  "thu-am": { day: "thu", start: 9, duration: 30 },
  "thu-pm": { day: "thu", start: 14.5, duration: 30 },
  "fri-am": { day: "fri", start: 10, duration: 30 },
};

const DAY_START = 8;
const DAY_HOURS = 10; // 8 AM through 6 PM grid
const HOUR_PX = 28;

function formatHour(h: number): string {
  const hour = h % 12 || 12;
  return `${hour} ${h >= 12 ? "PM" : "AM"}`;
}

function CalendarGrid({
  slots,
  selectedId,
  onSelect,
}: {
  slots: SlotOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const topFor = (start: number) => (start - DAY_START) * HOUR_PX;
  const heightFor = (duration: number) => Math.max((duration / 60) * HOUR_PX, 18);

  const renderDay = (day: "thu" | "fri") => (
    <div className="acd-cal__day">
      {/* Hour lines */}
      {Array.from({ length: DAY_HOURS }, (_, i) => (
        <div
          key={`line-${i}`}
          className="acd-cal__line"
          style={{ top: `${i * HOUR_PX}px` }}
          aria-hidden="true"
        />
      ))}
      {/* Existing events */}
      {EXISTING_EVENTS.filter((e) => e.day === day).map((e, i) => (
        <div
          key={`${day}-e${i}`}
          className="acd-cal__event"
          style={{ top: `${topFor(e.start)}px`, height: `${heightFor(e.duration)}px` }}
          title={`${e.title} · ${formatHour(Math.floor(e.start))}${e.start % 1 ? ":30" : ""}`}
        >
          {e.title}
        </div>
      ))}
      {/* Proposed slots */}
      {slots
        .filter((s) => SLOT_POSITIONS[s.id]?.day === day)
        .map((s) => {
          const pos = SLOT_POSITIONS[s.id];
          const isSelected = selectedId === s.id;
          const hasConflict = !!s.conflict;
          return (
            <button
              key={s.id}
              type="button"
              className={`acd-cal__slot ${isSelected ? "is-selected" : ""} ${
                hasConflict ? "acd-cal__slot--tight" : ""
              } ${s.recommended ? "acd-cal__slot--recommended" : ""}`}
              style={{
                top: `${topFor(pos.start)}px`,
                height: `${heightFor(pos.duration)}px`,
              }}
              onClick={() => onSelect(s.id)}
              aria-pressed={isSelected}
              title={`Sam intro · ${formatHour(Math.floor(pos.start))}${pos.start % 1 ? ":30" : ""}`}
            >
              <span className="acd-cal__slot-label">Sam intro</span>
            </button>
          );
        })}
    </div>
  );

  return (
    <div className="acd-cal">
      <div className="acd-cal__head">
        <div className="acd-cal__head-spacer" />
        <div className="acd-cal__day-head">Thu · May 21</div>
        <div className="acd-cal__day-head">Fri · May 22</div>
      </div>
      <div className="acd-cal__body">
        <div className="acd-cal__times">
          {Array.from({ length: DAY_HOURS }, (_, i) => (
            <div key={i} className="acd-cal__time" style={{ height: `${HOUR_PX}px` }}>
              {formatHour(DAY_START + i)}
            </div>
          ))}
        </div>
        {renderDay("thu")}
        {renderDay("fri")}
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  selected,
  onClick,
  onConfirm,
}: {
  slot: SlotOption;
  selected: boolean;
  onClick: () => void;
  onConfirm?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
      className={`acd-slot ${selected ? "acd-slot--selected" : ""} ${
        slot.recommended ? "acd-slot--recommended" : ""
      }`}
    >
      <div className="acd-slot__top">
        <span className="acd-slot__day">{slot.day}</span>
        {slot.recommended && !selected && <span className="acd-slot__badge">Recommended</span>}
        {selected && (
          <span className="acd-slot__badge acd-slot__badge--selected">
            <Check size={10} strokeWidth={3} />
            Picked
          </span>
        )}
      </div>
      <div className="acd-slot__times">
        <div className="acd-slot__time">
          <span className="acd-slot__time-label">You</span>
          <span className="acd-slot__time-value">{slot.yourTime}</span>
        </div>
        <div className="acd-slot__time">
          <span className="acd-slot__time-label">Sam</span>
          <span className="acd-slot__time-value">{slot.theirTime}</span>
        </div>
      </div>
      {slot.conflict ? (
        <p className="acd-slot__conflict">{slot.conflict}</p>
      ) : slot.note ? (
        <p className="acd-slot__note">{slot.note}</p>
      ) : null}
      {selected && onConfirm && (
        <button
          type="button"
          className="acd-inline-confirm"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
        >
          <Check size={13} strokeWidth={2.5} />
          Send invite
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * 4. HOTEL PICK — 3 hotels with distance, price, amenities
 * ═══════════════════════════════════════════════════════════════════════ */

interface HotelOption {
  id: string;
  name: string;
  distance: string;
  pricePerNight: number;
  nights: number;
  totalNote?: string;
  amenities: string[];
  why: string;
  recommended?: boolean;
  /** Real-world lat/lng for the Leaflet map. */
  lat: number;
  lng: number;
}

// LondonHouse Chicago is at 85 E Wacker Dr · ~41.8884, -87.6249.
// Other hotels are fictional but positioned to match the listed walking
// distances so the map reads honestly. The venue marker sits just north of
// LondonHouse so the two don't perfectly overlap on the map.
const VENUE = { lat: 41.8890, lng: -87.6249 };

const HOTELS: HotelOption[] = [
  {
    id: "h1",
    name: "Riverside Marriott",
    distance: "0.3 mi · 6 min walk",
    pricePerNight: 312,
    nights: 2,
    amenities: ["Lounge access", "King · high floor", "Free breakfast"],
    why: "Bonvoy Titanium hits — bumps you to a suite for free if available.",
    recommended: true,
    lat: 41.8902,
    lng: -87.6294,
  },
  {
    id: "h2",
    name: "Loop & Olive",
    distance: "0.4 mi · 8 min walk",
    pricePerNight: 268,
    nights: 2,
    totalNote: "Boutique · cash-only loyalty",
    amenities: ["Coffee bar in lobby", "Quiet floor", "No lounge"],
    why: "Cheapest of the three, but no Marriott points and no lounge.",
    lat: 41.8843,
    lng: -87.6285,
  },
  {
    id: "h3",
    name: "LondonHouse Chicago",
    distance: "On-site · venue hotel",
    pricePerNight: 389,
    nights: 2,
    amenities: ["Conference rate", "0 walk", "Rooftop bar"],
    why: "Most convenient — no commute, but pricey and no Marriott points.",
    lat: 41.8884,
    lng: -87.6249,
  },
];

export function HotelPickCard({ onConfirmedChange, embedded }: EmbeddedCardProps = {}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  useEmitConfirmed(confirmed, onConfirmedChange);

  const onAsk = (text: string): AskResult => {
    const lower = text.toLowerCase();
    if (lower.includes("airbnb") || lower.includes("rental")) {
      return {
        reply:
          "Pulled 4 Airbnbs within 0.6 mi, all available for the 2 nights. Best is a $214/night loft 4 blocks east on Wabash.",
      };
    }
    if (lower.includes("cheaper") || lower.includes("under $250") || lower.includes("under 250")) {
      return {
        reply:
          "No hotel below $250 here — Loop & Olive at $268 is the floor. For under $250 you'd need Airbnb (see 'Show Airbnbs too').",
      };
    }
    if (lower.includes("walk under 5") || lower.includes("under 5 min")) {
      return {
        reply:
          "Only LondonHouse is under 5 min — it's the on-site venue hotel. Marriott is 6 min, Loop & Olive is 8 min.",
      };
    }
    if (lower.includes("more night") || lower.includes("3 nights") || lower.includes("extra night")) {
      return {
        reply:
          "Bumped to 3 nights for all three: Marriott $936, Loop & Olive $804, LondonHouse $1,167. Same recommendation.",
      };
    }
    return { reply: "Holding the 3 options. Tell me the constraint to filter on." };
  };

  const pickedHotel = HOTELS.find((h) => h.id === picked);
  const summary = pickedHotel ? (
    <>
      Booked <strong>{pickedHotel.name}</strong> · ${pickedHotel.pricePerNight * pickedHotel.nights}{" "}
      total · {pickedHotel.distance}.
    </>
  ) : null;

  return (
    <CardShell
      id="hotel"
      kind="Needs you · Decision"
      title="Book your stay near OG Summit"
      body="All 3 within a 10-min walk of the venue. Hover a card or pin to cross-highlight. Prices for 2 nights including taxes."
      ask={{
        suggestions: ["Show Airbnbs too", "Cheaper under $250", "Walk under 5 min", "Add 1 more night"],
        onAsk,
      }}
      confirmed={confirmed}
      summary={summary}
      embedded={embedded}
      onUndo={() => {
        setConfirmed(false);
        setPicked(null);
      }}
    >
      <HotelMap
        hotels={HOTELS}
        picked={picked}
        hovered={hovered}
        onHover={setHovered}
        onPick={(id) => setPicked((p) => (p === id ? null : id))}
      />
      <div className="acd-hotels">
        {HOTELS.map((h, i) => (
          <HotelCard
            key={h.id}
            hotel={h}
            num={i + 1}
            selected={picked === h.id}
            hovered={hovered === h.id}
            onHover={(on) => setHovered(on ? h.id : null)}
            onClick={() => setPicked((p) => (p === h.id ? null : h.id))}
            onConfirm={() => setConfirmed(true)}
          />
        ))}
      </div>
    </CardShell>
  );
}

/* Custom Leaflet markers — DivIcon's iconSize handles positioning natively
 * so the markers don't depend on tricky absolute positioning. The icon root
 * (the leaflet-marker-icon wrapper) IS the styled element.
 */

function buildHotelIcon(
  num: number,
  price: number,
  selected: boolean,
  hovered: boolean,
): L.DivIcon {
  const cls = [
    "acd-hotel-pin",
    selected ? "is-selected" : "",
    hovered ? "is-hovered" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return L.divIcon({
    className: cls,
    html: `<span class="acd-hotel-pin__circle">${num}</span><span class="acd-hotel-pin__label">$${price}</span>`,
    iconSize: [70, 48],
    iconAnchor: [14, 48],
  });
}

const VENUE_ICON = L.divIcon({
  className: "acd-venue-pin",
  html: `<span class="acd-venue-pin__dot"></span><span class="acd-venue-pin__label">Venue</span>`,
  iconSize: [70, 30],
  iconAnchor: [14, 30],
});

/** Helper component — recalculates map size when the container resizes. */
function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 60);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

function HotelMap({
  hotels,
  picked,
  hovered,
  onPick,
  onHover,
}: {
  hotels: HotelOption[];
  picked: string | null;
  hovered: string | null;
  onPick: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  // Bounds: include venue + every hotel so they all fit on screen
  const bounds = L.latLngBounds([
    [VENUE.lat, VENUE.lng],
    ...hotels.map((h) => [h.lat, h.lng] as [number, number]),
  ]);

  return (
    <div className="acd-leaflet" role="group" aria-label="Hotels near venue">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [40, 40] }}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="acd-leaflet__map"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
          maxZoom={19}
        />
        <MapInvalidator />
        <Marker
          position={[VENUE.lat, VENUE.lng]}
          icon={VENUE_ICON}
          interactive={false}
        />
        {hotels.map((h, i) => (
          <Marker
            key={h.id}
            position={[h.lat, h.lng]}
            icon={buildHotelIcon(i + 1, h.pricePerNight, picked === h.id, hovered === h.id)}
            eventHandlers={{
              click: () => onPick(h.id),
              mouseover: () => onHover(h.id),
              mouseout: () => onHover(null),
            }}
          />
        ))}
      </MapContainer>
      <div className="acd-leaflet__attribution" aria-hidden="true">
        © OpenStreetMap · CARTO
      </div>
    </div>
  );
}

function HotelCard({
  hotel,
  num,
  selected,
  hovered,
  onHover,
  onClick,
  onConfirm,
}: {
  hotel: HotelOption;
  num: number;
  selected: boolean;
  hovered: boolean;
  onHover: (on: boolean) => void;
  onClick: () => void;
  onConfirm?: () => void;
}) {
  const total = hotel.pricePerNight * hotel.nights;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
      className={`acd-hotel ${selected ? "acd-hotel--selected" : ""} ${
        hovered ? "acd-hotel--hovered" : ""
      } ${hotel.recommended ? "acd-hotel--recommended" : ""}`}
    >
      <div className="acd-hotel__head">
        <span className="acd-hotel__pin-num" aria-hidden="true">
          {num}
        </span>
        <div className="acd-hotel__title">
          <span className="acd-hotel__name">{hotel.name}</span>
          <span className="acd-hotel__distance">{hotel.distance}</span>
        </div>
        {hotel.recommended && !selected && <span className="acd-hotel__badge">Recommended</span>}
        {selected && (
          <span className="acd-hotel__badge acd-hotel__badge--selected">
            <Check size={10} strokeWidth={3} />
            Picked
          </span>
        )}
      </div>
      <div className="acd-hotel__price">
        <span className="acd-hotel__price-total">${total.toLocaleString()}</span>
        <span className="acd-hotel__price-meta">
          ${hotel.pricePerNight} × {hotel.nights} nights
          {hotel.totalNote ? ` · ${hotel.totalNote}` : ""}
        </span>
      </div>
      <ul className="acd-hotel__amenities">
        {hotel.amenities.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
      <p className="acd-hotel__why">{hotel.why}</p>
      {selected && onConfirm && (
        <button
          type="button"
          className="acd-inline-confirm"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
        >
          <Check size={13} strokeWidth={2.5} />
          Book this hotel
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * 5. BUG TRIAGE — assign priority to a list of tickets (chip cycles)
 * ═══════════════════════════════════════════════════════════════════════ */

type Priority = "urgent" | "high" | "medium" | "low";

interface BugItem {
  id: string;
  key: string;
  title: string;
  reporter: string;
  recommended: Priority;
  reason: string;
}

const BUGS: BugItem[] = [
  {
    id: "b1",
    key: "RUN-2105",
    title: "'Sent via Runner' tagline still renders after toggle off",
    reporter: "Customer · Bridgewire",
    recommended: "high",
    reason: "Customer-blocking · auth-adjacent",
  },
  {
    id: "b2",
    key: "RUN-2098",
    title: "Twitter connector loses cursor after 50 fetches",
    reporter: "Internal",
    recommended: "medium",
    reason: "Connector issue, non-critical",
  },
  {
    id: "b3",
    key: "RUN-2092",
    title: "Session view scrolls past last message after 6300+ turns",
    reporter: "3 customers",
    recommended: "urgent",
    reason: "Runtime issue · multiple reports",
  },
  {
    id: "b4",
    key: "RUN-2087",
    title: "Avatar misaligned in compact density",
    reporter: "Internal · QA",
    recommended: "low",
    reason: "Visual only · no repro on touch densities",
  },
  {
    id: "b5",
    key: "RUN-2079",
    title: "Memory-review surfaces archived contradictions",
    reporter: "Customer · Atlas Pay",
    recommended: "medium",
    reason: "Wrong but rare · product call pending",
  },
  {
    id: "b6",
    key: "RUN-2075",
    title: "Enrichment returns wrong company for ambiguous handles",
    reporter: "Customer · 2 reports",
    recommended: "high",
    reason: "Hallucination · trust impact",
  },
];

const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low"];
const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function BugTriageCard() {
  const [states, setStates] = useState<Record<string, Priority>>(() => {
    const initial: Record<string, Priority> = {};
    BUGS.forEach((b) => {
      initial[b.id] = b.recommended;
    });
    return initial;
  });
  const [confirmed, setConfirmed] = useState(false);
  const [deepDive, setDeepDive] = useState<string | null>(null);

  const cycle = (b: BugItem) => {
    setStates((prev) => {
      const cur = prev[b.id];
      const idx = PRIORITY_ORDER.indexOf(cur);
      const next = PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length];
      return { ...prev, [b.id]: next };
    });
  };

  const counts = PRIORITY_ORDER.reduce<Record<Priority, number>>(
    (acc, p) => ({ ...acc, [p]: BUGS.filter((b) => states[b.id] === p).length }),
    { urgent: 0, high: 0, medium: 0, low: 0 },
  );

  const onAsk = (text: string): AskResult => {
    const lower = text.toLowerCase();
    const diveMatch = lower.match(/run-(\d{4})/);
    if (diveMatch || lower.includes("show similar") || lower.includes("dig in")) {
      const ref = diveMatch ? `RUN-${diveMatch[1]}` : "RUN-2105";
      const target = BUGS.find((b) => b.key === ref) ?? BUGS[0];
      if (BUG_DETAILS[target.id]) {
        setDeepDive(target.id);
        return {
          reply: `Pulled the full ${target.key} context — related tickets, customer messages, recent activity. See the deep-dive card below.`,
        };
      }
    }
    if (lower.includes("urgent") && lower.includes("only")) {
      return { reply: "Filtered to just the 2 urgents: RUN-2092 and RUN-2075's hallucination cluster." };
    }
    if (lower.includes("customer")) {
      return { reply: "Sorted by customer impact — RUN-2092 (3 reports) and RUN-2105 lead." };
    }
    if (lower.includes("zero-bug") || lower.includes("zero bug")) {
      setStates((prev) => ({ ...prev, b4: "medium" }));
      return {
        reply:
          "Applied zero-bug rules: anything customer-reported stays High or above. Bumped RUN-2087 from Low → Medium since QA has it documented.",
      };
    }
    if (lower.includes("accept all") || lower.includes("all suggestions") || lower.includes("reset")) {
      setStates(() => {
        const next: Record<string, Priority> = {};
        BUGS.forEach((b) => (next[b.id] = b.recommended));
        return next;
      });
      return {
        reply: "Reset everything to Runner's recommended priorities. Adjust any individually before confirming.",
      };
    }
    return { reply: "Will keep the list as-is. Click a priority chip to cycle." };
  };

  return (
    <CardShell
      id="linear"
      kind="Needs you · Triage"
      title="6 untriaged bugs — set priority"
      body="Runner pre-classified each one. Click a priority chip to cycle Urgent → High → Medium → Low. Click any row for full context."
      status={undefined}
      ask={{
        suggestions: ["Dig in on RUN-2105", "Accept all suggestions", "Sort by customer impact", "Apply 'zero-bug' rules"],
        onAsk,
      }}
      commit={{
        label: `Apply triage · ${BUGS.length} ticket${BUGS.length === 1 ? "" : "s"}`,
        note: "— routes each ticket into the matched project in Linear",
        onConfirm: () => setConfirmed(true),
        visible: true,
      }}
      confirmed={confirmed}
      summary={
        <>
          Triaged <strong>{BUGS.length} bugs</strong> · {counts.urgent} urgent, {counts.high} high,{" "}
          {counts.medium} medium, {counts.low} low.
        </>
      }
      onUndo={() => {
        setConfirmed(false);
        const initial: Record<string, Priority> = {};
        BUGS.forEach((b) => {
          initial[b.id] = b.recommended;
        });
        setStates(initial);
      }}
    >
      <ul className="acd-bugs">
        {BUGS.map((b) => (
          <Fragment key={b.id}>
            <BugRow
              bug={b}
              state={states[b.id]}
              onCycle={() => cycle(b)}
              onDeepDive={BUG_DETAILS[b.id] ? () => setDeepDive(b.id) : undefined}
              isDiving={deepDive === b.id}
            />
            {deepDive === b.id && BUG_DETAILS[b.id] && (
              <li className="acd-bugs__dive-row">
                <BugDeepDive
                  bug={b}
                  detail={BUG_DETAILS[b.id]}
                  onClose={() => setDeepDive(null)}
                />
              </li>
            )}
          </Fragment>
        ))}
      </ul>
    </CardShell>
  );
}

interface BugDetail {
  fullDescription: string;
  customerMessages: { from: string; when: string; text: string }[];
  related: { key: string; title: string; status: string }[];
  activity: { actor: string; when: string; what: string }[];
}

const BUG_DETAILS: Record<string, BugDetail> = {
  b1: {
    fullDescription:
      "Bridgewire reports the 'Sent via Runner' tagline continues to render in outgoing email signatures even after disabling the toggle in Settings → General → Branding. Affects all 8 of their seats. They've tried both per-seat and workspace-level toggles. Repro confirmed on staging with their config.",
    customerMessages: [
      {
        from: "Tatijana K. · Bridgewire",
        when: "Tue 11:42 AM",
        text:
          "Hey — we toggled off the Runner tagline yesterday morning, but it's still showing up in our threads. Our customers are asking; can you check on your side?",
      },
      {
        from: "Tatijana K. · Bridgewire",
        when: "Wed 9:14 AM",
        text:
          "Bump on this — we have a board meeting Friday and would love it gone by then if at all possible.",
      },
      {
        from: "Mark D. · Bridgewire (CC'd)",
        when: "Wed 10:30 AM",
        text: "Adding myself to the thread — happy to test fixes on our side.",
      },
    ],
    related: [
      { key: "RUN-1987", title: "Tagline toggle UI doesn't persist across browser sessions", status: "Closed · won't fix" },
      { key: "RUN-1832", title: "Email signature reverts after workspace plan downgrade", status: "Closed · fixed in v4.2" },
      { key: "RUN-2022", title: "Signature renders twice when reply uses a custom alias", status: "In progress · Yi" },
    ],
    activity: [
      { actor: "Bridgewire", when: "Tue 11:42 AM", what: "Filed via Linear customer portal" },
      { actor: "Runner triage bot", when: "Tue 11:43 AM", what: "Auto-labeled 'bug', 'gmail', 'customer-impact'" },
      { actor: "Yi", when: "Tue 4:18 PM", what: "Reproduced on staging — found the toggle state isn't propagating to the signature renderer cache" },
      { actor: "Tatijana K.", when: "Wed 9:14 AM", what: "Added priority context (board meeting Friday)" },
    ],
  },
  b3: {
    fullDescription:
      "Runner's session view fails to scroll past the most recent message once a chat exceeds ~6,300 turns. Three customers reported between Mon and Tue — all affecting their long-running daily session threads. Confirmed reproducible at >6,000 turns with mixed tool + text content.",
    customerMessages: [
      {
        from: "kaivbs@gmail.com",
        when: "Mon 8:01 PM",
        text:
          "I can't see my latest replies in the chat — it just freezes at the bottom. I've been using the same thread for a few weeks.",
      },
      {
        from: "avedissian9@gmail.com",
        when: "Tue 11:02 AM",
        text:
          "Same issue here. Reloading helps for 2 minutes then it sticks again. My session is huge though.",
      },
      {
        from: "andra@andraarnold.com",
        when: "Tue 6:18 PM",
        text:
          "FYI — happening on my end too, started yesterday. New sessions seem fine; only the long one is broken.",
      },
    ],
    related: [
      { key: "RUN-1564", title: "Performance: virtualized list rebuilds on every message tick", status: "In progress · Steven" },
      { key: "RUN-1781", title: "Session memory cap before lag becomes noticeable", status: "Open · backlog" },
    ],
    activity: [
      { actor: "kaivbs", when: "Mon 8:01 PM", what: "Filed via in-app feedback" },
      { actor: "Runner triage bot", when: "Mon 8:02 PM", what: "Clustered with 2 similar reports from past 24h" },
      { actor: "Steven", when: "Tue 9:30 AM", what: "Reproduced locally with synthetic 7K-turn session — confirmed scroll virtualization regression" },
      { actor: "Yi", when: "Tue 3:45 PM", what: "Tagged 'runtime' + bumped to urgent" },
    ],
  },
};

function BugDeepDive({
  bug,
  detail,
  onClose,
}: {
  bug: BugItem;
  detail: BugDetail;
  onClose: () => void;
}) {
  return (
    <div className="acd-dive" role="region" aria-label={`Deep dive: ${bug.key}`}>
      <header className="acd-dive__head">
        <div className="acd-dive__title-block">
          <span className="acd-dive__eyebrow">Deep dive · {bug.key}</span>
          <h3 className="acd-dive__title">{bug.title}</h3>
          <p className="acd-dive__meta">{bug.reporter}</p>
        </div>
        <button
          type="button"
          className="acd-dive__close"
          onClick={onClose}
          aria-label="Close deep dive"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      </header>

      <section className="acd-dive__section">
        <span className="acd-dive__section-label">Full description</span>
        <p className="acd-dive__text">{detail.fullDescription}</p>
      </section>

      <section className="acd-dive__section">
        <span className="acd-dive__section-label">
          Customer messages · {detail.customerMessages.length}
        </span>
        <div className="acd-dive__messages">
          {detail.customerMessages.map((m, i) => (
            <div key={i} className="acd-dive__msg">
              <div className="acd-dive__msg-head">
                <span className="acd-dive__msg-from">{m.from}</span>
                <span className="acd-dive__msg-when">{m.when}</span>
              </div>
              <p className="acd-dive__msg-body">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="acd-dive__section">
        <span className="acd-dive__section-label">Related · {detail.related.length}</span>
        <ul className="acd-dive__related">
          {detail.related.map((r, i) => (
            <li key={i}>
              <span className="acd-dive__related-key">{r.key}</span>
              <span className="acd-dive__related-title">{r.title}</span>
              <span className="acd-dive__related-status">{r.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="acd-dive__section">
        <span className="acd-dive__section-label">Recent activity</span>
        <ol className="acd-dive__activity">
          {detail.activity.map((a, i) => (
            <li key={i}>
              <span className="acd-dive__activity-when">{a.when}</span>
              <span className="acd-dive__activity-actor">{a.actor}</span>
              <span className="acd-dive__activity-what">{a.what}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function BugRow({
  bug,
  state,
  onCycle,
  onDeepDive,
  isDiving,
}: {
  bug: BugItem;
  state: Priority;
  onCycle: () => void;
  onDeepDive?: () => void;
  isDiving?: boolean;
}) {
  return (
    <li
      className={`acd-bug ${isDiving ? "acd-bug--diving" : ""}`}
      onClick={(e) => {
        if (!onDeepDive) return;
        // Don't trigger when clicking the chip itself.
        if ((e.target as HTMLElement).closest("button")) return;
        onDeepDive();
      }}
    >
      <button
        type="button"
        className={`acd-bug__chip acd-bug__chip--${state}`}
        onClick={(e) => {
          e.stopPropagation();
          onCycle();
        }}
        title="Click to cycle priority"
      >
        {PRIORITY_LABEL[state]}
      </button>
      <div className="acd-bug__body">
        <div className="acd-bug__top">
          <span className="acd-bug__key">{bug.key}</span>
          <span className="acd-bug__title">{bug.title}</span>
        </div>
        <p className="acd-bug__meta">
          <span className="acd-bug__reporter">{bug.reporter}</span>
          <span className="acd-bug__dot" aria-hidden="true">·</span>
          <span>{bug.reason}</span>
        </p>
      </div>
      {onDeepDive && (
        <span className="acd-bug__open" aria-hidden="true">
          {isDiving ? "↓" : "→"}
        </span>
      )}
    </li>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * 6. OUTREACH DRAFTS — review N drafts in a navigable stack
 * ═══════════════════════════════════════════════════════════════════════ */

interface OutreachDraft {
  id: string;
  recipient: string;
  role: string;
  hook: string;
  body: string;
}

const OUTREACH: OutreachDraft[] = [
  {
    id: "d1",
    recipient: "Mitt M.",
    role: "Senior engineer · Atlas Pay → fractional",
    hook: "Recent post on consolidating back-office for early-stage founders",
    body:
      "Hi Mitt — saw your recent post on consolidating back-office for early-stage founders. Building Runner along similar lines; would love 20 minutes to compare notes if you're open to it.",
  },
  {
    id: "d2",
    recipient: "Debbie R.",
    role: "Operator turned advisor",
    hook: "Essay on the 'quiet operator' archetype",
    body:
      "Hey Debbie — really enjoyed your essay on the 'quiet operator' archetype. We're working on tools to make that style scale; quick chat sometime?",
  },
  {
    id: "d3",
    recipient: "Daniel K.",
    role: "Co-founder · Bridgewire",
    hook: "Shared interest in agent infra",
    body:
      "Hi Daniel — both of us in the agent-infra space, would love to swap notes. Even 15 minutes this or next week would be great.",
  },
  {
    id: "d4",
    recipient: "Liz M.",
    role: "Head of Ops · Citadel Finance",
    hook: "Your team's note on AI ops adoption",
    body:
      "Hi Liz — saw your team's post on how non-engineers are picking up AI tools. We're building for that user; would love your read on what's actually working.",
  },
  {
    id: "d5",
    recipient: "Aaron J.",
    role: "Founder · Cobalt Labs",
    hook: "Mutual connection through Bethany",
    body:
      "Hi Aaron — Bethany mentioned we should connect. Building Runner; from what she said, sounds like Cobalt's running into similar problems. Coffee?",
  },
];

type DraftStatus = "pending" | "sent" | "discarded";

export function OutreachDraftsCard({ onConfirmedChange, embedded }: EmbeddedCardProps = {}) {
  const [statuses, setStatuses] = useState<DraftStatus[]>(() => OUTREACH.map(() => "pending"));
  const [index, setIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  useEmitConfirmed(confirmed, onConfirmedChange);

  const sent = statuses.filter((s) => s === "sent").length;
  const discarded = statuses.filter((s) => s === "discarded").length;
  const pending = statuses.filter((s) => s === "pending").length;
  const allHandled = pending === 0;

  const advance = (i: number) => {
    for (let j = i + 1; j < OUTREACH.length; j++) if (statuses[j] === "pending") return setIndex(j);
    for (let j = 0; j < i; j++) if (statuses[j] === "pending") return setIndex(j);
  };

  const updateStatus = (i: number, s: DraftStatus) => {
    setStatuses((prev) => prev.map((v, idx) => (idx === i ? s : v)));
    advance(i);
  };

  const onAsk = (text: string): AskResult => {
    const lower = text.toLowerCase();
    if (lower.includes("send all")) {
      setStatuses((prev) => prev.map((s) => (s === "pending" ? "sent" : s)));
      return { reply: `Marked ${pending} drafts for send. None go out until you confirm at the bottom.` };
    }
    if (lower.includes("tone") || lower.includes("warmer") || lower.includes("shorter")) {
      return { reply: "Regenerated all 5 with a warmer, shorter tone. Cycle through to compare." };
    }
    if (lower.includes("subject")) {
      return { reply: "Added a 1-line subject to each. Check the first draft to confirm fit." };
    }
    return { reply: "Holding the stack. Tell me what to tweak." };
  };

  return (
    <CardShell
      id="outreach"
      kind="Needs you · Review"
      title="5 LinkedIn outreach drafts"
      body="SF engineers, 5y experience, blue-check startups. Step through to send/discard each."
      status={
        sent + discarded > 0 ? (
          <StatusBadge tone={allHandled ? "success" : "neutral"}>
            {sent} sent · {discarded} discarded · {pending} pending
          </StatusBadge>
        ) : undefined
      }
      ask={{
        suggestions: ["Send all 5", "Warmer tone", "Shorter version", "Add a subject line"],
        onAsk,
      }}
      commit={{
        label: `Confirm batch · ${sent} send / ${discarded} discard`,
        note: "— nothing leaves until you confirm",
        onConfirm: () => setConfirmed(true),
        visible: sent + discarded > 0,
      }}
      confirmed={confirmed}
      summary={
        <>
          Sent <strong>{sent}</strong> · discarded {discarded}
          {pending > 0 ? ` · ${pending} kept pending` : ""}.
        </>
      }
      embedded={embedded}
      onUndo={() => {
        setConfirmed(false);
        setStatuses(OUTREACH.map(() => "pending"));
        setIndex(0);
      }}
    >
      <div className="acd-outreach">
        <DraftQueueChips
          drafts={OUTREACH}
          statuses={statuses}
          current={index}
          onPick={setIndex}
        />
        <DraftComposer
          draft={OUTREACH[index]}
          status={statuses[index]}
          onSend={() => updateStatus(index, "sent")}
          onDiscard={() => updateStatus(index, "discarded")}
          onPrev={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={() => setIndex((i) => Math.min(OUTREACH.length - 1, i + 1))}
          position={index + 1}
          total={OUTREACH.length}
        />
      </div>
    </CardShell>
  );
}

function DraftQueueChips({
  drafts,
  statuses,
  current,
  onPick,
}: {
  drafts: OutreachDraft[];
  statuses: DraftStatus[];
  current: number;
  onPick: (i: number) => void;
}) {
  return (
    <ol className="acd-queue" role="tablist">
      {drafts.map((d, i) => (
        <li key={d.id}>
          <button
            type="button"
            role="tab"
            aria-selected={i === current}
            className={`acd-queue__chip acd-queue__chip--${statuses[i]} ${
              i === current ? "is-active" : ""
            }`}
            onClick={() => onPick(i)}
          >
            <span className="acd-queue__avatar">{d.recipient.charAt(0)}</span>
            <span className="acd-queue__name">{d.recipient.split(" ")[0]}</span>
            <span className="acd-queue__status" aria-hidden="true">
              {statuses[i] === "sent" ? (
                <Check size={10} strokeWidth={3} />
              ) : statuses[i] === "discarded" ? (
                <X size={10} strokeWidth={3} />
              ) : (
                <span className="acd-queue__dot" />
              )}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function DraftComposer({
  draft,
  status,
  onSend,
  onDiscard,
  onPrev,
  onNext,
  position,
  total,
}: {
  draft: OutreachDraft;
  status: DraftStatus;
  onSend: () => void;
  onDiscard: () => void;
  onPrev: () => void;
  onNext: () => void;
  position: number;
  total: number;
}) {
  const disabled = status !== "pending";
  return (
    <div className={`acd-composer ${disabled ? "acd-composer--locked" : ""}`}>
      <header className="acd-composer__head">
        <div className="acd-composer__to">
          <span className="acd-composer__to-label">To</span>
          <span className="acd-composer__to-value">{draft.recipient}</span>
          <span className="acd-composer__to-role">· {draft.role}</span>
        </div>
        <div className="acd-composer__hook">Hook: {draft.hook}</div>
      </header>
      <div className="acd-composer__body">{draft.body}</div>
      {status !== "pending" && (
        <div className={`acd-composer__status acd-composer__status--${status}`}>
          {status === "sent" ? (
            <>
              <Check size={11} strokeWidth={2.5} /> Staged for send
            </>
          ) : (
            <>
              <X size={11} strokeWidth={2.5} /> Discarded
            </>
          )}
        </div>
      )}
      <footer className="acd-composer__foot">
        <button
          type="button"
          className="acd-composer__btn acd-composer__btn--ghost"
          onClick={onDiscard}
          disabled={disabled}
        >
          <Trash2 size={12} strokeWidth={2.2} /> Discard
        </button>
        <div className="acd-composer__nav">
          <button
            type="button"
            className="acd-composer__nav-btn"
            onClick={onPrev}
            disabled={position === 1}
            aria-label="Previous"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="acd-composer__nav-pos">
            {position} / {total}
          </span>
          <button
            type="button"
            className="acd-composer__nav-btn"
            onClick={onNext}
            disabled={position === total}
            aria-label="Next"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <button
          type="button"
          className="acd-composer__btn acd-composer__btn--primary"
          onClick={onSend}
          disabled={disabled}
        >
          <ArrowUpRight size={12} strokeWidth={2.2} /> Stage send
        </button>
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * 7. CREDIT CARD OPTIMIZATION — keep/cancel current + apply for new
 * ═══════════════════════════════════════════════════════════════════════ */

type CardVerdict = "keep" | "cancel" | "apply" | "skip" | null;

interface CreditCardOption {
  id: string;
  name: string;
  fee: string;
  feeAmount: number;
  status: "current" | "proposed";
  bullets: string[];
  recommendation: Exclude<CardVerdict, null>;
  rationale: string;
}

const CARDS: CreditCardOption[] = [
  {
    id: "c1",
    name: "Personal Platinum",
    fee: "$695/yr",
    feeAmount: 695,
    status: "current",
    bullets: [
      "Lounge network + airline credits",
      "Used 11 of last 12 months",
      "Anchor of your travel stack",
    ],
    recommendation: "keep",
    rationale: "Highest-utility card — anchor your travel benefits.",
  },
  {
    id: "c2",
    name: "Personal Gold",
    fee: "$325/yr",
    feeAmount: 325,
    status: "current",
    bullets: [
      "4× on dining/groceries",
      "Used 0 times in last 9 months",
      "Annual fee posted last week",
    ],
    recommendation: "cancel",
    rationale: "Unused — fee posts again in 11 months if you keep it.",
  },
  {
    id: "c3",
    name: "Business Platinum",
    fee: "$695/yr",
    feeAmount: 695,
    status: "current",
    bullets: [
      "Business spend benefits",
      "Overlaps with personal Plat on lounges",
      "Used 4 of last 12 months",
    ],
    recommendation: "cancel",
    rationale: "Overlaps with personal Plat; switching to United Club saves $300+.",
  },
  {
    id: "c4",
    name: "United Club Card",
    fee: "$595/yr",
    feeAmount: 595,
    status: "proposed",
    bullets: [
      "United Club lounges (where Plat doesn't apply)",
      "Closes the gap in United-only terminals",
      "12 trips/yr · SF ↔ TOR/NYC",
    ],
    recommendation: "apply",
    rationale: "Fills the United-only lounge gap. Net savings vs current after Business Plat drop.",
  },
];

function CreditCardCard() {
  const [verdicts, setVerdicts] = useState<Record<string, CardVerdict>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [deepDive, setDeepDive] = useState<string | null>(null);

  const effective = (c: CreditCardOption): CardVerdict =>
    verdicts[c.id] === undefined ? c.recommendation : verdicts[c.id];

  const choose = (id: string, v: Exclude<CardVerdict, null>) =>
    setVerdicts((prev) => ({ ...prev, [id]: v }));

  const decidedCount = CARDS.filter((c) => effective(c) !== null).length;
  const kept = CARDS.filter((c) => effective(c) === "keep").length;
  const cancelled = CARDS.filter((c) => effective(c) === "cancel").length;
  const applied = CARDS.filter((c) => effective(c) === "apply").length;

  const onAsk = (text: string): AskResult => {
    const lower = text.toLowerCase();
    if (
      (lower.includes("united club") || lower.includes("the proposal") || lower.includes("c4")) &&
      (lower.includes("more") || lower.includes("deep") || lower.includes("tell me") || lower.includes("info"))
    ) {
      setDeepDive("c4");
      return {
        reply:
          "Pulled the full breakdown on United Club Card — benefits, year-1 vs year-2 cost, application notes. See the deep-dive card below.",
      };
    }
    if (lower.includes("personal plat") && (lower.includes("more") || lower.includes("deep"))) {
      setDeepDive("c1");
      return {
        reply: "Pulled the full Personal Platinum breakdown below — your last 12 months of usage and what you'd lose if you cancel.",
      };
    }
    if (lower.includes("chase") || lower.includes("sapphire")) {
      return {
        reply:
          "Pulled the Chase comparison: Sapphire Reserve ($550/yr) is close to a wash with United Club ($595/yr) if you don't fly United exclusively. Your United volume (12 trips/yr) still favours the United Club.",
      };
    }
    if (lower.includes("2-card") || lower.includes("two card") || lower.includes("2 card")) {
      return {
        reply:
          "2-card setup: Personal Plat (keep) + United Club (apply). Cancel both Gold and Business Plat. Net annual fee drops from $1,715 to $1,290.",
      };
    }
    if (lower.includes("points earn") || lower.includes("earn") || lower.includes("multiplier")) {
      return {
        reply:
          "For pure points earn, swap the United Club proposal for Capital One Venture X — 2x on everything, transfers to United at 1:1, and the $395 fee credits back through the travel portal.",
      };
    }
    if (lower.includes("travel pattern") || lower.includes("different travel")) {
      return {
        reply:
          "If your TOR trips drop and NYC grows, Amex Plat + Delta SkyMiles Reserve beats this stack. Want me to rerun with that pattern?",
      };
    }
    return {
      reply: "Keeping the stack. Tell me which constraint matters most — fees, lounges, or points earn.",
    };
  };

  const dive = deepDive ? CARDS.find((c) => c.id === deepDive) : null;

  return (
    <CardShell
      id="cards"
      kind="Needs you · Decision"
      title="Credit card optimization"
      body="Based on your travel pattern (~12 trips/yr, SF ↔ TOR/NYC) and 3 current cards. Click a verdict per card."
      ask={{
        suggestions: ["Tell me more about United Club", "Compare with Chase Sapphire Reserve", "Show a 2-card setup", "Different travel pattern"],
        onAsk,
      }}
      commit={{
        label: "Apply changes",
        note: "— Runner queues the cancels + opens the apply form",
        onConfirm: () => setConfirmed(true),
        visible: decidedCount > 0,
      }}
      confirmed={confirmed}
      summary={
        <>
          {kept} kept, {cancelled} cancelled, {applied} applied — Runner queued the cancel forms
          and opened the apply flow.
        </>
      }
      onUndo={() => {
        setConfirmed(false);
        setVerdicts({});
      }}
    >
      <CreditSummary cards={CARDS} effective={effective} />
      <ul className="acd-cards-list">
        {CARDS.map((c) => (
          <CreditCardRow
            key={c.id}
            card={c}
            verdict={effective(c)}
            isOverride={verdicts[c.id] !== undefined}
            onChoose={(v) => choose(c.id, v)}
            onDeepDive={() => setDeepDive(c.id)}
            isDiving={deepDive === c.id}
          />
        ))}
      </ul>
      {dive && (
        <CreditCardDeepDive
          card={dive}
          detail={CARD_DETAILS[dive.id]}
          onClose={() => setDeepDive(null)}
        />
      )}
    </CardShell>
  );
}

interface CreditCardDetail {
  perks: string[];
  yearOne: { label: string; amount: number; note?: string }[];
  yearTwoPlus: { label: string; amount: number; note?: string }[];
  approval: string;
  comparables: { name: string; tradeoff: string }[];
}

const CARD_DETAILS: Record<string, CreditCardDetail> = {
  c4: {
    perks: [
      "Full United Club lounge access (you + 2 guests, globally)",
      "Free checked bag for you + companion on United flights",
      "Premier Access boarding · priority security at hubs",
      "25% rebate on inflight purchases",
      "2× MileagePlus per dollar on United · 1.5× elsewhere",
      "Hyatt Discoverist status (4 nights/yr equivalent)",
    ],
    yearOne: [
      { label: "Annual fee", amount: 595 },
      { label: "Signup bonus (60K MP)", amount: -1200, note: "valued at 2¢/MP based on your redemption history" },
      { label: "United credits used", amount: -150, note: "carry-on baggage + lounge guest passes" },
    ],
    yearTwoPlus: [
      { label: "Annual fee", amount: 595 },
      { label: "Lounge value (12 trips/yr)", amount: -360, note: "$30 avg/visit at LGA/ORD/SFO" },
      { label: "Free checked bags", amount: -240, note: "$35 × ~7 trips you'd otherwise pay" },
    ],
    approval: "Instant approval typical for Plat-holders. Virtual card available immediately; physical arrives in 7–10 days.",
    comparables: [
      { name: "Chase Sapphire Reserve · $550/yr", tradeoff: "Better point multipliers, weaker on United-specific perks" },
      { name: "Capital One Venture X · $395/yr", tradeoff: "Cheapest fee with airline-agnostic lounges (Plaza Premium, not United Club)" },
      { name: "Delta SkyMiles Reserve · $650/yr", tradeoff: "Only worth it if your travel shifts away from United" },
    ],
  },
  c1: {
    perks: [
      "Centurion Lounge access (Amex network)",
      "$200/yr airline incidental credit",
      "$200/yr hotel credit (FHR/Hotel Collection)",
      "$240/yr digital entertainment credit",
      "5× points on airfare booked direct",
      "Global Entry/TSA PreCheck credit",
    ],
    yearOne: [
      { label: "Annual fee", amount: 695 },
      { label: "Credits used (last 12 mo)", amount: -480, note: "airline + hotel + entertainment, partial" },
    ],
    yearTwoPlus: [
      { label: "Annual fee", amount: 695 },
      { label: "Credits used (last 12 mo)", amount: -480 },
      { label: "Lounge value (~25 visits/yr)", amount: -750, note: "anchor of your travel stack" },
    ],
    approval: "Already active. Cancelling forfeits future credits + lounge access; consider downgrading instead.",
    comparables: [
      { name: "Capital One Venture X · $395/yr", tradeoff: "Cheaper, but no Centurion access" },
      { name: "Chase Sapphire Reserve · $550/yr", tradeoff: "Comparable lounge network, weaker on the credit menu" },
    ],
  },
};

function CreditCardDeepDive({
  card,
  detail,
  onClose,
}: {
  card: CreditCardOption;
  detail: CreditCardDetail | undefined;
  onClose: () => void;
}) {
  if (!detail) return null;
  const yearOneTotal = detail.yearOne.reduce((sum, line) => sum + line.amount, 0);
  const yearTwoTotal = detail.yearTwoPlus.reduce((sum, line) => sum + line.amount, 0);

  return (
    <div className="acd-dive" role="region" aria-label={`Deep dive: ${card.name}`}>
      <header className="acd-dive__head">
        <div className="acd-dive__title-block">
          <span className="acd-dive__eyebrow">Deep dive · pulled live</span>
          <h3 className="acd-dive__title">{card.name}</h3>
        </div>
        <button type="button" className="acd-dive__close" onClick={onClose} aria-label="Close deep dive">
          <X size={14} strokeWidth={2.2} />
        </button>
      </header>

      <section className="acd-dive__section">
        <span className="acd-dive__section-label">Full benefits</span>
        <ul className="acd-dive__list">
          {detail.perks.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="acd-dive__section">
        <span className="acd-dive__section-label">Year 1 cost math</span>
        <div className="acd-dive__math">
          {detail.yearOne.map((line, i) => (
            <div key={i} className="acd-dive__math-row">
              <span className="acd-dive__math-label">{line.label}</span>
              <span
                className={`acd-dive__math-amount ${line.amount < 0 ? "is-credit" : "is-charge"}`}
              >
                {line.amount < 0 ? "−" : "+"}${Math.abs(line.amount).toLocaleString()}
              </span>
              {line.note && <span className="acd-dive__math-note">{line.note}</span>}
            </div>
          ))}
          <div className="acd-dive__math-total">
            <span>Year 1 net</span>
            <strong className={yearOneTotal < 0 ? "is-saving" : ""}>
              {yearOneTotal < 0 ? "−" : "+"}${Math.abs(yearOneTotal).toLocaleString()}
            </strong>
          </div>
        </div>
      </section>

      <section className="acd-dive__section">
        <span className="acd-dive__section-label">Year 2+ baseline</span>
        <div className="acd-dive__math">
          {detail.yearTwoPlus.map((line, i) => (
            <div key={i} className="acd-dive__math-row">
              <span className="acd-dive__math-label">{line.label}</span>
              <span
                className={`acd-dive__math-amount ${line.amount < 0 ? "is-credit" : "is-charge"}`}
              >
                {line.amount < 0 ? "−" : "+"}${Math.abs(line.amount).toLocaleString()}
              </span>
              {line.note && <span className="acd-dive__math-note">{line.note}</span>}
            </div>
          ))}
          <div className="acd-dive__math-total">
            <span>Year 2+ net</span>
            <strong className={yearTwoTotal < 0 ? "is-saving" : ""}>
              {yearTwoTotal < 0 ? "−" : "+"}${Math.abs(yearTwoTotal).toLocaleString()}
            </strong>
          </div>
        </div>
      </section>

      <section className="acd-dive__section">
        <span className="acd-dive__section-label">Approval & timing</span>
        <p className="acd-dive__text">{detail.approval}</p>
      </section>

      <section className="acd-dive__section">
        <span className="acd-dive__section-label">Comparable cards</span>
        <ul className="acd-dive__compares">
          {detail.comparables.map((c, i) => (
            <li key={i}>
              <strong>{c.name}</strong>
              <span>{c.tradeoff}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CreditSummary({
  cards,
  effective,
}: {
  cards: CreditCardOption[];
  effective: (c: CreditCardOption) => CardVerdict;
}) {
  // Current fees: any "current" card currently has its fee in your stack.
  const currentFees = cards
    .filter((c) => c.status === "current")
    .reduce((sum, c) => sum + c.feeAmount, 0);

  // Proposed fees: kept current + applied proposed.
  const proposedFees = cards.reduce((sum, c) => {
    const v = effective(c);
    if (v === "keep") return sum + c.feeAmount;
    if (v === "apply") return sum + c.feeAmount;
    return sum;
  }, 0);

  const delta = proposedFees - currentFees;
  const isSaving = delta < 0;

  return (
    <div className="acd-credit-summary">
      <div className="acd-credit-summary__what">
        <span className="acd-credit-summary__label">Runner ran the numbers on</span>
        <span className="acd-credit-summary__value">3 current cards · 12 months activity · 12 trips/yr</span>
      </div>
      <div className="acd-credit-summary__fees">
        <div className="acd-credit-summary__col">
          <span className="acd-credit-summary__col-label">Current</span>
          <span className="acd-credit-summary__col-value">${currentFees.toLocaleString()}/yr</span>
        </div>
        <span className="acd-credit-summary__arrow" aria-hidden="true">
          →
        </span>
        <div className="acd-credit-summary__col">
          <span className="acd-credit-summary__col-label">Proposed</span>
          <span className="acd-credit-summary__col-value">${proposedFees.toLocaleString()}/yr</span>
        </div>
        <div
          className={`acd-credit-summary__delta ${
            isSaving ? "is-saving" : delta > 0 ? "is-costing" : ""
          }`}
        >
          {delta === 0 ? "no change" : isSaving ? `saves $${Math.abs(delta)}/yr` : `costs $${delta}/yr more`}
        </div>
      </div>
      <ul className="acd-credit-summary__what-changes">
        <li>
          <Check size={11} strokeWidth={2.5} /> Lounge coverage maintained · United-only gap closed
        </li>
        <li>
          <Check size={11} strokeWidth={2.5} /> No card overlap with personal Platinum
        </li>
        <li>
          <Star size={11} strokeWidth={2.4} /> Year-1 net (incl. 60K MP signup bonus on United Club): ~$1,825 ahead
        </li>
      </ul>
    </div>
  );
}

function CreditCardRow({
  card,
  verdict,
  isOverride,
  onChoose,
  onDeepDive,
  isDiving,
}: {
  card: CreditCardOption;
  verdict: CardVerdict;
  isOverride: boolean;
  onChoose: (v: Exclude<CardVerdict, null>) => void;
  onDeepDive?: () => void;
  isDiving?: boolean;
}) {
  const isProposed = card.status === "proposed";
  const hasDetail = !!CARD_DETAILS[card.id];
  const onVerdict: Exclude<CardVerdict, null> = isProposed ? "apply" : "keep";
  const offVerdict: Exclude<CardVerdict, null> = isProposed ? "skip" : "cancel";
  const isOn = verdict === onVerdict;
  const label = isProposed ? "Apply" : "Keep";
  const tooltip = isOverride
    ? `You changed Runner's pick — click to ${isOn ? offVerdict : onVerdict}`
    : `Runner's pick: ${label.toLowerCase()} — click to ${isOn ? offVerdict : onVerdict}`;
  return (
    <li className={`acd-credit ${verdict ? `acd-credit--${verdict}` : ""} ${isDiving ? "is-diving" : ""}`}>
      <div className="acd-credit__visual" aria-hidden="true">
        <span className="acd-credit__visual-stripe" />
        <span className="acd-credit__visual-chip" />
        <span className="acd-credit__visual-name">{card.name}</span>
      </div>
      <div className="acd-credit__body">
        <div className="acd-credit__head">
          <span className="acd-credit__status">{isProposed ? "Proposed" : "Current"}</span>
          <span className="acd-credit__name">{card.name}</span>
          <span className="acd-credit__fee">{card.fee}</span>
        </div>
        <ul className="acd-credit__bullets">
          {card.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        <p className="acd-credit__rationale">
          <Star size={10} strokeWidth={2.4} aria-hidden="true" />
          {card.rationale}
        </p>
        {hasDetail && onDeepDive && (
          <button
            type="button"
            className="acd-credit__more"
            onClick={onDeepDive}
            aria-pressed={isDiving}
          >
            {isDiving ? "Showing deep dive ↓" : "Tell me more about this card →"}
          </button>
        )}
      </div>
      <div className="acd-credit__actions">
        <button
          type="button"
          className={`acd-credit-toggle ${isOn ? "is-on" : "is-off"}`}
          onClick={() => onChoose(isOn ? offVerdict : onVerdict)}
          aria-pressed={isOn}
          title={tooltip}
        >
          <Check
            size={12}
            strokeWidth={2.6}
            className="acd-credit-toggle__check"
            aria-hidden="true"
          />
          <span>{label}</span>
        </button>
      </div>
    </li>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * 8. MISSING CONTEXT — Runner stalled mid-draft, needs one piece of info
 *    from the user before continuing.
 * ═══════════════════════════════════════════════════════════════════════ */

const CONTEXT_PRESETS = [5, 10, 15];
const formatPriceK = (k: number) =>
  Number.isInteger(k) ? `$${k}K/yr base` : `$${k.toFixed(1).replace(/\.0$/, "")}K/yr base`;

function MissingContextCard() {
  const [valueK, setValueK] = useState<number | null>(null);
  const [customText, setCustomText] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const provided = valueK !== null ? formatPriceK(valueK) : customText.trim() || null;

  const onAsk = (text: string): AskResult => {
    const lower = text.toLowerCase();
    if (lower.includes("default") || lower.includes("recommend")) {
      return {
        reply:
          "Common default for accounts at Reid's stage is $10K/yr base with the standard 1-year term. Want me to fill that in?",
      };
    }
    if (lower.includes("compare") || lower.includes("similar")) {
      return {
        reply:
          "Comparable deals you closed this quarter: Atlas Pay at $9K, Bridgewire at $14K (bigger seat count). Both at the standard 1-year term.",
      };
    }
    return {
      reply: "Holding the draft. Drag the price in the draft, pick a base, or type a range.",
    };
  };

  const usingCustom = valueK === null && customText.trim().length > 0;

  return (
    <CardShell
      id="context"
      kind="Needs you · Missing context"
      title="Draft to Reid stalled — need your pricing floor"
      body="Runner drafted a response to Reid's pricing inquiry but doesn't know your enterprise pricing floor. Drag the underlined number in the draft to scrub the price, pick a preset, or type a range."
      status={
        provided ? (
          <StatusBadge tone="success" icon={<Check size={11} strokeWidth={2.5} />}>
            Context provided
          </StatusBadge>
        ) : (
          <StatusBadge tone="info" icon={<Sparkles size={11} strokeWidth={2} />}>
            Awaiting context
          </StatusBadge>
        )
      }
      ask={{
        suggestions: ["What's your default?", "Compare with recent deals", "Skip for now"],
        onAsk,
      }}
      commit={{
        label: "Use this and complete the draft",
        note: "— Runner finishes the reply and stages it for your review",
        onConfirm: () => setConfirmed(true),
        visible: !!provided,
      }}
      confirmed={confirmed}
      summary={
        <>
          Filled enterprise floor as <strong>{provided}</strong> · Runner staged the reply to Reid
          for review.
        </>
      }
      onUndo={() => {
        setConfirmed(false);
        setValueK(null);
        setCustomText("");
      }}
    >
      <div className="acd-context">
        <div className="acd-context__draft">
          <div className="acd-context__draft-head">
            <span className="acd-context__draft-label">Drafted reply · to Reid Sterling</span>
            <span className="acd-context__draft-status">
              {provided ? "Ready to send" : "Stalled at line 3"}
            </span>
          </div>
          <p className="acd-context__draft-body">
            Hi Reid — thanks for the patience. Happy to dig in on pricing for your team.
            <br />
            <br />
            Our enterprise plan starts at{" "}
            {usingCustom ? (
              <mark className="acd-context__gap">{customText.trim()}</mark>
            ) : (
              <ScrubNumber
                value={valueK}
                onChange={(v) => {
                  setValueK(v);
                  setCustomText("");
                }}
                seed={10}
                min={1}
                max={50}
                step={1}
                pxPerStep={4}
                ariaLabel="Drag horizontally to scrub the annual pricing floor in thousands"
                placeholder={<span className="acd-scrub__placeholder">drag to set price</span>}
                format={(v) => formatPriceK(v)}
              />
            )}{" "}
            on a standard 1-year term, with seat-based scaling above that.
            <br />
            <br />
            If that's in the right neighborhood, I'll send the redline today.
          </p>
          <div className="acd-context__hint" aria-hidden="true">
            <span className="acd-context__hint-dot" /> Drag the number left/right · Shift = ±$5K ·
            Option = ±$0.5K
          </div>
        </div>

        <div className="acd-context__ask">
          <div className="acd-context__ask-head">
            <Sparkles size={12} strokeWidth={2.4} />
            <span>Or pick a preset / type a range</span>
          </div>
          <div className="acd-context__options">
            {CONTEXT_PRESETS.map((k) => {
              const label = formatPriceK(k);
              const active = valueK === k && !usingCustom;
              return (
                <button
                  key={k}
                  type="button"
                  className={`acd-context__option ${active ? "is-active" : ""}`}
                  onClick={() => {
                    setValueK((prev) => (prev === k ? null : k));
                    setCustomText("");
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="acd-context__custom">
            <span className="acd-context__custom-prefix">Or:</span>
            <input
              type="text"
              placeholder="type a range (e.g. $8K–$12K) — disables the scrubber"
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                if (e.target.value.trim()) setValueK(null);
              }}
            />
          </div>
        </div>
      </div>
    </CardShell>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * 9. MONITOR TRIGGERED — Watch fired, drafted next move ready
 * ═══════════════════════════════════════════════════════════════════════ */

type MonitorVerdict = "send" | "edit" | "defer" | "resolved" | null;

function MonitorTriggeredCard() {
  const [verdict, setVerdict] = useState<MonitorVerdict>(null);
  const [confirmed, setConfirmed] = useState(false);

  const onAsk = (text: string): AskResult => {
    const lower = text.toLowerCase();
    if (lower.includes("scope") || lower.includes("agent included")) {
      return {
        reply:
          "Reid's ask: standard agent (1 mailbox, 1 calendar, no SDK access) bundled in the $12K. Matches what you offered Atlas Pay.",
      };
    }
    if (lower.includes("redline") || lower.includes("contract")) {
      return {
        reply:
          "I've pulled the Atlas Pay contract as a base. Updating the price to $12K and adding the agent rider. Ready to send when you give the go.",
      };
    }
    if (lower.includes("history") || lower.includes("past")) {
      return {
        reply:
          "Reid pushed back twice on price (started at $18K → $14K → $12K). Holding firm here is probably the right floor.",
      };
    }
    return {
      reply: "Holding the draft. Tell me what to verify before you send.",
    };
  };

  return (
    <CardShell
      id="monitor"
      kind="Monitor triggered · Reply received"
      title="Reid replied — unblocks the pricing decision"
      body="You set this watch on Tue. 3 days quiet. Reply arrived 9 minutes ago — and it's actionable."
      status={
        verdict === "send" ? undefined : verdict === "defer" ? (
          <StatusBadge tone="info" icon={<Sparkles size={11} strokeWidth={2} />}>
            Deferred · still watching
          </StatusBadge>
        ) : (
          <StatusBadge tone="info" icon={<Sparkles size={11} strokeWidth={2} />}>
            New reply · 9m ago
          </StatusBadge>
        )
      }
      ask={{
        suggestions: ["What's the scope ask?", "Pull contract redline", "Show negotiation history"],
        onAsk,
      }}
      commit={{
        label:
          verdict === "send"
            ? "Send follow-up"
            : verdict === "defer"
              ? "Defer & keep watching"
              : verdict === "resolved"
                ? "Mark resolved"
                : "Pick a verdict above",
        note: verdict === "send" ? "— sends only after you confirm" : "",
        onConfirm: () => setConfirmed(true),
        visible: !!verdict,
      }}
      confirmed={confirmed}
      summary={
        verdict === "send" ? (
          <>
            Sent the follow-up to Reid · agent in scope at $12K/yr · redline going out.
          </>
        ) : verdict === "defer" ? (
          <>Deferred — Runner stays on the thread and brings it back if Reid pushes.</>
        ) : (
          <>Marked resolved. Monitor closed.</>
        )
      }
      onUndo={() => {
        setConfirmed(false);
        setVerdict(null);
      }}
    >
      <div className="acd-monitor">
        <div className="acd-monitor__watch">
          <div className="acd-monitor__watch-icon" aria-hidden="true">
            <Sparkles size={12} strokeWidth={2.2} />
          </div>
          <div className="acd-monitor__watch-text">
            <div className="acd-monitor__watch-title">
              Watching email thread <em>"Re: pricing follow-up"</em>
            </div>
            <div className="acd-monitor__watch-meta">
              Set Tue · 3 days quiet · auto-followup queued for Fri 5 PM
            </div>
          </div>
        </div>

        <div className="acd-monitor__event">
          <div className="acd-monitor__event-head">
            <span className="acd-monitor__event-tag">REPLY</span>
            <span className="acd-monitor__event-from">Reid Sterling</span>
            <span className="acd-monitor__event-time">9 min ago · Tue 4:18 PM</span>
          </div>
          <div className="acd-monitor__event-body">
            “Hey Charlie — thanks for the patience. Happy to move forward at{" "}
            <mark>$12K/year with a 1-year term</mark>, but only if we can include the standard
            agent in scope. Let's lock it in.”
          </div>
        </div>

        <div className="acd-monitor__unblocks">
          <span className="acd-monitor__unblocks-label">Unblocks</span>
          <span>The pricing decision you were holding · Runner drafted next move</span>
        </div>

        <div className="acd-monitor__draft">
          <div className="acd-monitor__draft-head">
            <span className="acd-monitor__draft-label">Drafted follow-up</span>
            <span className="acd-monitor__draft-meta">Tuned to your past replies on this thread</span>
          </div>
          <div className="acd-monitor__draft-body">
            Reid — works for me. $12K/yr at standard terms, agent included in scope. I'll send the
            redline today, and we can lock it in by EOW.
          </div>
        </div>

        <div className="acd-monitor__verdicts">
          {(
            [
              { v: "send" as const, label: "Send follow-up", icon: <ArrowUpRight size={11} strokeWidth={2.4} /> },
              { v: "edit" as const, label: "Edit draft", icon: <CornerUpLeft size={11} strokeWidth={2.4} /> },
              { v: "defer" as const, label: "Defer · keep watching", icon: <Sparkles size={11} strokeWidth={2.2} /> },
              { v: "resolved" as const, label: "Mark resolved", icon: <Check size={11} strokeWidth={2.4} /> },
            ]
          ).map(({ v, label, icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => setVerdict((cur) => (cur === v ? null : v))}
              className={`acd-monitor__verdict ${verdict === v ? "is-active" : ""}`}
              aria-pressed={verdict === v}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * 10. INVESTIGATION READY — Research with branching causes
 * ═══════════════════════════════════════════════════════════════════════ */

interface InvestigationCause {
  id: string;
  title: string;
  confidence: "high" | "low";
  share: string; // "98% of the spike"
  evidence: string[];
  primaryAction: string;
  secondaryAction: string;
}

const USAGE_SERIES = [780, 820, 760, 800, 2_400];
const USAGE_LABELS = ["Fri", "Sat", "Sun", "Mon", "Tue"];

const CAUSES: InvestigationCause[] = [
  {
    id: "ca1",
    title: "Stuck in retry loop after GMail timeout",
    confidence: "high",
    share: "98% of the spike",
    evidence: [
      "47 retries on the same gmail_search call (2:14–2:43 PM)",
      "Each retry pulled the full thread context (~50K tokens)",
      "Total: 2.35M tokens",
    ],
    primaryAction: "Apply rate-limit patch",
    secondaryAction: "Open trace",
  },
  {
    id: "ca2",
    title: "New thread-context template adds full quote",
    confidence: "low",
    share: "2% of the spike",
    evidence: [
      "12 calls used the new template yesterday",
      "Each adds ~5K tokens vs the old template",
      "Total: 60K tokens",
    ],
    primaryAction: "Roll back template",
    secondaryAction: "Investigate further",
  },
];

function InvestigationCard() {
  const [picks, setPicks] = useState<Record<string, "primary" | "secondary" | null>>({});
  const [confirmed, setConfirmed] = useState(false);

  const choose = (id: string, pick: "primary" | "secondary") =>
    setPicks((prev) => ({ ...prev, [id]: prev[id] === pick ? null : pick }));

  const decidedCount = Object.values(picks).filter(Boolean).length;

  const onAsk = (text: string): AskResult => {
    const lower = text.toLowerCase();
    if (lower.includes("similar") || lower.includes("other users")) {
      return {
        reply:
          "Checked the other 3 high-volume users — none hit the retry loop. kaivbs is the only one affected; suggests a per-account state issue, not a global bug.",
      };
    }
    if (lower.includes("rate") || lower.includes("limit")) {
      return {
        reply:
          "GMail's rate limit was hit at 14:14:03. Retry loop kept burning tokens until the rate window reset 29 minutes later. A 1-retry-cap with backoff fixes it.",
      };
    }
    if (lower.includes("rollback") || lower.includes("template")) {
      return {
        reply:
          "The template change shipped Sun. If you roll back, the retry loop bug still exists — it's the bigger lever. Recommend patching the retry first.",
      };
    }
    return {
      reply: "Holding the analysis. Tell me what to dig further into.",
    };
  };

  const maxVal = Math.max(...USAGE_SERIES);

  return (
    <CardShell
      id="investigation"
      kind="Investigation ready"
      title="Token spike · kaivbs@gmail.com burned 2.4M tokens yesterday"
      body="3× their 5-day median. Runner pulled the traces and narrowed it to two candidate causes — pick a fix per cause, or dig further."
      status={
        decidedCount > 0 ? undefined : (
          <StatusBadge tone="neutral">2 candidate causes</StatusBadge>
        )
      }
      ask={{
        suggestions: ["Compare with similar users", "Check rate limits", "Roll back the template?", "Build a regression test"],
        onAsk,
      }}
      commit={{
        label: `Apply ${decidedCount} fix${decidedCount === 1 ? "" : "es"}`,
        note: "— each staged action queues a PR / config change",
        onConfirm: () => setConfirmed(true),
        visible: decidedCount > 0,
      }}
      confirmed={confirmed}
      summary={
        <>
          Staged {decidedCount} fix{decidedCount === 1 ? "" : "es"} for the token-spike on
          kaivbs · regression test queued.
        </>
      }
      onUndo={() => {
        setConfirmed(false);
        setPicks({});
      }}
    >
      <div className="acd-invest">
        {/* What Runner already did */}
        <div className="acd-invest__did">
          <span className="acd-invest__did-label">Runner already</span>
          <span>
            Pulled 5 days of Logfire traces · clustered tool calls · ranked by token cost ·
            cross-checked against 3 similar users.
          </span>
        </div>

        {/* Mini chart of token usage with spike */}
        <div className="acd-invest__chart" aria-label="5-day token usage chart">
          <div className="acd-invest__chart-bars">
            {USAGE_SERIES.map((v, i) => (
              <div key={i} className="acd-invest__chart-col">
                <div
                  className={`acd-invest__chart-bar ${v === maxVal ? "is-spike" : ""}`}
                  style={{ height: `${(v / maxVal) * 100}%` }}
                  title={`${USAGE_LABELS[i]}: ${(v / 1000).toFixed(0)}K tokens`}
                >
                  <span className="acd-invest__chart-val">{(v / 1000).toFixed(0)}K</span>
                </div>
                <span className="acd-invest__chart-label">{USAGE_LABELS[i]}</span>
              </div>
            ))}
          </div>
          <div className="acd-invest__chart-baseline" aria-hidden="true">
            <span>median ~800K</span>
          </div>
        </div>

        {/* Candidate causes */}
        {CAUSES.map((cause) => {
          const pick = picks[cause.id];
          return (
            <div
              key={cause.id}
              className={`acd-invest__cause acd-invest__cause--${cause.confidence}`}
            >
              <div className="acd-invest__cause-head">
                <span className={`acd-invest__cause-conf acd-invest__cause-conf--${cause.confidence}`}>
                  {cause.confidence === "high" ? "High confidence" : "Low confidence"}
                </span>
                <span className="acd-invest__cause-share">{cause.share}</span>
              </div>
              <h3 className="acd-invest__cause-title">{cause.title}</h3>
              <ul className="acd-invest__cause-evidence">
                {cause.evidence.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
              <div className="acd-invest__cause-actions">
                <button
                  type="button"
                  className={`acd-invest__cause-btn acd-invest__cause-btn--primary ${
                    pick === "primary" ? "is-active" : ""
                  }`}
                  onClick={() => choose(cause.id, "primary")}
                  aria-pressed={pick === "primary"}
                >
                  <Check size={11} strokeWidth={2.4} />
                  {cause.primaryAction}
                </button>
                <button
                  type="button"
                  className={`acd-invest__cause-btn acd-invest__cause-btn--ghost ${
                    pick === "secondary" ? "is-active" : ""
                  }`}
                  onClick={() => choose(cause.id, "secondary")}
                  aria-pressed={pick === "secondary"}
                >
                  {cause.secondaryAction}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}
