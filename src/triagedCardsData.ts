/*
 * Mock data for the /triaged-cards prototype.
 *
 * Many examples are modeled on Charlie's actual prompt traffic so the
 * prototype reads against real-feeling work.
 *
 * Operational cards are visually anchored by a live activity ticker — the
 * `activities` array cycles every few seconds, simulating Runner working in
 * real time. Sources are consolidated into a single list (Runner doesn't
 * distinguish "working" vs "watching" — those are modes, not separate
 * sections).
 */

export type LaneKind = "working" | "watching" | "needs-you" | "waiting";

/* ────────────────────────── Source references ────────────────────────── */

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

export interface SourceRef {
  kind: SourceKind;
  label: string;
  meta?: string;
}

/* ─────────────────── Needs-you mini-cards (decisions) ──────────────────── */

export type NeedsYouKind = "decision" | "approval" | "clarification" | "review";

export interface NeedsYouAction {
  label: string;
  variant?: "primary" | "default" | "ghost";
}

/* ───────────────────── Artifacts (inline decision context) ─────────────────────
 *
 * Each NeedsYouCard can carry an artifact — the actual material the user
 * needs to look at to decide. Rendered inline inside the card, between body
 * and actions. Kind drives the visual treatment. */

export type Artifact =
  | EmailArtifact
  | DiffArtifact
  | SlideArtifact
  | DistributionArtifact
  | OptionsArtifact
  | DraftsArtifact
  | FlightArtifact;

export interface EmailArtifact {
  kind: "email";
  from?: string;
  to?: string;
  subject?: string;
  body: string;
}

export interface DiffArtifact {
  kind: "diff";
  before: string;
  after: string;
  label?: string;
}

export interface SlideArtifact {
  kind: "slide";
  /** Deck chrome — appears around the slide like real PowerPoint metadata. */
  deck?: {
    name: string;
    slideNumber: number;
    totalSlides: number;
    /** Optional version label, e.g. "v7" — shown next to deck name. */
    version?: string;
  };
  /** Composition. Defaults to "title-content". */
  layout?: "title-content" | "title-image" | "title-only";
  /**
   * Visual theme:
   *  - "white" — plain white slide (default)
   *  - "brand" — Runner-branded slide (terracotta accent rail + light tint)
   *  - "dark"  — dark slide for hero/title pages
   */
  theme?: "white" | "brand" | "dark";
  /** Main title. Rendered at presentation-size weight. */
  title?: string;
  /** Subtitle under the title. */
  subtitle?: string;
  /** Bulleted body for title-content layout. */
  bullets?: string[];
  /** Right-side visual for title-image layout. Rendered as a placeholder shape. */
  rightImage?: {
    shape: "phone" | "screenshot" | "photo" | "logo";
    label?: string;
  };
  /**
   * Staging treatment. Drives the visible "this slide is being changed"
   * affordance — title-edit shows track-changes inside the slide, remove
   * overlays a deletion treatment, new flags it as a fresh layout.
   */
  staging?: SlideStaging;
  /** Optional muted caption below the slide. */
  caption?: string;
}

export type SlideStaging =
  | { mode: "edit-title"; oldTitle: string }
  | {
      mode: "remove";
      reason?: string;
      /** Where the dropped content goes — rendered as a small adjacent slide. */
      destination?: {
        slideNumber: number;
        title: string;
        addedLine: string;
      };
    }
  | {
      mode: "new";
      /** Previous version that this slide replaces — small thumbnail. */
      replaces?: { label: string; note?: string };
    };

export interface DistributionArtifact {
  kind: "distribution";
  unit?: string;
  values: Array<{
    label: string;
    value: string;
    fraction: number; // 0–1
    flagged?: boolean;
  }>;
}

export interface OptionsArtifact {
  kind: "options";
  options: Array<{
    label: string;
    headline?: string;
    bullets?: string[];
    recommended?: boolean;
  }>;
}

export interface DraftsArtifact {
  kind: "drafts";
  drafts: Array<{
    to: string;
    preview: string;
  }>;
  remaining?: number;
}

export interface FlightArtifact {
  kind: "flight";
  legs: Array<{
    label: string; // "Outbound" / "Return"
    date: string; // "Wed · May 18"
    carrier: string; // "UA 1238"
    from: { code: string; time: string };
    to: { code: string; time: string };
    duration: string; // "5h 27m"
    stops: string; // "Nonstop" / "1 stop · DEN"
  }>;
  pricing: {
    points: { headline: string; bullets: string[]; recommended?: boolean };
    cash: { headline: string; bullets: string[]; recommended?: boolean };
  };
}

export interface NeedsYouCard {
  kind: NeedsYouKind;
  title: string;
  body?: string;
  options?: string[];
  artifact?: Artifact;
  actions: NeedsYouAction[];
}

/* ──────────────────────── Card families ──────────────────────── */

export type ActivityMode = "working" | "watching" | "waiting";

export interface OperationalCard {
  id: string;
  family: "operational";
  title: string;
  /**
   * Mode of the work. Used to drive optional visual tone (e.g. waiting feels
   * more muted than working). The verb in `state` also implicitly carries it.
   */
  mode: ActivityMode;
  /**
   * Whether Runner is actively executing work on this packet right now —
   * making queries, drafting, editing — as opposed to held / watching / ready.
   * Surfaces as a static "Active" chip at the top of the card.
   * Independent of `needsYou` (a card can be Active AND need user input).
   */
  active?: boolean;
  /**
   * Seconds since Runner started this active run. The card's Active chip
   * ticks up from this seed every second — real elapsed time, not animation.
   * Only consulted when `active === true`.
   */
  activeSinceSeconds?: number;
  /**
   * Literal description of the tool call / operation Runner is on right now.
   * Shown only in the expanded view, only when `active === true`. Distinct
   * from `state` (narrative): this is the immediate operation, e.g.
   * "Querying Logfire · rananl@betterspeech.com".
   *
   * Pass a single string for a static operation, or an array of strings to
   * cycle through. The cycle represents Runner moving through a sequence of
   * real distinct operations (next user, next company, next slide) — same
   * verb, rotating target. In a real implementation each entry would be
   * appended live by the agent's tool-call log.
   */
  currentOperation?: string | string[];
  /**
   * The answer to "what are you working on right now?" — a single concrete
   * sentence describing the current state of the work. Past-tense progress
   * plus what it's holding for or working on next. No animation, no ticker.
   *
   *   ✓ "Drafted agenda from 4 sources — holding for your framing decision."
   *   ✓ "Pulled traces for 3 of 4 users — querying the last."
   *   ✗ "Drafting…" then "Reading…" cycling like a chatbot.
   */
  state: string;
  /** All sources Runner is touching — drives compact icon cluster + expanded list. */
  sources: SourceRef[];
  /** Hero block in the expanded card. Mini-cards stack inside an amber container. */
  needsYou?: NeedsYouCard[];
  /** Optional explicit waiting condition shown in the expanded footer. */
  waitingOn?: string;
  /**
   * Monitor block — what Runner is watching for + recent observations. Shown
   * in the expanded view for watching-mode cards. Distinct from `sources`
   * (the actual objects) — this describes the *watch* on those objects.
   */
  watch?: WatchBlock;
  /** Footer line: what Runner will produce. */
  output: string;
  /** Footer line: what happens next. */
  next: string;
}

export interface WatchBlock {
  /** Signals Runner is monitoring for. Each becomes a bulleted row. */
  watchingFor: string[];
  /** Recent observations / activity log, newest last. */
  activity?: Array<{ when: string; text: string }>;
  /** Display string for the most recent check. */
  lastCheck?: string;
  /** Display string for the next scheduled check. */
  nextCheck?: string;
  /** What happens if the watch trigger fires. */
  escalation?: string;
}

export interface RecurringCard {
  id: string;
  family: "recurring";
  title: string;
  headline: string;
  summary: string;
  nextRun: string;
  lastRun: string;
  expanded: {
    runs: string;
    checks: string;
    produces: string;
    lastRun: string;
    nextRun: string;
    approvalBoundary?: string;
    sources?: SourceRef[];
  };
}

export interface LightweightCard {
  id: string;
  family: "lightweight";
  title: string;
  /** One-line meta — count, persistence, source, etc. Optional. */
  meta?: string;
  /** The actual list. Shown in full — no truncation. */
  items: string[];
}

export type TriagedCard = OperationalCard | RecurringCard | LightweightCard;

/* ──────────────────────── Operational cards ──────────────────────── */

export const OPERATIONAL: OperationalCard[] = [
  {
    id: "op-design-review-brief",
    family: "operational",
    title: "Prepare design review brief",
    mode: "working",
    state:
      "Drafted agenda and risk sections from 4 sources — holding for your framing decision before finalizing.",
    sources: [
      { kind: "calendar", label: "Mon 2pm · Design review", meta: "Invite" },
      { kind: "google-doc", label: "Q3 launch notes" },
      { kind: "figma", label: "Hero comp v3" },
      { kind: "google-doc", label: "Design doc — Maya's comment", meta: "Reply pending" },
    ],
    needsYou: [
      {
        kind: "decision",
        title: "Choose opening frame",
        body: "Two framings, drafted side-by-side. Pick the one that lands best with this room.",
        artifact: {
          kind: "options",
          options: [
            {
              label: "Customer urgency",
              headline: "Center user pain",
              bullets: [
                "Shorter narrative · 2 risks",
                "Opens: “Customers are losing 40 min/day on the manual flow…”",
                "Lands with PM / GTM-leaning attendees",
              ],
            },
            {
              label: "Technical risk",
              headline: "Center engineering debt",
              bullets: [
                "Longer narrative · 4 risks",
                "Opens: “Three risks if we don't ship the refactor by Q3…”",
                "Lands with Maya and the platform crew",
              ],
            },
          ],
        },
        actions: [
          { label: "Choose framing", variant: "primary" },
          { label: "Defer", variant: "ghost" },
        ],
      },
    ],
    output: "Brief with agenda, risks, open questions, and suggested talking points.",
    next: "Runner can prepare a partial brief now and update it when Maya responds.",
  },
  {
    id: "op-lucas-monitor",
    family: "operational",
    title: "Waiting for Lucas's reply",
    mode: "watching",
    state:
      "Watching the email thread — quiet 3 days. Drafting a backup follow-up to send if no reply by Friday 5 PM.",
    sources: [{ kind: "email", label: "Re: pricing follow-up", meta: "3 days quiet" }],
    watch: {
      watchingFor: [
        "A reply on the thread",
        "An out-of-office auto-reply",
        "Mentions of Lucas in connected channels",
      ],
      activity: [
        { when: "3 days ago", text: "Started watching after your last reply" },
        { when: "2 days ago", text: "Lucas opened the thread (no reply)" },
        { when: "1 day ago", text: "Lucas posted in Slack #pricing (unrelated)" },
        { when: "12 min ago", text: "Polled · no change" },
      ],
      lastCheck: "12 min ago",
      nextCheck: "in 8 min",
      escalation: "Friday 5 PM → draft follow-up",
    },
    waitingOn: "No response by Friday at 5 PM.",
    output: "Either a reply lands, or Runner produces a follow-up draft for review.",
    next: "If the deadline passes, Runner drafts the follow-up. No action needed until then.",
  },
  {
    id: "op-lucas-followup",
    family: "operational",
    title: "Follow-up to Lucas ready",
    mode: "working",
    state:
      "Drafted a follow-up from the original thread, tuned to your past replies. Awaiting your approval before send.",
    sources: [{ kind: "email", label: "Original thread with Lucas" }],
    needsYou: [
      {
        kind: "approval",
        title: "Approve follow-up email",
        body: "Drafted from the original thread, tuned to your past replies.",
        artifact: {
          kind: "email",
          from: "charlie@runner.now",
          to: "lucas@stonebridge.io",
          subject: "Re: Pricing — checking in",
          body:
            "Hey Lucas,\n\nCircling back on pricing — wanted to make sure my note didn't get lost. Happy to jump on a 15-min call this week if it's easier than email; let me know what works.\n\nBest,\nCharlie",
        },
        actions: [
          { label: "Send as-is", variant: "primary" },
          { label: "Edit", variant: "default" },
          { label: "Defer", variant: "ghost" },
        ],
      },
    ],
    output: "Follow-up email sent to Lucas.",
    next: "Sends only after approval.",
  },
  {
    id: "op-token-spend-audit",
    family: "operational",
    title: "Token-spend audit · 4 users",
    mode: "working",
    active: true,
    activeSinceSeconds: 47,
    currentOperation: [
      "Querying Logfire · kaivbs@gmail.com",
      "Querying Logfire · avedissian9@gmail.com",
      "Querying Logfire · rananl@betterspeech.com",
      "Querying Logfire · andra@andraarnold.com",
    ],
    state:
      "Pulled Logfire traces for 3 of 4 users — querying rananl now. Flagged kaivbs as 3× median; holding on outlier handling.",
    sources: [
      { kind: "logfire", label: "Logfire · kaivbs@gmail.com", meta: "2.4M tokens" },
      { kind: "logfire", label: "Logfire · avedissian9@gmail.com", meta: "1.9M tokens" },
      { kind: "logfire", label: "Logfire · andra@andraarnold.com", meta: "780K tokens" },
      { kind: "logfire", label: "Logfire · rananl@betterspeech.com", meta: "1.2M tokens" },
    ],
    needsYou: [
      {
        kind: "clarification",
        title: "Outlier handling",
        body: "kaivbs is ~3× the median. Treat as outlier or include in baseline?",
        artifact: {
          kind: "distribution",
          unit: "tokens · last 5 days",
          values: [
            { label: "kaivbs@gmail.com", value: "2.4M", fraction: 1, flagged: true },
            { label: "rananl@betterspeech.com", value: "1.2M", fraction: 0.5 },
            { label: "avedissian9@gmail.com", value: "850K", fraction: 0.35 },
            { label: "andra@andraarnold.com", value: "780K", fraction: 0.33 },
          ],
        },
        actions: [
          { label: "Treat as outlier", variant: "primary" },
          { label: "Include in baseline", variant: "default" },
        ],
      },
    ],
    output: "Per-user breakdown with tool-call patterns, prompt sizes, and outliers flagged.",
    next: "Once outlier handling is set, Runner produces the summary in one pass.",
  },
  {
    id: "op-og-summit-deck",
    family: "operational",
    title: "OG Summit deck — final pass",
    mode: "working",
    state:
      "Edited slides 6, 23, and the title page from your notes. 3 decisions left before export.",
    sources: [
      { kind: "google-slides", label: "OG Summit 2026", meta: "v7" },
      { kind: "image", label: "Mobile app screenshot", meta: "title slide" },
      { kind: "obsidian", label: "Talk outline", meta: "speaker notes" },
    ],
    needsYou: [
      {
        kind: "approval",
        title: "Confirm slide 23 title",
        body: "Keep the rewrite, or trim it tighter?",
        artifact: {
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
        },
        actions: [
          { label: "Keep", variant: "primary" },
          { label: "Suggest trim", variant: "default" },
        ],
      },
      {
        kind: "decision",
        title: "Drop “Choose your own adventure” slide?",
        body: "Content moves to a 1-liner on the Thank-you slide, per your earlier note.",
        artifact: {
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
        },
        actions: [
          { label: "Drop", variant: "primary" },
          { label: "Keep", variant: "ghost" },
        ],
      },
      {
        kind: "review",
        title: "Title page composition",
        body: "Mockup ready for review.",
        artifact: {
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
        },
        actions: [
          { label: "Looks good", variant: "primary" },
          { label: "Edit", variant: "default" },
        ],
      },
    ],
    output: "Updated Google Slides deck ready to import.",
    next: "Runner exports a .pptx once decisions are confirmed.",
  },
  {
    id: "op-toronto-trip",
    family: "operational",
    title: "Toronto trip · SFO ↔ YYZ",
    mode: "working",
    state:
      "Compared May 18 and 19 United options; watching UA 1238 for a price drop. Holding on your points-vs-cash choice.",
    sources: [
      { kind: "email", label: "Gmail · flight history", meta: "past 2y" },
      { kind: "obsidian", label: "Travel points guide" },
      { kind: "browser", label: "United · SFO→YYZ search" },
      { kind: "browser", label: "UA 1238 · $899 RT", meta: "watching for drop" },
    ],
    needsYou: [
      {
        kind: "decision",
        title: "Lock in Wed AM, $899 round-trip?",
        body: "Both legs nonstop, arrival before your 4 PM ET cutoff.",
        artifact: {
          kind: "flight",
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
          pricing: {
            points: {
              headline: "40,000 MP + $80",
              bullets: [
                "Effective: 2.05¢ per point",
                "Saves $819 vs cash",
                "~½ of your current MP balance",
              ],
            },
            cash: {
              headline: "$899 round-trip",
              bullets: [
                "Earns 2,247 MileagePlus",
                "Preserves points for premium cabins",
                "Better year-end card balance",
              ],
              recommended: true,
            },
          },
        },
        actions: [
          { label: "Book with cash", variant: "primary" },
          { label: "Book with points", variant: "default" },
          { label: "Wait for drop", variant: "ghost" },
        ],
      },
    ],
    output: "Booked flight + Google Calendar block for travel.",
    next: "Runner books after your call and adds calendar holds for both legs.",
  },
  {
    id: "op-recruiting-search",
    family: "operational",
    title: "Recruiting · SF engineers",
    mode: "working",
    state:
      "Drafted 5 personalized LinkedIn notes from your SF, 5-year, blue-check search. Awaiting your review before send.",
    sources: [
      { kind: "linkedin", label: "Search · SF, 5y, blue-check", meta: "12 results" },
      { kind: "person", label: "Mitt Mehta" },
      { kind: "person", label: "Debbie Cohen Rosler" },
      { kind: "person", label: "Daniel Kivatinos" },
    ],
    needsYou: [
      {
        kind: "review",
        title: "Review 5 LinkedIn outreach drafts",
        body: "Short, personalized — first two below, +3 more inside.",
        artifact: {
          kind: "drafts",
          drafts: [
            {
              to: "Mitt Mehta · Stripe → fractional CFO",
              preview:
                "Hi Mitt — saw your recent post on consolidating back-office for early-stage founders. Building Runner along similar lines; would love 20 minutes to compare notes…",
            },
            {
              to: "Debbie Cohen Rosler · Operator turned advisor",
              preview:
                "Hey Debbie — really enjoyed your essay on the “quiet operator” archetype. We're working on tools to make that style scale; quick chat sometime?",
            },
          ],
          remaining: 3,
        },
        actions: [
          { label: "Review all", variant: "primary" },
          { label: "Approve all", variant: "default" },
          { label: "Regenerate", variant: "ghost" },
        ],
      },
    ],
    output: "5 LinkedIn connect drafts (one per match).",
    next: "Sends only after approval — Runner does not send without review.",
  },
  {
    id: "op-death-of-saas",
    family: "operational",
    title: "“Death of SaaS” market analysis",
    mode: "working",
    active: true,
    activeSinceSeconds: 252,
    currentOperation: [
      "Tagging sector · Salesforce",
      "Tagging sector · Microsoft",
      "Tagging sector · Adobe",
      "Tagging sector · Workday",
      "Tagging sector · ServiceNow",
      "Tagging sector · HubSpot",
    ],
    state:
      "Pulled NASDAQ and S&P 500 listings; tagging companies by sector (1,800 of ~3,900 so far). Holding on revenue-vs-market-cap proxy.",
    sources: [
      { kind: "spreadsheet", label: "NASDAQ listings", meta: "3,400 rows" },
      { kind: "spreadsheet", label: "S&P 500 listings" },
      { kind: "browser", label: "SEC EDGAR · 10-K filings" },
    ],
    needsYou: [
      {
        kind: "clarification",
        title: "Use revenue or market cap as the SaaS proxy?",
        body: "Both produce different breakdowns. Pick the lens that matches the memo you want.",
        artifact: {
          kind: "options",
          options: [
            {
              label: "Revenue",
              headline: "More accurate, slower",
              bullets: [
                "Measures actual SaaS exposure",
                "Needs 10-Q parsing per company",
                "Asana lands at ~92% SaaS",
              ],
            },
            {
              label: "Market cap",
              headline: "Fast, noisier",
              bullets: [
                "Uses listing data — no filings",
                "Speculative companies skew higher",
                "Asana lands at ~65% SaaS",
              ],
            },
          ],
        },
        actions: [
          { label: "Use revenue", variant: "primary" },
          { label: "Use market cap", variant: "default" },
        ],
      },
    ],
    output: "Sector breakdown + 1-page memo with macro POV.",
    next: "Runner produces the chart and memo once the proxy is chosen.",
  },
];

/* ──────────────────────── Recurring cards ──────────────────────── */

export const RECURRING: RecurringCard[] = [
  {
    id: "rec-morning-brief",
    family: "recurring",
    title: "Morning attention brief",
    headline: "Runs weekdays 8:30 AM",
    summary: "Checks calendar, email, active items, and monitors",
    nextRun: "Tomorrow · 8:30 AM",
    lastRun: "Found 3 items",
    expanded: {
      runs: "Every weekday at 8:30 AM.",
      checks: "Calendar, important email, active operational items, and monitors.",
      produces: "A morning brief plus review items when judgment is needed.",
      lastRun: "Found 2 replies, 1 stale waiting item, and 1 meeting needing prep.",
      nextRun: "Tomorrow at 8:30 AM.",
      approvalBoundary:
        "Runner can draft replies, but will not send messages or modify calendar events without review.",
      sources: [
        { kind: "calendar", label: "Google Calendar" },
        { kind: "email", label: "Gmail · primary" },
        { kind: "slack", label: "Slack · @mentions" },
      ],
    },
  },
  {
    id: "rec-weekly-escalation",
    family: "recurring",
    title: "Weekly escalation review",
    headline: "Runs Mondays 9 AM",
    summary: "Checks escalation channels and unresolved support threads",
    nextRun: "Monday · 9 AM",
    lastRun: "3 issues · 1 needs review",
    expanded: {
      runs: "Every Monday at 9 AM.",
      checks: "Customer escalation channels and unresolved support threads.",
      produces: "Escalation report and suggested follow-ups.",
      lastRun: "Found 3 issues; 1 requiring review.",
      nextRun: "Monday at 9 AM.",
      approvalBoundary:
        "Runner drafts customer responses but does not send them; all follow-ups require explicit approval.",
      sources: [
        { kind: "slack", label: "Slack · #escalations" },
        { kind: "linear", label: "Linear · Support project" },
        { kind: "email", label: "Gmail · support@" },
      ],
    },
  },
  {
    id: "rec-ea-bot",
    family: "recurring",
    title: "/ea-bot · SMS inbox triage",
    headline: "Runs every 3 hours",
    summary: "Processes inbound SMS into draft replies and follow-ups",
    nextRun: "In 22 minutes",
    lastRun: "2:17 AM · 1 message processed",
    expanded: {
      runs: "Every 3 hours, all day.",
      checks: "SMS inbox, last processed timestamp, contact graph.",
      produces: "Draft replies, calendar holds, or escalations into operational items.",
      lastRun: "Processed 1 message from Cyrus; drafted a reply.",
      nextRun: "In 22 minutes.",
      approvalBoundary: "Drafts only. No SMS is sent without your approval.",
      sources: [
        { kind: "phone", label: "iMessage · SMS inbox" },
        { kind: "person", label: "Contact graph" },
      ],
    },
  },
  {
    id: "rec-memory-review",
    family: "recurring",
    title: "/memory-review",
    headline: "Runs daily · 10 PM",
    summary: "Audits memory store for staleness, contradictions, and gaps",
    nextRun: "Tonight · 10 PM",
    lastRun: "Yesterday · 3 stale memories",
    expanded: {
      runs: "Every night at 10 PM.",
      checks: "Memory store for stale facts, contradictions, and unresolved gaps.",
      produces: "A review report; promotes flagged items into operational review cards.",
      lastRun: "Flagged 3 stale memories and 1 contradiction.",
      nextRun: "Tonight at 10 PM.",
      approvalBoundary: "Suggests changes; does not edit memory directly.",
      sources: [
        { kind: "mcp", label: "Memory MCP" },
        { kind: "obsidian", label: "Obsidian vault" },
      ],
    },
  },
  {
    id: "rec-heartbeat",
    family: "recurring",
    title: "Heartbeat check",
    headline: "Runs hourly",
    summary: "Verifies all MCPs, schedulers, and integrations are healthy",
    nextRun: "In 46 minutes",
    lastRun: "14 minutes ago · 0 issues",
    expanded: {
      runs: "Every hour, top of the hour.",
      checks: "Connected MCPs, scheduled jobs, integration auth tokens.",
      produces: "A 1-line health line, or an operational item if something is unhealthy.",
      lastRun: "All systems healthy. 12 MCPs connected, 6 schedulers running.",
      nextRun: "In 46 minutes.",
      sources: [{ kind: "mcp", label: "All connected MCPs" }],
    },
  },
];

/* ──────────────────────── Lightweight cards ──────────────────────── */

export const LIGHTWEIGHT: LightweightCard[] = [
  {
    id: "lw-packing-nyc",
    family: "lightweight",
    title: "Packing for New York",
    meta: "Expires after trip",
    items: [
      "Jacket",
      "Laptop charger",
      "Sketchbook",
      "Dinner outfit",
      "Running shoes",
      "Sunglasses",
      "Phone charger",
      "Headphones",
      "Toothbrush",
      "Notebook + pens",
      "Business cards",
      "Umbrella",
      "Snack bars",
      "Reusable bottle",
    ],
  },
  {
    id: "lw-office-shopping",
    family: "lightweight",
    title: "Office shopping list",
    meta: "Shared · saved",
    items: ["Coffee filters", "Oat milk", "Paper towels", "Whiteboard markers"],
  },
  {
    id: "lw-post-og-followups",
    family: "lightweight",
    title: "Post-OG Summit followups",
    meta: "Saved",
    items: [
      "Casey — FOG allocation chat",
      "Molly — advisory + invest conversation",
      "Cyrus — accounting followup",
      "Sameed — swap, find replacement",
    ],
  },
  {
    id: "lw-credit-card-opt",
    family: "lightweight",
    title: "Credit card optimization",
    meta: "Decisions log",
    items: [
      "Apply: United MileagePlus Club",
      "Cancel: AMEX Gold (not used)",
      "Keep: AMEX Plat (personal)",
    ],
  },
  {
    id: "lw-reading",
    family: "lightweight",
    title: "Read later",
    meta: "5 articles · saved",
    items: [
      "Death of SaaS thesis — what to watch next 5 years",
      "Asana 10-K key takeaways",
      "Linear · “Issue tracking is dead” announcement",
      "Jensen Huang on the 5 layers of AI",
      "Network effects in AI — why model providers struggle",
    ],
  },
  {
    id: "lw-ai-tools",
    family: "lightweight",
    title: "AI tools to try",
    meta: "Saved",
    items: [
      "FinalLayer · LinkedIn content automation",
      "Granola · call note alternatives",
      "openclaw · DIY agents",
      "Strava MCP server (local)",
    ],
  },
];
