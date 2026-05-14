import type {
  MonitorTriggerKind,
  RunnerActionCard,
  RunnerTodo,
} from "./runnerData";

export interface SubscriptionDefinition {
  labels?: string[];
  nlQuery?: string;
}

export interface DashboardSubscription {
  id: string;
  name: string;
  projects: string[];
  summary: string;
  latelyNote?: string;
  members?: string[];
  definition?: SubscriptionDefinition;
  candidates?: string[];
  archived?: boolean;
}

export const SEED_SUBSCRIPTIONS: DashboardSubscription[] = [
  {
    id: "sub-personal-life",
    name: "Personal Life",
    projects: ["Travel", "Personal", "749 Guerrero"],
    summary:
      "Toronto trip is the big open question — three friends can't do the original week, so dates aren't locked. Chicago hotel needs a call between Conrad ($80/night over) and two cheaper options. May rent is one routing number away from filed.",
    members: [
      "todo-chicago-hotel",
      "todo-toronto-3bd",
      "todo-summer-trip",
      "todo-rent-may",
      "todo-flight-prices",
    ],
    candidates: [
      "todo-meeting-briefs",
      "todo-toronto-hunt",
      "todo-toronto-crawl",
    ],
  },
  {
    id: "sub-investor-board",
    name: "Investor + Board",
    projects: ["Investor update", "Board Prep"],
    summary:
      "April investor update is drafted and the metrics are pulled — it can't go out until you pick a cover chart, and the Friday send window is at risk if today slips. Board prep is in good shape except the finance pack from Maria.",
    members: ["todo-investor-update", "todo-board-prep", "todo-bq-data-quality"],
    candidates: [
      "todo-investor-digest",
      "todo-q4-deck",
      "todo-deck-case-research",
    ],
  },
  {
    id: "sub-sales-platform",
    name: "Sales & Platform",
    projects: ["Sales", "Analytics", "Platform"],
    summary:
      "Q1 analytics memo is ready to circulate after a skim. Expedia deck is 10 slides in, waiting on which case study to drop into slide 6. The Superman GDoc is rebuilt and only needs an audience pick before sharing.",
    members: [
      "todo-q1-analytics",
      "todo-expedia-deck",
      "todo-superman-gdoc",
      "todo-comp-watch",
    ],
    candidates: ["todo-gmail-style", "todo-fjor-email"],
  },
  {
    id: "sub-og-guild",
    name: "OG Guild",
    projects: ["OG Guild"],
    summary:
      "Chicago meetup is Saturday — outreach is in flight, stickers need a design pick, and the hotel block has 4 RSVPs outstanding before the hold lapses Friday.",
    members: [
      "todo-og-outreach",
      "todo-og-stickers",
      "todo-og-hotel-block",
      "todo-og-rsvp-watch",
    ],
    candidates: [],
  },
];

export function todosInSubscription(
  sub: DashboardSubscription,
  todos: RunnerTodo[],
): RunnerTodo[] {
  if (sub.members && sub.members.length > 0) {
    const order = new Map(sub.members.map((id, i) => [id, i] as const));
    return todos
      .filter((t) => order.has(t.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
  if (sub.projects.length === 0) return [];
  const set = new Set(sub.projects);
  return todos.filter((t) => t.project !== undefined && set.has(t.project));
}

export function monitorsInSubscription(
  sub: DashboardSubscription,
  todos: RunnerTodo[],
): RunnerTodo[] {
  return todosInSubscription(sub, todos).filter(
    (t) => t.status === "monitoring",
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// NL_QUERIES — scripted full-sentence filters. The dropdown of "recent queries"
// in the subscription prototype's list view picks from these. Each maps to a
// predicate over RunnerTodo[] and a suggestedName used when the user clicks
// "Subscribe to this set."
// ──────────────────────────────────────────────────────────────────────────────

export interface NLQueryEntry {
  query: string;
  suggestedName: string;
  predicate: (todos: RunnerTodo[]) => RunnerTodo[];
}

const matchText = (t: RunnerTodo, re: RegExp) =>
  re.test(t.title) || (!!t.source && re.test(t.source));

export const NL_QUERIES: NLQueryEntry[] = [
  {
    query: "What are all the items related to the OG Guild event?",
    suggestedName: "OG Guild",
    predicate: (todos) =>
      todos.filter(
        (t) =>
          t.project === "OG Guild" ||
          (t.tags ?? []).includes("OG Guild") ||
          matchText(t, /og guild|chicago meetup|stickers|conrad|rsvp/i),
      ),
  },
  {
    query: "What's happening with the investor update?",
    suggestedName: "Investor + Board",
    predicate: (todos) =>
      todos.filter(
        (t) =>
          t.project === "Investor update" ||
          t.project === "Board Prep" ||
          matchText(t, /investor|board|deck|update/i),
      ),
  },
  {
    query: "What needs me right now?",
    suggestedName: "Needs me",
    predicate: (todos) =>
      todos.filter((t) => t.status === "needs-you" || t.status === "blocked"),
  },
  {
    query: "What's stalled this week?",
    suggestedName: "Stalled",
    predicate: (todos) =>
      todos.filter((t) => t.status === "blocked" || t.status === "stale"),
  },
  {
    query: "What am I quietly watching?",
    suggestedName: "Quietly watching",
    predicate: (todos) => todos.filter((t) => t.status === "monitoring"),
  },
  {
    query: "Anything travel-related?",
    suggestedName: "Travel",
    predicate: (todos) =>
      todos.filter(
        (t) =>
          t.project === "Travel" ||
          (t.tags ?? []).includes("Travel") ||
          matchText(t, /chicago|toronto|flight|hotel|trip|expedia/i),
      ),
  },
];

export function availableLabels(todos: RunnerTodo[]): string[] {
  const set = new Set<string>();
  todos.forEach((t) => {
    if (t.project) set.add(t.project);
    (t.tags ?? []).forEach((tag) => set.add(tag));
  });
  return Array.from(set).sort();
}

export function applyTagOverlay(todos: RunnerTodo[]): RunnerTodo[] {
  const TAG_MAP: Record<string, string[]> = {
    "todo-chicago-hotel": ["Travel", "OG Guild"],
    "todo-og-hotel-block": ["Travel", "OG Guild"],
    "todo-og-outreach": ["OG Guild"],
    "todo-og-stickers": ["OG Guild"],
    "todo-og-rsvp-watch": ["OG Guild"],
    "todo-toronto-3bd": ["Travel"],
    "todo-summer-trip": ["Travel"],
    "todo-flight-prices": ["Travel"],
  };
  return todos.map((t) =>
    TAG_MAP[t.id] ? { ...t, tags: TAG_MAP[t.id] } : t,
  );
}

export interface MonitorMetadata {
  trigger: string;
  triggerKind: MonitorTriggerKind;
  nextTrigger?: string;
}

const MONITOR_META: Record<string, MonitorMetadata> = {
  "todo-comp-watch": {
    trigger: "weekly Mondays",
    triggerKind: "time",
    nextTrigger: "Mon May 18, 9:00 AM",
  },
  "todo-flight-prices": {
    trigger: "every 15m during market hours",
    triggerKind: "time",
    nextTrigger: "5:00 PM",
  },
  "todo-bq-data-quality": {
    trigger: "daily 6:00 AM",
    triggerKind: "time",
    nextTrigger: "Tomorrow 6:00 AM",
  },
  "todo-og-rsvp-watch": {
    trigger: "hourly until Friday cutoff",
    triggerKind: "time",
    nextTrigger: "in 38m",
  },
  "todo-meeting-briefs": {
    trigger: "30m before each external meeting",
    triggerKind: "calendar",
    nextTrigger: "Tomorrow 1:30 PM — Sarah Chen (Acme)",
  },
};

export function applyMonitorMetadata(todos: RunnerTodo[]): RunnerTodo[] {
  return todos.map((t) => {
    const meta = MONITOR_META[t.id];
    if (!meta) return t;
    return { ...t, ...meta };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// MONITOR_SETUP_PROMPTS — scripted NL prompts for setting up a new monitor.
// Each prompt maps to a pre-built monitor config (the new monitoring todo and
// its initial approval card). Used by MonitorSetupPrompt and proposeMonitor().
// ──────────────────────────────────────────────────────────────────────────────

export interface MonitorSetupConfig {
  todoTitle: string;
  project: string;
  trigger: string;
  triggerKind: MonitorTriggerKind;
  nextTrigger: string;
  consequence: string;
  approvalTitle: string;
  approvalWhy: string;
  approvalWhatHappens: string;
}

export const MONITOR_SETUP_PROMPTS: { prompt: string; config: MonitorSetupConfig }[] = [
  {
    prompt: "Watch SFO → YYZ for drops > 15% hourly",
    config: {
      todoTitle: "Tracking SFO → YYZ fares",
      project: "Travel",
      trigger: "hourly",
      triggerKind: "time",
      nextTrigger: "Top of hour",
      consequence: "Toronto fares ratchet up after a dip. Catching one early saves $80–120.",
      approvalTitle: "I'll check SFO → YYZ hourly and alert on drops > 15%. Accept?",
      approvalWhy:
        "Fares are climbing. A 15% drop is the threshold where booking pays off vs. waiting.",
      approvalWhatHappens:
        "On accept, I'll start the watch and surface a card any time a drop > 15% lands. Quiet hours stay in the activity log.",
    },
  },
  {
    prompt: "Brief me on the other person 30 min before each external meeting",
    config: {
      todoTitle: "Pre-meeting briefs",
      project: "Operations",
      trigger: "30m before each external meeting",
      triggerKind: "calendar",
      nextTrigger: "Tomorrow 1:30 PM — Sarah Chen (Acme)",
      consequence:
        "Walking into a meeting cold costs the first 5 minutes. A one-page brief recovers that.",
      approvalTitle:
        "I'll generate a one-page brief 30 min before each external meeting. Accept?",
      approvalWhy:
        "External attendees are where context matters most — past emails, last touch, recent news.",
      approvalWhatHappens:
        "I'll surface a brief card 30m before each external meeting. Internal meetings stay quiet.",
    },
  },
  {
    prompt: "Daily morning summary of my unread Slack DMs",
    config: {
      todoTitle: "Daily Slack DM summary",
      project: "Operations",
      trigger: "daily 8:00 AM",
      triggerKind: "time",
      nextTrigger: "Tomorrow 8:00 AM",
      consequence: "Unread DMs accumulate quietly. A daily roll-up catches the ones that matter.",
      approvalTitle: "I'll send a morning summary of unread Slack DMs every day at 8am. Accept?",
      approvalWhy:
        "DMs are where async asks live. A daily summary keeps them from rotting in the unread pile.",
      approvalWhatHappens:
        "On accept, the first summary lands tomorrow at 8am with priority + sender + snippet per thread.",
    },
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// OG Guild seed todos — Chicago meetup on Saturday May 18. Lives here instead
// of runnerData.ts so the original /dashboard-todolist prototype stays clean.
// ──────────────────────────────────────────────────────────────────────────────

export const SUBSCRIPTION_EXTRA_TODOS: RunnerTodo[] = [
  {
    id: "todo-og-outreach",
    title: "Reach out to 12 guild members before Saturday's meetup",
    status: "needs-you",
    icon: "attention",
    project: "OG Guild",
    projectKey: "personal",
    labelOrigin: "manual",
    consequence:
      "First-touch window is closing — the quieter members won't reply if pinged later than Wednesday.",
    timeSensitivity: "today",
    runnerStatus:
      "12 drafts ready, on your tone. 4 are to people you haven't seen in 6+ months.",
    nextAction: "Approve or edit drafts",
    source: "OG Guild Chicago meetup — May 18",
    createdAt: "2 days ago",
    updatedAt: "1h ago",
    cards: [
      {
        id: "card-og-outreach-1",
        type: "informational",
        state: "resolved",
        title: "Pulled 12 names ranked by time since last contact",
        why: "Quieter members go first — they're least likely to reply if pinged late.",
        createdAt: "2 days ago",
        resolution: { kind: "accepted", at: "2 days ago" },
        artifact: {
          kind: "people",
          entries: [
            { name: "Hannah Liu", meta: "Last contact: 8 months ago", note: "Direct DM — used to send postcards" },
            { name: "Marcus Wei", meta: "Last contact: 7 months ago", note: "Reply-to-last-thread, his book launch" },
            { name: "Yitong Park", meta: "Last contact: 6 months ago", note: "Personal note, ask about her parents" },
            { name: "Priya Shah", meta: "Last contact: 5 months ago", note: "Reference Bangalore trip plan" },
            { name: "8 others", meta: "Last contact: 2–4 months ago", note: "Lighter touch, group-shaped" },
          ],
        },
      },
      {
        id: "card-og-outreach-2",
        type: "approval",
        state: "open",
        title: "12 drafts ready — Hannah, Marcus, Yitong, Priya are the time-sensitive ones",
        why: "Short, on your tone. Personalized hooks where I had recent context.",
        whatHappens: "Sent on your approval; threaded into existing chat history where possible.",
        createdAt: "1h ago",
        artifact: {
          kind: "drafts",
          intro: "Top 4 are the time-sensitive ones (6+ months since last contact). Edit any inline.",
          channel: "DM where I had recent context · email otherwise",
          defaultFrom: "yitong@runner.now",
          previewCount: 4,
          entries: [
            {
              recipient: "Hannah Liu",
              recipientMeta: "Direct DM · 8mo since last contact",
              hook: "Used to trade postcards — kept it warm.",
              to: "hannah.liu@gmail.com",
              subject: "Re: OG Chicago — Saturday",
              body:
                "hannah — long time. doing a quick OG thing in chicago saturday, would be good to see you. low key, dinner-ish around six at the conrad bar. block of rooms held if you want one.",
            },
            {
              recipient: "Marcus Wei",
              recipientMeta: "Reply on book-launch thread · 7mo since last contact",
              hook: "His book launched in February — good thread to land in.",
              to: "marcus@marcuswei.co",
              subject: "Re: the book — and chicago saturday",
              body:
                "marcus — saw the book launched, proud of you. doing an OG meetup in chicago saturday — would love to actually clink something with you over it. room in the conrad block is yours if travel works.",
            },
            {
              recipient: "Yitong Park",
              recipientMeta: "Personal email · 6mo since last contact",
              hook: "Her parents were in the hospital last fall — open with that.",
              to: "yitong.park@protonmail.com",
              subject: "Thinking of you — OG chicago this saturday",
              body:
                "yitong — been thinking about you. how are your parents doing? we're doing a small OG thing in chicago saturday — would be good to see you in person. block at the conrad if travel works.",
            },
            {
              recipient: "Priya Shah",
              recipientMeta: "DM on the bangalore-trip thread · 5mo since last contact",
              hook: "Bangalore plan never landed — easy bridge.",
              to: "priya.shah@gmail.com",
              subject: "OG chicago saturday — easier than bangalore?",
              body:
                "priya — did the bangalore plan ever happen? doing an OG meetup in chicago saturday and between the two trips this one might be easier to swing. block at the conrad.",
            },
            {
              recipient: "Devon Carter",
              recipientMeta: "Group-shaped DM · 4mo since last contact",
              body:
                "devon — short notice — OG meetup in chicago saturday. low key, no programming, just dinner-ish. block at the conrad if you can make it work.",
            },
            {
              recipient: "Ana Reyes",
              recipientMeta: "Reply on old thread · 3mo since last contact",
              body:
                "ana — doing a small OG thing in chicago saturday. would be good to see you. block at the conrad, six-ish.",
            },
            {
              recipient: "Theo Park",
              recipientMeta: "Group-shaped DM · 3mo since last contact",
              body:
                "theo — OG meetup chicago saturday — last minute but it's coming together. block at the conrad if you need a room.",
            },
            {
              recipient: "Lena Schmidt",
              recipientMeta: "Email · 3mo since last contact",
              body:
                "lena — quick one. OG getting together in chicago saturday. would love to have you. block at the conrad if travel makes sense.",
            },
            {
              recipient: "Owen Kim",
              recipientMeta: "Group-shaped DM · 2mo since last contact",
              body:
                "owen — doing OG in chicago saturday. low key, dinner-ish. block at the conrad — let me know.",
            },
            {
              recipient: "Maya Tran",
              recipientMeta: "DM · 2mo since last contact",
              body:
                "maya — chicago saturday for OG. small, casual. block at the conrad if you need a room. would be good to see you.",
            },
            {
              recipient: "Sasha Polotsky",
              recipientMeta: "Group-shaped DM · 2mo since last contact",
              body:
                "sasha — OG meetup chicago saturday, dinner near the conrad. room in the block if you need one. would be great to have you.",
            },
            {
              recipient: "Niko Chen",
              recipientMeta: "DM · 2mo since last contact",
              body:
                "niko — quick — OG getting together in chicago saturday. would love to have you. block at the conrad.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "todo-og-stickers",
    title: "Pick a sticker design for the meetup",
    status: "needs-you",
    icon: "attention",
    project: "OG Guild",
    projectKey: "personal",
    labelOrigin: "manual",
    consequence:
      "Stickers need 5 business days to print + ship to the venue. Friday is the print cutoff.",
    timeSensitivity: "tomorrow",
    runnerStatus:
      "Maya delivered 3 design options. Vendor quotes locked at $1.20–$1.80/sticker for 100.",
    nextAction: "Pick a design + vendor",
    source: "OG Guild Chicago meetup",
    createdAt: "4 days ago",
    updatedAt: "Yesterday",
    cards: [
      {
        id: "card-og-stickers-1",
        type: "informational",
        state: "resolved",
        title: "Maya delivered 3 design options",
        why: "Reused the founders' logo from the 2019 retro deck — felt right for the OG audience.",
        createdAt: "Yesterday",
        resolution: { kind: "accepted", at: "Yesterday" },
        artifact: {
          kind: "options",
          intro: "Three takes — same logo, different treatments.",
          options: [
            { id: "sticker-clean", title: "Clean monochrome", meta: "Black on cream · matte", notes: "Most legible at small size. Reads as the original mark." },
            { id: "sticker-holo", title: "Holographic foil", meta: "Foil over black · gloss", notes: "Premium feel. ~$1.80/sticker, longest lead time." },
            { id: "sticker-die", title: "Die-cut shaped", meta: "Logo silhouette · matte", notes: "Most fun to peel. $1.40/sticker, 5-day turnaround." },
          ],
        },
      },
      {
        id: "card-og-stickers-2",
        type: "decision",
        state: "open",
        title: "Pick a design + lock the vendor",
        why: "Print + ship to Chicago takes 5 business days. Friday is the cutoff to make Saturday.",
        whatHappens: "I'll place the order and ship to the Conrad front desk.",
        createdAt: "Yesterday",
        options: [
          { id: "sticker-clean", label: "Clean monochrome — StickerMule" },
          { id: "sticker-die", label: "Die-cut shaped — StickerMule", primary: true },
          { id: "sticker-holo", label: "Holographic — Sticker Giant" },
        ],
        artifact: {
          kind: "options",
          intro: "Same three from Maya's drop — vendor + per-unit cost locked.",
          options: [
            {
              id: "sticker-clean",
              title: "Clean monochrome",
              meta: "StickerMule · $1.20/sticker · 5-day turnaround",
              notes: "Black on cream, matte. Most legible at small size; reads as the original mark.",
            },
            {
              id: "sticker-die",
              title: "Die-cut shaped",
              meta: "StickerMule · $1.40/sticker · 5-day turnaround",
              notes: "Logo silhouette, matte. Most fun to peel — my pick if you want OG to feel like a thing.",
            },
            {
              id: "sticker-holo",
              title: "Holographic foil",
              meta: "Sticker Giant · $1.80/sticker · 7-day turnaround",
              notes: "Foil over black, gloss. Premium feel — longest lead time, tightest against the Friday cutoff.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "todo-og-hotel-block",
    title: "Confirm Chicago hotel block — 8 rooms at Conrad",
    status: "blocked",
    icon: "blocked",
    project: "OG Guild",
    projectKey: "personal",
    labelOrigin: "manual",
    consequence:
      "Hold expires Friday — unconfirmed rooms release and the rate jumps ~$80/night.",
    timeSensitivity: "this-week",
    runnerStatus:
      "8 rooms held at Conrad, $295/night guild rate. 4 RSVPs in, 4 outstanding.",
    nextAction: "Wait — RSVPs landing",
    source: "OG Guild Chicago meetup",
    createdAt: "6 days ago",
    updatedAt: "Today 9:00 AM",
    cards: [
      {
        id: "card-og-hotel-1",
        type: "informational",
        state: "in-progress",
        title: "Block hold confirmed — Conrad, May 17–19, $295/night guild rate",
        why: "Conrad is a 6-min walk from the venue and has the only group block left in that range.",
        evidence: "Held under your name, expires Friday 5pm CT.",
        createdAt: "6 days ago",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Rooms held", value: "8" },
            { label: "Confirmed", value: "4" },
            { label: "Outstanding", value: "4" },
            { label: "Rate", value: "$295/night" },
          ],
        },
      },
      {
        id: "card-og-hotel-2",
        type: "clarification",
        state: "open",
        title: "Awaiting 4 RSVPs — Hannah confirmed, Marcus + Yitong pending, Priya unread",
        why: "Hold releases Friday; unconfirmed rooms re-list at ~$375.",
        whatHappens: "I'll release any room still pending Friday 3pm CT unless you say otherwise.",
        createdAt: "Today 9:00 AM",
        artifact: {
          kind: "people",
          entries: [
            {
              name: "Hannah Liu",
              meta: "Confirmed Apr 30",
              note: "Room locked. Arriving Friday evening, departing Sunday AM.",
            },
            {
              name: "Marcus Wei",
              meta: "Pending · last reply 2 days ago",
              note: "Said \"looking at flights\" — no follow-up. Hold expires Friday 3pm CT.",
            },
            {
              name: "Yitong Park",
              meta: "Pending · last reply yesterday",
              note: "Said \"trying to make it work\" + asked about Friday-night dinner. Awaiting confirm.",
            },
            {
              name: "Priya Shah",
              meta: "Unread · 3 pings sent (May 8, 10, 12)",
              note: "No read receipt on any. See the RSVP monitor card for ping detail.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "todo-og-rsvp-watch",
    title: "Tracking guild RSVPs for Saturday",
    status: "monitoring",
    icon: "waiting",
    project: "OG Guild",
    projectKey: "personal",
    labelOrigin: "suggested",
    consequence:
      "Watching 12 RSVPs. 8 confirmed, 4 outstanding. I'll page if anyone cancels or the hold approaches expiry.",
    timeSensitivity: "none",
    runnerStatus: "Watching guild thread + email replies. Last update 2h ago.",
    nextAction: "Wait — I'll surface late confirms or cancellations",
    source: "Auto-watch — guild RSVPs",
    createdAt: "1 week ago",
    updatedAt: "2h ago",
    lastAdvancedNote: "Yitong RSVP'd yes",
    cards: [
      {
        id: "card-og-rsvp-setup",
        type: "informational",
        state: "in-progress",
        title: "Watching 12 RSVPs across guild thread + email",
        why: "Hotel block lapses Friday, so RSVP timing is load-bearing for the hold.",
        whatHappens: "Quietly tracking. I'll surface a card when someone confirms, cancels, or goes silent past the chase window.",
        createdAt: "1 week ago",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Confirmed", value: "8" },
            { label: "Outstanding", value: "4" },
            { label: "Cancelled", value: "1" },
            { label: "Last update", value: "2h ago" },
          ],
        },
      },
      {
        id: "card-og-rsvp-1",
        type: "informational",
        state: "resolved",
        title: "Apr 30 — Hannah RSVP'd yes",
        why: "First in. Hotel room confirmed under her name.",
        createdAt: "Apr 30",
        resolution: { kind: "accepted", at: "Apr 30" },
      },
      {
        id: "card-og-rsvp-2",
        type: "informational",
        state: "resolved",
        title: "May 4 — Marcus RSVP'd yes",
        why: "Confirmed travel from Boston. Asked about Friday-night dinner availability.",
        createdAt: "May 4",
        resolution: { kind: "accepted", at: "May 4" },
      },
      {
        id: "card-og-rsvp-3",
        type: "informational",
        state: "resolved",
        title: "May 8 — Yitong RSVP'd yes",
        why: "She's bringing her partner; flagged a +1 for dinner only.",
        createdAt: "May 8",
        resolution: { kind: "accepted", at: "May 8" },
      },
      {
        id: "card-og-rsvp-4",
        type: "informational",
        state: "resolved",
        title: "May 11 — Sarah declined (work conflict)",
        why: "She's covering a launch that weekend. Sent a kind note + invited her to the next one.",
        createdAt: "May 11",
        resolution: { kind: "accepted", at: "May 11" },
      },
      {
        id: "card-og-rsvp-5",
        type: "clarification",
        state: "open",
        title: "May 12 — Priya hasn't replied to 3 pings",
        why: "Hotel hold expires Friday. If she's not coming, the room should release before the price jumps.",
        whatHappens: "On 'escalate' I'll send a direct text. On 'release' I drop her room and let the hotel re-list.",
        createdAt: "2h ago",
        options: [
          { id: "escalate", label: "Escalate — text her directly", primary: true },
          { id: "release", label: "Release her room" },
          { id: "wait", label: "Hold until Friday" },
        ],
        artifact: {
          kind: "people",
          entries: [
            {
              name: "Ping 1 — May 8, 9:12 AM",
              meta: "Guild Slack DM · delivered, unread",
              note: "\"priya — are you in for chicago saturday? holding a room for you in the block at the conrad — want to lock it before friday.\"",
            },
            {
              name: "Ping 2 — May 10, 4:30 PM",
              meta: "Email (priya@known.io) · delivered, unread",
              note: "\"hey — quick nudge on the chicago thing. block at the conrad releases friday 3pm CT. let me know either way?\"",
            },
            {
              name: "Ping 3 — May 12, 8:00 AM",
              meta: "Guild Slack DM · delivered, unread",
              note: "\"last nudge — chicago saturday. hold lapses friday afternoon. easy 'in / out' is fine.\"",
            },
            {
              name: "Signal",
              meta: "Slack: last active 2 days ago · email: last opened May 6",
              note: "She's been quiet across the board — not just to you.",
            },
          ],
        },
      },
    ],
  },

  // ── Pre-meeting briefs — calendar-triggered monitor ────────────────────────
  {
    id: "todo-meeting-briefs",
    title: "Pre-meeting briefs",
    status: "monitoring",
    icon: "waiting",
    project: "Operations",
    projectKey: "platform",
    labelOrigin: "manual",
    consequence:
      "30m before each external meeting, I'll surface a one-page brief on the other attendee.",
    timeSensitivity: "none",
    runnerStatus: "Watching your calendar. Next brief: Tomorrow 1:30 PM — Sarah Chen.",
    nextAction: "Wait — I'll surface a brief 30m before each external meeting",
    source: "Calendar — external meetings",
    createdAt: "1 week ago",
    updatedAt: "1h ago",
    trigger: "30m before each external meeting",
    triggerKind: "calendar",
    nextTrigger: "Tomorrow 1:30 PM — Sarah Chen (Acme)",
    cards: [
      {
        id: "card-mb-setup",
        type: "informational",
        state: "in-progress",
        title: "Watching 4 upcoming external meetings this week",
        why: "External attendees are where context matters most — past emails, last touch, recent news.",
        whatHappens:
          "I'll surface a brief 30m before each. Internal meetings stay quiet.",
        createdAt: "1 week ago",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Tomorrow 2:00 PM", value: "Sarah Chen (Acme)", trend: "external" },
            { label: "Thu 10:00 AM", value: "Tom Park (Series A lead)", trend: "external" },
            { label: "Thu 3:00 PM", value: "Internal — product review", trend: "skipped" },
            { label: "Fri 11:00 AM", value: "Lin Hu (Beta)", trend: "external" },
          ],
        },
      },
      {
        id: "card-mb-1",
        type: "informational",
        state: "resolved",
        title: "Apr 30 — Brief for Marcus Wei (book launch follow-up)",
        why: "Last touch 7mo ago; book launched Feb. Surfaced the launch thread + 2 recent reviews.",
        createdAt: "Apr 30 9:30 AM",
        resolution: { kind: "accepted", at: "Apr 30 10:00 AM" },
      },
      {
        id: "card-mb-2",
        type: "informational",
        state: "resolved",
        title: "May 4 — Brief for Jen Park (board update prep)",
        why: "Annual check-in. Pulled her last 3 questions from the March board meeting + her recent LinkedIn posts.",
        createdAt: "May 4 1:30 PM",
        resolution: { kind: "accepted", at: "May 4 2:00 PM" },
      },
      {
        id: "card-mb-3",
        type: "informational",
        state: "resolved",
        title: "May 7 — Brief for Acme procurement lead",
        why: "First meeting. Pulled their company news + procurement team profile + your prior touchpoint with their CTO.",
        createdAt: "May 7 9:30 AM",
        resolution: { kind: "accepted", at: "May 7 10:00 AM", note: "Closed the contract after." },
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// MONITOR_CARD_HISTORY — extra cards appended to the existing monitoring todos
// in runnerData.ts. Applied only when this prototype reads SEED_TODOS, so the
// original /dashboard-todolist sees the unmodified single-card monitors.
// ──────────────────────────────────────────────────────────────────────────────

export const MONITOR_CARD_HISTORY: Record<string, RunnerActionCard[]> = {
  "todo-comp-watch": [
    {
      id: "card-comp-origin",
      type: "informational",
      state: "resolved",
      title: "Mar 14 — Converted from one-off task",
      why:
        "Originally: 'Track competitor pricing for Q2 planning.' You asked me to keep watching after the Q2 review — converted to a weekly monitor (runs Mondays 9:00 AM).",
      createdAt: "Mar 14",
      resolution: { kind: "accepted", at: "Mar 14" },
    },
    {
      id: "card-comp-w1",
      type: "informational",
      state: "resolved",
      title: "Week of Apr 22 — Lindy quiet, Devin staffing",
      why: "Weekly digest. Nothing material this week beyond Devin's hiring page.",
      createdAt: "Apr 22",
      resolution: { kind: "accepted", at: "Apr 22" },
    },
    {
      id: "card-comp-w2",
      type: "informational",
      state: "resolved",
      title: "Week of Apr 29 — Replit Series F rumor",
      why: "Crunchbase whisper of $200M Series F. No primary source yet — keeping on watch.",
      createdAt: "Apr 29",
      resolution: { kind: "accepted", at: "Apr 29" },
    },
    {
      id: "card-comp-w3",
      type: "informational",
      state: "resolved",
      title: "Week of May 6 — Cursor lowered enterprise floor",
      why: "Cursor dropped their enterprise floor from $40/seat to $32/seat. First public move on enterprise pricing in months.",
      createdAt: "May 6",
      resolution: { kind: "accepted", at: "May 6", note: "Acked — discuss at Mon planning." },
    },
    {
      id: "card-comp-w4",
      type: "decision",
      state: "open",
      title: "Week of May 13 — 2 material moves, pricing alignment?",
      why: "Cursor's floor cut now has follow-on: Replit posted a 'usage-based' tier today. Both moves push the market toward the floor we hold.",
      whatHappens: "Pick a stance. I'll draft a short Slack to the pricing channel either way.",
      createdAt: "Today",
      options: [
        { id: "match", label: "Match — lower our floor to $32/seat", primary: true },
        { id: "hold", label: "Hold our floor; differentiate on plan tier" },
        { id: "discuss", label: "Pull into Monday pricing review" },
      ],
      artifact: {
        kind: "people",
        entries: [
          {
            name: "Cursor Composer",
            meta: "May 6 — enterprise floor: $40 → $32/seat",
            note: "First public move on enterprise pricing in months. Sourced from their pricing page diff + sales-deck leak in /r/cursor. Targets the 50-200 seat band — directly overlaps ours.",
          },
          {
            name: "Replit Agents",
            meta: "Today — new 'usage-based' tier",
            note: "Posted today: $0 monthly + $0.18/run agent-execution metering. Floor reads as $0 to a buyer doing a POC. Sourced from their blog + a CRO post on LinkedIn.",
          },
          {
            name: "Our floor (today)",
            meta: "Enterprise: $38/seat · per-seat only",
            note: "Cursor undercuts our seat price by ~16%. Replit undercuts the entry path entirely — different shape but same buyer impression at trial.",
          },
        ],
      },
    },
  ],
  "todo-flight-prices": [
    {
      id: "card-flt-q1",
      type: "informational",
      state: "resolved",
      title: "Apr 21 — quiet, no fares moved > 15%",
      why: "Watched 4 routes through the week.",
      createdAt: "Apr 21",
      resolution: { kind: "accepted", at: "Apr 21" },
    },
    {
      id: "card-flt-1",
      type: "informational",
      state: "resolved",
      title: "Apr 28 — SFO → SEA dropped 22% to $115",
      why: "Below the threshold. Booked your Father's Day weekend trip on the fare.",
      createdAt: "Apr 28",
      resolution: { kind: "accepted", at: "Apr 28", note: "Booked aisle 14B." },
    },
    {
      id: "card-flt-q2",
      type: "informational",
      state: "resolved",
      title: "May 5 — quiet, no fares moved > 15%",
      why: "All 4 routes within 5% of baseline.",
      createdAt: "May 5",
      resolution: { kind: "accepted", at: "May 5" },
    },
    {
      id: "card-flt-q3",
      type: "informational",
      state: "resolved",
      title: "May 8 — quiet, no fares moved > 15%",
      why: "JFK and LHR flat; YYZ climbed 6%; SEA flat.",
      createdAt: "May 8",
      resolution: { kind: "accepted", at: "May 8" },
    },
    {
      id: "card-flt-2",
      type: "decision",
      state: "open",
      title: "May 11 — SFO → YYZ dropped 18% to $297",
      why: "Toronto fares have been climbing for 3 weeks; this is the first meaningful dip. Likely the booking window before the next bump.",
      whatHappens: "I'll book if you say go. Otherwise I'll keep watching but Toronto fares tend to ratchet up after a dip.",
      createdAt: "Today 6:00 AM",
      options: [
        { id: "book-yyz", label: "Book it — $297 nonstop", primary: true },
        { id: "wait-yyz", label: "Wait, watch one more cycle" },
        { id: "stop-yyz", label: "Stop watching this route" },
      ],
      artifact: {
        kind: "metrics",
        rows: [
          { label: "Today (May 11)", value: "$297", trend: "-18% vs. yesterday" },
          { label: "Apr 28", value: "$362", trend: "+6%" },
          { label: "Apr 14", value: "$342", trend: "+12%" },
          { label: "Apr 1", value: "$305", trend: "baseline" },
          { label: "Flight", value: "UA-704 nonstop", trend: "SFO 09:15 → YYZ 17:45" },
          { label: "Trip", value: "Jun 4 → Jun 8", trend: "matches the Toronto-apt showings weekend" },
        ],
      },
    },
  ],
  "todo-bq-data-quality": [
    {
      id: "card-bq-1",
      type: "informational",
      state: "resolved",
      title: "May 4 — all 5 tables passed integrity checks",
      why: "Routine pass. No null spikes, no row-count cliffs, no schema drift.",
      createdAt: "May 4",
      resolution: { kind: "accepted", at: "May 4" },
    },
    {
      id: "card-bq-2",
      type: "informational",
      state: "resolved",
      title: "May 7 — null spike in events.user_id, auto-resolved",
      why: "Upstream Kafka producer skipped a column for 12 minutes. Resolved before my next check; flagging so you know it happened.",
      createdAt: "May 7",
      resolution: { kind: "accepted", at: "May 7" },
    },
    {
      id: "card-bq-3",
      type: "clarification",
      state: "open",
      title: "May 10 — users.last_login_at column dropped — schema drift",
      why: "The platform team dropped users.last_login_at without a deprecation notice. 4 downstream queries reference it.",
      whatHappens: "On 'pause' I'll halt the 4 dependent queries and notify their owners. On 'wait' I keep watching for upstream guidance.",
      createdAt: "Yesterday 5:00 AM",
      options: [
        { id: "pause-q", label: "Pause the 4 dependent queries", primary: true },
        { id: "notify", label: "Notify the owners, keep queries running" },
        { id: "wait-q", label: "Wait — platform usually re-adds within a day" },
      ],
      artifact: {
        kind: "people",
        entries: [
          {
            name: "weekly_active_users_v3",
            meta: "Owner: @analytics-eng · runs every 1h · last success 18h ago",
            note: "Powers the WAU dashboard on /metrics. Failing since the column drop. Already paged the owner once.",
          },
          {
            name: "churn_signal_daily",
            meta: "Owner: @growth · runs every 24h · last success yesterday 4am",
            note: "Feeds the retention model. last_login_at is one of 6 features — will run but with a stale feature.",
          },
          {
            name: "founders_morning_brief",
            meta: "Owner: @ceo-ops · runs daily 6am · failing today",
            note: "The brief Charlie + Yitong read each morning. Will surface a stale value or NaN if not paused.",
          },
          {
            name: "investor_update_inputs",
            meta: "Owner: @finance · runs monthly on the 1st",
            note: "Pulls last_login_at into the cohort table. Next run is June 1 — comfortable margin to fix.",
          },
        ],
      },
    },
  ],
};

export function applyMonitorHistory(todos: RunnerTodo[]): RunnerTodo[] {
  return todos.map((todo) => {
    const extras = MONITOR_CARD_HISTORY[todo.id];
    if (!extras || extras.length === 0) return todo;
    const cards = [...todo.cards, ...extras];
    const latest = extras[extras.length - 1];
    const lastResolved = [...extras].reverse().find((c) => c.state === "resolved");
    return {
      ...todo,
      cards,
      lastAdvancedNote: lastResolved?.title ?? todo.lastAdvancedNote,
      updatedAt: latest.createdAt,
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// CALLOUT_SYNTHESES — when a todo has 2+ open cards, the dashboard shouldn't
// hide the rest behind the first card's title. A hand-written synthesis line
// names both decisions in one breath so the user sees what's at stake.
// ──────────────────────────────────────────────────────────────────────────────

export const CALLOUT_SYNTHESES: Record<string, string> = {
  "todo-chicago-hotel":
    "Conrad vs 2 cheaper hotels — and Reece + Marcus still owe a final dinner ping.",
};

// ──────────────────────────────────────────────────────────────────────────────
// applyCardReplacements — patches specific cards on existing todos so the
// /dashboard-subscriptions prototype can demo richer content without touching
// runnerData.ts. The original /dashboard-todolist still reads SEED_TODOS raw.
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// applyConversionSuggestions — appends a "convert to monitor?" approval card
// to specific one-off todos so the demo can show the conversion path without
// any real interaction.
// ──────────────────────────────────────────────────────────────────────────────

const CONVERSION_SUGGESTIONS: Record<string, RunnerActionCard> = {
  "todo-toronto-3bd": {
    id: "card-toronto-convert-suggest",
    type: "approval",
    state: "open",
    title: "Want me to keep watching SFO → YYZ after we book?",
    why: "Once dates are locked, fares move quickly. A drop-monitor catches refund-and-rebook windows.",
    whatHappens:
      "On accept, I'll spawn a monitoring task that runs hourly and alerts on drops > 15% for SFO → YYZ in your trip window.",
    createdAt: "Today 10:00 AM",
    options: [
      { id: "make-monitor", label: "Yes — set up the monitor", primary: true },
      { id: "no-thanks", label: "No thanks" },
    ],
  },
};

export function applyConversionSuggestions(todos: RunnerTodo[]): RunnerTodo[] {
  return todos.map((todo) => {
    const card = CONVERSION_SUGGESTIONS[todo.id];
    if (!card) return todo;
    // Append at end so it sits at the bottom of "Needs you" (open cards).
    return { ...todo, cards: [...todo.cards, card] };
  });
}

export function applyCardReplacements(todos: RunnerTodo[]): RunnerTodo[] {
  return todos.map((todo) => {
    if (todo.id !== "todo-chicago-hotel") return todo;
    return {
      ...todo,
      cards: todo.cards.map((c) => {
        if (!c.title.startsWith("Lock dinners")) return c;
        return {
          ...c,
          type: "decision",
          title: "Lock dinners with Reece, Talia, Marcus — Kasama hold lapses Wed noon",
          why: "Talia confirmed Kasama Tue (party of 4, 7pm). Reece hasn't replied since Monday's ping about pricing. Marcus said 'maybe' on Saturday with no follow-up. Kasama's hold for 4 lapses Wednesday noon.",
          evidence:
            "Last touches — Reece: Mon 6:14pm (re: pricing thread, no dinner ack). Marcus: Sat 11:02am ('maybe — let me check work'). Talia: Tue 3:47pm (in for Saturday).",
          whatHappens:
            "Chase: a tight nudge to Reece + Marcus, hold Kasama for 4. Downsize: confirm Kasama for 3 and let R+M join later if free. Wait: revisit tomorrow morning before the hold drops.",
          options: [
            { id: "chase", label: "Chase R+M, hold Kasama for 4", primary: true },
            { id: "downsize", label: "Confirm Kasama for 3, drop R+M" },
            { id: "wait", label: "Wait — revisit tomorrow before the hold drops" },
          ],
          artifact: {
            kind: "people",
            entries: [
              {
                name: "Talia",
                meta: "Confirmed Tue 3:47pm · in the party-of-4 hold",
                note: "Already has the cal invite. Asked if we want her to bring wine.",
              },
              {
                name: "Reece",
                meta: "Last seen Mon 6:14pm · re: pricing thread",
                note: "Hasn't acknowledged the dinner ask after my Monday ping; he usually replies within a day.",
              },
              {
                name: "Marcus",
                meta: "Sat 11:02am · 'maybe — let me check work'",
                note: "Soft maybe, then quiet. He's traveling from Boston the same weekend; flights mid-Friday.",
              },
            ],
          },
        };
      }),
    };
  });
}
