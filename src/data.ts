export type Mode = "proposed" | "active" | "done";
export type ProjectStatus = "proposed" | "active" | "done";
export type CardState = "done" | "todo" | "triage";
export type CardKind = "decide" | "confirm" | "form";
export type VerifyState = "idle" | "verifying" | "verified" | "failed";

export interface FormField {
  key: string;
  label: string;
  type: "text" | "password";
  placeholder?: string;
  value: string;
}

export interface ConfirmAttachment {
  name: string;
  dataUrl: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  body: string;
  timestamp: string;
}

export type Artifact =
  | {
      kind: "email";
      to?: string;
      subject: string;
      body: string;
    }
  | {
      kind: "options";
      intro?: string;
      options: { id: string; title: string; meta?: string; notes?: string }[];
      selectedOptionId?: string;
    }
  | {
      kind: "decision";
      question: string;
      choices: { id: string; label: string; rationale?: string }[];
      chosen?: string;
    }
  | {
      kind: "note";
      body: string;
    }
  | {
      kind: "checklist";
      items: { label: string; checked?: boolean; pendingMeta?: string }[];
    }
  | {
      kind: "attachments";
      items: { label: string; meta?: string }[];
    }
  | {
      kind: "metrics";
      rows: { label: string; value: string; trend?: string }[];
    }
  | {
      kind: "people";
      entries: { name: string; meta?: string; note?: string }[];
    }
  | {
      kind: "drafts";
      intro?: string;
      channel?: string;
      defaultFrom?: string;
      entries: {
        recipient: string;
        recipientMeta?: string;
        subject?: string;
        body: string;
        hook?: string;
        from?: string;
        to?: string;
        cc?: string[];
        bcc?: string[];
      }[];
      previewCount?: number;
    }
  | {
      kind: "paused";
      reason: string;
      awaiting: string;
    }
  | {
      kind: "code";
      summary: string;
      changes: { label: string; meta?: string }[];
    };

export interface ActionCard {
  id: string;
  title: string;
  state: CardState;
  triageNote?: string;
  artifact?: Artifact;
  kind?: CardKind;
  formFields?: FormField[];
  verifyState?: VerifyState;
  verifyMessage?: string;
  confirmNote?: string;
  confirmAttachment?: ConfirmAttachment;
}

export interface DoneArtifact {
  id: string;
  title: string;
  artifact?: Artifact;
}

export interface Task {
  id: string;
  title: string;
  detail: string;
}

export interface Project {
  id: string;
  status: ProjectStatus;
  title: string;
  summary: string;
  proposal?: string;
  tasks?: Task[];
  cards?: ActionCard[];
  artifacts?: DoneArtifact[];
  decisions?: string[];
  chatMessages: ChatMessage[];
  updatedAt: string;
}

const cid = (() => {
  let n = 0;
  return (prefix: string) => `${prefix}-${++n}`;
})();

const seedChat = (proposal: string, reply: string): ChatMessage[] => [
  {
    id: cid("chat"),
    role: "user",
    body: proposal,
    timestamp: "9:12 AM",
  },
  {
    id: cid("chat"),
    role: "assistant",
    body: reply,
    timestamp: "9:13 AM",
  },
];

export const PROPOSALS: Project[] = [
  {
    id: cid("project"),
    status: "proposed",
    title: "Review my top 50 emails — reply / archive / flag",
    summary:
      "Looking at the last 50 in the inbox. Want a classification pass: which ones I should reply to, which to archive, and which to flag for review.",
    proposal:
      "Look at my top 50 emails, tell me which ones we should reply to and which ones we should archive and which ones I should review.",
    chatMessages: [],
    updatedAt: "Just now",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Find flights SFO → Chicago, May 14 arriving <3pm, return May 17",
    summary:
      "Need to be at the venue by 4pm, so anything landing before 3 works. Return Saturday evening. Prefer United or Delta, aisle.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Find SF houses near 749 Guerrero — 3bd, 2ba",
    summary:
      "Browsing the neighborhood. Pull listings within 4 blocks, 3 bed / 2 bath, show list price and sqft. Top 5 is fine.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Set Gmail vacation auto-reply for next Monday",
    summary:
      "Out Monday, back Tuesday. Message: 'Out of office, back Tuesday.' Apply to both Gmail accounts.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Tell me about my Google Drive folder structure",
    summary:
      "Just curious what I've got and where things live. Top-level folders, anything that looks stale, anything I should reorganize.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Explore BigQuery — cannabis jobs + deals pipeline",
    summary:
      "What tables are available in my analytics dataset? Particularly interested in the cannabis_jobs table and whatever's in the deals pipeline.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Find the Q4 Budget spreadsheet",
    summary:
      "Somewhere in Drive — find it and link it. I keep losing it.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Add Action Items section to Meeting Notes (Apr 27)",
    summary:
      "Open the Meeting Notes Google Doc from April 27, 2026 and add an 'Action Items' section at the bottom. Leave it empty — I'll fill it.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Sum column B in budget sheet, write to B15",
    summary:
      "In the Q4 Budget spreadsheet, sum all of column B and put the total in cell B15. Quick one.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Schedule a 30-min sync with Yitong at 2pm PT today",
    summary:
      "Throw a 30-min hold on the calendar with yitong@runner.now for 2pm PT today. Default Google Meet.",
    chatMessages: [],
    updatedAt: "Just now",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Validate barley@oteagoa.com",
    summary:
      "Looks like a typo of someone real. Validate the address — MX records, deliverability, and suggest a likely-intended correction.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Draft a poem email to yitong@runner.now",
    summary:
      "Short, warm, vaguely about spring. 6-8 lines max. Subject line: something playful.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Sales deck — Expedia (flight MCPs for their business)",
    summary:
      "Create a Google Slides deck for an enterprise sales meeting with Expedia. Pitch: flight MCPs for their corporate travel arm. ~10 slides.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Find Toronto apartments near Union Station — 2bd, 2ba",
    summary:
      "Browsing Toronto. Walking distance to Union Station, 2 bed / 2 bath. List price and sqft for each.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Add 'Next Steps' closing slide to Q4 Deck Sample",
    summary:
      "Add a closing slide titled 'Next Steps' to the Q4 Deck Sample. Three bullets, leave them as placeholders.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Reformat the Notion 'Next 3mo Superman' doc as a Google Doc",
    summary:
      "Pull the Notion doc agoraxyz/Our-Next-3mo-Superman and create a clean, well-formatted Google Doc version I can share externally.",
    chatMessages: [],
    updatedAt: "2 days ago",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Show me my last 5 emails",
    summary:
      "Quick scan — what's the most recent thing in my inbox?",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Email charlie@fjor.co + label FYI",
    summary:
      "Send: 'thanks, I'll review the meeting notes tomorrow.' Apply the label 'FYI' to it once sent.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Pull April rent from 749 Guerrero Rent Tracker",
    summary:
      "Find the 749 Guerrero Rent Tracker in Drive. What did I pay in April? I'm about to send May rent.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Learn my Gmail writing style",
    summary:
      "Run /analyze-and-remember-writing-style across my Gmail accounts so future drafts sound like me.",
    chatMessages: [],
    updatedAt: "2 days ago",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Create board meeting notes doc",
    summary:
      "Format a Google Doc for the upcoming board meeting — agenda block, attendees, sections for each topic, action items at the bottom.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Send a calendar invite from runner.now → fjor.co",
    summary:
      "Send a calendar invite with title 'test' from my charlie@runner.now account to charlie@fjor.co. Just smoke-testing the cross-account flow.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Top 5 Toronto 3bd apartments walkable to Union Station",
    summary:
      "Sibling search to the 2bd version — same area, but 3 bedroom this time. Show me top 5 with price and sqft.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Pull recent emails from yitong@runner.now",
    summary:
      "Summarize the last few threads with Yitong. I want to see what's open before our 2pm.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Top events last week (BigQuery)",
    summary:
      "Query the analytics dataset for the top 10 events by count last week. Just a quick scan.",
    chatMessages: [],
    updatedAt: "2 days ago",
  },
];

export const ACTIVE: Project[] = [
  {
    id: cid("project"),
    status: "active",
    title: "Inbox triage — top 50 emails",
    summary:
      "Classified all 50, drafted replies for the 14 actionables, queued 31 archives, flagged 5 for review. Drafts waiting.",
    chatMessages: seedChat(
      "Look at my top 50 emails, tell me which ones we should reply to, which to archive, and which I should review.",
      "Classified all 50. 14 actionable (drafts ready), 31 archive candidates, 5 flagged for your eyes. Skim and I'll send / archive in bulk.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Classify all 50",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Actionable", value: "14" },
            { label: "Newsletter / noise", value: "31" },
            { label: "Needs your decision", value: "5" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Draft replies for the 14 actionable threads",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "All 14 drafts in the Drafts folder, written in your Gmail voice (short, lowercase first word, no signoff for internal). Three flagged for your eyes: the Expedia procurement rep, the Anthropic partner-team intro, and the Stripe contract redline.",
        },
      },
      {
        id: cid("card"),
        title: "Review and send the drafts",
        state: "triage",
        triageNote:
          "14 drafts ready. Skim the three flagged ones — others should be one-click sends.",
        artifact: {
          kind: "email",
          to: "Expedia procurement",
          subject: "Re: Flight MCP enterprise pricing",
          body:
            "Hi Dana —\n\nAppreciate the detailed RFP. Quick read: your volume falls into our enterprise tier; we'd structure it as a 12-month commit with a usage-based add-on for the agentic features.\n\nHappy to walk through Wednesday or Thursday next week — what works on your side?\n\nBest,\nCharlie",
        },
      },
      {
        id: cid("card"),
        title: "Archive the 31 noise emails",
        state: "todo",
        artifact: {
          kind: "checklist",
          items: [
            { label: "12 newsletters (Stratechery, Lenny's, etc.)" },
            { label: "9 calendar notifications already actioned" },
            { label: "6 receipts (auto-filtered to Receipts label)" },
            { label: "4 marketing from tools we already use" },
          ],
        },
      },
    ],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Chicago trip — May 14-17",
    summary:
      "SFO → ORD outbound under $400 found, hotel options in the Loop staged, dinners pending.",
    chatMessages: seedChat(
      "Find me flights from SFO to Chicago for May 14, arriving before 3pm. Return May 17 evening.",
      "Three flight options that land before 3pm. Two are under $400. Picked hotel options near the Loop too — one is over your usual cap but four blocks from the venue.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Find flights SFO → ORD, May 14 (arrive <3pm)",
        state: "done",
        artifact: {
          kind: "options",
          intro: "Three options that land before 3pm. United nonstop is the cleanest.",
          options: [
            {
              id: "ua-2241",
              title: "United UA-2241 — nonstop",
              meta: "May 14 · 08:40 SFO → 14:55 ORD · $362 · aisle 12B",
              notes: "Nonstop, lands at 2:55pm. Cheapest of the three.",
            },
            {
              id: "aa-1156",
              title: "American AA-1156 — nonstop",
              meta: "May 14 · 07:15 SFO → 13:25 ORD · $398 · aisle 9C",
              notes: "Earlier arrival, slightly more expensive. Better buffer to the venue.",
            },
            {
              id: "dl-5530",
              title: "Delta DL-5530 — 1 stop (MSP)",
              meta: "May 14 · 06:00 SFO → 14:48 ORD · $341 · aisle 14D",
              notes: "Cheapest but earliest wake-up and the MSP layover is tight.",
            },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Pick hotel — Chicago Loop, May 14-17",
        state: "triage",
        triageNote:
          "Three options. Conrad is over the $300 cap but 4 blocks from the venue.",
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
              notes: "Under budget. Solid wifi, smaller rooms. Walkable.",
            },
            {
              id: "hyatt-mag",
              title: "Hyatt Centric The Loop",
              meta: "$252/night · 10 blocks to venue",
              notes: "Cheapest. Decent gym, 12-min walk in good weather.",
            },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Return flight ORD → SFO, May 17 evening",
        state: "done",
        artifact: {
          kind: "attachments",
          items: [
            { label: "United UA-1885 — nonstop", meta: "May 17 · 19:10 ORD → 21:42 SFO · $348" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Schedule dinners in Chicago",
        state: "todo",
        artifact: {
          kind: "people",
          entries: [
            { name: "Reece W.", meta: "Wed May 14", note: "Suggested Avec — awaiting reply" },
            { name: "Talia O.", meta: "Thu May 15", note: "Confirmed at Kasama 7pm" },
            { name: "Marcus B.", meta: "Fri May 16", note: "Pinged, no reply yet" },
          ],
        },
      },
    ],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "active",
    title: "749 Guerrero — pay May rent",
    summary:
      "Found the tracker, pulled April rent. Form ready, paused at the routing-number field.",
    chatMessages: seedChat(
      "Find my 749 Guerrero Rent Tracker — what was April rent? I'm paying May now.",
      "Found it. April was $4,825 (same as March). Pulled up the landlord's online payment portal, filled everything except routing number — drop that in and I'll submit.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Find the 749 Guerrero Rent Tracker sheet",
        state: "done",
        artifact: {
          kind: "attachments",
          items: [
            { label: "749 Guerrero Rent Tracker", meta: "Google Sheets · last edited Apr 30" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Confirm April rent amount",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "April rent", value: "$4,825" },
            { label: "March rent", value: "$4,825" },
            { label: "YTD paid", value: "$19,300" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Submit May payment via landlord portal",
        state: "triage",
        triageNote:
          "Form filled except routing number. Drop it in and I'll submit.",
        kind: "form",
        verifyState: "idle",
        formFields: [
          {
            key: "routing",
            label: "Bank routing number",
            type: "password",
            placeholder: "XXXXXXXXX (9 digits)",
            value: "",
          },
          {
            key: "memo",
            label: "Memo line",
            type: "text",
            placeholder: "e.g. May 2026 rent — 749 Guerrero",
            value: "May 2026 rent — 749 Guerrero",
          },
        ],
        artifact: {
          kind: "paused",
          reason: "Routing number requires manual entry — won't autofill banking credentials.",
          awaiting: "User to enter routing number; I'll verify and submit.",
        },
      },
    ],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Expedia sales deck",
    summary:
      "10-slide pitch on flight MCPs for Expedia's corporate travel arm. Outline + 7 slides drafted, waiting on logo + case study slide.",
    chatMessages: seedChat(
      "Create a Google Slides sales deck for an enterprise meeting with Expedia — pitch is flight MCPs for their business.",
      "Drafted 10 slides. The case study slide is a placeholder until you tell me which logo to feature. Deck link below.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Outline + structure",
        state: "done",
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
      },
      {
        id: cid("card"),
        title: "Draft the 10 slides",
        state: "done",
        artifact: {
          kind: "attachments",
          items: [
            { label: "Expedia — Flight MCP Pitch (v0.4)", meta: "Google Slides · 10 slides" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Pick a customer logo for the case study slide",
        state: "triage",
        triageNote:
          "Three options — pick one and I'll drop it into slide 6.",
        artifact: {
          kind: "decision",
          question: "Which case study should we lead with on slide 6?",
          choices: [
            {
              id: "navan",
              label: "Navan (corporate travel)",
              rationale:
                "Closest analog to Expedia's audience. Strong activation numbers (62% W1). Risk: they're a partial competitor.",
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
                "Most prestigious. Their travel use case is small but the engineering rigor proves out the integration. Best technical credibility.",
            },
          ],
        },
      },
    ],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Board meeting prep — May 19",
    summary:
      "Notes doc structured, pre-read sent, three 1:1s on the calendar. Waiting on financial pack from finance.",
    chatMessages: seedChat(
      "Help me prep for the May 19 board meeting — notes doc, pre-read, and 1:1s.",
      "Created the notes doc with our usual structure, sent the pre-read 96 hours out, scheduled the three 1:1s. Finance pack is the last open item.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Create board meeting notes Google Doc",
        state: "done",
        artifact: {
          kind: "attachments",
          items: [
            { label: "Board meeting — May 19", meta: "Google Doc · agenda, attendees, 6 sections" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Send pre-read 96h ahead",
        state: "done",
        artifact: {
          kind: "email",
          to: "Board (5 members)",
          subject: "May 19 pre-read + agenda",
          body:
            "Board team —\n\nAttaching the May 19 pre-read and agenda 96 hours ahead per usual cadence.\n\nKey reads: Q1 close, Q2 plan, and the new pricing proposal (page 11).\n\nReply with anything you want surfaced live.\n\nBest,\nCharlie",
        },
      },
      {
        id: cid("card"),
        title: "Schedule three 1:1s with board members",
        state: "done",
        artifact: {
          kind: "people",
          entries: [
            { name: "James K.", meta: "Wed May 14 · 4pm", note: "Confirmed" },
            { name: "Yitong L.", meta: "Thu May 15 · 11am", note: "Confirmed" },
            { name: "Ramesh P.", meta: "Fri May 16 · 9am", note: "Tentative — awaiting" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Get financial pack from finance team",
        state: "triage",
        triageNote:
          "Pinged Maria Tuesday, no response yet. Worth a nudge or wait?",
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
                "She's heads-down on monthly close. A nudge today might be unwelcome. Risk: tight turnaround if she's late.",
            },
          ],
        },
      },
    ],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "active",
    title: "April investor update",
    summary:
      "Metrics pulled, narrative drafted, two cover-chart options ready for selection.",
    chatMessages: seedChat(
      "Draft the April investor update — same format as March.",
      "Pulled the April metrics, drafted the narrative, prepared two cover chart options. Pick a chart and I'll send.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Pull April metrics from BigQuery",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "ARR", value: "$4.6M", trend: "+18% MoM" },
            { label: "Net new logos", value: "42", trend: "+11" },
            { label: "Gross margin", value: "76%", trend: "+1pp" },
            { label: "Cash runway", value: "18 mo", trend: "flat" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Draft narrative",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "April was the strongest month since launch — ARR crossed $4.6M (+18% MoM) on mid-market expansion. Two larger logos (Acme, Beta) closed. Hiring slowed to a single offer due to focus on the staff-eng search. Outlook for May is steady; June depends on the new pricing rolling cleanly.",
        },
      },
      {
        id: cid("card"),
        title: "Pick a cover chart",
        state: "triage",
        triageNote:
          "Two layouts attached. Pick one and I'll send the update.",
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
      },
    ],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Q1 analytics — cannabis jobs + deals pipeline",
    summary:
      "BigQuery exploration complete, deals pipeline pulled, summary memo drafted. Need your read before circulating.",
    chatMessages: seedChat(
      "Take a look at BigQuery — what tables are available? Tell me about cannabis_jobs and the deals pipeline.",
      "Mapped the dataset. cannabis_jobs has 412k rows; deals pipeline has 1.8k records. Drafted a one-pager summarizing the trends.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "List BigQuery datasets and tables",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Datasets", value: "4" },
            { label: "Tables (analytics)", value: "23" },
            { label: "cannabis_jobs rows", value: "412,038" },
            { label: "deals_pipeline rows", value: "1,847" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Pull deals pipeline by stage",
        state: "done",
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
      },
      {
        id: cid("card"),
        title: "Draft summary memo",
        state: "triage",
        triageNote:
          "One-pager ready. Skim before I send it to the team.",
        artifact: {
          kind: "note",
          body:
            "Q1 read: deals_pipeline volume up 22% QoQ but conversion from Qualified → Proposal slipped 4pp. cannabis_jobs activity flat — likely market-level. Recommend: instrument the Qualified → Proposal handoff for hand-off latency. Memo doc linked in Drive.",
        },
      },
    ],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Toronto apartment hunt — near Union Station",
    summary:
      "12 listings scanned, top 4 surfaced, two showings on the calendar.",
    chatMessages: seedChat(
      "Find me apartments in Toronto near Union Station — 2 bed 2 bath. Top picks.",
      "Pulled 12 listings within 10 min walk, filtered to 4 strong ones, booked showings for the top 2.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Search listings near Union Station",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Listings scanned", value: "12" },
            { label: "Match criteria (2bd/2ba)", value: "7" },
            { label: "Final shortlist", value: "4" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Top 4 picks",
        state: "done",
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
      },
      {
        id: cid("card"),
        title: "Book showings",
        state: "todo",
        artifact: {
          kind: "checklist",
          items: [
            { label: "88 Front St — Sat May 17 · 11am", checked: true },
            { label: "60 Yonge St — Sat May 17 · 2pm", checked: true },
            { label: "12 Wellington — pending agent reply" },
            { label: "300 King W — pending agent reply" },
          ],
        },
      },
    ],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Set Gmail vacation auto-reply",
    summary:
      "Tried three times — each attempt hit a renderer crash. Walked around it via the IMAP route; awaiting your confirm to apply.",
    chatMessages: seedChat(
      "Set my Gmail vacation auto-reply for next Monday: 'Out of office, back Tuesday'.",
      "First three attempts triggered renderer crashes on the settings tab. Routed through IMAP settings instead. Ready to apply — just need you to confirm the dates.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Attempt via Gmail settings UI (3×)",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "Three retries — each crashed the renderer mid-flow (sessions 260428-deft-slate, 260428-ready-bronze, 260428-snug-crane). Logged the stack trace and filed it. Switched to IMAP settings path.",
        },
      },
      {
        id: cid("card"),
        title: "Apply auto-reply via IMAP settings",
        state: "triage",
        triageNote:
          "Dates and message ready. Confirm and I'll apply across both accounts.",
        kind: "confirm",
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
      },
    ],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Notion 'Next 3mo Superman' → Google Doc",
    summary:
      "Notion doc parsed, content reformatted, GDoc generated. Review the formatting before I share it.",
    chatMessages: seedChat(
      "Review the Notion doc 'Our-Next-3mo-Superman' and make me a well-formatted Google Doc version.",
      "Pulled the Notion content, rebuilt the structure in Google Docs with proper heading styles and a TOC. Linked below — let me know if you want any sections reordered.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Fetch the Notion source",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "Pulled 18 blocks, 4 nested toggles, 2 embedded tables, and the linked Loom (kept as a hyperlink — Docs doesn't embed Loom natively).",
        },
      },
      {
        id: cid("card"),
        title: "Create the Google Doc",
        state: "done",
        artifact: {
          kind: "attachments",
          items: [
            { label: "Our Next 3 Months — Superman (Google Doc)", meta: "Created · 4 sections · TOC · 1,840 words" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Review formatting + share",
        state: "triage",
        triageNote:
          "Skim the doc — once you're happy, I'll set view-only sharing for the team.",
        artifact: {
          kind: "decision",
          question: "Who should get access?",
          choices: [
            { id: "exec", label: "Exec team only (view)", rationale: "Tight loop, low risk of leak." },
            { id: "all-hands", label: "Whole company (view)", rationale: "Aligned with our transparency default. Some context cost." },
            { id: "external", label: "Exec + board (view)", rationale: "If you want board pre-input before circulating internally." },
          ],
        },
      },
    ],
    updatedAt: "2 days ago",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Q4 Deck — closing slides",
    summary:
      "Added 'Next Steps' and 'Closing, Thank You' slides. Layouts done; copy needs your edit pass.",
    chatMessages: seedChat(
      "Add closing slides to my Q4 Deck — 'Next Steps' and 'Closing, Thank You'.",
      "Added both slides matching the deck's style. Filled in placeholder copy — you'll want to edit the Next Steps bullets.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Add 'Next Steps' slide",
        state: "done",
        artifact: {
          kind: "checklist",
          items: [
            { label: "Layout: title + 3 bullets, mirroring slide 4", checked: true },
            { label: "Placeholder bullets in — edit before sharing", checked: false },
            { label: "Footer + slide number aligned", checked: true },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Add 'Closing, Thank You' slide",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "Single line title centered, subtle gradient background matching the title slide. Brand-aligned. No further action needed.",
        },
      },
      {
        id: cid("card"),
        title: "Replace Next Steps placeholder copy",
        state: "triage",
        triageNote: "Three bullets are placeholders. Edit and I'll finalize.",
        artifact: {
          kind: "note",
          body:
            "Current placeholders: 'Follow up with team', 'Schedule next review', 'Track KPIs'. Worth replacing with the actual three commitments from the deck's body.",
        },
      },
    ],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Learn my Gmail writing style",
    summary:
      "Sampled 18 sent messages across both accounts. Style profile drafted. Confirm before saving to memory.",
    chatMessages: seedChat(
      "Run /analyze-and-remember-writing-style for my Gmail accounts.",
      "Sampled 18 sent messages across charlie@runner.now and charlie@voteagora.com. Drafted a style profile — your voice differs by account. Want to confirm before I save it.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Sample sent messages",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Messages sampled (runner.now)", value: "11" },
            { label: "Messages sampled (voteagora.com)", value: "7" },
            { label: "Median length", value: "62 words" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Draft style profile",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "Runner.now voice: lowercase first word for internal, no signoff for short threads, em-dashes liberally. voteagora.com voice: more formal, sentence case throughout, signs off with 'Best, Charlie'. Both: short paragraphs, no emojis, occasional rhetorical question to soften asks.",
        },
      },
      {
        id: cid("card"),
        title: "Save profile to memory",
        state: "triage",
        triageNote:
          "Confirm and I'll commit this as the per-account Gmail style profile.",
        kind: "confirm",
        artifact: {
          kind: "checklist",
          items: [
            { label: "Save runner.now Gmail Communication Style profile" },
            { label: "Save voteagora.com Gmail Communication Style profile" },
            { label: "Use these when drafting future Gmail replies on each account" },
          ],
        },
      },
    ],
    updatedAt: "2 days ago",
  },
];

export const DONE: Project[] = [
  {
    id: cid("project"),
    status: "done",
    title: "Email triage — May 3 batch (50)",
    summary: "Drafted 14 replies, archived 31 noise emails, flagged 5.",
    chatMessages: seedChat(
      "Look at my latest emails, help me draft replies and after I send them, archive the ones where I was the last email.",
      "Done. 14 drafts sent, 31 archived, 5 flagged for your eyes. Inbox now at 11 unread.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Classification metrics",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Replied", value: "14" },
            { label: "Archived", value: "31" },
            { label: "Flagged for review", value: "5" },
          ],
        },
      },
      {
        id: cid("art"),
        title: "Drafts sent",
        artifact: {
          kind: "note",
          body:
            "All 14 sent. Three needed light edits before send (the Stripe contract redline, the Anthropic partner intro, and the Expedia procurement reply).",
        },
      },
    ],
    decisions: [
      "Auto-archive newsletters older than 7 days going forward",
    ],
    updatedAt: "May 3",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Booked SFO → Chicago for May 14",
    summary: "United UA-2241 nonstop, $362, lands 2:55pm. Aisle 12B.",
    chatMessages: seedChat(
      "Find me flights from SFO to Chicago May 14, arriving before 3pm.",
      "Booked UA-2241 nonstop, $362, lands 2:55pm. Confirmation in your inbox.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Flight booked",
        artifact: {
          kind: "attachments",
          items: [
            { label: "United UA-2241 SFO → ORD", meta: "May 14 · 08:40 → 14:55 · Confirmation UA-3KJ91X" },
          ],
        },
      },
    ],
    updatedAt: "May 5",
  },
  {
    id: cid("project"),
    status: "done",
    title: "SF house scan — 5 listings near 749 Guerrero",
    summary: "Top 5 3bd/2ba listings within 4 blocks. Open houses logged.",
    chatMessages: seedChat(
      "Find me houses in SF near 749 Guerrero — 3 bed 2 bath, list price and sqft.",
      "Top 5 in the neighborhood. Two have weekend open houses already scheduled.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "5 listings",
        artifact: {
          kind: "options",
          intro: "5 near-block listings.",
          options: [
            { id: "g-737", title: "737 Guerrero", meta: "3 bed · 2 bath · 1,820 sqft · $2.4M", notes: "Open house Sat 1pm." },
            { id: "g-810", title: "810 Guerrero", meta: "3 bed · 2 bath · 1,950 sqft · $2.65M", notes: "Open house Sun 2pm." },
            { id: "d-925", title: "925 Dolores", meta: "3 bed · 2 bath · 1,780 sqft · $2.55M", notes: "By appointment." },
            { id: "v-415", title: "415 Valencia", meta: "3 bed · 2 bath · 2,100 sqft · $2.8M", notes: "Higher price, more square footage." },
            { id: "g-655", title: "655 Guerrero", meta: "3 bed · 2 bath · 1,650 sqft · $2.25M", notes: "Closest to 749. Cheapest." },
          ],
        },
      },
    ],
    updatedAt: "May 5",
  },
  {
    id: cid("project"),
    status: "done",
    title: "749 Guerrero Rent Tracker — Cleaner Tab",
    summary: "Reorganized and formatted the Cleaner tab; conditional formatting applied.",
    chatMessages: seedChat(
      "Find my 749 Guerrero Rent Tracker — help me organize and format the Cleaner tab.",
      "Reorganized into three sections, applied conditional formatting for paid/unpaid status, and froze the header row.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Cleaner tab formatted",
        artifact: {
          kind: "code",
          summary: "Cleaner tab restructured with conditional formatting.",
          changes: [
            { label: "Header row frozen", meta: "row 1" },
            { label: "Conditional format: paid (green) / unpaid (red)", meta: "column D" },
            { label: "Currency format applied to amounts", meta: "column B" },
          ],
        },
      },
    ],
    updatedAt: "May 1",
  },
  {
    id: cid("project"),
    status: "done",
    title: "BigQuery — top 10 events last week",
    summary: "Pulled top 10 events from analytics, summarized counts and trends.",
    chatMessages: seedChat(
      "Query my analytics dataset on BigQuery for the top 10 events last week by count.",
      "Top 10 events pulled. Session_start dominates as expected; agent_chat is up 14% week-over-week.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Top 10 events (last 7 days)",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "session_start", value: "182,914" },
            { label: "agent_chat", value: "94,201", trend: "+14% WoW" },
            { label: "tool_call", value: "78,533", trend: "+9%" },
            { label: "mcp_invoke", value: "41,028" },
            { label: "draft_created", value: "12,886" },
          ],
        },
      },
    ],
    updatedAt: "Apr 28",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Q4 Budget — column B summed in B15",
    summary: "Found the sheet, summed column B, wrote $487,512 to B15.",
    chatMessages: seedChat(
      "In the Q4 Budget spreadsheet, sum column B and write the result in B15.",
      "Done. B15 = $487,512. Formula left as =SUM(B2:B14) so it'll auto-update.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "B15 updated",
        artifact: {
          kind: "note",
          body: "B15 = SUM(B2:B14) = $487,512. Currency format applied.",
        },
      },
    ],
    updatedAt: "Apr 28",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Meeting Notes (Apr 27) — Action Items section added",
    summary: "Opened the doc, added a blank Action Items section at the bottom.",
    chatMessages: seedChat(
      "Open my Meeting Notes April 27, 2026 doc and add an Action Items section at the bottom.",
      "Added. Section uses the same H2 style as your other meeting docs. Empty bullet list ready to fill.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Doc updated",
        artifact: {
          kind: "attachments",
          items: [
            { label: "Meeting Notes — April 27, 2026", meta: "Google Doc · +1 section" },
          ],
        },
      },
    ],
    updatedAt: "Apr 28",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Test email to yitong@runner.now",
    summary: "Sent.",
    chatMessages: seedChat(
      "Read my latest email and write to yitong@runner.now: 'This is a test email, thank you for the meeting today!'",
      "Sent. Subject auto-generated from your meeting context.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Email sent",
        artifact: {
          kind: "email",
          to: "yitong@runner.now",
          subject: "Thanks for the meeting today",
          body: "This is a test email, thank you for the meeting today!",
        },
      },
    ],
    updatedAt: "Apr 28",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Email validation — charlie@voteagora.com",
    summary: "Valid. MX records resolve, no disposable signal, no catch-all.",
    chatMessages: seedChat(
      "Is charlie@voteagora.com a valid email?",
      "Yes — MX records resolve cleanly, deliverability OK, no disposable/catch-all signal. Safe to send to.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Validation result",
        artifact: {
          kind: "checklist",
          items: [
            { label: "MX records present", checked: true },
            { label: "Deliverable", checked: true },
            { label: "Not disposable", checked: true },
            { label: "Not catch-all", checked: true },
          ],
        },
      },
    ],
    updatedAt: "May 6",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Board meeting notes Google Doc",
    summary: "Formatted doc for upcoming board meeting — agenda, attendees, section blocks, action items.",
    chatMessages: seedChat(
      "Help me create a meeting notes Google Doc that's well-formatted for the upcoming board meeting.",
      "Created. Includes agenda block, attendee list, six section blocks, and an Action Items section at the bottom.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Doc structure",
        artifact: {
          kind: "checklist",
          items: [
            { label: "Title + date", checked: true },
            { label: "Attendees (5 board members)", checked: true },
            { label: "Agenda block", checked: true },
            { label: "Six section H2s for topics", checked: true },
            { label: "Action Items section at bottom", checked: true },
          ],
        },
      },
    ],
    updatedAt: "May 1",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Poem email to Yitong",
    summary: "Sent a short spring poem.",
    chatMessages: seedChat(
      "Draft me an email with a poem to send to yitong@runner.now.",
      "Drafted and sent. Six lines, light, spring-themed. You signed off with 'c'.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Email sent",
        artifact: {
          kind: "email",
          to: "yitong@runner.now",
          subject: "small thing",
          body:
            "yitong —\n\nlight comes earlier now\nthe sidewalks are forgetful\nbut the magnolias remember everything\nand spill it out at once\n\n(thinking of you)\n\nc",
        },
      },
    ],
    updatedAt: "May 6",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Pulled April rent — $4,825",
    summary: "Found the tracker, pulled the April line, matched March exactly.",
    chatMessages: seedChat(
      "Look for the 749 Guerrero Rent Tracker. What was rent in April? I need to pay May.",
      "Found it. April rent: $4,825 (same as March). Ready to set up May payment when you are.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "April rent line",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "April rent", value: "$4,825" },
            { label: "Status", value: "Paid Apr 1" },
            { label: "March rent (for ref)", value: "$4,825" },
          ],
        },
      },
    ],
    updatedAt: "May 1",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Expedia sales deck — first draft (8 slides)",
    summary: "First-pass draft of the Expedia sales deck before the full 10-slide build.",
    chatMessages: seedChat(
      "Create me a Google Slides for a sales presentation with an enterprise customer — Expedia, on flight MCPs for our business.",
      "First draft up: 8 slides covering problem, solution, integration, pricing, next steps. Will expand to the full 10 later.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Deck v0.1",
        artifact: {
          kind: "attachments",
          items: [
            { label: "Expedia — Flight MCP Pitch (v0.1)", meta: "Google Slides · 8 slides" },
          ],
        },
      },
    ],
    updatedAt: "May 1",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Linked the Q4 Budget spreadsheet",
    summary: "Found in Drive at /Finance/Budgets/2025/. Linked it.",
    chatMessages: seedChat(
      "Find the Q4 Budget spreadsheet.",
      "Found at /Finance/Budgets/2025/Q4 Budget. Linked below.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Link",
        artifact: {
          kind: "attachments",
          items: [
            { label: "Q4 Budget", meta: "/Finance/Budgets/2025/Q4 Budget · Google Sheets" },
          ],
        },
      },
    ],
    updatedAt: "Apr 28",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Morning briefing — May 1",
    summary: "Daily brief: 3 meetings, 11 unread, 2 deadlines.",
    chatMessages: seedChat(
      "/morning-briefing",
      "Today: 3 meetings (Yitong 11am, board sync 2pm, Maria 4pm). 11 unread (Acme RFP is the only urgent one). 2 deadlines: pre-read draft due tomorrow, May rent on the 1st.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Daily summary",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Meetings today", value: "3" },
            { label: "Unread email", value: "11" },
            { label: "Deadlines this week", value: "2" },
          ],
        },
      },
    ],
    updatedAt: "May 1",
  },
];

export const ALL_PROJECTS: Project[] = [...PROPOSALS, ...ACTIVE, ...DONE];

export type SplitBucket =
  | "today"
  | "tomorrow"
  | "this-week"
  | "next-week"
  | "this-month";

export interface SplitTodo {
  id: string;
  title: string;
  note?: string;
  bucket?: SplitBucket;
  project?: string;
  time?: string;
}

export const SPLIT_PROJECT_ORDER: string[] = [
  "Inbox",
  "Travel",
  "749 Guerrero",
  "Board Prep",
  "Analytics",
  "Sales",
  "Everything",
];

export const SPLIT_TODOS: SplitTodo[] = [
  {
    id: "split-yitong-sync",
    title: "30-min sync with Yitong",
    time: "14:00",
    bucket: "today",
    project: "Inbox",
  },
  {
    id: "split-board-pre-read",
    title: "Send board pre-read",
    note: "96h ahead of May 19 — needs to go today.",
    bucket: "today",
    project: "Board Prep",
  },
  {
    id: "split-may-rent",
    title: "Pay May rent — 749 Guerrero",
    note: "$4,825. Form is filled except routing number.",
    bucket: "today",
    project: "749 Guerrero",
  },
  {
    id: "split-cover-chart",
    title: "Pick April investor update cover chart",
    note: "Two options waiting in the active stack.",
    bucket: "today",
    project: "Inbox",
  },
  {
    id: "split-vacation-reply",
    title: "Confirm Gmail vacation auto-reply",
    note: "Dates ready — confirm to apply across both accounts.",
    bucket: "today",
    project: "Inbox",
  },
  {
    id: "split-expedia-logo",
    title: "Pick case study logo for Expedia deck",
    bucket: "today",
    project: "Sales",
  },
  {
    id: "split-chicago-hotel",
    title: "Pick Chicago hotel — Conrad vs Kimpton vs Hyatt",
    bucket: "tomorrow",
    project: "Travel",
  },
  {
    id: "split-toronto-agents",
    title: "Chase agents for Wellington + King W showings",
    bucket: "tomorrow",
    project: "Travel",
  },
  {
    id: "split-finance-pack",
    title: "Nudge Maria for the finance pack",
    note: "Pre-read goes out tomorrow.",
    bucket: "tomorrow",
    project: "Board Prep",
  },
  {
    id: "split-share-superman",
    title: "Decide sharing for Superman GDoc",
    bucket: "this-week",
    project: "Board Prep",
  },
  {
    id: "split-q1-memo",
    title: "Circulate Q1 analytics memo",
    note: "After your read pass.",
    bucket: "this-week",
    project: "Analytics",
  },
  {
    id: "split-chicago-dinners",
    title: "Lock in Chicago dinners (Reece, Marcus)",
    bucket: "this-week",
    project: "Travel",
  },
  {
    id: "split-toronto-showings",
    title: "Toronto showings — 88 Front, 60 Yonge",
    note: "Sat May 17. Confirm with agents.",
    bucket: "this-week",
    project: "Travel",
  },
  {
    id: "split-q4-deck-copy",
    title: "Edit 'Next Steps' bullets on Q4 Deck",
    bucket: "this-week",
    project: "Sales",
  },
  {
    id: "split-board-mtg",
    title: "Board meeting — May 19",
    bucket: "next-week",
    project: "Board Prep",
  },
  {
    id: "split-chicago-trip",
    title: "Chicago trip — May 14-17",
    bucket: "next-week",
    project: "Travel",
  },
  {
    id: "split-gmail-style",
    title: "Confirm Gmail style profiles",
    note: "Drafted — review and save to memory.",
    bucket: "next-week",
    project: "Inbox",
  },
  {
    id: "split-pipeline-handoff",
    title: "Instrument Qualified → Proposal handoff latency",
    bucket: "this-month",
    project: "Analytics",
  },
  {
    id: "split-749-decision",
    title: "Decide on 749 Guerrero — renew or move",
    note: "Lease decision by end of month.",
    bucket: "this-month",
    project: "749 Guerrero",
  },
  {
    id: "split-toronto-pick",
    title: "Pick a Toronto apartment",
    bucket: "this-month",
    project: "Travel",
  },
  {
    id: "split-expedia-followup",
    title: "Expedia follow-up after the meeting",
    project: "Sales",
  },
  {
    id: "split-bq-cleanup",
    title: "Clean up BigQuery scratch tables",
    project: "Analytics",
  },
  {
    id: "split-drive-tidy",
    title: "Tidy Drive folder structure",
  },
  {
    id: "split-poem-followup",
    title: "Reply to Yitong if she writes back about the poem",
  },
];
