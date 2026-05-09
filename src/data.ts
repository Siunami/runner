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
      items: { label: string; checked?: boolean }[];
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
    title: "Fix the flaky auth tests on CI",
    summary:
      "The auth.refresh.token-rotation suite has been failing intermittently for two weeks. Last 5 retries all passed, but main went red Tuesday. Probably a race in the mock clock setup.",
    proposal:
      "The auth.refresh.token-rotation suite has been failing intermittently for two weeks. Last 5 retries all passed, but main went red Tuesday. Probably a race in the mock clock setup.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Migrate from raw pg-pool to pgbouncer",
    summary:
      "We're hitting connection ceiling on Railway during peak. pgbouncer in transaction mode would let us 10x. Risk: we use SET LOCAL in two places, need to audit.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Strict typecheck the shared package",
    summary:
      "@runner/shared has strict: false. Migrating it would catch the kind of null-deref that bit us in the draft renderer last week.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Rewrite ToolSearch ranking",
    summary:
      "Current scoring is naive — substring + recency. Want BM25 over the description corpus, plus a small reranker on the top 20.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Delete the deprecated mock agent path",
    summary:
      "AGENT_MODE=mock is no longer referenced by any test. Confirm with grep, then rip it out — ~600 lines.",
    chatMessages: [],
    updatedAt: "2 days ago",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Upgrade Vite 5 → 6",
    summary:
      "Mostly a chore but unblocks the new SSR streaming API we want for /home.",
    chatMessages: [],
    updatedAt: "2 days ago",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Audit Claude SDK token counting drift",
    summary:
      "Billing dashboard shows ~3% drift between SDK-reported and Anthropic-reported usage. Either we're over-counting cache hits or the SDK changed.",
    chatMessages: [],
    updatedAt: "3 days ago",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Get to inbox zero before Friday",
    summary:
      "Trip starts Saturday. Need a clean inbox before I leave. Probably 80% archive.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Draft April investor update",
    summary:
      "Format is the same as March. Pull metrics from the dashboard, write the narrative, ping me to review.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Respond to the 14 unanswered customer emails",
    summary:
      "The ones tagged 'product-feedback'. Most just need acknowledgement + 'we're tracking it'.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Schedule the three board prep sessions",
    summary:
      "Three 1:1s with each board member before the May meeting. Find times that work for everyone, draft the prep doc.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Book SFO → NYC for May 22, return May 26",
    summary:
      "Prefer red-eye out, daytime back. United or Delta. Aisle. Under $700 if possible.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Find a hotel within 10 min walk of SoHo office",
    summary:
      "May 22-26. Quiet room, gym, good wifi. Budget $400/night. Show me 3 options.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Renew TSA PreCheck before it expires",
    summary:
      "Expires June 14. Find the renewal flow, fill what you can, leave the SSN field for me.",
    chatMessages: [],
    updatedAt: "2 days ago",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Reply to the 8 Slack threads where I'm pinged",
    summary:
      "Most are async questions I can answer in one line. Draft cards, I'll review.",
    chatMessages: [],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Research onboarding flows from 5 best-in-class B2B SaaS",
    summary:
      "Linear, Notion, Vercel, Stripe, Figma. Screenshots + what made each one work.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Source 20 staff eng candidates with infra + AI background",
    summary:
      "Bay Area or remote. 8+ yrs. Has shipped a managed-services product. Draft outreach for the top 5.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Order Thai for lunch — pad see ew, no tofu",
    summary: "From Lers Ros if it's open, otherwise Osha. By 12:30.",
    chatMessages: [],
    updatedAt: "Just now",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Clean Downloads folder",
    summary:
      "Anything older than 60 days. Show me a list before deleting. Looking to reclaim 10+ GB.",
    chatMessages: [],
    updatedAt: "3 days ago",
  },
  {
    id: cid("project"),
    status: "proposed",
    title: "Read and summarize the latest MCP spec updates",
    summary:
      "Spec moved to draft 0.4. What changed, what breaks, what we should adopt.",
    chatMessages: [],
    updatedAt: "Yesterday",
  },
];

export const ACTIVE: Project[] = [
  {
    id: cid("project"),
    status: "active",
    title: "April investor update",
    summary:
      "Format is the same as March. Pull metrics, write narrative, send for review.",
    chatMessages: seedChat(
      "Draft the April investor update — same format as March.",
      "Pulled the Q1 metrics, drafted the narrative, and prepared two cover chart options. Pick a chart and I'll send.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Pull metrics",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "ARR", value: "$4.6M", trend: "+18% MoM" },
            { label: "Net new logos", value: "42", trend: "+11" },
            { label: "Gross margin", value: "76%", trend: "+1pp" },
            { label: "Cash runway", value: "18mo", trend: "flat" },
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
            "April was the strongest month since launch — ARR crossed $4.6M (+18% MoM) on the back of mid-market expansion. Two larger logos (Acme, Beta) closed. Hiring slowed to a single offer due to focus on the staff-eng search. Outlook for May is steady; June depends on the new pricing rolling cleanly.",
        },
      },
      {
        id: cid("card"),
        title: "Generate two chart options for the cover",
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
              notes:
                "Cleanest read; mirrors what investors saw in March. Best if we want continuity.",
            },
            {
              id: "chart-b",
              title: "Option B — ARR + Net new logos",
              meta: "Stacked dual-axis",
              notes:
                "More information density. Good if we want to highlight the logo acceleration.",
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
    title: "Hire a Staff Engineer",
    summary:
      "Bay Area or remote, 8+ yrs, infra/AI background. Driving the search end-to-end.",
    chatMessages: seedChat(
      "Source 20 staff eng candidates with infra + AI background. Bay Area or remote.",
      "Sourced 20, reached out to top 5, 3 replied. Need to schedule intros and decide on candidate #2 — she declined the on-site but is open to a longer chat.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Source 20 candidates",
        state: "done",
        artifact: {
          kind: "people",
          entries: [
            { name: "Aiden L.", meta: "Stripe → infra eng", note: "10 yrs, distributed systems" },
            { name: "Linnea S.", meta: "Anthropic → systems", note: "12 yrs, prior staff" },
            { name: "Marcus B.", meta: "Cloudflare → edge", note: "9 yrs, performance focus" },
            { name: "Priya N.", meta: "Snowflake → query", note: "11 yrs, prior tech lead" },
            { name: "+ 16 more", note: "Full pipeline tracked in Notion" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Outreach to top 5",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "Sent personalized outreach to Aiden, Linnea, Marcus, Priya, and Wen. Reply rate 60% (3 of 5). Two passes (Marcus, Wen).",
        },
      },
      {
        id: cid("card"),
        title: "Schedule intros for the 3 who replied",
        state: "todo",
        artifact: {
          kind: "checklist",
          items: [
            { label: "Aiden L. — proposed Tue 2pm or Wed 11am" },
            { label: "Linnea S. — flexible, prefers Thursday" },
            { label: "Priya N. — only afternoons next week" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Decide whether to keep pursuing candidate #2 (Linnea)",
        state: "triage",
        triageNote:
          "She declined the on-site but is open to a longer chat. Worth pushing or move on?",
        artifact: {
          kind: "decision",
          question:
            "Linnea declined the on-site but offered a longer informal chat. Continue or pass?",
          choices: [
            {
              id: "push",
              label: "Push for the chat",
              rationale:
                "Strong signal in her reply; long chat is a low-cost way to reset the funnel. Risk: another 2 weeks of cycle time.",
            },
            {
              id: "pass",
              label: "Pass and refocus",
              rationale:
                "Three other candidates progressing; an unwilling candidate rarely converts. Keep the bar high.",
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
    title: "NYC trip — May 22-26",
    summary:
      "SFO → JFK red-eye out, daytime back. Hotel near SoHo office, 4 dinners, airport pickups.",
    chatMessages: seedChat(
      "Plan the NYC trip May 22-26. Hotel near SoHo, dinners with Mike, Priya, Anand, plus airport pickup.",
      "Booked the flights and put hotel options up — one is over budget but a 4 min walk. Need approval before I book #2.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Book SFO → JFK red-eye May 22",
        state: "done",
        artifact: {
          kind: "attachments",
          items: [
            { label: "United UA-1525", meta: "May 22 · 22:30 SFO → 06:55 JFK · $612" },
            { label: "Confirmation #UA-7HJ43X", meta: "Aisle, exit row" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Find 3 hotel options near SoHo",
        state: "triage",
        triageNote:
          "Two options under budget, one above. Need approval to book #2 (Crosby St Hotel, $480/night) — over the $400 cap but 4 min walk.",
        artifact: {
          kind: "options",
          intro: "Three options near SoHo. Crosby is over budget but closest.",
          options: [
            {
              id: "h-soho-grand",
              title: "Soho Grand Hotel",
              meta: "$365/night · 7 min walk",
              notes:
                "Quiet rooms on high floors, full gym. Stayed in Feb — solid wifi.",
            },
            {
              id: "h-crosby",
              title: "Crosby Street Hotel",
              meta: "$480/night · 4 min walk",
              notes:
                "Over the $400 cap. Best location. Needs your approval to book.",
            },
            {
              id: "h-arlo",
              title: "Arlo SoHo",
              meta: "$295/night · 12 min walk",
              notes: "Cheapest. Smaller rooms, decent gym. Right at the budget edge.",
            },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Add calendar holds for the trip",
        state: "done",
        artifact: {
          kind: "checklist",
          items: [
            { label: "May 22 — outbound flight", checked: true },
            { label: "May 23-25 — NYC office days", checked: true },
            { label: "May 26 — return flight", checked: true },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Schedule dinners with Mike, Priya, Anand",
        state: "todo",
        artifact: {
          kind: "people",
          entries: [
            { name: "Mike T.", meta: "Tuesday May 23", note: "Confirmed at L'Artusi 7pm" },
            { name: "Priya N.", meta: "Wednesday May 24", note: "Awaiting reply" },
            { name: "Anand R.", meta: "Thursday May 25", note: "Suggested 3 spots, choose one" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Pre-book Revel for airport pickup",
        state: "todo",
        artifact: {
          kind: "note",
          body:
            "Plan: schedule a Revel for JFK arrival on May 23 at 06:55 and SFO departure May 26 at 19:30. Will hold once flights are confirmed.",
        },
      },
    ],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Inbox triage — today",
    summary: "47 unread to clear before EOD. Mostly classify, draft, and send.",
    chatMessages: seedChat(
      "Get through inbox triage today.",
      "Classified all 47, drafted replies for the 12 actionables, archived 31 noise emails. Drafts ready for your review.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Classify 47 unread",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Actionable", value: "12" },
            { label: "Newsletter / noise", value: "31" },
            { label: "Needs decision", value: "4" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Draft replies for 12 actionables",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "All 12 drafts ready in the Drafts folder. Average length 2 paragraphs. Three flagged for your eyes (RFP from Acme, contract redline from legal, mentor intro from Sarah).",
        },
      },
      {
        id: cid("card"),
        title: "Review and send drafts",
        state: "triage",
        triageNote:
          "12 drafts ready. Skim and send — flagging the three that need your eyes.",
        artifact: {
          kind: "email",
          to: "12 recipients",
          subject: "Acme RFP — proposed pricing structure",
          body:
            "Hi Sam,\n\nThanks for the detailed RFP. Quick read: the volume tier matches our enterprise plan; we'd add a 12-month commit discount and a usage-based addon for the agentic features. Draft pricing in the attached doc.\n\nHappy to walk you through this Thursday or Friday — what works on your side?\n\nBest,",
        },
      },
      {
        id: cid("card"),
        title: "Archive the 31 noise emails",
        state: "done",
        artifact: {
          kind: "note",
          body: "Auto-archived. Two senders moved to permanent filter.",
        },
      },
    ],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Postmortem: May 3 MCP proxy outage",
    summary:
      "Pulled the timeline, identified root cause, drafted writeup. Need sign-off on action items.",
    chatMessages: seedChat(
      "Write up the May 3 MCP proxy outage. Need timeline, root cause, action items.",
      "Done with the writeup. Pulled the trace, identified the bad upstream timeout config as root cause, drafted three action items. Want sign-off before sending broader.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Pull the trace timeline",
        state: "done",
        artifact: {
          kind: "attachments",
          items: [
            { label: "trace-2026-05-03.json", meta: "14.2 MB · 3,918 spans" },
            { label: "Logfire dashboard", meta: "logfire/runner/2026-05-03" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Identify root cause",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "Upstream Anthropic API gateway returned 502s for 9 minutes; our proxy had no fallback timeout, so all in-flight requests piled up and saturated the worker pool. No retries because the request shape failed our internal validation cache.",
        },
      },
      {
        id: cid("card"),
        title: "Write up timeline and contributing factors",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "5 min outage, 17 min full impact. Contributing factors: validation cache thundering herd, no per-upstream circuit breaker, alert routing missed because of paging policy update from last week.",
        },
      },
      {
        id: cid("card"),
        title: "Confirm preventive action items with platform team",
        state: "triage",
        triageNote:
          "Walk through these three with platform leads in person. Confirm here once you've got verbal sign-off — drop a note or screenshot of the channel ack.",
        kind: "confirm",
        artifact: {
          kind: "checklist",
          items: [
            { label: "Add per-upstream circuit breaker (owner: Mark)" },
            { label: "Cap validation cache fan-out at 50 concurrent (owner: Lina)" },
            { label: "Restore alert routing rule for proxy 5xx > 1% / min (owner: oncall)" },
          ],
        },
      },
    ],
    updatedAt: "Today",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Migrate to pgbouncer",
    summary:
      "Audit complete, staging deployed, load test green. Pool mode call needed.",
    chatMessages: seedChat(
      "Move us off raw pg-pool to pgbouncer.",
      "Audit done — two SET LOCAL callsites. Staging up, load test green. Need a pool mode decision.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Audit SET LOCAL usage",
        state: "done",
        artifact: {
          kind: "code",
          summary: "Two callsites use SET LOCAL — both in audit middleware.",
          changes: [
            { label: "server/audit/middleware.ts", meta: "SET LOCAL audit.user" },
            { label: "server/billing/tx.ts", meta: "SET LOCAL billing.context" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Stand up pgbouncer in staging",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "Deployed to staging cluster. 100 connection limit on bouncer side, 1k on Postgres side. Health check passing.",
        },
      },
      {
        id: cid("card"),
        title: "Run load test",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "p50 latency", value: "8ms", trend: "-2ms" },
            { label: "p99 latency", value: "42ms", trend: "-15ms" },
            { label: "Connection saturation", value: "31%", trend: "down from 92%" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Decide pool mode: transaction vs session",
        state: "triage",
        triageNote:
          "Transaction mode breaks our two SET LOCAL callsites. Either rewrite them (~2 days) or use session mode and accept lower pooling.",
        artifact: {
          kind: "decision",
          question: "Pick a pool mode for pgbouncer rollout.",
          choices: [
            {
              id: "tx-mode",
              label: "Transaction mode + rewrite SET LOCAL",
              rationale:
                "10x pooling. ~2 days of work in audit + billing. Required for the eventual API migration. Highest long-term ceiling.",
            },
            {
              id: "session-mode",
              label: "Session mode (no rewrite)",
              rationale:
                "Ship today, no code change. Pooling gain ~3x instead of 10x. Acceptable until next quarter.",
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
    title: "Renew TSA PreCheck",
    summary:
      "Expires June 14. Form ready, paused on the SSN field.",
    chatMessages: seedChat(
      "Renew TSA PreCheck — expires June 14.",
      "Opened the renewal flow, filled everything I could. Need you to drop in the SSN to submit.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Open the renewal flow",
        state: "done",
        artifact: {
          kind: "note",
          body: "Logged in to TSA enrollment portal with the existing KTN. Renewal flow available.",
        },
      },
      {
        id: cid("card"),
        title: "Fill the renewal form",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "Pre-populated name, address, KTN, passport. Reviewed for typos. Form ready aside from the SSN field.",
        },
      },
      {
        id: cid("card"),
        title: "Need SSN to submit",
        state: "triage",
        triageNote:
          "Paused at the SSN field — drop it in and I'll verify the format and submit.",
        kind: "form",
        verifyState: "idle",
        formFields: [
          {
            key: "ssn",
            label: "Social Security Number",
            type: "password",
            placeholder: "XXX-XX-XXXX",
            value: "",
          },
          {
            key: "ktnConfirm",
            label: "Confirm KTN (last 4)",
            type: "text",
            placeholder: "e.g. 4821",
            value: "",
          },
        ],
        artifact: {
          kind: "paused",
          reason: "SSN field requires manual entry — won't autofill sensitive data.",
          awaiting: "User to enter SSN below; AI will verify and submit.",
        },
      },
    ],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Clean Downloads folder",
    summary:
      "84 items >60 days old, 12.4GB. Confirm the deletion list before I move them to Trash.",
    chatMessages: seedChat(
      "Clean my Downloads folder. Anything older than 60 days.",
      "Inventoried 84 items, 12.4GB. Categorized them. Confirm the list before I move to Trash.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Inventory items >60d old",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Total items", value: "84" },
            { label: "Total size", value: "12.4 GB" },
            { label: "Oldest", value: "247 days" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Categorize: screenshots / installers / docs / other",
        state: "done",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Screenshots", value: "37 (1.2 GB)" },
            { label: "Installers (.dmg/.pkg)", value: "18 (8.9 GB)" },
            { label: "Docs (PDF, ZIP)", value: "21 (1.8 GB)" },
            { label: "Other", value: "8 (0.5 GB)" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Confirm deletion list",
        state: "triage",
        triageNote:
          "Ready to move 84 items to Trash. Showing summary — confirm before I proceed.",
        artifact: {
          kind: "checklist",
          items: [
            { label: "37 screenshots — older than 60 days" },
            { label: "18 installers — Xcode, Docker, Slack, Zoom, Notion" },
            { label: "21 misc docs — most are old contract drafts and exports" },
            { label: "8 other — PDFs, fonts, downloads-from-browser" },
          ],
        },
      },
    ],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Q2 competitive scan",
    summary:
      "8 competitors tracked. Funding/headcount/positioning pulled. Need synthesis + leadership review.",
    chatMessages: seedChat(
      "Run Q2 competitive scan.",
      "Tracked 8 competitors and pulled funding/headcount/positioning. Synthesis + leadership review still to do.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Identify the 8 competitors to track",
        state: "done",
        artifact: {
          kind: "people",
          entries: [
            { name: "Replit Agents", meta: "Direct" },
            { name: "Cursor Composer", meta: "Direct" },
            { name: "Lindy", meta: "Adjacent — agentic todo" },
            { name: "Sweep", meta: "Adjacent" },
            { name: "Codeium Cascade", meta: "Direct" },
            { name: "Devin (Cognition)", meta: "Direct" },
            { name: "Warp Agent Mode", meta: "Adjacent" },
            { name: "Zed AI", meta: "Adjacent" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Pull funding, headcount, positioning",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "Logged in the comp tracker doc. Replit and Cursor remain best-funded; Devin's traction questions persist; Lindy and Sweep both pivoted positioning since Q1.",
        },
      },
      {
        id: cid("card"),
        title: "Summarize key shifts since Q1",
        state: "todo",
        artifact: {
          kind: "note",
          body:
            "Plan: 1-page memo, 4 bullets per competitor max. Will pull the Q1 doc for diff. Aiming for 800-1200 words total.",
        },
      },
      {
        id: cid("card"),
        title: "Schedule review with leadership",
        state: "todo",
        artifact: {
          kind: "checklist",
          items: [
            { label: "Find a 45-minute slot before May 19" },
            { label: "Send pre-read 24h ahead" },
            { label: "Capture decisions in the comp tracker" },
          ],
        },
      },
    ],
    updatedAt: "Yesterday",
  },
  {
    id: cid("project"),
    status: "active",
    title: "Upgrade Vite 5 → 6",
    summary:
      "Migration in progress. Codemods done, SSR layer broken, HMR needs re-enabling for shadcn package.",
    chatMessages: seedChat(
      "Upgrade us from Vite 5 to 6.",
      "Read the migration guide, ran codemods. SSR layer has two breakages and shadcn HMR is off. Working through them.",
    ),
    cards: [
      {
        id: cid("card"),
        title: "Read migration guide",
        state: "done",
        artifact: {
          kind: "note",
          body:
            "Three breaking changes affect us: middleware mode signature, deprecated `define` field, and `legacy.buildSsrCjsExternalHeuristics`.",
        },
      },
      {
        id: cid("card"),
        title: "Run codemods on apps/web",
        state: "done",
        artifact: {
          kind: "code",
          summary: "Ran @vitejs/codemod-vite-6 across the workspace.",
          changes: [
            { label: "vite.config.ts", meta: "Updated 4 packages" },
            { label: "src/server/ssr.ts", meta: "Adapter signature changed" },
            { label: "package.json", meta: "Bumped to ^6.4" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Fix breakages in the SSR layer",
        state: "todo",
        artifact: {
          kind: "code",
          summary: "Two open errors in SSR streaming after the bump.",
          changes: [
            { label: "ssr.ts:42", meta: "ViteDevServer signature mismatch" },
            { label: "stream.ts:91", meta: "transformIndexHtml return type" },
          ],
        },
      },
      {
        id: cid("card"),
        title: "Re-enable HMR for shadcn package",
        state: "todo",
        artifact: {
          kind: "note",
          body:
            "shadcn registers its own HMR boundary which silently broke. Plan: pin to 0.8.x for now, file an upstream issue.",
        },
      },
      {
        id: cid("card"),
        title: "Roll to staging",
        state: "todo",
        artifact: {
          kind: "checklist",
          items: [
            { label: "Cut a release branch" },
            { label: "Deploy to staging cluster" },
            { label: "Run full e2e suite" },
            { label: "Watch for HMR regressions for 24h" },
          ],
        },
      },
    ],
    updatedAt: "Yesterday",
  },
];

export const DONE: Project[] = [
  {
    id: cid("project"),
    status: "done",
    title: "Q1 board meeting",
    summary: "Held Apr 9. Approved budget, no objections to Q2 plan.",
    chatMessages: seedChat(
      "Run the Q1 board meeting.",
      "Held Apr 9. Approved budget, no objections to Q2 plan. Filed minutes and decision log.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Pre-read sent 96h ahead",
        artifact: {
          kind: "email",
          to: "Board (5 members)",
          subject: "Q1 pre-read and Apr 9 agenda",
          body:
            "Board team,\n\nAttaching the Q1 pre-read and Apr 9 agenda 96 hours ahead per our usual cadence.\n\nKey reads: Q1 metrics, Q2 plan, budget proposal (page 14).\n\nReply with anything you want surfaced live.\n\nBest,",
        },
      },
      {
        id: cid("art"),
        title: "Deck v3",
        artifact: {
          kind: "attachments",
          items: [
            { label: "board-deck-v3.key", meta: "Updated through Apr 8" },
          ],
        },
      },
      {
        id: cid("art"),
        title: "Minutes filed",
        artifact: {
          kind: "attachments",
          items: [
            { label: "docs/board/2026-04-09.md", meta: "12 sections, 4 decisions captured" },
          ],
        },
      },
    ],
    decisions: ["Bump R&D spend +15% in Q2"],
    updatedAt: "Apr 9",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Hired Product Designer (Maya K.)",
    summary: "Started May 1.",
    chatMessages: seedChat(
      "Hire a product designer.",
      "Maya K. accepted Apr 18, started May 1. Funnel summary filed.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Sourced 35 candidates",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Sourced", value: "35" },
            { label: "Phone screened", value: "8" },
            { label: "On-site", value: "3" },
            { label: "Offer", value: "1" },
          ],
        },
      },
      {
        id: cid("art"),
        title: "Offer extended to Maya K., accepted Apr 18",
        artifact: {
          kind: "email",
          subject: "Welcome to Runner — offer details",
          body:
            "Hi Maya,\n\nWe'd love for you to join us as Senior Product Designer. Offer details attached. Looking forward to having you onboard.\n\nWelcome aboard!",
        },
      },
    ],
    decisions: ["Skip the take-home next round — the live exercise was more signal"],
    updatedAt: "Apr 18",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Shipped billing page v2",
    summary: "Self-serve plan changes now possible.",
    chatMessages: seedChat(
      "Ship billing page v2.",
      "Shipped. Self-serve plan changes are now live. Annual prepay parked for now.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "PR — web#798",
        artifact: {
          kind: "code",
          summary: "Billing page v2 with self-serve plan changes.",
          changes: [
            { label: "web/billing/PlanSelector.tsx", meta: "+312 / -42" },
            { label: "server/billing/api.ts", meta: "+158 / -19" },
            { label: "shared/billing-types.ts", meta: "+24 / -2" },
          ],
        },
      },
    ],
    decisions: ["Don't expose annual prepay yet — pricing not finalized"],
    updatedAt: "Apr 30",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Mar 28 rate-limit incident postmortem",
    summary: "Wrote up, presented, action items in flight.",
    chatMessages: seedChat(
      "Postmortem the Mar 28 rate-limit incident.",
      "Doc filed, presented to platform team. 5 action items assigned, all tracked.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Postmortem doc",
        artifact: {
          kind: "attachments",
          items: [
            { label: "docs/incidents/2026-03-28.md", meta: "Timeline, root cause, factors" },
          ],
        },
      },
      {
        id: cid("art"),
        title: "5 action items",
        artifact: {
          kind: "checklist",
          items: [
            { label: "Add per-workspace quota caps", checked: true },
            { label: "Tune circuit-breaker thresholds", checked: true },
            { label: "Wire alert to PagerDuty", checked: true },
            { label: "Add runbook entry", checked: true },
            { label: "Re-run capacity test on staging", checked: true },
          ],
        },
      },
    ],
    decisions: ["Introduce per-workspace quota caps (now live, see today's spike)"],
    updatedAt: "Apr 4",
  },
  {
    id: cid("project"),
    status: "done",
    title: "London trip Apr 15-22",
    summary: "Booked, attended, returned.",
    chatMessages: seedChat(
      "Plan London trip Apr 15-22.",
      "All booked, all dinners held. Recommendation: 8 days next time, the last day was rushed.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "BA flights booked",
        artifact: {
          kind: "attachments",
          items: [
            { label: "BA-286 SFO → LHR", meta: "Apr 15 · Confirmation BA-7XQ8" },
            { label: "BA-285 LHR → SFO", meta: "Apr 22 · Confirmation BA-9MN1" },
          ],
        },
      },
      {
        id: cid("art"),
        title: "Soho Hotel · 7 nights",
        artifact: {
          kind: "attachments",
          items: [
            { label: "Soho Hotel London", meta: "Apr 15-22 · £388/night · gym, quiet floor" },
          ],
        },
      },
      {
        id: cid("art"),
        title: "12 dinners scheduled and held",
        artifact: {
          kind: "people",
          entries: [
            { name: "Tom (Anthropic UK)", meta: "Apr 15 — Lyle's" },
            { name: "Anna + Reece", meta: "Apr 16 — Brat" },
            { name: "Old SFO crew", meta: "Apr 17 — Sketch" },
            { name: "Plus 9 more", note: "All held, notes filed" },
          ],
        },
      },
    ],
    decisions: ["Extend to 8 days next time — the last day was rushed"],
    updatedAt: "Apr 22",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Closed seed extension",
    summary: "$8M from existing investors + one new lead.",
    chatMessages: seedChat(
      "Close the seed extension.",
      "Term sheet signed Apr 2. Wire received Apr 11. Cap table updated. Skipping the Series A pitch tour for 12 months.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Term sheet signed Apr 2",
        artifact: {
          kind: "attachments",
          items: [
            { label: "termsheet-2026-04-02.pdf", meta: "Counter-signed" },
          ],
        },
      },
      {
        id: cid("art"),
        title: "Wire received Apr 11",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Total raised", value: "$8.0M" },
            { label: "Existing investors", value: "$5.5M" },
            { label: "New lead", value: "$2.5M" },
          ],
        },
      },
      {
        id: cid("art"),
        title: "Cap table updated",
        artifact: {
          kind: "note",
          body: "Pulley updated. Founder + employee dilution within plan. ESOP top-up to 14%.",
        },
      },
    ],
    decisions: ["Skip a Series A pitch tour for 12 months — focus on revenue"],
    updatedAt: "Apr 11",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Strategy doc v3",
    summary: "Published internally Apr 5. Reviewed by exec team + board.",
    chatMessages: seedChat(
      "Write strategy doc v3.",
      "Published Apr 5. Path 2 (agentic todo) committed; Path 1 deprioritized.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "Strategy doc v3",
        artifact: {
          kind: "attachments",
          items: [
            { label: "docs/strategy/v3.md", meta: "9,400 words · 4 pillars" },
          ],
        },
      },
      {
        id: cid("art"),
        title: "Reviewed by exec + board",
        artifact: {
          kind: "people",
          entries: [
            { name: "Exec team", meta: "Apr 3" },
            { name: "Board readout", meta: "Apr 5" },
          ],
        },
      },
    ],
    decisions: [
      "Commit to the agentic-todo direction (Path 2)",
      "De-prioritize generalist agent (Path 1)",
    ],
    updatedAt: "Apr 5",
  },
  {
    id: cid("project"),
    status: "done",
    title: "Rewrote onboarding flow",
    summary: "Activation up 18% week over week.",
    chatMessages: seedChat(
      "Rewrite the onboarding flow.",
      "Shipped. Activation up 18% WoW. The 'tour' step had <5% adoption — killed it.",
    ),
    artifacts: [
      {
        id: cid("art"),
        title: "3 PRs merged",
        artifact: {
          kind: "code",
          summary: "Onboarding flow rebuilt across web + server.",
          changes: [
            { label: "web/onboarding/Welcome.tsx", meta: "new" },
            { label: "server/onboarding/api.ts", meta: "rewritten" },
            { label: "Removed src/onboarding/Tour.tsx", meta: "deleted" },
          ],
        },
      },
      {
        id: cid("art"),
        title: "Activation metrics",
        artifact: {
          kind: "metrics",
          rows: [
            { label: "Activation rate", value: "62%", trend: "+18 pp WoW" },
            { label: "Time to first action", value: "1m 42s", trend: "-3m" },
            { label: "Tour step adoption", value: "<5%" },
          ],
        },
      },
    ],
    decisions: ["Kill the optional 'tour' — adoption was <5%"],
    updatedAt: "Apr 28",
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
  "OG Guild",
  "Finances",
  "Housing",
  "Hiring",
  "Investor update",
  "Everything",
];

export const SPLIT_TODOS: SplitTodo[] = [
  {
    id: "split-call-michael",
    title: "Call with Michael",
    time: "15:00",
    bucket: "today",
    project: "Hiring",
  },
  {
    id: "split-lunch-investors",
    title: "Lunch with investors",
    time: "12:30",
    bucket: "today",
    project: "Investor update",
  },
  {
    id: "split-print-stickers",
    title: "Print stickers for the conference",
    note: "Pick up at FedEx by 5pm — booth setup is tonight.",
    bucket: "today",
    project: "Hiring",
  },
  {
    id: "split-cover-chart",
    title: "Approve cover chart for April investor update",
    note: "Two options waiting in the active stack.",
    bucket: "today",
    project: "Investor update",
  },
  {
    id: "split-reply-mike",
    title: "Reply to Mike about Thursday dinner",
    bucket: "today",
    project: "OG Guild",
  },
  {
    id: "split-thai-lunch",
    title: "Order Thai for lunch — pad see ew, no tofu",
    note: "Lers Ros if open, otherwise Osha. By 12:30.",
    bucket: "today",
  },
  {
    id: "split-standup-linnea",
    title: "Standup with Linnea",
    time: "09:30",
    bucket: "tomorrow",
    project: "Hiring",
  },
  {
    id: "split-narrative-linnea",
    title: "Send draft narrative to Linnea before Wed call",
    bucket: "tomorrow",
    project: "Hiring",
  },
  {
    id: "split-tsa-precheck",
    title: "Renew TSA PreCheck — flight is Saturday",
    note: "SSN field needs to be done in person.",
    bucket: "tomorrow",
  },
  {
    id: "split-april-rent",
    title: "Pay April rent",
    bucket: "tomorrow",
    project: "Housing",
  },
  {
    id: "split-board-prep",
    title: "Schedule the 3 board prep sessions",
    note: "Each board member, 1:1, before May meeting.",
    bucket: "this-week",
    project: "Investor update",
  },
  {
    id: "split-decide-linnea",
    title: "Decide on Linnea — push for chat or pass",
    bucket: "this-week",
    project: "Hiring",
  },
  {
    id: "split-fde-ashby",
    title: "Post FDE role on Ashby",
    note: "Roughly: ship customer integrations, pair with founders. Bay Area or remote.",
    bucket: "this-week",
    project: "Hiring",
  },
  {
    id: "split-quarterly-taxes",
    title: "Submit quarterly estimated taxes",
    bucket: "this-week",
    project: "Finances",
  },
  {
    id: "split-christine-dinner",
    title: "Book Christine's birthday dinner reservation",
    note: "Party of 8, Friday at 7. Try Nopa first.",
    bucket: "this-week",
    project: "OG Guild",
  },
  {
    id: "split-lease-addendum",
    title: "Sign new lease addendum",
    bucket: "next-week",
    project: "Housing",
  },
  {
    id: "split-investor-update-send",
    title: "Send investor update",
    bucket: "next-week",
    project: "Investor update",
  },
  {
    id: "split-insurance-quotes",
    title: "Review insurance quotes",
    note: "Three brokers, compare deductibles.",
    bucket: "next-week",
    project: "Finances",
  },
  {
    id: "split-source-candidates",
    title: "Source 20 staff eng candidates",
    note: "Bay Area or remote, infra/AI background.",
    bucket: "this-month",
    project: "Hiring",
  },
  {
    id: "split-investor-narrative",
    title: "Finalize April investor update narrative",
    bucket: "this-month",
    project: "Investor update",
  },
  {
    id: "split-hvac",
    title: "Schedule HVAC tune-up",
    bucket: "this-month",
    project: "Housing",
  },
  {
    id: "split-mothers-day",
    title: "Mother's day gift",
    note: "Ship a week before. Likes books, candles, slow craft.",
    bucket: "this-month",
  },
  {
    id: "split-guild-trip",
    title: "Plan summer guild trip",
    note: "Rough dates, see who's in, draft a budget.",
    project: "OG Guild",
  },
  {
    id: "split-student-loans",
    title: "Refinance student loans",
    project: "Finances",
  },
  {
    id: "split-dishwasher-filter",
    title: "Order new dishwasher filter",
    project: "Housing",
  },
  {
    id: "split-linkedin",
    title: "Update LinkedIn profile",
  },
  {
    id: "split-mcp-spec",
    title: "Read MCP spec 0.4 changes",
  },
];
