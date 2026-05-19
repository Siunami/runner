import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Repeat,
} from "lucide-react";
import {
  AskRow,
  Card,
  Chip,
  DSRoot,
  Eyebrow,
  Field,
  Heading,
  LiveDuration,
  Meta,
  NeedsStack,
  Row,
  SourceCluster,
  SourceList,
  SourceRow,
  Stack,
  Text,
} from "./design-system/primitives";
import "./design-system/primitives.css";
import "./TriagedCards.css";
import {
  LIGHTWEIGHT,
  OPERATIONAL,
  RECURRING,
  type LightweightCard,
  type OperationalCard,
  type RecurringCard,
  type WatchBlock,
} from "./triagedCardsData";

type Theme = "light" | "dark";

export default function TriagedCards() {
  const [theme, setTheme] = useState<Theme>("light");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <DSRoot theme={theme} className="triaged">
      <div className="triaged__inner">
        <header className="triaged__header">
          <Stack gap="snug">
            <Eyebrow>Runner · Triaged items</Eyebrow>
            <Heading size="xl" as="h1">
              What Runner is carrying for you
            </Heading>
            <Text tone="muted">
              Three families, each a different kind of burden. Operational items are work
              Runner is actively carrying. Recurring operations are standing procedures.
              Lightweight support is low-custody — useful, but Runner isn't taking full
              custody unless promoted.
            </Text>
          </Stack>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>

        <FamilySection
          title="Operational items"
          caption="Work packets Runner is actively carrying — working, watching, or needing decisions."
          count={OPERATIONAL.length}
        >
          {OPERATIONAL.map((card) => (
            <OperationalCardView
              key={card.id}
              card={card}
              expanded={expanded.has(card.id)}
              onToggle={() => toggle(card.id)}
            />
          ))}
        </FamilySection>

        <FamilySection
          title="Recurring operations"
          caption="Standing procedures on a cadence. May produce briefs, reports, or operational items."
          count={RECURRING.length}
        >
          {RECURRING.map((card) => (
            <RecurringCardView
              key={card.id}
              card={card}
              expanded={expanded.has(card.id)}
              onToggle={() => toggle(card.id)}
            />
          ))}
        </FamilySection>

        <FamilySection
          title="Lightweight support"
          caption="Lists Runner is keeping for you. No custody — just saved."
          count={LIGHTWEIGHT.length}
          quiet
        >
          <div className="triaged__lw-grid">
            {LIGHTWEIGHT.map((card) => (
              <LightweightCardView key={card.id} card={card} />
            ))}
          </div>
        </FamilySection>
      </div>
    </DSRoot>
  );
}

/* ────────────────────────── Family section ────────────────────────── */

function FamilySection({
  title,
  caption,
  count,
  quiet,
  children,
}: {
  title: string;
  caption: string;
  count: number;
  quiet?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`triaged__family ${quiet ? "triaged__family--quiet" : ""}`}>
      <header className="triaged__family-header">
        <Stack gap="tight">
          <Row className="triaged__family-title-row">
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

/* ────────────────────────── Operational card ──────────────────────────
 *
 * Visual anatomy (top → bottom):
 *
 *   ┌───────────────────────────────────────────┐
 *   │ ◆ Operational     ⚠ Needs you        ⌄    │  ← chips
 *   │                                            │
 *   │ Prepare design review brief                │  ← title
 *   │                                            │
 *   │ ●  Drafting the agenda right now…          │  ← live activity ticker
 *   │                                            │
 *   │ Looking at  [📅] [📄] [🎨] +1              │  ← source cluster (compact)
 *   │ ─────────────────────────────────────────  │
 *   │ ▌ ⚠ Needs you · 1                          │  ← hero block
 *   │ ▌                                          │
 *   │ ▌ ┌──────────────────────────────────────┐ │
 *   │ ▌ │ DECISION  Choose opening frame       │ │
 *   │ ▌ │ Customer urgency or technical risk?  │ │
 *   │ ▌ │ [Customer urgency] [Technical risk]  │ │
 *   │ ▌ │ [Choose framing] Defer               │ │
 *   │ ▌ └──────────────────────────────────────┘ │
 *   │                                            │
 *   │ ◇ Sources                                  │  ← labeled list (expanded only)
 *   │   📅 Mon 2pm · Design review     Invite    │
 *   │   📄 Q3 launch notes                       │
 *   │   ...                                      │
 *   │                                            │
 *   │ → Output  Brief with agenda, risks, …      │  ← quiet footer
 *   │ → Next    Runner can prepare a partial…    │
 *   └───────────────────────────────────────────┘ */

function OperationalCardView({
  card,
  expanded,
  onToggle,
}: {
  card: OperationalCard;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasNeedsYou = !!card.needsYou && card.needsYou.length > 0;

  return (
    <Card
      weight="heavy"
      interactive={!expanded}
      expanded={expanded}
      className={`triaged__op ${hasNeedsYou ? "triaged__op--needs-you" : ""}`}
      onClick={(e) => {
        if (expanded) return;
        if ((e.target as HTMLElement).closest("button")) return;
        onToggle();
      }}
    >
      <div className="triaged__op-top">
        <div className="triaged__op-chips">
          <Chip tone="accent">
            <Activity size={11} />
            Operational
          </Chip>
          {hasNeedsYou && (
            <Chip tone="info">
              <AlertCircle size={11} />
              Needs you
            </Chip>
          )}
          {card.active && (
            <Chip tone="success">
              Active
              {typeof card.activeSinceSeconds === "number" && (
                <>
                  <span className="triaged__chip-sep" aria-hidden="true">
                    ·
                  </span>
                  <LiveDuration seedSeconds={card.activeSinceSeconds} />
                </>
              )}
            </Chip>
          )}
          {card.mode === "watching" && !card.active && (
            <Chip tone="outline">Watching</Chip>
          )}
        </div>
        <div className="triaged__op-actions">
          <SessionLink />
          <ExpandToggle expanded={expanded} onToggle={onToggle} />
        </div>
      </div>

      <Heading size="md" as="h3" className="triaged__op-title">
        {card.title}
      </Heading>

      <p className="triaged__op-state">{card.state}</p>

      {!expanded && card.watch && card.watch.activity && card.watch.activity.length > 0 && (
        <div className="triaged__op-cluster">
          <Meta className="triaged__op-cluster-label">Last update</Meta>
          <span className="triaged__op-activity">
            <span className="triaged__op-activity-when">
              {card.watch.activity[card.watch.activity.length - 1]!.when}
            </span>
            <span className="triaged__op-activity-sep" aria-hidden="true">
              ·
            </span>
            <span className="triaged__op-activity-text">
              {card.watch.activity[card.watch.activity.length - 1]!.text}
            </span>
          </span>
        </div>
      )}

      {!expanded && !card.watch && card.sources.length > 0 && (
        <div className="triaged__op-cluster">
          <Meta className="triaged__op-cluster-label">Looking at</Meta>
          <SourceCluster sources={card.sources} max={5} />
        </div>
      )}

      {expanded && (
        <div className="triaged__op-expanded">
          {card.active && card.currentOperation && (
            <CurrentlyLine value={card.currentOperation} />
          )}

          {hasNeedsYou && <NeedsStack cards={card.needsYou!} />}

          {card.watch && <WatchBlockView watch={card.watch} />}

          {card.sources.length > 0 && !card.watch && (
            <div className="triaged__op-sources">
              <Meta className="triaged__op-sources-label">Looking at</Meta>
              <SourceList sources={card.sources} />
            </div>
          )}

          {card.waitingOn && !card.watch && (
            <FooterLine label="Waiting on" value={card.waitingOn} />
          )}
          <FooterLine label="Output" value={card.output} />
          <FooterLine label="Next" value={card.next} />

          <AskRow
            placeholder={askPlaceholder(card)}
            suggestions={askSuggestions(card)}
            onSubmit={(text) => console.log("ask runner", card.id, text)}
          />
        </div>
      )}
    </Card>
  );
}

function askPlaceholder(card: OperationalCard): string {
  if (card.mode === "watching") return "Tell Runner to check now, change the trigger, or take action…";
  if (card.needsYou && card.needsYou.length > 0) return "Push back, ask for more options, or redirect Runner…";
  return "Ask Runner to change something or look further…";
}

function askSuggestions(card: OperationalCard): string[] | undefined {
  if (card.mode === "watching") return ["Check now", "Extend deadline", "Draft follow-up now", "Stop watching"];
  if (card.needsYou && card.needsYou.length > 0) return ["Show me other options", "Why these?", "What's the risk?"];
  return undefined;
}

function CurrentlyLine({ value }: { value: string | string[] }) {
  const values = Array.isArray(value) ? value : [value];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (values.length <= 1) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % values.length),
      3500,
    );
    return () => window.clearInterval(id);
  }, [values.length]);

  const safeIndex = values.length === 0 ? 0 : index % values.length;
  const current = values[safeIndex] ?? "";

  return (
    <div className="triaged__currently">
      <span className="triaged__currently-label">Currently</span>
      <span className="triaged__currently-value" key={safeIndex}>
        {current}
      </span>
    </div>
  );
}

function SessionLink() {
  return (
    <button
      type="button"
      className="triaged__session-button"
      aria-label="Open session"
      title="Open session"
    >
      <ArrowUpRight size={14} strokeWidth={1.75} />
    </button>
  );
}

function WatchBlockView({ watch }: { watch: WatchBlock }) {
  return (
    <div className="ds-watch">
      <div className="ds-watch__header">
        <span className="ds-watch__icon" aria-hidden="true">
          <WatchIcon />
        </span>
        <span>Watching for</span>
      </div>
      <ul className="ds-watch__signals">
        {watch.watchingFor.map((s) => (
          <li key={s} className="ds-watch__signal">
            <span className="ds-watch__signal-marker" aria-hidden="true" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
      {watch.activity && watch.activity.length > 0 && (
        <div className="ds-watch__activity">
          <p className="ds-watch__activity-label">Recent activity</p>
          {watch.activity.map((a, i) => (
            <div key={i} className="ds-watch__activity-item">
              <span className="ds-watch__activity-when">{a.when}</span>
              <span className="ds-watch__activity-text">{a.text}</span>
            </div>
          ))}
        </div>
      )}
      {(watch.lastCheck || watch.nextCheck || watch.escalation) && (
        <div className="ds-watch__meta">
          {watch.lastCheck && (
            <div className="ds-watch__meta-item">
              <span className="ds-watch__meta-label">Last check</span>
              <span className="ds-watch__meta-value">{watch.lastCheck}</span>
            </div>
          )}
          {watch.nextCheck && (
            <div className="ds-watch__meta-item">
              <span className="ds-watch__meta-label">Next check</span>
              <span className="ds-watch__meta-value">{watch.nextCheck}</span>
            </div>
          )}
          {watch.escalation && (
            <div className="ds-watch__meta-item">
              <span className="ds-watch__meta-label">Escalation</span>
              <span className="ds-watch__meta-value ds-watch__meta-value--escalation">
                {watch.escalation}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WatchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FooterLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="triaged__op-footer">
      <span className="triaged__op-footer-arrow" aria-hidden="true">
        →
      </span>
      <span className="triaged__op-footer-label">{label}</span>
      <span className="triaged__op-footer-value">{value}</span>
    </p>
  );
}

/* ────────────────────────── Recurring card ────────────────────────── */

function RecurringCardView({
  card,
  expanded,
  onToggle,
}: {
  card: RecurringCard;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      weight="medium"
      interactive={!expanded}
      expanded={expanded}
      className="triaged__card"
      onClick={(e) => {
        if (expanded) return;
        if ((e.target as HTMLElement).closest("button")) return;
        onToggle();
      }}
    >
      <Row justify="between" align="start" className="triaged__card-top">
        <Stack gap="snug" className="triaged__card-top-text">
          <Row>
            <Chip tone="info">
              <Repeat size={11} />
              Recurring
            </Chip>
            <Chip tone="outline">
              <Calendar size={11} />
              {card.headline.replace(/^Runs\s+/, "")}
            </Chip>
          </Row>
          <Heading size="md" as="h3" className="triaged__card-title">
            {card.title}
          </Heading>
          <Text size="sm" tone="muted">
            {card.summary}
          </Text>
        </Stack>
        <div className="triaged__op-actions">
          <SessionLink />
          <ExpandToggle expanded={expanded} onToggle={onToggle} />
        </div>
      </Row>

      <Row wrap className="triaged__card-lanes triaged__card-lanes--procedural">
        <span className="triaged__recurring-next">
          <Clock size={12} />
          Next run · {card.nextRun}
        </span>
        <span className="triaged__lane-divider" aria-hidden="true">
          /
        </span>
        <Meta>Last run · {card.lastRun}</Meta>
      </Row>

      {expanded && (
        <div className="triaged__card-expanded">
          <Stack>
            <Field label="Runs">{card.expanded.runs}</Field>
            <Field label="Runner checks">
              {card.expanded.checks}
              {card.expanded.sources && card.expanded.sources.length > 0 && (
                <div className="triaged__recurring-sources">
                  <SourceRow sources={card.expanded.sources} />
                </div>
              )}
            </Field>
            <Field label="Produces">{card.expanded.produces}</Field>
            <Field label="Last run">{card.expanded.lastRun}</Field>
            <Field label="Next run">{card.expanded.nextRun}</Field>
            {card.expanded.approvalBoundary && (
              <Field label="Approval boundary">{card.expanded.approvalBoundary}</Field>
            )}
            <AskRow
              placeholder="Run now, pause, change the cadence, or ask Runner something…"
              suggestions={["Run now", "Pause", "Change schedule", "View last run"]}
              onSubmit={(text) => console.log("ask runner", card.id, text)}
            />
          </Stack>
        </div>
      )}
    </Card>
  );
}

/* ────────────────────────── Lightweight card ──────────────────────────
 *
 * Just the list. No expand/collapse, no chip, no actions. Runner is holding
 * onto these for you; you read them. Title + meta + items.
 */

function LightweightCardView({ card }: { card: LightweightCard }) {
  return (
    <article className="triaged__lw">
      <header className="triaged__lw-header">
        <h3 className="triaged__lw-title">{card.title}</h3>
        {card.meta && <p className="triaged__lw-meta">{card.meta}</p>}
      </header>
      <ul className="triaged__lw-items">
        {card.items.map((item, i) => (
          <li key={i} className="triaged__lw-item">
            <span className="triaged__lw-bullet" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ────────────────────────── Helpers ────────────────────────── */

function ExpandToggle({
  expanded,
  onToggle,
  small,
}: {
  expanded: boolean;
  onToggle: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse" : "Expand"}
      onClick={onToggle}
      className={`triaged__expand ${small ? "triaged__expand--small" : ""}`}
    >
      {expanded ? <ChevronDown size={small ? 14 : 16} /> : <ChevronRight size={small ? 14 : 16} />}
    </button>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <Row className="triaged__theme">
      <Eyebrow>Theme</Eyebrow>
      <div className="triaged__theme-toggle">
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
