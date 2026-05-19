import { useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  ListChecks,
  Repeat,
  User,
} from "lucide-react";
import {
  ArtifactView,
  Button,
  Card,
  Chip,
  DSRoot,
  Divider,
  Eyebrow,
  Field,
  Heading,
  Lane,
  LaneBlock,
  Meta,
  NeedsStack,
  PreviewList,
  Row,
  Section,
  SourceChip,
  SourceCluster,
  SourceList,
  Stack,
  Text,
} from "./primitives";
import "./design-system-page.css";

type Theme = "light" | "dark";

export default function DesignSystem() {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <DSRoot theme={theme} className="ds-page">
      <div className="ds-page__inner">
        <header className="ds-page__header">
          <Stack gap="snug">
            <Eyebrow>Runner · Design System</Eyebrow>
            <Heading size="xl" as="h1">
              Canonical tokens & primitives
            </Heading>
            <Text tone="muted">
              The single source of truth for color, type, spacing, radius, and shadow in
              every Runner prototype. Mirrors the core product (
              <code className="ds-page__code">cambridge/packages/ui</code>) and ports it to
              plain CSS so any prototype — Tailwind or not — can consume it.
            </Text>
          </Stack>
          <Row className="ds-page__theme">
            <Eyebrow>Theme</Eyebrow>
            <div className="ds-page__theme-toggle">
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
        </header>

        <Divider />

        <ColorsSection />
        <MixVariantsSection />
        <TypeSection />
        <RadiusShadowSection />
        <SpacingSection />
        <ChipSection />
        <ButtonSection />
        <CardSection />
        <FieldSection />
        <SourceChipSection />
        <NeedsStackSection />
        <SlideArtifactSection />
        <LaneSection />
        <FooterNote />
      </div>
    </DSRoot>
  );
}

/* ───────────────────────── Colors ───────────────────────── */

const BASE_COLORS: Array<{ name: string; token: string; description: string }> = [
  { name: "background", token: "--background", description: "Surface — pages, cards, popovers" },
  { name: "foreground", token: "--foreground", description: "Text, icons, primary actions" },
  { name: "accent", token: "--accent", description: "Neutral accent (Execute mode)" },
  { name: "info", token: "--info", description: "Amber — Ask mode, warnings, needs-you" },
  { name: "success", token: "--success", description: "Connected, healthy, done" },
  { name: "destructive", token: "--destructive", description: "Errors, failed, dismiss" },
  { name: "brand-accent", token: "--brand-accent", description: "Optional Runner signature (terracotta)" },
];

function ColorsSection() {
  return (
    <PageSection title="Base colors" caption="The 6-color semantic palette — everything else derives from these.">
      <div className="ds-page__color-grid">
        {BASE_COLORS.map((c) => (
          <div className="ds-page__color" key={c.name}>
            <div
              className="ds-page__color-swatch"
              style={{ background: `var(${c.token})` }}
            />
            <Stack gap="tight">
              <Text size="sm">{c.name}</Text>
              <Meta>{c.token}</Meta>
              <Meta>{c.description}</Meta>
            </Stack>
          </div>
        ))}
      </div>
    </PageSection>
  );
}

/* ───────────────────────── Mix variants ───────────────────────── */

const MIX_STEPS = ["1.5", "2", "3", "5", "10", "20", "30", "40", "50", "60", "70", "80", "90", "95"];
const TINT_FAMILIES = [
  { label: "foreground", token: "foreground", steps: MIX_STEPS },
  { label: "accent", token: "accent", steps: ["3", "5", "10"] },
  { label: "info", token: "info", steps: ["3", "5", "10"] },
  { label: "success", token: "success", steps: ["3", "5", "10"] },
  { label: "destructive", token: "destructive", steps: ["3", "5", "10"] },
];

function MixVariantsSection() {
  return (
    <PageSection
      title="Mixed-color tints"
      caption="Tints are solid — color blended toward background, not opacity. Use for hover surfaces, tinted backgrounds, subtle states."
    >
      <Stack>
        {TINT_FAMILIES.map((fam) => (
          <Stack key={fam.label} gap="snug">
            <Eyebrow>{fam.label}</Eyebrow>
            <div className="ds-page__tint-row">
              {fam.steps.map((step) => (
                <div className="ds-page__tint" key={step}>
                  <div
                    className="ds-page__tint-swatch"
                    style={{ background: `var(--${fam.token}-${step})` }}
                  />
                  <Meta>{step}</Meta>
                </div>
              ))}
            </div>
          </Stack>
        ))}
      </Stack>
    </PageSection>
  );
}

/* ───────────────────────── Type ───────────────────────── */

function TypeSection() {
  return (
    <PageSection title="Type" caption="System font stack, 15px base. UI scale uses --runner-text-* tokens.">
      <Stack>
        <Stack gap="tight">
          <Heading size="xl">Heading XL — title</Heading>
          <Meta>--runner-text-2xl · 28px · 650</Meta>
        </Stack>
        <Stack gap="tight">
          <Heading size="lg">Heading LG — section</Heading>
          <Meta>--runner-text-xl · 22px · 600</Meta>
        </Stack>
        <Stack gap="tight">
          <Heading size="md">Heading MD — card title</Heading>
          <Meta>--runner-text-lg · 18px · 600</Meta>
        </Stack>
        <Stack gap="tight">
          <Text>Body MD — primary copy at 15px, 1.5 line-height.</Text>
          <Meta>--runner-text-md · 15px · 400</Meta>
        </Stack>
        <Stack gap="tight">
          <Text size="sm" tone="muted">
            Body SM — secondary copy at 12px.
          </Text>
          <Meta>--runner-text-sm · 12px · 400</Meta>
        </Stack>
        <Stack gap="tight">
          <Eyebrow>Eyebrow · uppercase tracking</Eyebrow>
          <Meta>--runner-text-xs · 10px · 600 · letter-spacing 0.06em</Meta>
        </Stack>
      </Stack>
    </PageSection>
  );
}

/* ───────────────────────── Radius / Shadow ───────────────────────── */

const RADII = [
  { name: "xs", token: "--runner-radius-xs", value: "3px" },
  { name: "sm", token: "--runner-radius-sm", value: "4px" },
  { name: "md", token: "--runner-radius-md", value: "6px" },
  { name: "lg", token: "--runner-radius-lg", value: "8px" },
  { name: "xl", token: "--runner-radius-xl", value: "16px" },
  { name: "pill", token: "--runner-radius-pill", value: "999px" },
];

const SHADOWS = [
  { name: "minimal", token: "--shadow-minimal", caption: "Cards at rest" },
  { name: "middle", token: "--shadow-middle", caption: "Hover, elevated" },
  { name: "hero", token: "--shadow-hero", caption: "Floating menus, modals" },
];

function RadiusShadowSection() {
  return (
    <PageSection title="Radius & shadow" caption="Default for cards/popovers is lg (8px). Shadows are minimal by design.">
      <Stack>
        <Stack gap="snug">
          <Eyebrow>Radius</Eyebrow>
          <Row wrap>
            {RADII.map((r) => (
              <div className="ds-page__radius" key={r.name}>
                <div
                  className="ds-page__radius-swatch"
                  style={{ borderRadius: `var(${r.token})` }}
                />
                <Meta>
                  {r.name} · {r.value}
                </Meta>
              </div>
            ))}
          </Row>
        </Stack>
        <Stack gap="snug">
          <Eyebrow>Shadow</Eyebrow>
          <Row wrap className="ds-page__shadow-row">
            {SHADOWS.map((s) => (
              <div className="ds-page__shadow" key={s.name}>
                <div className="ds-page__shadow-swatch" style={{ boxShadow: `var(${s.token})` }}>
                  <Text size="sm" tone="muted">
                    {s.name}
                  </Text>
                </div>
                <Meta>{s.caption}</Meta>
              </div>
            ))}
          </Row>
        </Stack>
      </Stack>
    </PageSection>
  );
}

/* ───────────────────────── Spacing ───────────────────────── */

const SPACING = [1, 2, 3, 4, 5, 6, 8, 10, 12];

function SpacingSection() {
  return (
    <PageSection title="Spacing" caption="4px base. Use --runner-space-1..12 — no arbitrary values.">
      <div className="ds-page__spacing">
        {SPACING.map((n) => (
          <div className="ds-page__spacing-row" key={n}>
            <Meta className="ds-page__spacing-label">space-{n}</Meta>
            <div className="ds-page__spacing-bar" style={{ width: `var(--runner-space-${n})` }} />
            <Meta>{n * 4}px</Meta>
          </div>
        ))}
      </div>
    </PageSection>
  );
}

/* ───────────────────────── Chips ───────────────────────── */

function ChipSection() {
  return (
    <PageSection title="Chip" caption="Pills for type labels, status badges, kind indicators.">
      <Row wrap>
        <Chip>Default</Chip>
        <Chip tone="neutral">Neutral</Chip>
        <Chip tone="accent">Accent</Chip>
        <Chip tone="info" icon={<Bell size={11} />}>
          Info
        </Chip>
        <Chip tone="success" icon={<CheckCircle2 size={11} />}>
          Success
        </Chip>
        <Chip tone="destructive">Destructive</Chip>
        <Chip tone="outline">Outline</Chip>
      </Row>
    </PageSection>
  );
}

/* ───────────────────────── Buttons ───────────────────────── */

function ButtonSection() {
  return (
    <PageSection title="Button" caption="Default, primary, ghost, outline. 28px height.">
      <Row wrap>
        <Button>Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button disabled>Disabled</Button>
        <Button iconOnly variant="outline" aria-label="More">
          <ChevronDown size={14} />
        </Button>
      </Row>
    </PageSection>
  );
}

/* ───────────────────────── Cards ───────────────────────── */

function CardSection() {
  return (
    <PageSection title="Card" caption="Three visual weights — heavy, medium, light. Match weight to operational importance.">
      <Stack>
        <Card weight="heavy">
          <Stack gap="tight">
            <Row justify="between">
              <Chip tone="accent">Heavy</Chip>
              <Meta>--shadow-minimal · border foreground-20</Meta>
            </Row>
            <Heading size="md">Operational item</Heading>
            <Text tone="muted">Used for items Runner is actively carrying. Strongest visual weight.</Text>
          </Stack>
        </Card>
        <Card weight="medium">
          <Stack gap="tight">
            <Row justify="between">
              <Chip tone="info">Medium</Chip>
              <Meta>border foreground-10</Meta>
            </Row>
            <Heading size="md">Recurring operation</Heading>
            <Text tone="muted">Standing procedures. Procedural feel, not urgent by default.</Text>
          </Stack>
        </Card>
        <Card weight="light">
          <Stack gap="tight">
            <Row justify="between">
              <Chip tone="neutral">Light</Chip>
              <Meta>foreground-1.5 bg · border foreground-5</Meta>
            </Row>
            <Heading size="md">Lightweight support</Heading>
            <Text tone="muted">Low-custody utilities. Visually quieter than the others.</Text>
          </Stack>
        </Card>
      </Stack>
    </PageSection>
  );
}

/* ───────────────────────── Fields ───────────────────────── */

function FieldSection() {
  return (
    <PageSection title="Field" caption='Labeled blocks for expanded cards. The "needs you" emphasis variant is amber-tinted.'>
      <Stack>
        <Field label="Runner is working">
          Drafting agenda and risk sections from calendar invite, launch notes, and Figma comments.
        </Field>
        <Field label="Output">Brief with agenda, risks, open questions, and suggested talking points.</Field>
        <Field label="Needs you" emphasis="accent">
          Choose opening frame: customer urgency or technical risk.
        </Field>
        <Field label="Preview">
          <PreviewList items={["Jacket", "Laptop charger", "Sketchbook", "Dinner outfit"]} />
        </Field>
      </Stack>
    </PageSection>
  );
}

/* ───────────────────────── SourceChip ───────────────────────── */

function SourceChipSection() {
  const sample = [
    { kind: "calendar" as const, label: "Mon 2pm · Design review", meta: "Invite" },
    { kind: "google-doc" as const, label: "Q3 launch notes" },
    { kind: "figma" as const, label: "Hero comp v3" },
    { kind: "google-doc" as const, label: "Design doc — Maya's comment", meta: "Reply pending" },
  ];
  return (
    <PageSection
      title="Sources"
      caption="Three visual densities. Cluster for compact cards (icons only). List for expanded cards (icon + label + meta). Chip for inline/legacy use."
    >
      <Stack>
        <Stack gap="snug">
          <Eyebrow>Cluster (compact, icon-only)</Eyebrow>
          <Card weight="medium">
            <Row>
              <Meta>Looking at</Meta>
              <SourceCluster sources={sample} max={5} />
            </Row>
          </Card>
        </Stack>
        <Stack gap="snug">
          <Eyebrow>List (expanded, labeled rows)</Eyebrow>
          <Card weight="medium">
            <SourceList sources={sample} />
          </Card>
        </Stack>
        <Stack gap="snug">
          <Eyebrow>Chip (inline)</Eyebrow>
          <Row wrap>
            <SourceChip kind="calendar" label="Mon 2pm · Design review" meta="Invite" />
            <SourceChip kind="email" label="Re: pricing follow-up" meta="3 days quiet" />
            <SourceChip kind="logfire" label="Logfire · kaivbs@gmail.com" meta="2.4M tokens" />
            <SourceChip kind="linkedin" label="Search · SF, 5y" meta="12 results" />
            <SourceChip kind="slack" label="#escalations" />
            <SourceChip kind="obsidian" label="Travel points guide" />
            <SourceChip kind="google-slides" label="OG Summit 2026" meta="v7" />
            <SourceChip kind="phone" label="iMessage · SMS inbox" />
            <SourceChip kind="mcp" label="Memory MCP" />
            <SourceChip kind="person" label="Mitt Mehta" />
          </Row>
        </Stack>
        <Stack gap="snug">
          <Eyebrow>LaneBlock (legacy combined view)</Eyebrow>
          <Card weight="medium">
            <LaneBlock
              label="Runner is working"
              summary="Drafting the agenda and risk sections."
              sources={sample}
            />
          </Card>
        </Stack>
      </Stack>
    </PageSection>
  );
}

/* ───────────────────────── Needs-you stack ───────────────────────── */

function NeedsStackSection() {
  return (
    <PageSection
      title="Needs-you stack"
      caption="Container for one or more decisions/approvals. Each item is a mini-card with its own actions."
    >
      <Card weight="medium">
        <Stack>
          <NeedsStack
            cards={[
              {
                kind: "approval",
                title: "Confirm slide 23 title",
                body: '“Learnings from spending 100B tokens in 45 days” — keep as-is or trim?',
                actions: [
                  { label: "Keep", variant: "primary" },
                  { label: "Suggest trim", variant: "default" },
                ],
              },
              {
                kind: "decision",
                title: "Drop “Choose your own adventure” slide?",
                body: "Move to a 1-liner on the Thank-you slide.",
                options: ["Drop", "Keep as standalone"],
                actions: [
                  { label: "Drop", variant: "primary" },
                  { label: "Keep", variant: "ghost" },
                ],
              },
              {
                kind: "review",
                title: "Title page composition",
                body: "Right: app screenshot. Left: Runner logo + framework line + OG Summit 2026.",
                actions: [
                  { label: "Looks good", variant: "primary" },
                  { label: "Edit", variant: "default" },
                ],
              },
            ]}
          />
        </Stack>
      </Card>
    </PageSection>
  );
}

/* ───────────────────────── Slide artifacts ───────────────────────── */

function SlideArtifactSection() {
  return (
    <PageSection
      title="Slide artifact"
      caption="A staged change rendered as the slide itself. Three modes: edit-title (in-slide track changes), remove (hatched overlay + destination preview), new (corner pill + replaces note)."
    >
      <Stack>
        <Stack gap="snug">
          <Eyebrow>Edit-title — in-slide track changes</Eyebrow>
          <Card weight="medium">
            <ArtifactView
              artifact={{
                kind: "slide",
                deck: { name: "OG Summit 2026", slideNumber: 23, totalSlides: 28, version: "v7" },
                layout: "title-content",
                theme: "white",
                title: "Learnings from spending 100B tokens in 45 days",
                bullets: [
                  "What the spend bought us",
                  "What we'd cut in hindsight",
                  "Where the next 100B goes",
                ],
                staging: { mode: "edit-title", oldTitle: "Make agents work for your team" },
              }}
            />
          </Card>
        </Stack>

        <Stack gap="snug">
          <Eyebrow>Remove — overlay + destination preview</Eyebrow>
          <Card weight="medium">
            <ArtifactView
              artifact={{
                kind: "slide",
                deck: { name: "OG Summit 2026", slideNumber: 18, totalSlides: 28, version: "v7" },
                layout: "title-content",
                theme: "white",
                title: "Choose your own adventure",
                bullets: [
                  "Workshop tomorrow with Bethany",
                  "The tool is less important than the thinking",
                  "What do you want to accomplish?",
                  "What data + context is needed?",
                ],
                staging: {
                  mode: "remove",
                  destination: {
                    slideNumber: 28,
                    title: "Thank you",
                    addedLine: "More on the workshop tomorrow with Bethany — find me after.",
                  },
                },
              }}
            />
          </Card>
        </Stack>

        <Stack gap="snug">
          <Eyebrow>New layout — title-image with brand theme</Eyebrow>
          <Card weight="medium">
            <ArtifactView
              artifact={{
                kind: "slide",
                deck: { name: "OG Summit 2026", slideNumber: 1, totalSlides: 28, version: "v7" },
                layout: "title-image",
                theme: "brand",
                title: "Runner",
                subtitle: "Framework for AI productivity · OG Summit 2026",
                rightImage: { shape: "phone", label: "mobile app" },
                staging: {
                  mode: "new",
                  replaces: { label: "v6 title page", note: "removed date/time/duration block" },
                },
              }}
            />
          </Card>
        </Stack>
      </Stack>
    </PageSection>
  );
}

/* ───────────────────────── Lane indicators ───────────────────────── */

function LaneSection() {
  return (
    <PageSection title="Lane indicator" caption="Inline indicators for operational card lanes. Needs-you uses --info-text.">
      <Row wrap>
        <Lane kind="working" label="Working" icon={<Activity size={12} />} />
        <Lane kind="watching" label="Watching" icon={<Eye size={12} />} />
        <Lane kind="needs-you" label="Needs you" icon={<User size={12} />} />
        <Lane kind="waiting" label="Waiting" icon={<Clock size={12} />} />
        <Lane kind="done" label="Done" icon={<CheckCircle2 size={12} />} />
      </Row>
      <Stack gap="snug">
        <Eyebrow>Other family icons</Eyebrow>
        <Row wrap>
          <Lane kind="working" label="Repeat" icon={<Repeat size={12} />} />
          <Lane kind="working" label="Checklist" icon={<ListChecks size={12} />} />
          <Lane kind="working" label="Calendar" icon={<Calendar size={12} />} />
        </Row>
      </Stack>
    </PageSection>
  );
}

/* ───────────────────────── Page chrome ───────────────────────── */

function PageSection({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  return (
    <Section title={title} caption={caption} className="ds-page__section">
      {children}
    </Section>
  );
}

function FooterNote() {
  return (
    <div className="ds-page__footer">
      <Stack gap="snug">
        <Eyebrow>Using the design system</Eyebrow>
        <Text tone="muted" size="sm">
          Import primitives from <code className="ds-page__code">src/design-system/primitives</code> and wrap your page in
          <code className="ds-page__code">&lt;DSRoot&gt;</code>. Stick to the 6-color palette and mix variants — no arbitrary
          colors. Stick to <code className="ds-page__code">--runner-space-*</code> for spacing and{" "}
          <code className="ds-page__code">--runner-radius-*</code> for radius. Match card weight to operational importance.
        </Text>
      </Stack>
    </div>
  );
}
