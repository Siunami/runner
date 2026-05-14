import type { Artifact } from "./data";

export type ActionCardType =
  | "decision"
  | "approval"
  | "clarification"
  | "metadata-suggestion"
  | "informational"
  | "progress"
  | "failure"
  | "follow-up";

export type ActionCardState = "open" | "in-progress" | "resolved";

export type ResolutionKind =
  | "accepted"
  | "rejected"
  | "modified"
  | "dismissed"
  | "superseded"
  | "cancelled"
  | "added";

export interface ActionCardResolution {
  kind: ResolutionKind;
  at: string;
  note?: string;
  chosenOptionId?: string;
}

export interface ProgressMicroEvent {
  id: string;
  text: string;
  ago: string;
}

export interface ProgressInfo {
  label: string;
  step: string;
  percent: number;
  startedAt: string;
  elapsed?: string;
  currently?: string;
  events?: ProgressMicroEvent[];
}

export interface RunnerInputField {
  key: string;
  label: string;
  type?: "text" | "password";
  placeholder?: string;
  helper?: string;
}

export interface RunnerActionCard {
  id: string;
  type: ActionCardType;
  state: ActionCardState;
  title: string;
  why: string;
  evidence?: string;
  whatHappens?: string;
  artifact?: Artifact;
  progress?: ProgressInfo;
  resolution?: ActionCardResolution;
  createdAt: string;
  options?: { id: string; label: string; primary?: boolean }[];
  inputs?: RunnerInputField[];
  submitLabel?: string;
}

export type TodoStatus =
  | "needs-you"
  | "runner-working"
  | "monitoring"
  | "blocked"
  | "stale"
  | "archived";

export type VisibleIcon = "attention" | "blocked" | "waiting";

export type TimeSensitivity =
  | "today"
  | "tomorrow"
  | "this-week"
  | "next-week"
  | "this-month"
  | "none";

export type ProjectKey =
  | "investor"
  | "travel"
  | "platform"
  | "personal"
  | "inbox"
  | "sales"
  | "board"
  | "rent";

export type LabelOrigin = "suggested" | "manual" | "unlabeled";

export type MonitorTriggerKind = "time" | "calendar" | "event";

export interface RunnerTodo {
  id: string;
  title: string;
  status: TodoStatus;
  icon: VisibleIcon;
  project?: string;
  projectKey?: ProjectKey;
  labelOrigin?: LabelOrigin;
  consequence?: string;
  timeSensitivity?: TimeSensitivity;
  runnerStatus: string;
  nextAction?: string;
  source?: string;
  cards: RunnerActionCard[];
  updatedAt: string;
  createdAt: string;
  lastAdvancedNote?: string;
  resolvedAt?: string;
  resolutionKind?: "completed" | "cancelled" | "superseded" | "delegated" | "archived";
  tags?: string[];
  trigger?: string;
  triggerKind?: MonitorTriggerKind;
  nextTrigger?: string;
  deadline?: string;
  paused?: boolean;
  spawnedFromMonitorId?: string;
}

let _uid = 0;
export const uid = (prefix: string) => `${prefix}-${++_uid}`;

const card = (c: Omit<RunnerActionCard, "id"> & { id?: string }): RunnerActionCard => ({
  id: c.id ?? uid("card"),
  ...c,
});

// ──────────────────────────────────────────────────────────────────────────────
// buildSpawnedCards — when the user resolves an open card, this returns the
// follow-up in-progress cards Runner spawns on the same todo. They appear in
// the In progress rail beneath the todo title with a pulsing dot.
// ──────────────────────────────────────────────────────────────────────────────
export interface SpawnContext {
  todoId: string;
  cardId: string;
  kind: ResolutionKind;
  note?: string;
}

const spawn = (title: string, currently: string, percent = 25): RunnerActionCard => ({
  id: uid("spawn"),
  type: "progress",
  state: "in-progress",
  title,
  why: "Triggered by your decision.",
  createdAt: "Just now",
  progress: {
    label: title,
    step: "in flight",
    percent,
    startedAt: "Just now",
    elapsed: "just started",
    currently,
  },
});

export function buildSpawnedCards(ctx: SpawnContext): RunnerActionCard[] {
  if (ctx.kind !== "accepted") return [];
  const note = ctx.note ?? "";
  switch (ctx.todoId) {
    case "todo-investor-update":
      return [
        spawn(
          "Sending April investor update",
          "inlining the chosen chart, then final typo pass + send",
          30,
        ),
      ];
    case "todo-chicago-hotel":
      return [
        spawn(
          `Booking ${note || "selected hotel"} for May 14-17`,
          "filling reservation form + adding to your calendar",
          25,
        ),
      ];
    case "todo-rent-may":
      return [
        spawn(
          "Submitting May rent payment",
          "validating routing # + filing the receipt",
          55,
        ),
      ];
    case "todo-vacation-reply":
      // Truly parallel — one card per Gmail account.
      return [
        spawn(
          "Applying auto-reply to charlie@runner.now",
          "writing IMAP settings",
          55,
        ),
        spawn(
          "Applying auto-reply to charlie@voteagora.com",
          "writing IMAP settings",
          35,
        ),
      ];
    case "todo-expedia-deck":
      return [
        spawn(
          `Inserting ${note || "selected case study"} into slide 6`,
          "fetching logo + metric callout, re-rendering deck",
          35,
        ),
      ];
    case "todo-board-prep":
      return note.toLowerCase().includes("nudge")
        ? [
            spawn(
              "Nudging Maria for the finance pack",
              "drafting a gentle ping in your voice",
              30,
            ),
          ]
        : [
            spawn(
              "Holding until tomorrow AM",
              "watching for the finance pack",
              10,
            ),
          ];
    case "todo-inbox-50":
      return [
        spawn(
          "Sending the 14 drafts + archiving threads",
          "batching 1 of 14",
          7,
        ),
      ];
    case "todo-q1-analytics":
      return [
        spawn(
          "Circulating Q1 analytics memo",
          "rendering email + linking BigQuery queries",
          35,
        ),
      ];
    case "todo-superman-gdoc":
      return [
        spawn(
          `Sharing Superman GDoc with ${note || "selected audience"}`,
          "applying sharing scope + sending kickoff note",
          50,
        ),
      ];
    case "todo-q4-deck":
      return [
        spawn(
          "Finalizing Q4 deck — Next Steps slide",
          "locking layout + cleaning rev history",
          50,
        ),
      ];
    case "todo-gmail-style":
      return [
        spawn(
          "Committing per-account Gmail style profiles",
          "writing both profiles to memory",
          65,
        ),
      ];
    case "todo-yitong-sync":
      return [
        spawn(
          "Scheduling 2pm sync with Yitong",
          "sending Meet invite + adding to your calendar",
          35,
        ),
      ];
    case "todo-fjor-email":
      return [
        spawn(
          "Sending to charlie@fjor.co with FYI label",
          "preparing headers + tagging the thread",
          40,
        ),
      ];
    case "todo-barley-typo":
      return note.toLowerCase().includes("voteagora")
        ? [
            spawn(
              "Updating draft to barley@voteagora.com",
              "rewriting To: field + re-validating recipient",
              45,
            ),
          ]
        : [spawn("Awaiting your manual entry", "draft paused", 10)];
    case "todo-toronto-3bd":
      return [
        spawn(
          "Booking Saturday Toronto showings",
          `confirming with agents for ${note || "selected listings"}`,
          40,
        ),
      ];
    case "todo-apr27-action-items":
      return [
        spawn(
          "Adding Action Items section",
          `inserting at: ${note || "selected location"}`,
          60,
        ),
      ];
    case "todo-drive-tidy":
      return [
        spawn(
          "Applying Drive folder reorg",
          "moving stale folders + merging duplicates",
          45,
        ),
      ];
    case "todo-summer-trip":
      return [
        spawn(
          "Locking summer trip rental options",
          `for new window: ${note || "selected dates"}`,
          35,
        ),
      ];
    case "todo-cal-invite-cross":
      return [
        spawn(
          "Re-running cross-account smoke test",
          "waiting for OAuth handshake",
          25,
        ),
      ];
    default:
      return [];
  }
}

export const SEED_TODOS: RunnerTodo[] = [
  {
    id: "todo-investor-update",
    title: "Draft April investor update",
    status: "needs-you",
    icon: "attention",
    project: "Investor update",
    projectKey: "investor",
    labelOrigin: "suggested",
    consequence:
      "Cannot send until you pick a cover chart. If this slips today, the Friday send window is at risk.",
    timeSensitivity: "today",
    runnerStatus: "Metrics pulled, narrative drafted — waiting on your chart pick.",
    nextAction: "Pick a cover chart",
    source: "Cadence — monthly investor update",
    createdAt: "Yesterday",
    updatedAt: "20m ago",
    cards: [
      card({
        type: "metadata-suggestion",
        state: "resolved",
        title: "Suggested label: Investor update",
        why: "Cadence and shape matched March's update.",
        evidence: "Source: Cadence — monthly investor update.",
        createdAt: "Yesterday 4:10 PM",
        resolution: {
          kind: "accepted",
          at: "Yesterday 4:11 PM",
          note: "Accepted — labeled Investor update.",
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Pulled April metrics from BigQuery",
        why: "Investors expect the same lines they saw in March.",
        evidence: "Source: analytics dataset — ARR, logos, GM, runway.",
        createdAt: "Yesterday 4:12 PM",
        resolution: { kind: "accepted", at: "Yesterday 4:14 PM" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "ARR", value: "$4.6M", trend: "+18% MoM" },
            { label: "Net new logos", value: "42", trend: "+11" },
            { label: "Gross margin", value: "76%", trend: "+1pp" },
            { label: "Cash runway", value: "18 mo", trend: "flat" },
          ],
        },
      }),
      card({
        type: "approval",
        state: "resolved",
        title: "Drafted the narrative",
        why: "Investors want the qualitative story behind the numbers.",
        evidence: "Modeled on March. ~340 words, four short paragraphs.",
        whatHappens: "Becomes the body of the email once the chart is picked.",
        createdAt: "Yesterday 5:30 PM",
        resolution: { kind: "accepted", at: "Yesterday 6:18 PM", note: "Tightened the close paragraph." },
        artifact: {
          kind: "note",
          body:
            "April was the strongest month since launch — ARR crossed $4.6M (+18% MoM) on mid-market expansion. Two larger logos (Acme, Beta) closed. Hiring slowed to a single offer due to focus on the staff-eng search. Outlook for May is steady; June depends on the new pricing rolling cleanly.",
        },
      }),
      card({
        type: "decision",
        state: "open",
        title: "Pick a cover chart for the April update",
        why: "Friday send window at risk if this slips. Two layouts ready — pick one and I'll send.",
        evidence: "Both reviewed in March cadence; A is the continuity choice, B carries more information.",
        whatHappens:
          "I'll inline the chosen chart, run a final typo pass, and send to the board list at the next valid window.",
        createdAt: "Today 9:14 AM",
        artifact: {
          kind: "options",
          intro: "Two cover charts for the update — pick one.",
          options: [
            {
              id: "chart-a",
              title: "Option A — ARR trendline",
              meta: "Single line, 6 months",
              notes: "Cleanest read; mirrors March. Best if you want continuity.",
            },
            {
              id: "chart-b",
              title: "Option B — ARR + Net new logos",
              meta: "Stacked dual-axis",
              notes: "More information density. Highlights logo acceleration.",
            },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-flight-drop-sfo-nrt",
    title: "SFO → NRT dropped 18% — confirm rebook?",
    status: "needs-you",
    icon: "attention",
    project: "Travel",
    projectKey: "travel",
    labelOrigin: "suggested",
    spawnedFromMonitorId: "todo-flight-prices",
    consequence: "Fare dropped overnight to $612 (was $748). Window likely closes by Thursday.",
    timeSensitivity: "today",
    runnerStatus: "Surfaced by flight-price watch — sub-15% drop threshold met for the first time this week.",
    nextAction: "Approve rebook or skip",
    source: "Flight price watch — SFO → NRT (Sep)",
    createdAt: "1h ago",
    updatedAt: "1h ago",
    cards: [
      card({
        type: "approval",
        state: "open",
        title: "Rebook SFO → NRT at $612?",
        why: "18% below the previous fare; matches your watch threshold.",
        evidence: "Same airline + cabin as the current Sep 12 reservation.",
        whatHappens:
          "I'll rebook on the same itinerary, cancel the old reservation, and forward the new confirmation.",
        createdAt: "1h ago",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "New fare", value: "$612", trend: "-18%" },
            { label: "Previous fare", value: "$748" },
            { label: "Travel dates", value: "Sep 12 – Sep 19" },
            { label: "Seats remaining", value: "3" },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-chicago-hotel",
    title: "Pick a Chicago hotel — May 14-17",
    status: "needs-you",
    icon: "attention",
    project: "Travel",
    projectKey: "travel",
    labelOrigin: "manual",
    consequence:
      "Conrad is $45 over the $300/night cap but 4 blocks from the venue. Holding rate guarantee likely lapses tomorrow.",
    timeSensitivity: "today",
    runnerStatus: "Outbound + return flights booked. Three hotel options ready — Conrad needs your call on budget.",
    nextAction: "Pick a hotel",
    source: "Chicago trip — May 14-17",
    createdAt: "3 days ago",
    updatedAt: "1h ago",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Found flights SFO → ORD, May 14",
        why: "You need to be at the venue by 4pm — anything landing before 3 works.",
        createdAt: "3 days ago",
        resolution: { kind: "accepted", at: "2 days ago", note: "Booked UA-2241 nonstop." },
        artifact: {
          kind: "options",
          intro: "Three options that land before 3pm. United nonstop is cleanest.",
          options: [
            {
              id: "ua-2241",
              title: "United UA-2241 — nonstop",
              meta: "May 14 · 08:40 SFO → 14:55 ORD · $362 · aisle 12B",
              notes: "Nonstop, lands 2:55pm. Cheapest of the three.",
            },
            {
              id: "aa-1156",
              title: "American AA-1156 — nonstop",
              meta: "May 14 · 07:15 SFO → 13:25 ORD · $398 · aisle 9C",
              notes: "Earlier arrival, slightly more expensive.",
            },
            {
              id: "dl-5530",
              title: "Delta DL-5530 — 1 stop (MSP)",
              meta: "May 14 · 06:00 SFO → 14:48 ORD · $341 · aisle 14D",
              notes: "Cheapest but tight MSP layover.",
            },
          ],
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Booked return flight ORD → SFO, May 17",
        why: "Saturday evening, per your preference.",
        createdAt: "2 days ago",
        resolution: { kind: "accepted", at: "2 days ago" },
        artifact: {
          kind: "attachments",
          items: [
            { label: "United UA-1885 — nonstop", meta: "May 17 · 19:10 ORD → 21:42 SFO · $348" },
          ],
        },
      }),
      card({
        type: "decision",
        state: "open",
        title: "Pick hotel — Chicago Loop, May 14-17",
        why: "Conrad is $45 over the $300/night cap but 4 blocks from the venue. Rate guarantee likely lapses tomorrow.",
        evidence: "Kimpton and Hyatt are under budget; both walkable but farther.",
        whatHappens: "I'll book the choice, confirm the reservation, and add it to your calendar.",
        createdAt: "Today 9:30 AM",
        artifact: {
          kind: "options",
          intro: "Three Loop hotels. Conrad is closest but over budget.",
          options: [
            {
              id: "conrad",
              title: "Conrad Chicago",
              meta: "$345/night · 4 blocks to venue",
              notes: "Over the $300 cap. Best location and gym; quiet rooms.",
            },
            {
              id: "kimpton-gray",
              title: "Kimpton Gray",
              meta: "$278/night · 7 blocks to venue",
              notes: "Under budget. Solid wifi, smaller rooms.",
            },
            {
              id: "hyatt-mag",
              title: "Hyatt Centric The Loop",
              meta: "$252/night · 10 blocks to venue",
              notes: "Cheapest. Decent gym, 12-min walk in good weather.",
            },
          ],
        },
      }),
      card({
        type: "follow-up",
        state: "open",
        title: "Lock dinners with Reece, Talia, Marcus?",
        why: "Talia is confirmed at Kasama. Reece and Marcus haven't replied yet.",
        whatHappens: "I'll nudge Reece and Marcus once you say go.",
        createdAt: "Today 9:31 AM",
        artifact: {
          kind: "people",
          entries: [
            {
              name: "Reece W. — Wed May 14",
              meta: "Suggested Avec, 7pm · pinged Apr 28, no reply",
              note: "Goes quiet on iMessage but answers Telegram fast — I can nudge there if you greenlight.",
            },
            {
              name: "Talia O. — Thu May 15",
              meta: "Confirmed at Kasama, 7pm · res. under your name",
              note: "Locked. She asked if it's OK to bring her partner — assumed yes; flag if not.",
            },
            {
              name: "Marcus B. — Fri May 16",
              meta: "Pinged Apr 30, no reply · last seen on Slack 2 days ago",
              note: "No suggested venue yet. I'll propose Kasama or Avec depending on Reece's slot.",
            },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-rent-may",
    title: "Pay May rent — 749 Guerrero",
    status: "blocked",
    icon: "blocked",
    project: "749 Guerrero",
    projectKey: "rent",
    labelOrigin: "manual",
    consequence:
      "Form is filled except routing number. Can't autofill banking credentials — paused on you.",
    timeSensitivity: "today",
    runnerStatus: "Form filled except routing number. Drop it in and I'll submit.",
    nextAction: "Enter routing number to submit",
    source: "749 Guerrero Rent Tracker",
    createdAt: "Yesterday",
    updatedAt: "30m ago",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Found the 749 Guerrero Rent Tracker",
        why: "April rent confirms the amount before I file May.",
        createdAt: "Yesterday 10:02 AM",
        resolution: { kind: "accepted", at: "Yesterday 10:03 AM" },
        artifact: {
          kind: "attachments",
          items: [
            { label: "749 Guerrero Rent Tracker", meta: "Google Sheets · last edited Apr 30" },
          ],
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Confirmed April rent amount",
        why: "Matches March exactly — no rate change.",
        createdAt: "Yesterday 10:05 AM",
        resolution: { kind: "accepted", at: "Yesterday 10:06 AM" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "April rent", value: "$4,825" },
            { label: "March rent", value: "$4,825" },
            { label: "YTD paid", value: "$19,300" },
          ],
        },
      }),
      card({
        type: "failure",
        state: "open",
        title: "Enter your bank routing number to submit",
        why: "I won't autofill sensitive banking credentials. Drop it in and I'll verify the format and submit.",
        whatHappens:
          "I'll validate the routing number locally, fill the open landlord portal tab, submit, and file the receipt.",
        createdAt: "30m ago",
        inputs: [
          {
            key: "routing",
            label: "Bank routing number",
            type: "password",
            placeholder: "XXXXXXXXX (9 digits)",
            helper: "Never stored. Used once to submit the form, then discarded.",
          },
          {
            key: "memo",
            label: "Memo line",
            type: "text",
            placeholder: "e.g. May 2026 rent — 749 Guerrero",
          },
        ],
        submitLabel: "Submit & continue",
      }),
    ],
  },

  {
    id: "todo-vacation-reply",
    title: "Set Gmail vacation auto-reply",
    status: "needs-you",
    icon: "attention",
    project: "Inbox",
    projectKey: "inbox",
    labelOrigin: "suggested",
    consequence:
      "Three UI attempts crashed the renderer. IMAP route is ready — confirm dates and I'll apply across both accounts.",
    timeSensitivity: "today",
    runnerStatus: "Routed through IMAP after three Gmail UI crashes. Awaiting your confirm.",
    nextAction: "Confirm and apply",
    source: "Cadence — out-of-office",
    createdAt: "Yesterday",
    updatedAt: "2h ago",
    cards: [
      card({
        type: "failure",
        state: "resolved",
        title: "Three attempts via Gmail settings UI failed",
        why: "Each retry crashed the renderer mid-flow.",
        evidence: "Sessions 260428-deft-slate, 260428-ready-bronze, 260428-snug-crane.",
        createdAt: "Yesterday 11:14 AM",
        resolution: { kind: "modified", at: "Yesterday 11:42 AM", note: "Switched to IMAP settings path." },
        artifact: {
          kind: "note",
          body:
            "Logged each stack trace and filed it. Pivoted to the IMAP settings endpoint which doesn't go through the broken settings tab.",
        },
      }),
      card({
        type: "approval",
        state: "open",
        title: "Apply auto-reply via IMAP — confirm dates",
        why: "Dates and message ready. Confirm and I'll apply across both accounts.",
        whatHappens: "I'll set the auto-reply on charlie@runner.now AND charlie@voteagora.com simultaneously.",
        createdAt: "2h ago",
        artifact: {
          kind: "checklist",
          items: [
            { label: "Start: Mon May 12, 12:00 AM PT" },
            { label: "End: Tue May 13, 12:00 AM PT" },
            { label: "Subject: 'Out of office'" },
            { label: "Body: 'Out of office, back Tuesday.'" },
            { label: "Apply to: charlie@runner.now AND charlie@voteagora.com" },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-expedia-deck",
    title: "Expedia sales deck — pick case study logo",
    status: "needs-you",
    icon: "attention",
    project: "Sales",
    projectKey: "sales",
    labelOrigin: "manual",
    consequence:
      "Slide 6 is a placeholder until you choose. Meeting prep window closes end of week.",
    timeSensitivity: "this-week",
    runnerStatus: "10 slides drafted. Slide 6 (case study) waiting on your logo pick.",
    nextAction: "Pick a customer logo for slide 6",
    source: "Enterprise sales — Expedia",
    createdAt: "3 days ago",
    updatedAt: "Yesterday",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Outlined structure for 10 slides",
        why: "Standard enterprise pitch shape works for this audience.",
        createdAt: "3 days ago",
        resolution: { kind: "accepted", at: "3 days ago" },
        artifact: {
          kind: "checklist",
          items: [
            { label: "Title", checked: true },
            { label: "The corporate travel problem", checked: true },
            { label: "Why MCPs", checked: true },
            { label: "Our flight MCP — capabilities", checked: true },
            { label: "Integration footprint", checked: true },
            { label: "Case study (placeholder)", checked: false },
            { label: "Pricing tier proposal", checked: true },
            { label: "Rollout plan (90 days)", checked: true },
            { label: "Success metrics", checked: true },
            { label: "Next steps", checked: true },
          ],
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Drafted v0.4 of the deck",
        why: "Want to keep iteration fast — v0.4 is shareable internally.",
        createdAt: "Yesterday",
        resolution: { kind: "accepted", at: "Yesterday" },
        artifact: {
          kind: "attachments",
          items: [
            { label: "Expedia — Flight MCP Pitch (v0.4)", meta: "Google Slides · 10 slides" },
          ],
        },
      }),
      card({
        type: "decision",
        state: "open",
        title: "Pick a customer logo for slide 6",
        why: "Three options — pick one and I'll drop it into slide 6.",
        evidence: "Navan is the closest analog but a partial competitor. Ramp is the safest. Datadog is the most prestigious.",
        whatHappens: "I'll wire the logo, the metric callout, and the quote into slide 6.",
        createdAt: "Yesterday",
        artifact: {
          kind: "decision",
          question: "Which case study should we lead with on slide 6?",
          choices: [
            {
              id: "navan",
              label: "Navan (corporate travel)",
              rationale:
                "Closest analog to Expedia's audience. Strong activation numbers (62% W1). Risk: partial competitor.",
            },
            {
              id: "ramp",
              label: "Ramp (finance team workflow)",
              rationale:
                "Best-known logo. Less travel-specific but the agent integration story translates. Safe pick.",
            },
            {
              id: "datadog",
              label: "Datadog (enterprise ops)",
              rationale:
                "Most prestigious. Small travel use case but engineering rigor proves the integration. Best technical credibility.",
            },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-board-prep",
    title: "Board meeting prep — May 19",
    status: "needs-you",
    icon: "attention",
    project: "Board Prep",
    projectKey: "board",
    labelOrigin: "manual",
    consequence:
      "Pre-read goes out tomorrow. Finance pack still missing from Maria — chase or wait?",
    timeSensitivity: "next-week",
    runnerStatus: "Notes doc, pre-read, and three 1:1s done. Finance pack is the open item.",
    nextAction: "Chase Maria or wait",
    source: "Board meeting — May 19",
    createdAt: "1 week ago",
    updatedAt: "Today 8:40 AM",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Created board notes Google Doc",
        why: "Standard structure — agenda, attendees, six section blocks, action items.",
        createdAt: "1 week ago",
        resolution: { kind: "accepted", at: "1 week ago" },
        artifact: {
          kind: "attachments",
          items: [
            { label: "Board meeting — May 19", meta: "Google Doc · agenda, attendees, 6 sections" },
          ],
        },
      }),
      card({
        type: "approval",
        state: "resolved",
        title: "Sent pre-read 96h ahead",
        why: "Board cadence — 96h pre-read keeps prep windows tight.",
        createdAt: "3 days ago",
        resolution: { kind: "accepted", at: "3 days ago", note: "Sent to all 5 board members." },
        artifact: {
          kind: "email",
          to: "Board (5 members)",
          subject: "May 19 pre-read + agenda",
          body:
            "Board team —\n\nAttaching the May 19 pre-read and agenda 96 hours ahead per usual cadence.\n\nKey reads: Q1 close, Q2 plan, and the new pricing proposal (page 11).\n\nReply with anything you want surfaced live.\n\nBest,\nCharlie",
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Scheduled three 1:1s with board members",
        why: "Direct prep beats group surprises.",
        createdAt: "2 days ago",
        resolution: { kind: "accepted", at: "2 days ago" },
        artifact: {
          kind: "people",
          entries: [
            { name: "James K.", meta: "Wed May 14 · 4pm", note: "Confirmed" },
            { name: "Yitong L.", meta: "Thu May 15 · 11am", note: "Confirmed" },
            { name: "Ramesh P.", meta: "Fri May 16 · 9am", note: "Tentative — awaiting" },
          ],
        },
      }),
      card({
        type: "decision",
        state: "open",
        title: "Finance hasn't sent the pack — chase or wait?",
        why: "Pre-read goes out tomorrow. Maria is heads-down on monthly close.",
        evidence: "Pinged her Tuesday, no reply. Risk of late pack vs. risk of unwelcome nudge.",
        whatHappens: "I'll send a gentle nudge or hold until tomorrow AM, your call.",
        createdAt: "Today 8:40 AM",
        artifact: {
          kind: "decision",
          question: "Finance hasn't sent the pack — chase or wait?",
          choices: [
            {
              id: "chase",
              label: "Nudge Maria today",
              rationale:
                "Pre-read goes out tomorrow. If she's heads-down on close, a gentle ping unblocks me.",
            },
            {
              id: "wait",
              label: "Wait until tomorrow AM",
              rationale:
                "She's heads-down on monthly close. A nudge today might be unwelcome. Risk: tight turnaround.",
            },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-inbox-50",
    title: "Inbox triage — top 50 emails",
    status: "needs-you",
    icon: "attention",
    project: "Inbox",
    projectKey: "inbox",
    labelOrigin: "manual",
    consequence:
      "14 drafts are ready to send. The Expedia, Anthropic, and Stripe drafts need your eyes before send.",
    timeSensitivity: "this-week",
    runnerStatus: "Classified all 50. 14 drafted, 31 archive candidates, 5 flagged.",
    nextAction: "Skim flagged drafts, then send the batch",
    source: "Cadence — inbox sweep",
    createdAt: "Today 8:00 AM",
    updatedAt: "20m ago",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Classified all 50 emails",
        why: "Sorting noise from signal so we don't waste a triage pass.",
        createdAt: "Today 8:02 AM",
        resolution: { kind: "accepted", at: "Today 8:04 AM" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Actionable", value: "14" },
            { label: "Newsletter / noise", value: "31" },
            { label: "Needs your decision", value: "5" },
          ],
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Drafted replies for the 14 actionables",
        why: "Most are short — drafting in your Gmail voice saves you 20 minutes.",
        evidence: "All 14 in Drafts, written in your runner.now voice.",
        createdAt: "Today 8:30 AM",
        resolution: { kind: "accepted", at: "Today 8:35 AM" },
        artifact: {
          kind: "note",
          body:
            "All 14 drafts in the Drafts folder, written in your Gmail voice (short, lowercase first word, no signoff for internal). Three flagged for your eyes: the Expedia procurement rep, the Anthropic partner-team intro, and the Stripe contract redline.",
        },
      }),
      card({
        type: "approval",
        state: "open",
        title: "Review and send the 14 drafts",
        why: "14 drafts ready. Skim the three flagged ones — others should be one-click sends.",
        evidence: "Top-of-batch is the Expedia procurement reply.",
        whatHappens: "I'll send all approved drafts, then archive the originating threads.",
        createdAt: "20m ago",
        artifact: {
          kind: "drafts",
          intro: "Three flagged for your eyes (top of the list). The other 11 are short — skim and approve.",
          channel: "Gmail · runner.now voice",
          previewCount: 4,
          entries: [
            {
              recipient: "Dana — Expedia procurement",
              recipientMeta: "Flagged · long RFP reply · runner.now",
              hook: "Pricing detail is load-bearing — wanted you to read this one.",
              subject: "Re: Flight MCP enterprise pricing",
              body:
                "Hi Dana —\n\nAppreciate the detailed RFP. Quick read: your volume falls into our enterprise tier; we'd structure it as a 12-month commit with a usage-based add-on for the agentic features.\n\nHappy to walk through Wednesday or Thursday next week — what works on your side?\n\nBest,\nCharlie",
            },
            {
              recipient: "Maya — Anthropic partnerships",
              recipientMeta: "Flagged · partner-team intro · runner.now",
              hook: "Cross-org intro — wanted to make sure I named the right people on our side.",
              subject: "Re: partner-team intro",
              body:
                "maya — yes, let's do this. on our side, the right intros are Yitong (eng partnerships) and me. I'll pull Yitong in once you have a name from your team. happy to do a 30-min next week if helpful.",
            },
            {
              recipient: "Rina — Stripe legal",
              recipientMeta: "Flagged · contract redline · voteagora.com",
              hook: "Redline is a legal call, not mine — please confirm phrasing.",
              subject: "Re: MSA redline — section 8.2",
              body:
                "Rina —\n\nThanks for the markup on 8.2. We can accept the cap language as written; the indemnity carveout for AI-generated output is the one we still need to discuss. Can we do a 20-min call Thursday?\n\nBest,\nCharlie",
            },
            {
              recipient: "Carter — Acme onboarding",
              recipientMeta: "Quick reply · runner.now",
              body:
                "carter — yes, Thursday works. I'll bring the rollout plan; you bring the IT contact and we should be able to land the timeline live.",
            },
            {
              recipient: "Sam — recruiter follow-up",
              recipientMeta: "Quick reply · runner.now",
              body:
                "sam — appreciate the note. not looking right now but happy to keep the door open. ping me again in Q3 if it still makes sense.",
            },
            {
              recipient: "James K. (board) — pre-read note",
              recipientMeta: "Reply · runner.now",
              body:
                "james — pre-read is going out tomorrow on the usual 96h. nothing to flag in advance — pricing slide will surface live.",
            },
            {
              recipient: "Yitong — Acme handoff timing",
              recipientMeta: "Reply · runner.now",
              body:
                "yitong — agree on the timing. let's hand off after the May 19 board so we don't split focus. I'll keep Acme warm until then.",
            },
            {
              recipient: "Reece — Chicago dinner",
              recipientMeta: "Reply · runner.now",
              body:
                "reece — Avec wednesday 7pm works. let me know if Marcus is in and I'll size the res.",
            },
            {
              recipient: "Talia — Kasama Thursday",
              recipientMeta: "Reply · runner.now",
              body:
                "talia — locked, kasama 7pm thursday. partner is welcome — i'll bump the res to 3.",
            },
            {
              recipient: "Lin — 88 Front showing",
              recipientMeta: "Reply · runner.now",
              body:
                "lin — saturday 11am works for #1204. is there a #3204 viewing slot back-to-back? happy to do both same day.",
            },
            {
              recipient: "Carlos — 60 Yonge showing",
              recipientMeta: "Reply · runner.now",
              body:
                "carlos — 2pm saturday, confirmed. want to also see #2401 if a slot's open right after.",
            },
            {
              recipient: "Stratechery thread reply",
              recipientMeta: "Reply on subscriber email · runner.now",
              body:
                "ben — fair read on the agent-pricing piece. the floor question you raised is exactly the one we're sitting with internally this week. happy to share notes off-record.",
            },
            {
              recipient: "Maria — finance pack chase",
              recipientMeta: "Reply · runner.now",
              body:
                "maria — gentle nudge: pre-read goes out tomorrow. if the pack isn't done, a partial works too — i can drop what's ready into the appendix.",
            },
            {
              recipient: "Charlie — fjor.co self",
              recipientMeta: "FYI label · cross-account housekeeping · voteagora.com",
              body:
                "thanks, I'll review the meeting notes tomorrow.",
            },
          ],
        },
      }),
      card({
        type: "follow-up",
        state: "open",
        title: "Archive the 31 noise emails after send?",
        why: "Newsletters, calendar confirmations, receipts — all auto-classifiable.",
        whatHappens: "If you accept, I'll bulk-archive after the drafts go out.",
        createdAt: "20m ago",
        artifact: {
          kind: "checklist",
          items: [
            {
              label: "12 newsletters (Stratechery, Lenny's, The Rebooting, etc.)",
              pendingMeta: "all > 7d old · matches your existing auto-archive rule",
            },
            {
              label: "9 calendar notifications already actioned",
              pendingMeta: "events ended or moved · accept/decline already processed",
            },
            {
              label: "6 receipts (Uber, Stripe, AWS, Loom, Linear, Notion)",
              pendingMeta: "already labeled Receipts · safe to archive from inbox",
            },
            {
              label: "4 marketing from tools we already use",
              pendingMeta: "vendor pings from Datadog, Vercel, Linear, Slack",
            },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-q1-analytics",
    title: "Q1 analytics — cannabis jobs + deals pipeline",
    status: "needs-you",
    icon: "attention",
    project: "Analytics",
    projectKey: "platform",
    labelOrigin: "suggested",
    consequence: "Memo is ready. Skim before I circulate it to the team.",
    timeSensitivity: "this-week",
    runnerStatus: "BigQuery exploration done; deals pipeline pulled; one-pager memo ready.",
    nextAction: "Read the memo",
    source: "BigQuery — analytics dataset",
    createdAt: "5 days ago",
    updatedAt: "Yesterday",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Mapped BigQuery datasets and tables",
        why: "You asked what was available — needed a survey before any analysis.",
        createdAt: "5 days ago",
        resolution: { kind: "accepted", at: "5 days ago" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Datasets", value: "4" },
            { label: "Tables (analytics)", value: "23" },
            { label: "cannabis_jobs rows", value: "412,038" },
            { label: "deals_pipeline rows", value: "1,847" },
          ],
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Pulled deals pipeline by stage",
        why: "Stage breakdown shows where conversion is slipping.",
        createdAt: "4 days ago",
        resolution: { kind: "accepted", at: "4 days ago" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Discovery", value: "624" },
            { label: "Qualified", value: "311" },
            { label: "Proposal", value: "187" },
            { label: "Negotiation", value: "94" },
            { label: "Closed-Won (Q1)", value: "62" },
          ],
        },
      }),
      card({
        type: "approval",
        state: "open",
        title: "Read the Q1 summary memo before I circulate",
        why: "One-pager ready. I want your read before it goes to the team.",
        evidence: "Key call: instrument Qualified → Proposal handoff latency.",
        whatHappens: "On approve, I'll send the memo to the analytics list and link the underlying queries.",
        createdAt: "Yesterday",
        artifact: {
          kind: "note",
          body:
            "Q1 read: deals_pipeline volume up 22% QoQ but conversion from Qualified → Proposal slipped 4pp. cannabis_jobs activity flat — likely market-level. Recommend: instrument the Qualified → Proposal handoff for hand-off latency. Memo doc linked in Drive.",
        },
      }),
    ],
  },

  {
    id: "todo-superman-gdoc",
    title: "Notion 'Next 3mo Superman' → Google Doc",
    status: "needs-you",
    icon: "attention",
    project: "Board Prep",
    projectKey: "board",
    labelOrigin: "manual",
    consequence: "Doc is ready. Once you skim, pick the audience and I'll set sharing.",
    timeSensitivity: "this-week",
    runnerStatus: "Pulled Notion content, rebuilt structure in GDocs with TOC. Awaiting share decision.",
    nextAction: "Pick sharing audience",
    source: "Notion: agoraxyz/Our-Next-3mo-Superman",
    createdAt: "2 days ago",
    updatedAt: "Yesterday",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Fetched the Notion source",
        why: "Source-of-truth pull keeps the GDoc fully faithful.",
        createdAt: "2 days ago",
        resolution: { kind: "accepted", at: "2 days ago" },
        artifact: {
          kind: "note",
          body:
            "Pulled 18 blocks, 4 nested toggles, 2 embedded tables, and the linked Loom (kept as a hyperlink — Docs doesn't embed Loom natively).",
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Created the formatted Google Doc",
        why: "Heading styles + TOC make this skim-friendly for external readers.",
        createdAt: "Yesterday",
        resolution: { kind: "accepted", at: "Yesterday" },
        artifact: {
          kind: "attachments",
          items: [
            { label: "Our Next 3 Months — Superman (Google Doc)", meta: "4 sections · TOC · 1,840 words" },
          ],
        },
      }),
      card({
        type: "decision",
        state: "open",
        title: "Who should get access?",
        why: "Three sensible audiences. Pick one and I'll set view-only sharing.",
        whatHappens: "On accept, I'll apply the sharing scope and send a kickoff note.",
        createdAt: "Yesterday",
        artifact: {
          kind: "decision",
          question: "Who should get access?",
          choices: [
            { id: "exec", label: "Exec team only (view)", rationale: "Tight loop, low risk of leak." },
            { id: "all-hands", label: "Whole company (view)", rationale: "Aligned with transparency default. Some context cost." },
            { id: "external", label: "Exec + board (view)", rationale: "If you want board pre-input before circulating internally." },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-q4-deck",
    title: "Q4 Deck — replace Next Steps placeholders",
    status: "needs-you",
    icon: "attention",
    project: "Sales",
    projectKey: "sales",
    labelOrigin: "manual",
    consequence: "Three bullets are placeholders. Edit them or I'll send with generics.",
    timeSensitivity: "tomorrow",
    runnerStatus: "Both closing slides added. Next Steps bullets need your edit pass.",
    nextAction: "Edit the three placeholder bullets",
    source: "Q4 Deck Sample",
    createdAt: "2 days ago",
    updatedAt: "Yesterday",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Added 'Next Steps' slide",
        why: "Layout mirrors slide 4 to match the deck's rhythm.",
        createdAt: "2 days ago",
        resolution: { kind: "accepted", at: "2 days ago" },
        artifact: {
          kind: "checklist",
          items: [
            { label: "Layout: title + 3 bullets, mirroring slide 4", checked: true },
            { label: "Placeholder bullets in — edit before sharing", checked: false },
            { label: "Footer + slide number aligned", checked: true },
          ],
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Added 'Closing, Thank You' slide",
        why: "Matches the title slide's gradient — brand-aligned.",
        createdAt: "2 days ago",
        resolution: { kind: "accepted", at: "2 days ago" },
        artifact: {
          kind: "note",
          body:
            "Single line title centered, subtle gradient background matching the title slide. Brand-aligned. No further action needed.",
        },
      }),
      card({
        type: "approval",
        state: "open",
        title: "Replace the placeholder Next Steps bullets",
        why: "Currently generic — won't read as ours. Edit and I'll finalize the deck.",
        whatHappens: "On approve with your edits, I'll lock the slide and clean up the rev history.",
        createdAt: "Yesterday",
        artifact: {
          kind: "note",
          body:
            "Current placeholders: 'Follow up with team', 'Schedule next review', 'Track KPIs'. Worth replacing with the actual three commitments from the deck's body.",
        },
      }),
    ],
  },

  {
    id: "todo-toronto-hunt",
    title: "Toronto apartment hunt — near Union Station",
    status: "runner-working",
    icon: "waiting",
    project: "Travel",
    projectKey: "travel",
    labelOrigin: "manual",
    consequence: "Top 4 listings ready, two showings booked. Chasing two more agents for replies.",
    timeSensitivity: "this-week",
    runnerStatus: "12 listings scanned, top 4 ranked, 2 showings booked Sat May 17.",
    nextAction: "Wait — I'll surface confirmations as they land",
    source: "Toronto rentals — 2bd/2ba",
    createdAt: "4 days ago",
    updatedAt: "Yesterday",
    lastAdvancedNote: "Booked 88 Front + 60 Yonge showings",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Scanned 12 listings near Union Station",
        why: "Pulling broadly first, then filtering on walk time + budget.",
        createdAt: "4 days ago",
        resolution: { kind: "accepted", at: "4 days ago" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Listings scanned", value: "12" },
            { label: "Match criteria (2bd/2ba)", value: "7" },
            { label: "Final shortlist", value: "4" },
          ],
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Surfaced top 4 picks with price + sqft",
        why: "Need a comparable set before booking showings.",
        createdAt: "3 days ago",
        resolution: { kind: "accepted", at: "3 days ago" },
        artifact: {
          kind: "options",
          intro: "Top 4 with price + sqft.",
          options: [
            { id: "front-st", title: "88 Front St E #1204", meta: "2 bed · 2 bath · 1,150 sqft · $4,200/mo", notes: "5 min walk. South-facing." },
            { id: "wellington", title: "12 Wellington St W #802", meta: "2 bed · 2 bath · 1,080 sqft · $3,850/mo", notes: "7 min walk. Older building, lower price." },
            { id: "yonge-st", title: "60 Yonge St #1801", meta: "2 bed · 2 bath · 1,210 sqft · $4,500/mo", notes: "3 min walk. Newest unit, priciest." },
            { id: "king-w", title: "300 King St W #2105", meta: "2 bed · 2 bath · 1,140 sqft · $4,100/mo", notes: "9 min walk. Best gym/amenities." },
          ],
        },
      }),
      card({
        type: "progress",
        state: "in-progress",
        title: "Booking showings with the 4 agents",
        why: "Saturday May 17 is the window — both flights line up.",
        evidence: "88 Front + 60 Yonge confirmed; Wellington + King W pending.",
        createdAt: "Yesterday",
        progress: {
          label: "Confirming showings",
          step: "2 of 4 confirmed",
          percent: 50,
          startedAt: "Yesterday",
          elapsed: "started 2h ago",
          currently: "drafting follow-up to Wellington's agent — no reply since first inquiry",
          events: [
            { id: "ev-book-1", text: "Confirmed 60 Yonge — Sat May 17 · 2pm", ago: "45m ago" },
            { id: "ev-book-2", text: "Agent reply: 60 Yonge slot confirmed", ago: "1h ago" },
            { id: "ev-book-3", text: "Sent inquiry to 60 Yonge agent (Carlos)", ago: "1h 10m ago" },
            { id: "ev-book-4", text: "Confirmed 88 Front — Sat May 17 · 11am", ago: "1h 30m ago" },
            { id: "ev-book-5", text: "Sent inquiry to 88 Front agent (Lin)", ago: "2h ago" },
          ],
        },
        artifact: {
          kind: "checklist",
          items: [
            { label: "88 Front St — Sat May 17 · 11am", checked: true },
            { label: "60 Yonge St — Sat May 17 · 2pm", checked: true },
            { label: "12 Wellington — pending agent reply", pendingMeta: "sent 1h ago · awaiting reply" },
            { label: "300 King W — pending agent reply", pendingMeta: "sent 25m ago · awaiting reply" },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-gmail-style",
    title: "Learn my Gmail writing style",
    status: "needs-you",
    icon: "attention",
    project: "Inbox",
    projectKey: "inbox",
    labelOrigin: "manual",
    consequence: "Style profile drafted. Confirm and I'll save it so future drafts sound like you.",
    timeSensitivity: "none",
    runnerStatus: "Sampled 18 sent messages across both accounts. Profile drafted, awaiting your confirm.",
    nextAction: "Confirm to commit the style profile",
    source: "/analyze-and-remember-writing-style",
    createdAt: "3 days ago",
    updatedAt: "2 days ago",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Sampled sent messages from both accounts",
        why: "Per-account voice matters — runner.now and voteagora.com differ.",
        createdAt: "3 days ago",
        resolution: { kind: "accepted", at: "3 days ago" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Messages sampled (runner.now)", value: "11" },
            { label: "Messages sampled (voteagora.com)", value: "7" },
            { label: "Median length", value: "62 words" },
          ],
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Drafted the per-account style profile",
        why: "Distinct profiles let me match voice automatically.",
        createdAt: "2 days ago",
        resolution: { kind: "accepted", at: "2 days ago" },
        artifact: {
          kind: "note",
          body:
            "runner.now voice: lowercase first word for internal, no signoff for short threads, em-dashes liberally. voteagora.com voice: more formal, sentence case throughout, signs off with 'Best, Charlie'. Both: short paragraphs, no emojis, occasional rhetorical question to soften asks.",
        },
      }),
      card({
        type: "approval",
        state: "open",
        title: "Save profile to memory",
        why: "Confirm and I'll commit this as the per-account Gmail style profile.",
        whatHappens: "I'll use these profiles whenever I draft Gmail replies on either account.",
        createdAt: "2 days ago",
        artifact: {
          kind: "checklist",
          items: [
            { label: "Save runner.now Gmail Communication Style profile" },
            { label: "Save voteagora.com Gmail Communication Style profile" },
            { label: "Use these when drafting future Gmail replies on each account" },
          ],
        },
      }),
    ],
  },

  // ── More needs-you (today): quick asks Charlie can rip through ────────────
  {
    id: "todo-yitong-sync",
    title: "Schedule 30-min sync with Yitong",
    status: "needs-you",
    icon: "attention",
    project: "Inbox",
    projectKey: "inbox",
    labelOrigin: "suggested",
    consequence: "Yitong's only open slot today is 2pm PT. Next opening is Friday.",
    timeSensitivity: "today",
    runnerStatus: "Pulled Yitong's calendar — 2pm is open. Invite drafted.",
    nextAction: "Approve and send invite",
    source: "Daily catch-up cadence",
    createdAt: "Today 9:50 AM",
    updatedAt: "10m ago",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Pulled Yitong's open calendar today",
        why: "Need her availability before drafting an invite.",
        createdAt: "Today 9:50 AM",
        resolution: { kind: "accepted", at: "Today 9:51 AM" },
        artifact: {
          kind: "checklist",
          items: [
            { label: "11am — busy (board prep call)", checked: true },
            { label: "1pm — busy (lunch)", checked: true },
            { label: "2pm — OPEN · 30 min", checked: false },
            { label: "3pm — busy (1:1)", checked: true },
          ],
        },
      }),
      card({
        type: "approval",
        state: "open",
        title: "Send 2pm PT invite to yitong@runner.now",
        why: "Default Google Meet, 30 min. Approve and I'll send + add to your calendar.",
        whatHappens: "I'll send the invite, create the calendar event, and confirm back.",
        createdAt: "10m ago",
        artifact: {
          kind: "email",
          to: "yitong@runner.now",
          subject: "30-min sync — 2pm PT today",
          body:
            "yitong —\n\nGrabbing 30 min today at 2pm PT to catch up on the board prep + Acme handoff. Meet link in the invite.\n\nc",
        },
      }),
    ],
  },

  {
    id: "todo-barley-typo",
    title: "Validate barley@oteagoa.com — likely typo",
    status: "needs-you",
    icon: "attention",
    labelOrigin: "unlabeled",
    consequence: "Domain doesn't resolve. Found a near-match: voteagora.com.",
    timeSensitivity: "today",
    runnerStatus: "MX lookup failed. Distance suggests 'voteagora.com'.",
    nextAction: "Confirm the correction",
    source: "Outbound draft — failed validation",
    createdAt: "1h ago",
    updatedAt: "1h ago",
    cards: [
      card({
        type: "metadata-suggestion",
        state: "open",
        title: "Add project label: Inbox?",
        why: "This came from an outbound email draft — would group with your inbox work.",
        whatHappens: "I'll label it Inbox and surface it in that filter.",
        createdAt: "1h ago",
        options: [
          { id: "accept", label: "Accept (Inbox)", primary: true },
          { id: "change", label: "Choose another project" },
          { id: "leave", label: "Leave uncategorized" },
        ],
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Domain validation failed",
        why: "Want to know if this is a typo or a dead domain before bouncing it back.",
        createdAt: "1h ago",
        resolution: { kind: "accepted", at: "1h ago" },
        artifact: {
          kind: "checklist",
          items: [
            { label: "MX records present", checked: false },
            { label: "Deliverable", checked: false },
            { label: "Not disposable", checked: true },
            { label: "Domain registered", checked: false, pendingMeta: "no whois record" },
          ],
        },
      }),
      card({
        type: "decision",
        state: "open",
        title: "Likely correction: barley@voteagora.com",
        why: "Edit distance of 2; voteagora.com resolves cleanly.",
        evidence: "You have prior correspondence with this domain.",
        whatHappens: "On accept, I'll update the draft and re-validate.",
        createdAt: "55m ago",
        artifact: {
          kind: "decision",
          question: "Did you mean barley@voteagora.com?",
          choices: [
            { id: "accept", label: "Yes — update to voteagora.com", rationale: "Highest probability match; domain is valid." },
            { id: "manual", label: "Let me re-enter manually", rationale: "Charlie types it himself." },
            { id: "bounce", label: "Bounce — domain is dead", rationale: "Treat as a dead address." },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-fjor-email",
    title: "Email charlie@fjor.co + label FYI",
    status: "needs-you",
    icon: "attention",
    project: "Inbox",
    projectKey: "inbox",
    labelOrigin: "manual",
    consequence: "Drafted in your voice. Approve to send + apply the FYI label.",
    timeSensitivity: "today",
    runnerStatus: "Draft ready. One-step approve → send + label.",
    nextAction: "Approve to send + label",
    source: "Quick task",
    createdAt: "Today 9:00 AM",
    updatedAt: "20m ago",
    cards: [
      card({
        type: "approval",
        state: "open",
        title: "Send + label FYI",
        why: "Ready as-is — just need your go.",
        whatHappens: "I'll send to charlie@fjor.co and apply the FYI label to the thread.",
        createdAt: "20m ago",
        artifact: {
          kind: "email",
          to: "charlie@fjor.co",
          subject: "thanks",
          body: "thanks, I'll review the meeting notes tomorrow.",
        },
      }),
    ],
  },

  // ── More needs-you (this-week) ────────────────────────────────────────────
  {
    id: "todo-toronto-3bd",
    title: "Toronto 3bd sibling search",
    status: "needs-you",
    icon: "attention",
    project: "Travel",
    projectKey: "travel",
    labelOrigin: "manual",
    consequence: "Top 5 ranked. Pick which to slot into the May 17 showings.",
    timeSensitivity: "next-week",
    runnerStatus: "Top 5 ranked. Same-building options keep the Saturday efficient.",
    nextAction: "Pick 2 to schedule",
    source: "Toronto rentals — sibling to 2bd",
    createdAt: "Yesterday",
    updatedAt: "Yesterday",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Pulled top 5 3bd listings within 10 min walk",
        why: "Same criteria as the 2bd search, but 3 bed.",
        createdAt: "Yesterday",
        resolution: { kind: "accepted", at: "Yesterday" },
        artifact: {
          kind: "options",
          intro: "Top 5 3bd listings near Union Station.",
          options: [
            { id: "front-3", title: "88 Front St E #3204", meta: "3 bed · 2 bath · 1,520 sqft · $5,400/mo", notes: "Same building as the 2bd #1204." },
            { id: "yonge-3", title: "60 Yonge St #2401", meta: "3 bed · 2 bath · 1,610 sqft · $5,800/mo", notes: "Higher floor of the 2bd building." },
            { id: "queen", title: "200 Queen St E #1502", meta: "3 bed · 2 bath · 1,480 sqft · $4,950/mo", notes: "12 min walk; cheapest of the five." },
            { id: "richmond", title: "44 Richmond St W #1801", meta: "3 bed · 2 bath · 1,580 sqft · $5,200/mo", notes: "8 min walk; modern building." },
            { id: "bay-st", title: "330 Bay St #2802", meta: "3 bed · 3 bath · 1,720 sqft · $6,100/mo", notes: "Most expensive; full 3 bath." },
          ],
        },
      }),
      card({
        type: "decision",
        state: "open",
        title: "Pick 2 to add to the May 17 showings",
        why: "Same-building options keep the day efficient — no extra travel.",
        whatHappens: "On pick, I'll book Saturday slots around the existing showings.",
        createdAt: "Yesterday",
        artifact: {
          kind: "options",
          intro: "Pick 2 — same-building options keep the day efficient.",
          options: [
            { id: "front-3", title: "88 Front St E #3204", notes: "Same building as your 11am 2bd visit." },
            { id: "yonge-3", title: "60 Yonge St #2401", notes: "Same building as your 2pm 2bd visit." },
            { id: "queen", title: "200 Queen St E #1502", notes: "Adds 25 min of travel between visits." },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-apr27-action-items",
    title: "Add Action Items section to Apr 27 meeting notes",
    status: "needs-you",
    icon: "attention",
    project: "Board Prep",
    projectKey: "board",
    labelOrigin: "suggested",
    consequence: "Quick — confirm placement and I'll add the section.",
    timeSensitivity: "this-week",
    runnerStatus: "Document opened. Awaiting placement confirmation.",
    nextAction: "Confirm where to add",
    source: "Meeting Notes — April 27, 2026",
    createdAt: "2 days ago",
    updatedAt: "Yesterday",
    cards: [
      card({
        type: "clarification",
        state: "open",
        title: "Where should 'Action Items' go?",
        why: "Your meeting docs vary — some have it at the bottom, some after the agenda.",
        whatHappens: "I'll add a blank section in your chosen spot, ready for you to fill.",
        createdAt: "Yesterday",
        options: [
          { id: "bottom", label: "Bottom of doc (matches most recent)", primary: true },
          { id: "after-agenda", label: "After Agenda section" },
          { id: "top", label: "At the top (highest visibility)" },
        ],
      }),
    ],
  },

  // ── Untriaged / no time pressure ──────────────────────────────────────────
  {
    id: "todo-drive-tidy",
    title: "Drive folder structure review",
    status: "needs-you",
    icon: "attention",
    labelOrigin: "unlabeled",
    consequence: "Three top-level folders look stale. Proposed reorg ready for review.",
    timeSensitivity: "this-month",
    runnerStatus: "Surveyed Drive. 8 stale folders, 5 empty, 3 duplicates.",
    nextAction: "Approve the reorg",
    source: "/tell-me-about-my-drive-folder-structure",
    createdAt: "2 days ago",
    updatedAt: "2 days ago",
    cards: [
      card({
        type: "metadata-suggestion",
        state: "open",
        title: "Add project label?",
        why: "Drive cleanup doesn't have an obvious project — suggesting Inbox as closest fit.",
        whatHappens: "I'll label it once you pick — or leave it unlabeled.",
        createdAt: "2 days ago",
        options: [
          { id: "accept", label: "Accept (Inbox)", primary: true },
          { id: "change", label: "Choose another project" },
          { id: "leave", label: "Leave uncategorized" },
        ],
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Surveyed Drive folder structure",
        why: "Need a baseline before recommending a reorg.",
        createdAt: "2 days ago",
        resolution: { kind: "accepted", at: "2 days ago" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Top-level folders", value: "24" },
            { label: "Stale (>6mo)", value: "8" },
            { label: "Duplicates", value: "3" },
            { label: "Empty", value: "5" },
          ],
        },
      }),
      card({
        type: "approval",
        state: "open",
        title: "Apply the proposed reorg",
        why: "Cleans up 16 folders into a tighter top-level. Nothing deleted — everything moves to /Archive.",
        whatHappens: "Merges stale + empty folders into /Archive. Dedupes the duplicate pairs. Reversible from Drive trash.",
        createdAt: "2 days ago",
        artifact: {
          kind: "note",
          body:
            "Move 5 empty folders + 8 stale folders to /Archive/Stale-2026-05. Merge 3 duplicate pairs into single canonical folders. No data deleted; trash window is 30 days.",
        },
      }),
    ],
  },

  {
    id: "todo-summer-trip",
    title: "Plan summer trip with college friends",
    status: "needs-you",
    icon: "attention",
    labelOrigin: "unlabeled",
    consequence: "Dates aren't locked. Two friends can't do the original week.",
    timeSensitivity: "this-month",
    runnerStatus: "Sourced 3 rentals and a rough flight band. Holding on the dates question.",
    nextAction: "Confirm dates",
    source: "Slack thread — summer plans",
    createdAt: "1 week ago",
    updatedAt: "Yesterday",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Pulled 3 candidate rentals",
        why: "Need an option in hand before the dates question matters.",
        createdAt: "5 days ago",
        resolution: { kind: "accepted", at: "5 days ago" },
        artifact: {
          kind: "people",
          entries: [
            { name: "Tahoe — North", meta: "8 BR · $1,400/night", note: "Lake access, hot tub, walking distance to town." },
            { name: "Sea Ranch", meta: "6 BR · $1,100/night", note: "Smaller; better if it ends up being 8 not 12." },
            { name: "Healdsburg", meta: "10 BR · $1,800/night", note: "Pool, big kitchen, 2hr drive from SF." },
          ],
        },
      }),
      card({
        type: "clarification",
        state: "open",
        title: "Is Aug 8-15 still the target week?",
        why: "Two members can't do that week. Worth sliding by 1 week — or sticking and letting them join late?",
        evidence: "Original Slack thread said Aug 8-15. Two replies since said 'might need to shift'.",
        whatHappens: "I'll lock options for whichever date window you confirm.",
        createdAt: "Yesterday",
        options: [
          { id: "keep", label: "Keep Aug 8-15", primary: true },
          { id: "slide", label: "Slide to Aug 15-22" },
          { id: "poll", label: "Send a poll to the group" },
        ],
      }),
    ],
  },

  // ── Blocked: stuck on user input ──────────────────────────────────────────
  {
    id: "todo-cal-invite-cross",
    title: "Cross-account calendar invite — smoke test failed",
    status: "blocked",
    icon: "blocked",
    project: "Inbox",
    projectKey: "inbox",
    labelOrigin: "manual",
    consequence: "fjor.co rejected the OAuth calendar scope. You'll need to re-authorize.",
    timeSensitivity: "today",
    runnerStatus: "Three attempts, all failed at the OAuth handshake. Reconnect needed.",
    nextAction: "Reconnect the fjor.co integration",
    source: "Cross-account smoke test",
    createdAt: "Yesterday",
    updatedAt: "3h ago",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Tried the smoke test three times",
        why: "Want to be sure it's not transient.",
        createdAt: "Yesterday",
        resolution: { kind: "modified", at: "3h ago", note: "Consistent OAuth scope rejection." },
        artifact: {
          kind: "note",
          body:
            "All three attempts failed at the OAuth handshake — fjor.co rejected the calendar scope. Likely a refresh-token expiry on the fjor.co side. Not a transient.",
        },
      }),
      card({
        type: "failure",
        state: "open",
        title: "Reconnect the fjor.co calendar integration",
        why: "I can't refresh the token from this side. You'll need to authorize again in the popup.",
        whatHappens: "I'll open the OAuth flow; once you authorize, I'll retry the smoke test automatically.",
        createdAt: "3h ago",
        submitLabel: "Open reconnect flow",
      }),
    ],
  },

  // ── Runner-working: actively in progress, no user open card ──────────────
  {
    id: "todo-archive-sweep",
    title: "Daily inbox archive sweep",
    status: "runner-working",
    icon: "waiting",
    project: "Inbox",
    projectKey: "inbox",
    labelOrigin: "suggested",
    consequence: "Auto-archiving newsletters > 7 days old. 11 archived this morning.",
    timeSensitivity: "none",
    runnerStatus: "Daily sweep ran. 11 archived; queue empty until tomorrow 7am.",
    nextAction: "Wait — sweep runs daily at 7am",
    source: "Cadence — daily sweep",
    createdAt: "2 weeks ago",
    updatedAt: "Today 7:02 AM",
    lastAdvancedNote: "Archived 11 newsletters",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Filter rules locked",
        why: "Conservative rules — newsletters + receipts > 7 days, nothing else.",
        createdAt: "2 weeks ago",
        resolution: { kind: "accepted", at: "2 weeks ago" },
        artifact: {
          kind: "checklist",
          items: [
            { label: "Newsletters > 7 days old", checked: true },
            { label: "Receipts auto-tagged to Receipts label", checked: true },
            { label: "Calendar confirmations already actioned", checked: true },
            { label: "Marketing from tools we already use", checked: true },
          ],
        },
      }),
      card({
        type: "progress",
        state: "in-progress",
        title: "Today's batch — 11 archived",
        why: "Running quietly so your inbox stays signal-only.",
        createdAt: "Today 7:00 AM",
        progress: {
          label: "Today's sweep",
          step: "11 of 11 archived",
          percent: 100,
          startedAt: "Today 7:00 AM",
          elapsed: "ran in 2 min",
          currently: "queue empty — next sweep tomorrow 7am",
        },
      }),
    ],
  },

  {
    id: "todo-yitong-prep",
    title: "Pulling recent emails from yitong@runner.now",
    status: "runner-working",
    icon: "waiting",
    project: "Inbox",
    projectKey: "inbox",
    labelOrigin: "suggested",
    consequence: "Indexing last 14 days of correspondence for your 2pm prep.",
    timeSensitivity: "today",
    runnerStatus: "Indexing 27 threads. Summarizing 19 of 27 so far.",
    nextAction: "Wait — summary will land before 2pm",
    source: "Auto-prep — 2pm Yitong sync",
    createdAt: "1h ago",
    updatedAt: "30s ago",
    lastAdvancedNote: "Summarized thread 19 of 27",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Pulled 27 threads from last 14 days",
        why: "Conversation context before the 2pm sync.",
        createdAt: "1h ago",
        resolution: { kind: "accepted", at: "1h ago" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Threads pulled", value: "27" },
            { label: "Open loops", value: "4" },
            { label: "Latest exchange", value: "3 days ago" },
          ],
        },
      }),
      card({
        type: "progress",
        state: "in-progress",
        title: "Summarizing threads for the 2pm brief",
        why: "Quick read beforehand keeps the meeting tight.",
        createdAt: "30m ago",
        progress: {
          label: "Summarizing threads",
          step: "19 of 27 summarized",
          percent: 70,
          startedAt: "30m ago",
          elapsed: "25m elapsed",
          currently: "extracting open loops from the Acme handoff thread",
          events: [
            { id: "ev-yp-1", text: "Summarized thread 19: 'Acme handoff timing'", ago: "30s ago" },
            { id: "ev-yp-2", text: "Found 2 open loops in the Acme handoff", ago: "1m ago" },
            { id: "ev-yp-3", text: "Summarized thread 18: 'Pricing tier — internal'", ago: "2m ago" },
            { id: "ev-yp-4", text: "Skipped thread 17: noise (newsletter forward)", ago: "4m ago" },
            { id: "ev-yp-5", text: "Summarized thread 16: 'Q1 close review'", ago: "6m ago" },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-investor-digest",
    title: "Drafting weekly investor digest",
    status: "runner-working",
    icon: "waiting",
    project: "Investor update",
    projectKey: "investor",
    labelOrigin: "suggested",
    consequence: "Will surface for review Thursday. Two themes locked, one in flight.",
    timeSensitivity: "this-week",
    runnerStatus: "Two of three themes drafted. Pulling data for theme 3 now.",
    nextAction: "Wait — draft surfaces Thursday AM",
    source: "Cadence — weekly investor digest",
    createdAt: "Yesterday",
    updatedAt: "1h ago",
    lastAdvancedNote: "Drafted theme 2",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Pulled the week's metrics deltas",
        why: "Need the numbers before the narrative.",
        createdAt: "Yesterday",
        resolution: { kind: "accepted", at: "Yesterday" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "ARR (WoW)", value: "$4.69M", trend: "+2% WoW" },
            { label: "Net new logos (week)", value: "9" },
            { label: "Pipeline added", value: "$1.2M" },
          ],
        },
      }),
      card({
        type: "progress",
        state: "in-progress",
        title: "Drafting the three weekly themes",
        why: "Investors read the digest fast — three crisp themes work best.",
        createdAt: "1h ago",
        progress: {
          label: "Drafting themes",
          step: "2 of 3 drafted",
          percent: 66,
          startedAt: "1h ago",
          elapsed: "1h 5m elapsed",
          currently: "pulling supporting data for theme 3 (pricing rollout)",
          events: [
            { id: "ev-id-1", text: "Locked theme 2: 'Acme onboarding signal'", ago: "12m ago" },
            { id: "ev-id-2", text: "Pulled Q1 → Q2 expansion deltas", ago: "20m ago" },
            { id: "ev-id-3", text: "Locked theme 1: 'mid-market momentum'", ago: "40m ago" },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-toronto-crawl",
    title: "Crawling Toronto listings — new matches",
    status: "runner-working",
    icon: "waiting",
    project: "Travel",
    projectKey: "travel",
    labelOrigin: "manual",
    consequence: "Daily crawl for new matches near Union Station. 2 new since yesterday.",
    timeSensitivity: "none",
    runnerStatus: "Daily crawl ran. 47 listings scanned, 2 new matches added.",
    nextAction: "Wait — I'll surface notable matches",
    source: "Auto-crawl — Toronto listings",
    createdAt: "4 days ago",
    updatedAt: "Today 6:32 AM",
    lastAdvancedNote: "2 new matches",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Crawl criteria locked",
        why: "Tight criteria reduces noise.",
        createdAt: "4 days ago",
        resolution: { kind: "accepted", at: "4 days ago" },
        artifact: {
          kind: "checklist",
          items: [
            { label: "2-3 bed within 10 min walk of Union Station", checked: true },
            { label: "$3,500–$5,000/mo range", checked: true },
            { label: "Listed in last 7 days", checked: true },
            { label: "Excludes already-shortlisted addresses", checked: true },
          ],
        },
      }),
      card({
        type: "progress",
        state: "in-progress",
        title: "Today's crawl — 2 new matches",
        why: "Daily delta keeps the shortlist fresh.",
        createdAt: "Today 6:30 AM",
        progress: {
          label: "Today's crawl",
          step: "47 listings scanned · 2 new matches",
          percent: 100,
          startedAt: "Today 6:30 AM",
          elapsed: "ran in 4 min",
          currently: "shortlist updated · next crawl tomorrow 6:30 AM",
        },
      }),
    ],
  },

  {
    id: "todo-receipts-label",
    title: "Auto-organize receipts to label",
    status: "runner-working",
    icon: "waiting",
    project: "Inbox",
    projectKey: "inbox",
    labelOrigin: "suggested",
    consequence: "Receipts auto-labeled to /Receipts. 6 today, 2 expected later.",
    timeSensitivity: "none",
    runnerStatus: "Filter running. 6 receipts auto-labeled today.",
    nextAction: "Wait — filter runs continuously",
    source: "Cadence — receipt filing",
    createdAt: "3 weeks ago",
    updatedAt: "30m ago",
    lastAdvancedNote: "Labeled 2 receipts",
    cards: [
      card({
        type: "progress",
        state: "in-progress",
        title: "Today's batch — 6 of ~8 labeled",
        why: "Receipts pile up — invisible categorization keeps inbox useful.",
        createdAt: "Today 8:00 AM",
        progress: {
          label: "Labeling receipts",
          step: "6 of ~8 today",
          percent: 75,
          startedAt: "Today 8:00 AM",
          elapsed: "still running",
          currently: "watching for the Uber + Stripe receipts that usually land late morning",
        },
      }),
    ],
  },

  {
    id: "todo-deck-case-research",
    title: "Researching case study options for Expedia deck",
    status: "runner-working",
    icon: "waiting",
    project: "Sales",
    projectKey: "sales",
    labelOrigin: "suggested",
    consequence: "Pulling activation + retention numbers for the 3 candidate logos.",
    timeSensitivity: "this-week",
    runnerStatus: "Pulled Navan and Ramp data. Datadog still in flight.",
    nextAction: "Wait — data ready Thursday",
    source: "Expedia deck — slide 6 prep",
    createdAt: "2 days ago",
    updatedAt: "45m ago",
    lastAdvancedNote: "Pulled Ramp data",
    cards: [
      card({
        type: "progress",
        state: "in-progress",
        title: "Pulling activation + retention on 3 logos",
        why: "Whichever logo you pick, you'll want the data ready to drop in.",
        createdAt: "2 days ago",
        progress: {
          label: "Customer data pull",
          step: "2 of 3 logos done",
          percent: 66,
          startedAt: "2 days ago",
          elapsed: "intermittent — runs when their dashboards refresh",
          currently: "waiting on Datadog usage panel — refreshes Thursday AM",
          events: [
            { id: "ev-dr-1", text: "Pulled Ramp W1 activation: 58%", ago: "45m ago" },
            { id: "ev-dr-2", text: "Pulled Navan W1 activation: 62%", ago: "1d ago" },
            { id: "ev-dr-3", text: "Submitted Datadog data request", ago: "2d ago" },
          ],
        },
      }),
    ],
  },

  // ── Monitoring: long-running passive watches ──────────────────────────────
  {
    id: "todo-comp-watch",
    title: "MCP competitor watch",
    status: "monitoring",
    icon: "waiting",
    project: "Sales",
    projectKey: "sales",
    labelOrigin: "suggested",
    consequence: "Tracking 4 MCP-adjacent companies. Two material moves this week.",
    timeSensitivity: "none",
    runnerStatus: "Weekly digest in flight. Replit + Cursor had material moves this week.",
    nextAction: "Wait — digest delivers Monday",
    source: "Auto-tracking — competitive landscape",
    createdAt: "1 month ago",
    updatedAt: "Yesterday",
    lastAdvancedNote: "Logged Cursor pricing change",
    cards: [
      card({
        type: "informational",
        state: "in-progress",
        title: "Tracking 4 competitors — weekly digest",
        why: "Continuous low-effort monitoring beats a quarterly cram session.",
        evidence: "Sources: Crunchbase, public posts, ProductHunt, LinkedIn job pages.",
        whatHappens: "I'll deliver a weekly digest Mondays. You can pause or change cadence anytime.",
        createdAt: "1 month ago",
        artifact: {
          kind: "people",
          entries: [
            { name: "Replit Agents", meta: "Direct — funding event this week", note: "Series F rumor, $200M" },
            { name: "Cursor Composer", meta: "Direct — pricing change", note: "Lowered enterprise floor" },
            { name: "Lindy", meta: "Adjacent — agentic todo", note: "Quiet week" },
            { name: "Devin (Cognition)", meta: "Direct", note: "Hiring 8 staff eng" },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-flight-prices",
    title: "Tracking flight prices — upcoming trips",
    status: "monitoring",
    icon: "waiting",
    project: "Travel",
    projectKey: "travel",
    labelOrigin: "manual",
    consequence: "Watching SFO routes for Aug + Sep. Will surface drops > 15%.",
    timeSensitivity: "none",
    runnerStatus: "Monitoring 4 routes. No notable drops this week.",
    nextAction: "Wait — I'll surface drops",
    source: "Auto-watch — flight prices",
    createdAt: "3 weeks ago",
    updatedAt: "Today 4:00 AM",
    cards: [
      card({
        type: "informational",
        state: "in-progress",
        title: "4 routes watched · drops > 15% only",
        why: "Booking windows for Aug + Sep are approaching.",
        createdAt: "3 weeks ago",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "SFO → JFK (Aug)", value: "$498", trend: "flat" },
            { label: "SFO → LHR (Sep)", value: "$842", trend: "+3%" },
            { label: "SFO → YYZ (Jun)", value: "$362", trend: "-2%" },
            { label: "SFO → SEA (Jun)", value: "$148", trend: "flat" },
          ],
        },
      }),
    ],
  },

  {
    id: "todo-bq-data-quality",
    title: "BigQuery data quality monitor",
    status: "monitoring",
    icon: "waiting",
    project: "Analytics",
    projectKey: "platform",
    labelOrigin: "suggested",
    consequence: "Daily integrity checks on analytics tables. Paused since Sunday.",
    timeSensitivity: "none",
    runnerStatus: "Paused — last check Sun 6:00 AM. Resume to keep daily integrity checks running.",
    nextAction: "Paused — resume to continue",
    source: "Auto-monitor — analytics tables",
    paused: true,
    createdAt: "2 months ago",
    updatedAt: "Sun 6:00 AM",
    cards: [
      card({
        type: "informational",
        state: "in-progress",
        title: "Daily integrity checks — 5 tables",
        why: "Catches schema drift, null spikes, and row-count cliffs before they break downstream queries.",
        createdAt: "2 months ago",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Tables checked", value: "5" },
            { label: "Anomalies today", value: "0" },
            { label: "Last alert", value: "6 days ago" },
          ],
        },
      }),
    ],
  },

  // ── Archived: completed projects from Charlie's recent history ─────────────
  {
    id: "todo-archive-email-may3",
    title: "Email triage — May 3 batch (50)",
    status: "archived",
    icon: "waiting",
    project: "Inbox",
    projectKey: "inbox",
    runnerStatus: "Drafted 14 replies, archived 31 noise emails, flagged 5 for review.",
    createdAt: "May 3",
    updatedAt: "May 3",
    resolvedAt: "May 3",
    resolutionKind: "completed",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Pulled 50 unread from the May 3 batch",
        why: "Morning sweep — everything that landed overnight.",
        createdAt: "May 3 8:02 AM",
        resolution: { kind: "accepted", at: "May 3 8:02 AM" },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Classified all 50",
        why: "Routed each email by the patterns from your last six weeks of triage.",
        evidence: "Reply / Noise / Needs your eyes — your usual three buckets.",
        createdAt: "May 3 8:06 AM",
        resolution: { kind: "accepted", at: "May 3 8:06 AM" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Needs a reply", value: "14" },
            { label: "Noise / newsletter", value: "31" },
            { label: "Needs your eyes", value: "5" },
          ],
        },
      }),
      card({
        type: "approval",
        state: "resolved",
        title: "Drafted 14 replies",
        why: "Short, on your tone. Two over 80 words held for your review.",
        whatHappens: "Sent on your approval; replies threaded back to the originals.",
        createdAt: "May 3 8:18 AM",
        resolution: {
          kind: "accepted",
          at: "May 3 9:41 AM",
          note: "Two reworded, rest approved as-is.",
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Archived 31 noise emails",
        why: "Newsletters, receipts, recruiter blasts — same patterns as last week's sweep.",
        createdAt: "May 3 8:21 AM",
        resolution: { kind: "accepted", at: "May 3 8:21 AM" },
      }),
      card({
        type: "follow-up",
        state: "resolved",
        title: "Flagged 5 for your review",
        why: "Three vendor contracts, one board outreach, one personal — outside my confidence.",
        createdAt: "May 3 8:22 AM",
        resolution: {
          kind: "accepted",
          at: "May 3 8:22 AM",
          note: "Added to your review queue.",
        },
      }),
    ],
  },
  {
    id: "todo-archive-sfo-ord",
    title: "Booked SFO → Chicago for May 14",
    status: "archived",
    icon: "waiting",
    project: "Travel",
    projectKey: "travel",
    runnerStatus: "United UA-2241 nonstop, $362, lands 2:55pm. Aisle 12B.",
    createdAt: "May 5",
    updatedAt: "May 5",
    resolvedAt: "May 5",
    resolutionKind: "completed",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Searched flights SFO → ORD, May 14",
        why: "You need to be at the venue by 4pm — anything landing before 3 works.",
        createdAt: "May 5 11:14 AM",
        resolution: { kind: "accepted", at: "May 5 11:14 AM" },
        artifact: {
          kind: "options",
          intro: "Three options that land before 3pm. United nonstop is cleanest.",
          options: [
            {
              id: "ua-2241",
              title: "United UA-2241 — nonstop",
              meta: "08:40 SFO → 14:55 ORD · $362",
              notes: "Nonstop, lands 2:55pm. Cheapest nonstop.",
            },
            {
              id: "aa-1156",
              title: "American AA-1156 — nonstop",
              meta: "07:15 SFO → 13:25 ORD · $398",
              notes: "Earlier arrival, slightly more expensive.",
            },
            {
              id: "dl-5530",
              title: "Delta DL-5530 — 1 stop (MSP)",
              meta: "06:00 SFO → 14:48 ORD · $341",
              notes: "Cheapest but tight MSP layover.",
            },
          ],
          selectedOptionId: "ua-2241",
        },
      }),
      card({
        type: "decision",
        state: "resolved",
        title: "Picked UA-2241",
        why: "Nonstop, lands 2:55pm — clean buffer to the 4pm venue start. $362 is under cap.",
        createdAt: "May 5 11:16 AM",
        resolution: {
          kind: "accepted",
          at: "May 5 11:17 AM",
          note: "Confirmed nonstop over earlier AA-1156.",
          chosenOptionId: "ua-2241",
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Booked seat 12B (aisle)",
        why: "Aisle near the front per your usual preference.",
        createdAt: "May 5 11:18 AM",
        resolution: { kind: "accepted", at: "May 5 11:19 AM" },
        artifact: {
          kind: "attachments",
          items: [
            {
              label: "United UA-2241 — confirmation",
              meta: "Confirmation HGM4PQ · added to Calendar",
            },
          ],
        },
      }),
    ],
  },
  {
    id: "todo-archive-q4-budget",
    title: "Q4 Budget — column B summed in B15",
    status: "archived",
    icon: "waiting",
    project: "Analytics",
    projectKey: "platform",
    runnerStatus: "B15 = SUM(B2:B14) = $487,512. Currency format applied.",
    createdAt: "Apr 28",
    updatedAt: "Apr 28",
    resolvedAt: "Apr 28",
    resolutionKind: "completed",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Inspected column B (B2:B14)",
        why: "Q4 line items spanned 13 rows — last value in B14, B15 empty.",
        createdAt: "Apr 28 2:11 PM",
        resolution: { kind: "accepted", at: "Apr 28 2:11 PM" },
      }),
      card({
        type: "approval",
        state: "resolved",
        title: "Wrote =SUM(B2:B14) into B15",
        why: "Standard column total for the Q4 sheet.",
        whatHappens: "Cell formula committed; recalculated to $487,512.",
        createdAt: "Apr 28 2:12 PM",
        resolution: {
          kind: "accepted",
          at: "Apr 28 2:12 PM",
          note: "Result: $487,512.",
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Applied USD currency format to B15",
        why: "Matched the existing column B formatting.",
        createdAt: "Apr 28 2:13 PM",
        resolution: { kind: "accepted", at: "Apr 28 2:13 PM" },
      }),
    ],
  },
  {
    id: "todo-archive-apr27-notes",
    title: "Meeting Notes (Apr 27) — Action Items added",
    status: "archived",
    icon: "waiting",
    project: "Board Prep",
    projectKey: "board",
    runnerStatus: "Added blank Action Items section using the existing H2 style.",
    createdAt: "Apr 28",
    updatedAt: "Apr 28",
    resolvedAt: "Apr 28",
    resolutionKind: "completed",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Located the Apr 27 meeting doc",
        why: "Most recent doc in the Board Prep folder titled 'Meeting Notes — Apr 27'.",
        createdAt: "Apr 28 9:41 AM",
        resolution: { kind: "accepted", at: "Apr 28 9:41 AM" },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Read existing structure",
        why: "Two H2 sections present — 'Agenda' and 'Discussion'. Matched their styling.",
        createdAt: "Apr 28 9:42 AM",
        resolution: { kind: "accepted", at: "Apr 28 9:42 AM" },
      }),
      card({
        type: "approval",
        state: "resolved",
        title: "Added 'Action Items' H2 section",
        why: "Standard pattern for your meeting notes — H2 with empty bullet list ready for entries.",
        whatHappens: "Inserted below 'Discussion'; matched existing H2 style and spacing.",
        createdAt: "Apr 28 9:43 AM",
        resolution: { kind: "accepted", at: "Apr 28 9:43 AM" },
      }),
    ],
  },
  {
    id: "todo-archive-sf-house-scan",
    title: "SF house scan — 5 listings near 749 Guerrero",
    status: "archived",
    icon: "waiting",
    project: "749 Guerrero",
    projectKey: "rent",
    runnerStatus: "Top 5 surfaced; two with open houses scheduled.",
    createdAt: "May 5",
    updatedAt: "May 5",
    resolvedAt: "May 5",
    resolutionKind: "completed",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Pulled 14 listings within 0.6 mi of 749 Guerrero",
        why: "Your scan radius from the last sweep — Mission and the western edge of Castro.",
        createdAt: "May 5 7:12 AM",
        resolution: { kind: "accepted", at: "May 5 7:12 AM" },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Filtered to top 5",
        why: "≥ 2BR, under $1.6M, no HOA over $600, walkable to Guerrero Park.",
        createdAt: "May 5 7:14 AM",
        resolution: { kind: "accepted", at: "May 5 7:14 AM" },
        artifact: {
          kind: "options",
          intro: "Top 5 after your usual filters.",
          options: [
            {
              id: "h-21st",
              title: "742 21st St",
              meta: "$1.48M · 2BR/2BA · 0.3 mi",
              notes: "Open Sunday — RSVP'd.",
            },
            {
              id: "h-noe",
              title: "1305 Noe St",
              meta: "$1.55M · 3BR/2BA · 0.5 mi",
              notes: "Open Saturday — RSVP'd.",
            },
            {
              id: "h-hill",
              title: "418 Hill St",
              meta: "$1.39M · 2BR/1BA · 0.4 mi",
              notes: "No open house scheduled.",
            },
            {
              id: "h-fair",
              title: "62 Fair Oaks",
              meta: "$1.59M · 2BR/2BA · 0.2 mi",
              notes: "By appointment only.",
            },
            {
              id: "h-25th",
              title: "236 25th St",
              meta: "$1.45M · 2BR/2BA · 0.6 mi",
              notes: "No open house scheduled.",
            },
          ],
        },
      }),
      card({
        type: "follow-up",
        state: "resolved",
        title: "Scheduled two open-house visits",
        why: "742 21st (Sun 1pm) and 1305 Noe (Sat 11am) both fit your weekend.",
        createdAt: "May 5 7:18 AM",
        resolution: {
          kind: "accepted",
          at: "May 5 7:19 AM",
          note: "Added to Calendar with addresses and notes.",
        },
      }),
    ],
  },
  {
    id: "todo-archive-poem-sent",
    title: "Poem email sent to Yitong",
    status: "archived",
    icon: "waiting",
    project: "Inbox",
    projectKey: "inbox",
    runnerStatus: "Drafted six lines, light spring theme. Sent with signoff 'c'.",
    createdAt: "May 6",
    updatedAt: "May 6",
    resolvedAt: "May 6",
    resolutionKind: "completed",
    cards: [
      card({
        type: "approval",
        state: "resolved",
        title: "Drafted a six-line poem",
        why: "Light spring theme per your nudge — kept it short and a little playful.",
        createdAt: "May 6 8:51 PM",
        resolution: {
          kind: "accepted",
          at: "May 6 9:02 PM",
          note: "Approved as drafted; no edits.",
        },
        artifact: {
          kind: "note",
          body:
            "magnolia petals\nresting on the windshield\nsmall act of weather\n\nlilac on the avenue\nremembering the year\nwe walked past it twice",
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Sent to Yitong",
        why: "Sent with signoff 'c' as in past poems thread.",
        createdAt: "May 6 9:02 PM",
        resolution: { kind: "accepted", at: "May 6 9:02 PM" },
        artifact: {
          kind: "email",
          to: "yitong@yhliu.com",
          subject: "a small one for spring",
          body:
            "magnolia petals\nresting on the windshield\nsmall act of weather\n\nlilac on the avenue\nremembering the year\nwe walked past it twice\n\nc",
        },
      }),
    ],
  },
  {
    id: "todo-archive-voteagora-validation",
    title: "Email validation — charlie@voteagora.com",
    status: "archived",
    icon: "waiting",
    project: "Inbox",
    projectKey: "inbox",
    runnerStatus: "MX records resolve cleanly. No disposable/catch-all signal.",
    createdAt: "May 6",
    updatedAt: "May 6",
    resolvedAt: "May 6",
    resolutionKind: "completed",
    cards: [
      card({
        type: "informational",
        state: "resolved",
        title: "Resolved MX records for voteagora.com",
        why: "Confirms the domain actually accepts mail — first sanity check.",
        createdAt: "May 6 10:14 AM",
        resolution: { kind: "accepted", at: "May 6 10:14 AM" },
        artifact: {
          kind: "metrics",
          rows: [
            { label: "MX hosts", value: "Google Workspace (3)" },
            { label: "SPF", value: "pass" },
            { label: "DMARC", value: "p=quarantine" },
          ],
        },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Checked disposable/catch-all signals",
        why: "Catches throwaway domains and broad catch-all inboxes that send false positives.",
        evidence: "Cross-referenced disposable-domain list and SMTP catch-all probe.",
        createdAt: "May 6 10:15 AM",
        resolution: { kind: "accepted", at: "May 6 10:15 AM" },
      }),
      card({
        type: "informational",
        state: "resolved",
        title: "Returned clean validation",
        why: "All three checks passed — safe to add to the contacts list.",
        createdAt: "May 6 10:16 AM",
        resolution: {
          kind: "accepted",
          at: "May 6 10:16 AM",
          note: "Marked verified · added to contacts.",
        },
      }),
    ],
  },
];

export const SEED_RECENTLY_ADVANCED: { id: string; title: string; note: string; ago: string }[] = [
  { id: "adv-yitong-prep", title: "Yitong prep", note: "Summarized thread 19 of 27", ago: "Just now" },
  { id: "adv-receipts", title: "Receipts label", note: "Labeled 2 receipts", ago: "30m ago" },
  { id: "adv-investor-theme", title: "Investor digest", note: "Locked theme 2 — Acme onboarding signal", ago: "12m ago" },
  { id: "adv-deck-data", title: "Expedia case study research", note: "Pulled Ramp W1 activation: 58%", ago: "45m ago" },
  { id: "adv-toronto-crawl", title: "Toronto crawl", note: "2 new matches added to shortlist", ago: "Today 6:32 AM" },
  { id: "adv-archive-sweep", title: "Inbox sweep", note: "Archived 11 newsletters", ago: "Today 7:02 AM" },
  { id: "adv-narrative", title: "April investor update", note: "Drafted narrative", ago: "Yesterday 6:18 PM" },
  { id: "adv-deals", title: "Q1 analytics", note: "Pulled deals pipeline by stage", ago: "Yesterday" },
  { id: "adv-inbox-classify", title: "Inbox triage — top 50", note: "Classified all 50 emails", ago: "Today 8:04 AM" },
  { id: "adv-toronto-showings", title: "Toronto apartment hunt", note: "Booked 88 Front + 60 Yonge showings", ago: "Yesterday" },
];
