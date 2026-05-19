import { forwardRef, useEffect, useState, type HTMLAttributes, type ReactNode, type ButtonHTMLAttributes } from "react";
import {
  BarChart3,
  Calendar,
  Code2,
  FileImage,
  FileText,
  Globe,
  Image as ImageIcon,
  Linkedin,
  ListChecks,
  Mail,
  MapPin,
  Mic,
  Notebook,
  Phone,
  Plug,
  Presentation,
  Sheet,
  Slack,
  User as UserIcon,
  Youtube,
} from "lucide-react";
import "./primitives.css";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ────────────────────────── Root ────────────────────────── */

export interface DSRootProps extends HTMLAttributes<HTMLDivElement> {
  theme?: "light" | "dark";
}

export const DSRoot = forwardRef<HTMLDivElement, DSRootProps>(function DSRoot(
  { theme = "light", className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("ds-root", theme === "dark" && "ds-dark", className)}
      {...rest}
    >
      {children}
    </div>
  );
});

/* ────────────────────────── Layout ────────────────────────── */

type Gap = "tight" | "snug" | "default" | "loose" | "section";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: Gap;
}

export function Stack({ gap = "default", className, ...rest }: StackProps) {
  const gapClass =
    gap === "default" ? "" : `ds-stack--${gap}`;
  return <div className={cx("ds-stack", gapClass, className)} {...rest} />;
}

export interface RowProps extends HTMLAttributes<HTMLDivElement> {
  align?: "center" | "baseline" | "start";
  justify?: "default" | "between";
  wrap?: boolean;
}

export function Row({ align = "center", justify = "default", wrap, className, ...rest }: RowProps) {
  return (
    <div
      className={cx(
        "ds-row",
        align !== "center" && `ds-row--${align}`,
        justify === "between" && "ds-row--between",
        wrap && "ds-row--wrap",
        className,
      )}
      {...rest}
    />
  );
}

export function Divider({ className, ...rest }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cx("ds-divider", className)} {...rest} />;
}

/* ────────────────────────── Type ────────────────────────── */

export function Eyebrow({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("ds-eyebrow", className)} {...rest} />;
}

export function Meta({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("ds-meta", className)} {...rest} />;
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  size?: "sm" | "md" | "lg" | "xl";
  as?: "h1" | "h2" | "h3" | "h4";
}

export function Heading({ size = "md", as: Tag = "h2", className, ...rest }: HeadingProps) {
  return <Tag className={cx("ds-heading", `ds-heading--${size}`, className)} {...rest} />;
}

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  size?: "sm" | "md";
  tone?: "default" | "muted" | "faint";
}

export function Text({ size = "md", tone = "default", className, ...rest }: TextProps) {
  return (
    <p
      className={cx(
        "ds-text",
        size === "sm" && "ds-text--sm",
        tone === "muted" && "ds-text--muted",
        tone === "faint" && "ds-text--faint",
        className,
      )}
      {...rest}
    />
  );
}

/* ────────────────────────── Chip ────────────────────────── */

export type ChipTone = "accent" | "info" | "success" | "destructive" | "neutral" | "outline" | "default";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  icon?: ReactNode;
}

export function Chip({ tone = "default", icon, className, children, ...rest }: ChipProps) {
  return (
    <span className={cx("ds-chip", tone !== "default" && `ds-chip--${tone}`, className)} {...rest}>
      {icon ? <span className="ds-chip__icon">{icon}</span> : null}
      {children}
    </span>
  );
}

/* ────────────────────────── Card ────────────────────────── */

export type CardWeight = "heavy" | "medium" | "light";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  weight?: CardWeight;
  interactive?: boolean;
  expanded?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { weight = "medium", interactive, expanded, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx(
        "ds-card",
        `ds-card--${weight}`,
        interactive && "ds-card--interactive",
        expanded && "ds-card--expanded",
        className,
      )}
      {...rest}
    />
  );
});

/* ────────────────────────── Button ────────────────────────── */

export type ButtonVariant = "default" | "primary" | "ghost" | "outline";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  iconOnly?: boolean;
}

export function Button({ variant = "default", iconOnly, className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "ds-button",
        variant !== "default" && `ds-button--${variant}`,
        iconOnly && "ds-button--icon",
        className,
      )}
      {...rest}
    />
  );
}

/* ────────────────────────── Field (labeled block) ────────────────────────── */

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  emphasis?: "default" | "accent";
}

export function Field({ label, emphasis = "default", className, children, ...rest }: FieldProps) {
  return (
    <div className={cx("ds-field", emphasis === "accent" && "ds-field--accent", className)} {...rest}>
      <p className="ds-field__label">{label}</p>
      <div className="ds-field__body">{children}</div>
    </div>
  );
}

/* ────────────────────────── Section ────────────────────────── */

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  caption?: ReactNode;
}

export function Section({ title, caption, className, children, ...rest }: SectionProps) {
  return (
    <section className={cx("ds-section", className)} {...rest}>
      <header className="ds-section__header">
        <h3 className="ds-section__title">{title}</h3>
        {caption ? <p className="ds-section__caption">{caption}</p> : null}
      </header>
      {children}
    </section>
  );
}

/* ────────────────────────── Lane indicator ────────────────────────── */

export type LaneKind = "working" | "watching" | "needs-you" | "waiting" | "done";

export interface LaneProps extends HTMLAttributes<HTMLSpanElement> {
  kind: LaneKind;
  icon?: ReactNode;
  label: string;
}

export function Lane({ kind, icon, label, className, ...rest }: LaneProps) {
  return (
    <span
      className={cx("ds-lane", kind === "needs-you" && "ds-lane--needs-you", className)}
      {...rest}
    >
      {icon ? <span className="ds-lane__icon">{icon}</span> : null}
      {label}
    </span>
  );
}

/* ────────────────────────── Preview list ────────────────────────── */

export interface PreviewListProps extends HTMLAttributes<HTMLUListElement> {
  items: ReactNode[];
}

export function PreviewList({ items, className, ...rest }: PreviewListProps) {
  return (
    <ul className={cx("ds-list", className)} {...rest}>
      {items.map((item, i) => (
        <li key={i} className="ds-list__item">
          <span className="ds-list__bullet" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ────────────────────────── SourceChip ──────────────────────────
 * What Runner is paying attention to. Renders an icon + label and
 * optional meta. Kind drives the icon; if no match, falls back to FileText. */

export type SourceKind =
  | "calendar"
  | "email"
  | "slack"
  | "linear"
  | "linkedin"
  | "google-doc"
  | "google-sheet"
  | "google-slides"
  | "figma"
  | "granola"
  | "logfire"
  | "youtube"
  | "obsidian"
  | "pdf"
  | "browser"
  | "code"
  | "mcp"
  | "person"
  | "phone"
  | "spreadsheet"
  | "deck"
  | "image"
  | "map"
  | "task";

const SOURCE_ICONS: Record<SourceKind, typeof Calendar> = {
  calendar: Calendar,
  email: Mail,
  slack: Slack,
  linear: ListChecks,
  linkedin: Linkedin,
  "google-doc": FileText,
  "google-sheet": Sheet,
  "google-slides": Presentation,
  figma: FileImage,
  granola: Mic,
  logfire: BarChart3,
  youtube: Youtube,
  obsidian: Notebook,
  pdf: FileText,
  browser: Globe,
  code: Code2,
  mcp: Plug,
  person: UserIcon,
  phone: Phone,
  spreadsheet: Sheet,
  deck: Presentation,
  image: ImageIcon,
  map: MapPin,
  task: ListChecks,
};

export interface SourceChipProps extends HTMLAttributes<HTMLSpanElement> {
  kind: SourceKind;
  label: string;
  meta?: string;
}

export function SourceChip({ kind, label, meta, className, ...rest }: SourceChipProps) {
  const Icon = SOURCE_ICONS[kind] ?? FileText;
  return (
    <span className={cx("ds-source-chip", className)} {...rest}>
      <span className="ds-source-chip__icon">
        <Icon size={13} strokeWidth={1.75} />
      </span>
      <span className="ds-source-chip__label">{label}</span>
      {meta ? <span className="ds-source-chip__meta">{meta}</span> : null}
    </span>
  );
}

export interface SourceRowProps extends HTMLAttributes<HTMLDivElement> {
  sources: Array<{ kind: SourceKind; label: string; meta?: string }>;
}

export function SourceRow({ sources, className, ...rest }: SourceRowProps) {
  if (!sources.length) return null;
  return (
    <div className={cx("ds-source-row", className)} {...rest}>
      {sources.map((s, i) => (
        <SourceChip key={`${s.kind}-${i}`} kind={s.kind} label={s.label} meta={s.meta} />
      ))}
    </div>
  );
}

/* ────────────────────────── SourceCluster (icon-only, compact) ──────────────────────────
 * A tight cluster of source icons, no labels. Used on compact cards to show
 * "these are the things Runner is touching" without text weight. */

export interface SourceClusterProps extends HTMLAttributes<HTMLDivElement> {
  sources: Array<{ kind: SourceKind; label: string }>;
  max?: number;
}

export function SourceCluster({ sources, max = 4, className, ...rest }: SourceClusterProps) {
  if (!sources.length) return null;
  const visible = sources.slice(0, max);
  const more = sources.length - visible.length;
  return (
    <div className={cx("ds-source-cluster", className)} {...rest}>
      {visible.map((s, i) => {
        const Icon = SOURCE_ICONS[s.kind] ?? FileText;
        return (
          <span
            key={`${s.kind}-${i}`}
            className="ds-source-cluster__icon"
            title={s.label}
            aria-label={s.label}
          >
            <Icon size={12} strokeWidth={1.75} />
          </span>
        );
      })}
      {more > 0 && <span className="ds-source-cluster__more">+{more}</span>}
    </div>
  );
}

/* ────────────────────────── SourceList (expanded, labeled rows) ────────────────────────── */

export interface SourceListProps extends HTMLAttributes<HTMLDivElement> {
  sources: Array<{ kind: SourceKind; label: string; meta?: string }>;
}

export function SourceList({ sources, className, ...rest }: SourceListProps) {
  if (!sources.length) return null;
  return (
    <div className={cx("ds-source-list", className)} {...rest}>
      {sources.map((s, i) => {
        const Icon = SOURCE_ICONS[s.kind] ?? FileText;
        return (
          <div className="ds-source-list__item" key={`${s.kind}-${i}`}>
            <span className="ds-source-list__icon">
              <Icon size={13} strokeWidth={1.75} />
            </span>
            <span className="ds-source-list__label">{s.label}</span>
            {s.meta && <span className="ds-source-list__meta">{s.meta}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────── LaneBlock ──────────────────────────
 * Used inside the expanded card. Renders the field label (e.g. "Runner is
 * working"), a short summary line, and a row of source chips. */

export interface LaneBlockProps {
  label: string;
  summary: string;
  sources?: Array<{ kind: SourceKind; label: string; meta?: string }>;
}

export function LaneBlock({ label, summary, sources }: LaneBlockProps) {
  return (
    <div className="ds-field">
      <p className="ds-field__label">{label}</p>
      <div className="ds-lane-block">
        <p className="ds-lane-block__summary">{summary}</p>
        {sources && sources.length > 0 && <SourceRow sources={sources} />}
      </div>
    </div>
  );
}

/* ────────────────────────── Needs-you stack ──────────────────────────
 * Amber-tinted container with a stack of decision/approval mini-cards. */

export type NeedsKind = "decision" | "approval" | "clarification" | "review";

/* ────────────────────────── Artifact types ────────────────────────── */

export type SlideStagingData =
  | { mode: "edit-title"; oldTitle: string }
  | {
      mode: "remove";
      reason?: string;
      destination?: { slideNumber: number; title: string; addedLine: string };
    }
  | { mode: "new"; replaces?: { label: string; note?: string } };

export type SlideArtifactData = {
  kind: "slide";
  deck?: { name: string; slideNumber: number; totalSlides: number; version?: string };
  layout?: "title-content" | "title-image" | "title-only";
  theme?: "white" | "brand" | "dark";
  title?: string;
  subtitle?: string;
  bullets?: string[];
  rightImage?: { shape: "phone" | "screenshot" | "photo" | "logo"; label?: string };
  staging?: SlideStagingData;
  caption?: string;
};

export type ArtifactData =
  | { kind: "email"; from?: string; to?: string; subject?: string; body: string }
  | { kind: "diff"; before: string; after: string; label?: string }
  | SlideArtifactData
  | {
      kind: "distribution";
      unit?: string;
      values: Array<{ label: string; value: string; fraction: number; flagged?: boolean }>;
    }
  | {
      kind: "options";
      options: Array<{
        label: string;
        headline?: string;
        bullets?: string[];
        recommended?: boolean;
      }>;
    }
  | { kind: "drafts"; drafts: Array<{ to: string; preview: string }>; remaining?: number }
  | {
      kind: "flight";
      legs: Array<{
        label: string;
        date: string;
        carrier: string;
        from: { code: string; time: string };
        to: { code: string; time: string };
        duration: string;
        stops: string;
      }>;
      pricing: {
        points: { headline: string; bullets: string[]; recommended?: boolean };
        cash: { headline: string; bullets: string[]; recommended?: boolean };
      };
    };

export interface NeedsCardProps {
  kind: NeedsKind;
  title: string;
  body?: string;
  options?: string[];
  artifact?: ArtifactData;
  actions?: Array<{ label: string; variant?: "primary" | "default" | "ghost" }>;
}

const NEEDS_KIND_LABEL: Record<NeedsKind, string> = {
  decision: "Decision",
  approval: "Approval",
  clarification: "Clarification",
  review: "Review",
};

export function NeedsCard({ kind, title, body, options, artifact, actions }: NeedsCardProps) {
  return (
    <div className="ds-needs-card">
      <div className="ds-needs-card__top">
        <span className="ds-needs-card__kind">{NEEDS_KIND_LABEL[kind]}</span>
        <p className="ds-needs-card__title">{title}</p>
      </div>
      {body && <p className="ds-needs-card__body">{body}</p>}
      {options && options.length > 0 && (
        <div className="ds-needs-card__options">
          {options.map((opt) => (
            <span key={opt} className="ds-needs-card__option">
              {opt}
            </span>
          ))}
        </div>
      )}
      {artifact && <ArtifactView artifact={artifact} />}
      {actions && actions.length > 0 && (
        <div className="ds-needs-card__actions">
          {actions.map((action) => (
            <Button key={action.label} variant={action.variant ?? "default"}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── LiveDuration ──────────────────────────
 * A small monotonic clock — displays elapsed time since a seed value, ticking
 * every second. Use this where "how long has X been true" is real information
 * (e.g., "Active · 1m 23s"). The seed is a snapshot at component mount time
 * and the counter increments locally — for a prototype this means each
 * remount restarts from the seed, which is fine.
 *
 * Tabular numerals keep the digits from jittering width as they change. */

export interface LiveDurationProps {
  /** Initial elapsed seconds at mount. The counter ticks up from here. */
  seedSeconds: number;
  className?: string;
}

function formatElapsed(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r === 0 ? `${m}m` : `${m}m ${r}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm === 0 ? `${h}h` : `${h}h ${rm}m`;
}

export function LiveDuration({ seedSeconds, className }: LiveDurationProps) {
  const [secs, setSecs] = useState(seedSeconds);
  useEffect(() => {
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className={cx("ds-duration", className)}>{formatElapsed(secs)}</span>;
}

/* ────────────────────────── LiveActivity ──────────────────────────
 * Animated "what is Runner doing right now" ticker. Cycles through a list
 * of short verb-led strings every ~3.5s with a smooth fade-in. The pulse
 * dot's color is driven by `mode`.
 *
 *   working — accent green (Runner is doing)
 *   watching — info amber (Runner is monitoring)
 *   waiting — muted (Runner is paused, external dependency)
 */

export type ActivityMode = "working" | "watching" | "waiting";

export interface LiveActivityProps {
  activities: string[];
  mode?: ActivityMode;
  intervalMs?: number;
  className?: string;
}

export function LiveActivity({
  activities,
  mode = "working",
  intervalMs = 3500,
  className,
}: LiveActivityProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (activities.length <= 1) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % activities.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [activities.length, intervalMs]);

  const safeIndex = activities.length === 0 ? 0 : index % activities.length;
  const text = activities[safeIndex] ?? "";

  return (
    <div className={cx("ds-live", `ds-live--${mode}`, className)}>
      <span className="ds-live__dot" aria-hidden="true" />
      <span className="ds-live__text" key={`${mode}-${safeIndex}`}>
        {text}
      </span>
    </div>
  );
}

/* ────────────────────────── ArtifactView ──────────────────────────
 * Inline artifact rendered inside a NeedsCard. Each kind has its own
 * visual treatment — the goal is to put the decision context in front of
 * the user so they can choose without leaving the card. */

export function ArtifactView({ artifact }: { artifact: ArtifactData }) {
  switch (artifact.kind) {
    case "email":
      return <EmailArtifactView {...artifact} />;
    case "diff":
      return <DiffArtifactView {...artifact} />;
    case "slide":
      return <SlideArtifactView {...artifact} />;
    case "distribution":
      return <DistributionArtifactView {...artifact} />;
    case "options":
      return <OptionsArtifactView {...artifact} />;
    case "drafts":
      return <DraftsArtifactView {...artifact} />;
    case "flight":
      return <FlightArtifactView {...artifact} />;
  }
}

function EmailArtifactView({
  from,
  to,
  subject,
  body,
}: Extract<ArtifactData, { kind: "email" }>) {
  return (
    <div className="ds-art ds-art--email">
      <div className="ds-art-email__headers">
        {from && (
          <div className="ds-art-email__row">
            <span className="ds-art-email__label">From</span>
            <span className="ds-art-email__value">{from}</span>
          </div>
        )}
        {to && (
          <div className="ds-art-email__row">
            <span className="ds-art-email__label">To</span>
            <span className="ds-art-email__value">{to}</span>
          </div>
        )}
        {subject && (
          <div className="ds-art-email__row">
            <span className="ds-art-email__label">Subject</span>
            <span className="ds-art-email__value ds-art-email__subject">{subject}</span>
          </div>
        )}
      </div>
      <div className="ds-art-email__body">{body}</div>
    </div>
  );
}

function DiffArtifactView({ before, after, label }: Extract<ArtifactData, { kind: "diff" }>) {
  return (
    <div className="ds-art ds-art--diff">
      {label && <div className="ds-art__label">{label}</div>}
      <div className="ds-art-diff__line ds-art-diff__line--before">
        <span className="ds-art-diff__marker" aria-label="Before">
          −
        </span>
        <span className="ds-art-diff__text">{before}</span>
      </div>
      <div className="ds-art-diff__line ds-art-diff__line--after">
        <span className="ds-art-diff__marker" aria-label="After">
          +
        </span>
        <span className="ds-art-diff__text">{after}</span>
      </div>
    </div>
  );
}

function SlideArtifactView(props: SlideArtifactData) {
  const { deck, layout = "title-content", theme = "white", staging, caption } = props;

  const stagingMode = staging?.mode;

  return (
    <div className="ds-art ds-art--slide">
      {deck && (
        <div className="ds-slide-deck">
          <span className="ds-slide-deck__icon" aria-hidden="true">
            <Presentation size={11} strokeWidth={1.75} />
          </span>
          <span className="ds-slide-deck__name">{deck.name}</span>
          {deck.version && <span className="ds-slide-deck__version">· {deck.version}</span>}
          <span className="ds-slide-deck__spacer" />
          <span className="ds-slide-deck__num">
            Slide {deck.slideNumber}
            <span className="ds-slide-deck__num-of">/{deck.totalSlides}</span>
          </span>
        </div>
      )}

      <div
        className={cx(
          "ds-slide",
          `ds-slide--${theme}`,
          `ds-slide--${layout}`,
          stagingMode && `ds-slide--staged-${stagingMode}`,
        )}
      >
        {staging && <StagedPill staging={staging} />}
        <SlideBody {...props} />
        {stagingMode === "remove" && <div className="ds-slide__remove-overlay" aria-hidden="true" />}
        {deck && (
          <span className="ds-slide__footer-num" aria-hidden="true">
            {deck.slideNumber}
          </span>
        )}
      </div>

      {staging?.mode === "remove" && staging.destination && (
        <DestinationSlide destination={staging.destination} />
      )}
      {staging?.mode === "new" && staging.replaces && (
        <ReplacesSlide replaces={staging.replaces} />
      )}

      {caption && <p className="ds-slide-caption">{caption}</p>}
    </div>
  );
}

function SlideBody({
  layout = "title-content",
  title,
  subtitle,
  bullets,
  rightImage,
  staging,
}: SlideArtifactData) {
  const stagedEdit = staging?.mode === "edit-title" ? staging : null;

  if (layout === "title-image") {
    return (
      <div className="ds-slide__body ds-slide__body--two-col">
        <div className="ds-slide__col ds-slide__col--text">
          {title && (
            <SlideTitle text={title} edited={stagedEdit?.oldTitle} />
          )}
          {subtitle && <p className="ds-slide__subtitle">{subtitle}</p>}
          {bullets && bullets.length > 0 && (
            <ul className="ds-slide__bullets">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="ds-slide__col ds-slide__col--image">
          {rightImage && <ImagePlaceholder {...rightImage} />}
        </div>
      </div>
    );
  }

  if (layout === "title-only") {
    return (
      <div className="ds-slide__body ds-slide__body--center">
        {title && <SlideTitle text={title} edited={stagedEdit?.oldTitle} large />}
        {subtitle && <p className="ds-slide__subtitle ds-slide__subtitle--center">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="ds-slide__body ds-slide__body--content">
      {title && <SlideTitle text={title} edited={stagedEdit?.oldTitle} />}
      {subtitle && <p className="ds-slide__subtitle">{subtitle}</p>}
      {bullets && bullets.length > 0 && (
        <ul className="ds-slide__bullets">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SlideTitle({ text, edited, large }: { text: string; edited?: string; large?: boolean }) {
  return (
    <div className={cx("ds-slide__title-block", large && "ds-slide__title-block--large")}>
      {edited && (
        <span className="ds-slide__title-old" aria-label="Previous title">
          {edited}
        </span>
      )}
      <h4 className="ds-slide__title">
        {edited ? <span className="ds-slide__title-mark">{text}</span> : text}
      </h4>
    </div>
  );
}

function ImagePlaceholder({ shape, label }: { shape: string; label?: string }) {
  if (shape === "phone") {
    return (
      <div className="ds-slide__phone" aria-label={label ?? "phone mockup"}>
        <span className="ds-slide__phone-notch" aria-hidden="true" />
        <div className="ds-slide__phone-screen">
          <span className="ds-slide__phone-bar" />
          <span className="ds-slide__phone-bar ds-slide__phone-bar--short" />
          <span className="ds-slide__phone-bar" />
          <span className="ds-slide__phone-bar ds-slide__phone-bar--med" />
        </div>
        {label && <span className="ds-slide__placeholder-label">{label}</span>}
      </div>
    );
  }
  if (shape === "logo") {
    return (
      <div className="ds-slide__logo-mark" aria-label={label ?? "logo"}>
        <span>R</span>
      </div>
    );
  }
  return (
    <div className={cx("ds-slide__placeholder", `ds-slide__placeholder--${shape}`)}>
      <span className="ds-slide__placeholder-label">{label ?? shape}</span>
    </div>
  );
}

function StagedPill({ staging }: { staging: SlideStagingData }) {
  if (staging.mode === "edit-title") {
    return (
      <span className="ds-slide__pill ds-slide__pill--edit" title="Staged edit">
        <span className="ds-slide__pill-dot" aria-hidden="true" />
        Staged edit
      </span>
    );
  }
  if (staging.mode === "remove") {
    return (
      <span className="ds-slide__pill ds-slide__pill--remove" title="Staged for removal">
        <span className="ds-slide__pill-dot" aria-hidden="true" />
        Staged removal
      </span>
    );
  }
  return (
    <span className="ds-slide__pill ds-slide__pill--new" title="New layout">
      <span className="ds-slide__pill-dot" aria-hidden="true" />
      New layout
    </span>
  );
}

function DestinationSlide({
  destination,
}: {
  destination: { slideNumber: number; title: string; addedLine: string };
}) {
  return (
    <div className="ds-slide-dest">
      <div className="ds-slide-dest__arrow" aria-hidden="true">
        <span className="ds-slide-dest__arrow-line" />
        <span className="ds-slide-dest__arrow-head">↓</span>
      </div>
      <div className="ds-slide-dest__row">
        <span className="ds-slide-dest__label">Becomes 1-liner on</span>
        <span className="ds-slide-dest__target">
          Slide {destination.slideNumber} · {destination.title}
        </span>
      </div>
      <div className="ds-slide-dest__mini">
        <div className="ds-slide-dest__mini-title">{destination.title}</div>
        <div className="ds-slide-dest__mini-line ds-slide-dest__mini-line--added">
          <span className="ds-slide-dest__mini-marker" aria-hidden="true">
            +
          </span>
          {destination.addedLine}
        </div>
        <span className="ds-slide-dest__mini-num">{destination.slideNumber}</span>
      </div>
    </div>
  );
}

function ReplacesSlide({ replaces }: { replaces: { label: string; note?: string } }) {
  return (
    <div className="ds-slide-replaces">
      <span className="ds-slide-replaces__icon" aria-hidden="true">
        ↺
      </span>
      <span className="ds-slide-replaces__label">Replaces</span>
      <span className="ds-slide-replaces__value">{replaces.label}</span>
      {replaces.note && <span className="ds-slide-replaces__note">— {replaces.note}</span>}
    </div>
  );
}

function DistributionArtifactView({
  unit,
  values,
}: Extract<ArtifactData, { kind: "distribution" }>) {
  return (
    <div className="ds-art ds-art--dist">
      {unit && <div className="ds-art__label">{unit}</div>}
      <div className="ds-art-dist__rows">
        {values.map((v) => (
          <div
            key={v.label}
            className={cx("ds-art-dist__row", v.flagged && "ds-art-dist__row--flagged")}
          >
            <span className="ds-art-dist__label">{v.label}</span>
            <span className="ds-art-dist__track">
              <span
                className="ds-art-dist__bar"
                style={{ width: `${Math.max(0, Math.min(1, v.fraction)) * 100}%` }}
              />
            </span>
            <span className="ds-art-dist__value">{v.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionsArtifactView({ options }: Extract<ArtifactData, { kind: "options" }>) {
  return (
    <div className="ds-art ds-art--options">
      {options.map((opt) => (
        <div
          key={opt.label}
          className={cx("ds-art-option", opt.recommended && "ds-art-option--recommended")}
        >
          <div className="ds-art-option__top">
            <span className="ds-art-option__label">{opt.label}</span>
            {opt.recommended && <span className="ds-art-option__badge">Recommended</span>}
          </div>
          {opt.headline && <p className="ds-art-option__headline">{opt.headline}</p>}
          {opt.bullets && opt.bullets.length > 0 && (
            <ul className="ds-art-option__bullets">
              {opt.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function DraftsArtifactView({ drafts, remaining }: Extract<ArtifactData, { kind: "drafts" }>) {
  return (
    <div className="ds-art ds-art--drafts">
      {drafts.map((d, i) => (
        <div key={i} className="ds-art-draft">
          <div className="ds-art-draft__to">{d.to}</div>
          <div className="ds-art-draft__preview">{d.preview}</div>
        </div>
      ))}
      {typeof remaining === "number" && remaining > 0 && (
        <div className="ds-art-draft ds-art-draft--more">+{remaining} more drafts inside</div>
      )}
    </div>
  );
}

function FlightArtifactView({ legs, pricing }: Extract<ArtifactData, { kind: "flight" }>) {
  return (
    <div className="ds-art ds-art--flight">
      <div className="ds-art-flight__legs">
        {legs.map((leg, i) => (
          <div key={i} className="ds-art-flight__leg">
            <div className="ds-art-flight__leg-meta">
              <span className="ds-art-flight__leg-label">{leg.label}</span>
              <span className="ds-art-flight__leg-dot" aria-hidden="true">
                ·
              </span>
              <span>{leg.date}</span>
              <span className="ds-art-flight__leg-dot" aria-hidden="true">
                ·
              </span>
              <span className="ds-art-flight__leg-carrier">{leg.carrier}</span>
            </div>
            <div className="ds-art-flight__route">
              <div className="ds-art-flight__endpoint">
                <span className="ds-art-flight__time">{leg.from.time}</span>
                <span className="ds-art-flight__code">{leg.from.code}</span>
              </div>
              <div className="ds-art-flight__path">
                <span className="ds-art-flight__path-dot" aria-hidden="true" />
                <span className="ds-art-flight__path-line" aria-hidden="true" />
                <span className="ds-art-flight__path-dot" aria-hidden="true" />
                <div className="ds-art-flight__path-meta">
                  {leg.duration} · {leg.stops}
                </div>
              </div>
              <div className="ds-art-flight__endpoint ds-art-flight__endpoint--end">
                <span className="ds-art-flight__time">{leg.to.time}</span>
                <span className="ds-art-flight__code">{leg.to.code}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="ds-art-flight__pricing">
        <PricingColumn label="Points" data={pricing.points} />
        <PricingColumn label="Cash" data={pricing.cash} />
      </div>
    </div>
  );
}

function PricingColumn({
  label,
  data,
}: {
  label: string;
  data: { headline: string; bullets: string[]; recommended?: boolean };
}) {
  return (
    <div
      className={cx(
        "ds-art-flight__price",
        data.recommended && "ds-art-flight__price--recommended",
      )}
    >
      <div className="ds-art-flight__price-top">
        <span className="ds-art-flight__price-label">{label}</span>
        {data.recommended && <span className="ds-art-flight__price-badge">Recommended</span>}
      </div>
      <p className="ds-art-flight__price-headline">{data.headline}</p>
      <ul className="ds-art-flight__price-bullets">
        {data.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

export interface NeedsStackProps {
  cards: NeedsCardProps[];
}

export function NeedsStack({ cards }: NeedsStackProps) {
  if (!cards.length) return null;
  return (
    <div className="ds-needs">
      <div className="ds-needs__header">
        <span className="ds-needs__icon">
          <NeedsIcon />
        </span>
        <p className="ds-needs__title">Needs you</p>
        {cards.length > 1 && <span className="ds-needs__count">{cards.length}</span>}
      </div>
      <div className="ds-needs__stack">
        {cards.map((card, i) => (
          <NeedsCard key={i} {...card} />
        ))}
      </div>
    </div>
  );
}

function NeedsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/* ────────────────────────── AskRow ──────────────────────────
 * Universal chat input — the escape hatch on every expanded card. Lets the
 * user redirect Runner ("show me other flights"), ask for more detail, or
 * change anything about the card in natural language. Suggestion chips are
 * optional and context-specific. The submit handler is wired by the caller;
 * for the prototype it's typically a no-op that clears the input. */

export interface AskRowProps {
  placeholder?: string;
  suggestions?: string[];
  onSubmit?: (text: string) => void;
  className?: string;
}

export function AskRow({
  placeholder = "Ask Runner to change something or look further…",
  suggestions,
  onSubmit,
  className,
}: AskRowProps) {
  const [text, setText] = useState("");

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setText("");
  };

  return (
    <div className={cx("ds-ask", className)}>
      {suggestions && suggestions.length > 0 && (
        <div className="ds-ask__chips">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="ds-ask__chip"
              onClick={() => submit(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        className="ds-ask__form"
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
      >
        <input
          type="text"
          className="ds-ask__input"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Ask Runner"
        />
        <button
          type="submit"
          className="ds-ask__send"
          aria-label="Send"
          disabled={!text.trim()}
        >
          <AskSendIcon />
        </button>
      </form>
    </div>
  );
}

function AskSendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
