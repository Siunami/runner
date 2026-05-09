import type { Artifact } from "./data";

export interface TaskEntry {
  id: string;
  label: string;
  timestamp?: string;
  artifact: Artifact;
}

const entry = (
  id: string,
  label: string,
  timestamp: string | undefined,
  artifact: Artifact,
): TaskEntry => ({ id, label, timestamp, artifact });

export const TASK_ENTRIES: Record<string, TaskEntry[]> = {
  "split-call-michael": [
    entry("call-michael-1", "Brief on Michael", "yesterday", {
      kind: "people",
      entries: [
        {
          name: "Michael Reyes",
          meta: "Staff eng candidate · referred by Priya",
          note: "10 yrs infra, ex-Stripe, building AI agent harness on the side.",
        },
      ],
    }),
    entry("call-michael-2", "Talking points", "this morning", {
      kind: "checklist",
      items: [
        { label: "Walk through scope of FDE-style role" },
        { label: "Ask about side project — what's hardest about it" },
        { label: "Probe for compensation expectations" },
        { label: "Decide whether to send a take-home" },
      ],
    }),
    entry("call-michael-3", "Pending", "Today, 3:00 PM", {
      kind: "paused",
      reason: "Call with Michael",
      awaiting: "the conversation itself",
    }),
  ],

  "split-lunch-investors": [
    entry("lunch-1", "Attendees", "yesterday", {
      kind: "people",
      entries: [
        { name: "Avani Shah", meta: "Catalyst Ventures" },
        { name: "Tom Greer", meta: "Catalyst Ventures" },
      ],
    }),
    entry("lunch-2", "Reservation", "this morning", {
      kind: "attachments",
      items: [
        { label: "Outerlands · 12:30 PM · 2 guests", meta: "Confirmation #4012" },
      ],
    }),
    entry("lunch-3", "Topics to land", undefined, {
      kind: "checklist",
      items: [
        { label: "Where the April number landed" },
        { label: "Soft pitch on the bridge round size" },
        { label: "Hiring update — 2 closes in flight" },
      ],
    }),
  ],

  "split-print-stickers": [
    entry("stickers-1", "Vendor options", "2 days ago", {
      kind: "options",
      intro: "All quoted for 500 stickers, ready by 5pm.",
      options: [
        {
          id: "fedex",
          title: "FedEx Office (Mission)",
          meta: "$84 · 4hr turnaround",
          notes: "Walk-in, no shipping risk.",
        },
        {
          id: "stickermule",
          title: "Sticker Mule",
          meta: "$62 · next-day",
          notes: "Cheaper but won't arrive in time.",
        },
        {
          id: "vinyl-sf",
          title: "Vinyl SF",
          meta: "$110 · same-day",
          notes: "Best print quality, premium pricing.",
        },
      ],
      selectedOptionId: "fedex",
    }),
    entry("stickers-2", "Decision", "yesterday", {
      kind: "decision",
      question: "Picked FedEx for the same-day pickup window.",
      choices: [
        {
          id: "fedex",
          label: "FedEx Office",
          rationale: "Booth setup is tonight — speed beats $22 savings.",
        },
        { id: "stickermule", label: "Sticker Mule" },
        { id: "vinyl-sf", label: "Vinyl SF" },
      ],
      chosen: "fedex",
    }),
    entry("stickers-3", "Order placed", "yesterday", {
      kind: "attachments",
      items: [
        {
          label: "FedEx order #FDX-2034",
          meta: "Pickup: today by 5pm · 500 ct, 3x3 die-cut",
        },
      ],
    }),
  ],

  "split-cover-chart": [
    entry("cover-1", "Two layouts to choose from", "3 days ago", {
      kind: "options",
      options: [
        {
          id: "bar",
          title: "Stacked bar — quarterly revenue",
          meta: "Highlights composition",
          notes: "Easier to read mix shift between SMB and Enterprise.",
        },
        {
          id: "area",
          title: "Filled area — month-over-month",
          meta: "Highlights trajectory",
          notes: "More dramatic visually, downplays composition.",
        },
      ],
      selectedOptionId: "bar",
    }),
    entry("cover-2", "Picked bar layout", "yesterday", {
      kind: "note",
      body: "Stacked bar wins — investors keep asking about Enterprise share. Composition is the story this quarter.",
    }),
    entry("cover-3", "Final asset", "this morning", {
      kind: "attachments",
      items: [
        { label: "april-cover-chart-v3.png", meta: "1920x1080 · 412 KB" },
      ],
    }),
  ],

  "split-reply-mike": [
    entry("mike-1", "Mike's message", "yesterday", {
      kind: "note",
      body: "Mike asked about Thursday dinner at Nopa, 7pm — 'or anywhere walkable. Let me know either way.'",
    }),
    entry("mike-2", "Drafted reply", "this morning", {
      kind: "email",
      to: "mike@…",
      subject: "Re: Thursday?",
      body: "Thursday at Nopa works — 7pm. Want to grab a drink at Locanda first? Otherwise see you there.",
    }),
  ],

  "split-thai-lunch": [
    entry("thai-1", "Restaurants in range", "12 min ago", {
      kind: "options",
      intro: "Both deliver in 25-30 min.",
      options: [
        {
          id: "lers-ros",
          title: "Lers Ros",
          meta: "ETA 25 min · open",
          notes: "Pad see ew is the move here.",
        },
        {
          id: "osha",
          title: "Osha Thai",
          meta: "ETA 30 min · open",
          notes: "Backup if Lers Ros goes 86.",
        },
      ],
      selectedOptionId: "lers-ros",
    }),
    entry("thai-2", "Cart preview", "5 min ago", {
      kind: "attachments",
      items: [
        {
          label: "Lers Ros · Pad see ew (no tofu, add chicken)",
          meta: "$18.50 · ETA 12:24 PM",
        },
      ],
    }),
  ],

  "split-standup-linnea": [
    entry("standup-1", "Last week's notes", "Friday", {
      kind: "note",
      body: "Linnea was unblocking on the eval pipeline; she said she'd have first numbers by Monday standup.",
    }),
    entry("standup-2", "Agenda", "this morning", {
      kind: "checklist",
      items: [
        { label: "Eval pipeline numbers" },
        { label: "Walk through her week's plan" },
        { label: "Decide on the chat-vs-pass question" },
      ],
    }),
  ],

  "split-narrative-linnea": [
    entry("narrative-1", "Talking points outline", "2 days ago", {
      kind: "note",
      body: "Three threads: where the bar is, what she'd own in the first 90 days, and the comp range. Soft on the third — feel her out first.",
    }),
    entry("narrative-2", "Draft v1", "yesterday", {
      kind: "email",
      to: "linnea@…",
      subject: "Quick narrative ahead of Wed",
      body: "Wanted to give you a fuller picture before we talk Wednesday. Here's where we are: the team's around 14, bar is staff-eng plus product judgment, and the work in front of us is mostly customer-facing infra...",
    }),
    entry("narrative-3", "Revised after your edits", "this morning", {
      kind: "email",
      to: "linnea@…",
      subject: "Quick narrative ahead of Wed",
      body: "Wanted to give you a fuller picture before Wednesday. Team's at 14 — bar is staff-eng with product judgment. The work is customer-facing infra and the next person sets the pattern for the next three hires...",
    }),
  ],

  "split-tsa-precheck": [
    entry("tsa-1", "Steps", "yesterday", {
      kind: "checklist",
      items: [
        { label: "Confirm membership # is still active", checked: true },
        { label: "Pay $78 renewal fee", checked: true },
        { label: "Update SSN — must be in-person at enrollment center" },
        { label: "Get email confirmation of new KTN" },
      ],
    }),
    entry("tsa-2", "Renewal half-done", "yesterday", {
      kind: "paused",
      reason: "Online portion submitted",
      awaiting:
        "in-person SSN visit (closest center: SFO, walk-ins until 4pm)",
    }),
  ],

  "split-april-rent": [
    entry("rent-1", "What's owed", "today", {
      kind: "metrics",
      rows: [
        { label: "Rent", value: "$3,850" },
        { label: "Due", value: "Apr 30" },
        { label: "Account balance", value: "$12,402" },
      ],
    }),
    entry("rent-2", "One-tap pay", undefined, {
      kind: "checklist",
      items: [
        { label: "Open Chase bill pay" },
        { label: "Confirm landlord ACH details" },
        { label: "Schedule for Apr 30" },
      ],
    }),
  ],

  "split-board-prep": [
    entry("board-1", "Board members", "3 days ago", {
      kind: "people",
      entries: [
        { name: "Karen Park", meta: "Lead investor · Sequoia", note: "Prefers Wednesday afternoons." },
        { name: "Daniel Ortega", meta: "Operating partner · Catalyst" },
        { name: "Priya Menon", meta: "Independent · former Stripe CFO" },
      ],
    }),
    entry("board-2", "Time slot proposals", "yesterday", {
      kind: "options",
      intro: "Three 45-min slots, one per member.",
      options: [
        { id: "kp", title: "Karen — Wed Apr 24, 3:00 PM", meta: "Confirmed" },
        { id: "do", title: "Daniel — Thu Apr 25, 10:00 AM", meta: "Tentative — assistant replied" },
        { id: "pm", title: "Priya — Fri Apr 26, 1:00 PM", meta: "Awaiting reply" },
      ],
    }),
    entry("board-3", "Status", "this morning", {
      kind: "checklist",
      items: [
        { label: "Karen confirmed", checked: true },
        { label: "Daniel tentative — confirm by tonight" },
        { label: "Priya — bump assistant Wednesday AM" },
      ],
    }),
  ],

  "split-decide-linnea": [
    entry("linnea-1", "Profile", "1 week ago", {
      kind: "people",
      entries: [
        {
          name: "Linnea Boström",
          meta: "Staff eng · ex-Anthropic, ex-Datadog",
          note: "Currently leading evals at a small AI infra co. Wants to be closer to product.",
        },
      ],
    }),
    entry("linnea-2", "Interview notes", "4 days ago", {
      kind: "note",
      body: "Strong systems chops. The product instinct is real — caught two scoping issues mid-conversation. Slightly cautious in style; would need to be paired with someone willing to ship rough.",
    }),
    entry("linnea-3", "Pending decision", undefined, {
      kind: "decision",
      question: "Push for a 2nd chat or pass?",
      choices: [
        {
          id: "push",
          label: "Push for chat",
          rationale: "Product judgment is rare at this level; risk is on style not substance.",
        },
        {
          id: "pass",
          label: "Pass (politely)",
          rationale: "Style mismatch with current shipping pace.",
        },
      ],
    }),
  ],

  "split-fde-ashby": [
    entry("fde-1", "Job description draft", "3 days ago", {
      kind: "note",
      body: "Forward Deployed Engineer — partner with founders to ship customer integrations end-to-end. You'll embed with one or two design-partner customers, learn their stack, and ship the connective tissue. 5+ yrs eng, fluent in at least one backend language, willing to travel ~20%. Bay Area or remote (US).",
    }),
    entry("fde-2", "Updated draft after your feedback", "yesterday", {
      kind: "note",
      body: "Forward Deployed Engineer — you'll be the founder-extension at one or two of our top customers, shipping the integration that makes us indispensable. We're looking for someone who's lived the full stack, written gnarly migration code, and can read a customer's room as well as their codebase. 5+ yrs eng. Bay Area or remote, ~20% travel.",
    }),
    entry("fde-3", "Posted to Ashby", "this morning", {
      kind: "attachments",
      items: [
        {
          label: "ashby.com/careers/forward-deployed-engineer",
          meta: "Live · auto-syncing to LinkedIn careers",
        },
      ],
    }),
    entry("fde-4", "LinkedIn post draft (your voice)", "this morning", {
      kind: "email",
      subject: "LinkedIn post — FDE role",
      body: "We're hiring our first Forward Deployed Engineer.\n\nIf you're the kind of engineer who finds the customer's actual problem, ships the migration code that nobody else wants to write, and treats partnership like an engineering discipline — talk to me.\n\nLink in comments.",
    }),
  ],

  "split-quarterly-taxes": [
    entry("taxes-1", "Q1 numbers", "1 week ago", {
      kind: "metrics",
      rows: [
        { label: "Q1 income", value: "$94,200" },
        { label: "Estimated federal", value: "$22,608" },
        { label: "Estimated state (CA)", value: "$8,478" },
        { label: "Total due", value: "$31,086" },
      ],
    }),
    entry("taxes-2", "Worksheet from accountant", "5 days ago", {
      kind: "attachments",
      items: [
        { label: "Q1-2026-estimated.pdf", meta: "From: Yelena · 218 KB" },
      ],
    }),
    entry("taxes-3", "E-payment steps", undefined, {
      kind: "checklist",
      items: [
        { label: "Log into IRS Direct Pay" },
        { label: "Submit federal $22,608" },
        { label: "Log into CA FTB Web Pay" },
        { label: "Submit state $8,478" },
      ],
    }),
  ],

  "split-christine-dinner": [
    entry("christine-1", "Restaurant options", "2 days ago", {
      kind: "options",
      intro: "Party of 8, Friday at 7pm.",
      options: [
        {
          id: "nopa",
          title: "Nopa",
          meta: "8pm only · waitlist for 7",
          notes: "Christine's favorite, but timing is tight.",
        },
        {
          id: "cotogna",
          title: "Cotogna",
          meta: "7:15pm available",
          notes: "Italian — she's mentioned wanting to go.",
        },
        {
          id: "rich-table",
          title: "Rich Table",
          meta: "7pm · last table",
          notes: "Slightly fancier; would feel celebratory.",
        },
      ],
      selectedOptionId: "rich-table",
    }),
    entry("christine-2", "Booked Rich Table", "yesterday", {
      kind: "note",
      body: "Got the 7pm. Confirmation under your name. Nopa was 8pm only and Christine wants the early start so we can move to drinks after.",
    }),
    entry("christine-3", "Group invite — drafted", "this morning", {
      kind: "email",
      to: "the og guild",
      subject: "Christine's birthday — Friday 7pm at Rich Table",
      body: "Locked it in: Friday at 7, Rich Table. Reservation is under my name. If you can't make it, let me know by Thursday so I can release the seat.",
    }),
  ],

  "split-lease-addendum": [
    entry("lease-1", "Addendum from landlord", "4 days ago", {
      kind: "attachments",
      items: [
        { label: "Lease-Addendum-2026.pdf", meta: "8 pages · received Apr 18" },
      ],
    }),
    entry("lease-2", "Key changes", "3 days ago", {
      kind: "note",
      body: "Two material changes: (1) rent escalator capped at 4% instead of 5%, good for us; (2) new clause requiring 60-day notice for any subletting, more restrictive. Everything else is boilerplate.",
    }),
    entry("lease-3", "Next step", undefined, {
      kind: "paused",
      reason: "Awaiting your e-signature on DocuSign",
      awaiting: "your review + sign",
    }),
  ],

  "split-investor-update-send": [
    entry("update-1", "Outline", "5 days ago", {
      kind: "note",
      body: "Five sections: headline metric, what shipped, what we learned, what we're doing about it, what we need.",
    }),
    entry("update-2", "Draft v1", "3 days ago", {
      kind: "email",
      to: "investors@…",
      subject: "April update — composition shift",
      body: "Hi all,\n\nApril was the first month where Enterprise crossed 50% of new ARR. That's the headline. What follows is how we got there, what surprised us, and what we're prioritizing in May...",
    }),
    entry("update-3", "Revised — tightened opening", "yesterday", {
      kind: "email",
      to: "investors@…",
      subject: "April update — composition shift",
      body: "Hi all,\n\nApril: Enterprise crossed 50% of new ARR for the first time. Three things to share — what's working, what surprised us, and where May focus is going...",
    }),
    entry("update-4", "Send window", undefined, {
      kind: "paused",
      reason: "Hold for Friday morning send",
      awaiting: "final read + Friday 9am window",
    }),
  ],

  "split-insurance-quotes": [
    entry("ins-1", "Three quotes pulled", "1 week ago", {
      kind: "options",
      intro: "Same coverage limits, varying deductibles.",
      options: [
        {
          id: "policygenius",
          title: "Policygenius (Travelers)",
          meta: "$1,820/yr · $1k deductible",
          notes: "Highest premium, lowest out-of-pocket.",
        },
        {
          id: "lemonade",
          title: "Lemonade",
          meta: "$1,210/yr · $2.5k deductible",
          notes: "Cheapest, highest out-of-pocket.",
        },
        {
          id: "geico",
          title: "GEICO bundle",
          meta: "$1,440/yr · $1.5k deductible",
          notes: "Discount for bundling with auto.",
        },
      ],
      selectedOptionId: "geico",
    }),
    entry("ins-2", "Analysis", "5 days ago", {
      kind: "note",
      body: "GEICO is the right tradeoff — moderate deductible, premium is $380 less than Policygenius for similar coverage. Lemonade saves another $230 but the higher deductible offsets in 2 of last 3 years' claim history.",
    }),
    entry("ins-3", "Decision pending", undefined, {
      kind: "decision",
      question: "Pick the broker.",
      choices: [
        { id: "geico", label: "GEICO bundle", rationale: "Best value tradeoff." },
        { id: "policygenius", label: "Policygenius", rationale: "Lowest deductible." },
        { id: "lemonade", label: "Lemonade", rationale: "Cheapest premium." },
      ],
    }),
  ],

  "split-source-candidates": [
    entry("source-1", "First pass — 8 candidates", "2 weeks ago", {
      kind: "people",
      entries: [
        { name: "Michael Reyes", meta: "Stripe → independent" },
        { name: "Linnea Boström", meta: "Anthropic → small AI infra co" },
        { name: "Priya Goel", meta: "Datadog · platform infra" },
        { name: "Aamir Khan", meta: "Stripe · payments infra" },
        { name: "Sara Levin", meta: "GitHub Actions team" },
        { name: "Jordan Park", meta: "Replicate · ML infra" },
        { name: "Tom Cheung", meta: "ex-Vercel" },
        { name: "Mei Tanaka", meta: "ex-Snowflake" },
      ],
    }),
    entry("source-2", "Updated to 14 — added 6", "this week", {
      kind: "people",
      entries: [
        { name: "Above 8 + new additions:" },
        { name: "Devon Wells", meta: "ex-Cloudflare workers team" },
        { name: "Renée Iyer", meta: "Stripe Terminal" },
        { name: "Connor McLeod", meta: "ex-Anthropic infra" },
        { name: "Yelena Park", meta: "ex-Notion · sync engine" },
        { name: "Andre Vasquez", meta: "Modal · ML infra" },
        { name: "Hana Mirza", meta: "ex-Snowflake compute" },
      ],
    }),
    entry("source-3", "Pipeline", "today", {
      kind: "metrics",
      rows: [
        { label: "Sourced", value: "14 / 20" },
        { label: "First call booked", value: "5" },
        { label: "Passed first call", value: "2" },
        { label: "On-site scheduled", value: "1" },
      ],
    }),
  ],

  "split-investor-narrative": [
    entry("narr-1", "Outline", "1 week ago", {
      kind: "note",
      body: "Three beats: (1) the composition shift is real, not a one-month fluke; (2) we built for this — here's the work; (3) what we want to do with the bridge round.",
    }),
    entry("narr-2", "Draft v1", "4 days ago", {
      kind: "note",
      body: "April marks the first month Enterprise crossed 50% of new ARR. Eight months ago we re-architected the onboarding flow specifically for this; the data is starting to confirm the bet. The bridge round, if we do it, is to extend runway through the next two enterprise renewals without slowing hiring...",
    }),
    entry("narr-3", "Draft v2 after your edits", "yesterday", {
      kind: "note",
      body: "Headline: Enterprise crossed 50% of new ARR in April. This is the first signal that the onboarding rebuild we shipped last August is working as intended — Enterprise customers are converting on the same self-serve motion that previously only worked for SMB. The bridge round buys us through the next two renewals without slowing hiring or compressing the roadmap...",
    }),
  ],

  "split-hvac": [
    entry("hvac-1", "Vendor options", "5 days ago", {
      kind: "options",
      options: [
        { id: "atlas", title: "Atlas Heating & Air", meta: "$185 · 5-star Yelp" },
        { id: "fox", title: "Fox HVAC", meta: "$220 · same-day available" },
        { id: "pg-svc", title: "PG&E preferred service", meta: "$165 · 2-week wait" },
      ],
      selectedOptionId: "atlas",
    }),
    entry("hvac-2", "Decision", "3 days ago", {
      kind: "decision",
      question: "Picked Atlas — best price, well-reviewed, available next week.",
      choices: [
        { id: "atlas", label: "Atlas", rationale: "Price + reviews + window." },
        { id: "fox", label: "Fox" },
        { id: "pg-svc", label: "PG&E" },
      ],
      chosen: "atlas",
    }),
    entry("hvac-3", "Booking", "yesterday", {
      kind: "attachments",
      items: [
        { label: "Atlas booking #A-9821", meta: "Tue Apr 30, 9-11am window" },
      ],
    }),
  ],

  "split-mothers-day": [
    entry("mday-1", "Initial gift suggestions", "3 weeks ago", {
      kind: "options",
      intro: "Pulled from her interests + things you've heard her mention.",
      options: [
        {
          id: "books",
          title: "Annual book subscription — Heywood Hill",
          meta: "$240 / 6 months",
          notes: "Personal-shopper books matched to her tastes.",
        },
        {
          id: "candle",
          title: "Cire Trudon candle set",
          meta: "$165",
          notes: "She's mentioned the Spiritus Sancti scent twice.",
        },
        {
          id: "pottery",
          title: "Hand-thrown pottery class",
          meta: "$210 · Sausalito",
          notes: "Half-day class, includes lunch.",
        },
        {
          id: "scarf",
          title: "Wool scarf — Begg & Co",
          meta: "$280",
          notes: "Practical luxury, ships fast.",
        },
      ],
    }),
    entry("mday-2", "Refined to her preferences", "1 week ago", {
      kind: "options",
      intro:
        "You said she'd love something 'slow' and dislikes things she has to schedule. Narrowed accordingly.",
      options: [
        {
          id: "books",
          title: "Annual book subscription — Heywood Hill",
          meta: "$240 / 6 months",
          notes: "No scheduling, surprise arrives every month.",
        },
        {
          id: "candle",
          title: "Cire Trudon candle set",
          meta: "$165",
          notes: "Pure consumable, no commitment.",
        },
      ],
      selectedOptionId: "books",
    }),
    entry("mday-3", "Ready to send — pending your confirm", undefined, {
      kind: "paused",
      reason: "Heywood Hill subscription cued up",
      awaiting:
        "your confirm of shipping address (Mom's, on file) + final $240 charge",
    }),
  ],

  "split-guild-trip": [
    entry("trip-1", "Destination options", "1 month ago", {
      kind: "options",
      intro: "Long weekend, July or August.",
      options: [
        {
          id: "tahoe",
          title: "North Lake Tahoe",
          meta: "Drive · $400/night house",
          notes: "Easiest logistics, most familiar.",
        },
        {
          id: "mendocino",
          title: "Mendocino",
          meta: "Drive · $550/night",
          notes: "Quieter, no one's been recently.",
        },
        {
          id: "big-sur",
          title: "Big Sur",
          meta: "Drive · $700/night",
          notes: "Premium but limited rentals.",
        },
      ],
      selectedOptionId: "mendocino",
    }),
    entry("trip-2", "Who's in", "2 weeks ago", {
      kind: "people",
      entries: [
        { name: "Christine", note: "In, any weekend" },
        { name: "Mike + Sara", note: "In, prefer late July" },
        { name: "Jordan", note: "Tentative — work schedule" },
        { name: "Pat", note: "Out — wedding that month" },
        { name: "Dani", note: "No reply yet" },
      ],
    }),
    entry("trip-3", "Rough budget", "1 week ago", {
      kind: "metrics",
      rows: [
        { label: "House (3 nights)", value: "$1,650" },
        { label: "Per person (split 6)", value: "$275" },
        { label: "Groceries + meals", value: "$120 / person" },
        { label: "Total per person", value: "~$400" },
      ],
    }),
  ],

  "split-student-loans": [
    entry("loan-1", "Three lenders compared", "10 days ago", {
      kind: "options",
      options: [
        {
          id: "sofi",
          title: "SoFi",
          meta: "5.49% · 7 yr",
          notes: "Tightest rate; fee waived for existing accounts.",
        },
        {
          id: "earnest",
          title: "Earnest",
          meta: "5.74% · 7 yr",
          notes: "Slightly higher rate, more flexible terms.",
        },
        {
          id: "splash",
          title: "Splash Financial",
          meta: "5.62% · 7 yr",
          notes: "Marketplace — matches you to a credit union.",
        },
      ],
    }),
    entry("loan-2", "Rate comparison", "1 week ago", {
      kind: "metrics",
      rows: [
        { label: "Current rate", value: "7.84%" },
        { label: "Best new rate (SoFi)", value: "5.49%" },
        { label: "Monthly savings", value: "$162" },
        { label: "Total interest saved", value: "~$13,600" },
      ],
    }),
  ],

  "split-dishwasher-filter": [
    entry("dw-1", "Model match candidates", "yesterday", {
      kind: "options",
      intro: "Bosch SHPM78W55N — three replacement filters fit.",
      options: [
        {
          id: "oem",
          title: "Bosch OEM 12010059",
          meta: "$48 · 2-day",
          notes: "Manufacturer original.",
        },
        {
          id: "third",
          title: "Generic equivalent (3-pack)",
          meta: "$22 · 5-day",
          notes: "Reviews are good, but slightly thinner mesh.",
        },
      ],
      selectedOptionId: "oem",
    }),
    entry("dw-2", "Cart preview", "this morning", {
      kind: "attachments",
      items: [
        { label: "Amazon · Bosch 12010059 filter", meta: "$48.32 · arrives Tue" },
      ],
    }),
  ],

  "split-linkedin": [
    entry("li-1", "Current vs proposed bullets", "5 days ago", {
      kind: "note",
      body: "Current headline reads as a CV. Proposed: 'Building Runner — agent that does the boring half of running a small company.' Drop the dates from sub-roles, keep the company logos.",
    }),
    entry("li-2", "New headshot", "3 days ago", {
      kind: "attachments",
      items: [{ label: "headshot-2026-square.jpg", meta: "1024x1024 · 380 KB" }],
    }),
  ],

  "split-mcp-spec": [
    entry("mcp-1", "Key changes summary", "2 days ago", {
      kind: "note",
      body: "Three things matter for us: (1) tool result streaming is now standardized, (2) resource subscription model added, (3) auth flows tightened — older bearer tokens grandfathered for 6 months.",
    }),
    entry("mcp-2", "Sections to read", undefined, {
      kind: "checklist",
      items: [
        { label: "§3.4 Streaming results", checked: true },
        { label: "§5.1 Resource subscriptions" },
        { label: "§7 Authentication" },
        { label: "Migration appendix" },
      ],
    }),
  ],
};
