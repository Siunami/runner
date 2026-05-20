/*
 * Folders — Runner as a folder system, framed inside a regular macOS Finder
 * window. The only AI surface is one small "Latest" card at the top of the
 * file list, summarizing what's happening with the folder's contents.
 *
 * Everything else looks and behaves like ordinary Finder: sidebar of folders,
 * toolbar with back/forward + search, path bar, list of items, status bar.
 *
 * Mock data is anchored to Charlie's real prompt traffic.
 */

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Battery,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Coffee,
  Eye,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  Image as ImageIcon,
  Inbox,
  Link as LinkIcon,
  Linkedin,
  ListChecks,
  Mail,
  Mic,
  Notebook,
  Pencil,
  PlaneTakeoff,
  Presentation,
  Repeat,
  Search,
  Sheet,
  Slack,
  Sparkles,
  Wallet,
  Wifi,
} from "lucide-react";
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LiveDuration } from "./design-system/primitives";
import "./Folders.css";

/* ────────────────────────── Types ────────────────────────── */

type FolderStatus = "needs-you" | "active" | "watching" | "idle" | "done";
type FolderSource = "manual" | "auto";

type MaterialKind =
  | "doc"
  | "sheet"
  | "slides"
  | "email"
  | "image"
  | "link"
  | "note"
  | "pdf"
  | "csv"
  | "audio"
  | "chat"
  | "person";

type OperationKind = "task" | "monitor" | "routine" | "decision" | "review";

type OperationState =
  | "in-progress"
  | "pending-you"
  | "watching"
  | "done"
  | "blocked";

interface Material {
  id: string;
  name: string;
  kind: MaterialKind;
  meta: string;
  modified: string;
  size?: string;
  highlight?: boolean;
}

interface Operation {
  id: string;
  name: string;
  kind: OperationKind;
  state: OperationState;
  meta: string;
  modified: string;
  schedule?: string;
  needsYou?: boolean;
  consequence?: string;
}

interface Folder {
  id: string;
  name: string;
  icon: ReactNode;
  status: FolderStatus;
  source: FolderSource;
  activitySeed: number;
  /** One-sentence summary of what's happening with the contents right now. */
  latest: string;
  needsCount: number;
  materials: Material[];
  operations: Operation[];
}

/* ────────────────────────── Mock data ────────────────────────── */

const FOLDERS: Folder[] = [
  {
    id: "og-summit",
    name: "OG Summit · Chicago 2026",
    icon: <Presentation size={14} strokeWidth={1.75} />,
    status: "needs-you",
    source: "manual",
    activitySeed: 14 * 60,
    latest:
      "Slide 24 in revision · concierge bot enriched with 13 attendee bios · LondonHouse Chicago hotel held",
    needsCount: 3,
    materials: [
      {
        id: "m1",
        name: "Buy, Build, Borrow — keynote",
        kind: "slides",
        meta: "Google Slides · rev 4 · 28 of 30 slides",
        modified: "17 min ago",
        size: "12.4 MB",
        highlight: true,
      },
      {
        id: "m2",
        name: "og-summit-concierge.md",
        kind: "doc",
        meta: "Obsidian · 13 LinkedIn bios enriched",
        modified: "Today, 03:48",
        size: "184 KB",
      },
      {
        id: "m3",
        name: "Attendee contacts",
        kind: "csv",
        meta: "184 rows · phone + email + LinkedIn",
        modified: "May 8",
        size: "92 KB",
      },
      {
        id: "m4",
        name: "Hotel options — Molly",
        kind: "email",
        meta: "LondonHouse, Trump, Pendry shortlist",
        modified: "May 7",
      },
      {
        id: "m5",
        name: "Casey + Molly · talk track planning",
        kind: "audio",
        meta: "Granola · 38 min",
        modified: "May 6",
        size: "44 MB",
      },
      {
        id: "m6",
        name: "design-system reference",
        kind: "link",
        meta: "Cambridge repo",
        modified: "May 6",
      },
      {
        id: "m7",
        name: "Charlie headshot",
        kind: "image",
        meta: "for 'My journey' slide",
        modified: "May 5",
        size: "1.2 MB",
      },
    ],
    operations: [
      {
        id: "o1",
        name: "Concierge SMS bot",
        kind: "monitor",
        state: "watching",
        meta: "Live · launches Sun 7pm",
        modified: "Just now",
        schedule: "Always-on",
      },
      {
        id: "o2",
        name: "Slide revision pass",
        kind: "task",
        state: "in-progress",
        meta: "Slide 24 of 30",
        modified: "17 min ago",
      },
      {
        id: "o3",
        name: "Casey Woo bio in prompt",
        kind: "decision",
        state: "pending-you",
        meta: "Drafted — needs approve / revise",
        modified: "Last night",
        needsYou: true,
      },
      {
        id: "o4",
        name: "QR-code stock pick",
        kind: "decision",
        state: "pending-you",
        meta: "Bitly $20/mo vs Sticker Mule",
        modified: "Yesterday",
        needsYou: true,
      },
      {
        id: "o5",
        name: "Hotel check-in confirm",
        kind: "task",
        state: "pending-you",
        meta: "iMessage to Mark drafted",
        modified: "Yesterday",
        needsYou: true,
      },
      {
        id: "o6",
        name: "Talk track rehearsal",
        kind: "review",
        state: "in-progress",
        meta: "Tomorrow 2pm · Casey + Molly",
        modified: "Yesterday",
      },
    ],
  },
  {
    id: "toronto-trip",
    name: "Toronto trip · May 18–20",
    icon: <PlaneTakeoff size={14} strokeWidth={1.75} />,
    status: "needs-you",
    source: "manual",
    activitySeed: 2 * 60 + 31,
    latest:
      "Outbound shortlist locked: 7 am, 9:30 am, 11 am. United · 40k pts or $1,200 cash. Booking window closes 9pm PT.",
    needsCount: 2,
    materials: [
      {
        id: "m1",
        name: "SFO → YYZ search · May 18 outbound",
        kind: "link",
        meta: "Google Flights · refreshed 3 min ago",
        modified: "3 min ago",
        highlight: true,
      },
      {
        id: "m2",
        name: "Paolo wedding invite thread",
        kind: "email",
        meta: "cfeng.charlie@gmail.com",
        modified: "May 4",
      },
      {
        id: "m3",
        name: "WhatsApp · Paolo",
        kind: "chat",
        meta: "Landing-by-4pm request",
        modified: "May 6",
      },
      {
        id: "m4",
        name: "travel-points.md",
        kind: "doc",
        meta: "Obsidian · life-admin/",
        modified: "May 14",
        size: "8 KB",
      },
    ],
    operations: [
      {
        id: "o1",
        name: "Outbound flight choice",
        kind: "decision",
        state: "pending-you",
        meta: "40k pts vs $1,200 · break-even $1,200",
        modified: "3 min ago",
        needsYou: true,
      },
      {
        id: "o2",
        name: "Return flight pick",
        kind: "decision",
        state: "pending-you",
        meta: "May 20 evening · 4 → 1 seats by morning",
        modified: "3 min ago",
        needsYou: true,
      },
      {
        id: "o3",
        name: "SFO ↔ YYZ price watch",
        kind: "monitor",
        state: "watching",
        meta: "Hourly · alert on drops > 15%",
        modified: "3 min ago",
        schedule: "Every hour",
      },
      {
        id: "o4",
        name: "Block May 18–20 on calendar",
        kind: "task",
        state: "in-progress",
        meta: "Pending after booking",
        modified: "Yesterday",
      },
    ],
  },
  {
    id: "strategic-round",
    name: "Strategic round",
    icon: <Wallet size={14} strokeWidth={1.75} />,
    status: "active",
    source: "manual",
    activitySeed: 47 * 60,
    latest:
      "12 of 14 strategic investors contacted · Jai added last night · Sean's intro due-diligence half done",
    needsCount: 2,
    materials: [
      {
        id: "m1",
        name: "Strategic round investor sheet",
        kind: "sheet",
        meta: "Google Sheet · 14 rows · Jai added",
        modified: "Last night",
        size: "44 KB",
        highlight: true,
      },
      {
        id: "m2",
        name: "Sean → due-diligence intro",
        kind: "email",
        meta: "Presido follow-up",
        modified: "Yesterday",
      },
      {
        id: "m3",
        name: "Becca · investor cal request",
        kind: "email",
        meta: "Calendly link inside",
        modified: "May 12",
      },
      {
        id: "m4",
        name: "Jai · LinkedIn",
        kind: "person",
        meta: "Strategic round · added May 12",
        modified: "May 12",
      },
    ],
    operations: [
      {
        id: "o1",
        name: "Outreach batch · 14 investors",
        kind: "task",
        state: "in-progress",
        meta: "12 of 14 contacted · 2 drafted",
        modified: "47 min ago",
      },
      {
        id: "o2",
        name: "Becca cal slot · book via her calendly",
        kind: "task",
        state: "pending-you",
        meta: "Stance: use her calendly first",
        modified: "Yesterday",
        needsYou: true,
      },
      {
        id: "o3",
        name: "Sean's intro · due-diligence",
        kind: "review",
        state: "in-progress",
        meta: "Half-done · 3 references pending",
        modified: "Yesterday",
      },
      {
        id: "o4",
        name: "Confirm Molly advisory + invest ask",
        kind: "decision",
        state: "pending-you",
        meta: "Raised at OG Summit prep · no follow-up yet",
        modified: "May 12",
        needsYou: true,
      },
    ],
  },
  {
    id: "linear-engineering",
    name: "Engineering · Linear",
    icon: <ListChecks size={14} strokeWidth={1.75} />,
    status: "active",
    source: "manual",
    activitySeed: 6 * 60,
    latest:
      "5 bugs done in 24h · 12 outstanding across eng team · Composio enterprise call tomorrow 9 am",
    needsCount: 2,
    materials: [
      {
        id: "m1",
        name: "Bugs board",
        kind: "link",
        meta: "linear.app/argonavislabs · 12 outstanding",
        modified: "6 min ago",
        highlight: true,
      },
      {
        id: "m2",
        name: "RUN-2027 · Composio tool-call log opt-out",
        kind: "doc",
        meta: "Linear ticket · key for enterprise",
        modified: "Today",
      },
      {
        id: "m3",
        name: "Bug aging report · 3 over 2 weeks",
        kind: "doc",
        meta: "Auto-generated · daily refresh",
        modified: "Today, 09:00",
      },
    ],
    operations: [
      {
        id: "o1",
        name: "Daily Linear triage",
        kind: "routine",
        state: "watching",
        meta: "Last ran today 14:00 · 5 bugs auto-classified",
        modified: "Today, 14:00",
        schedule: "Daily · 9 am PT · autonomous",
      },
      {
        id: "o2",
        name: "Composio enterprise deal",
        kind: "task",
        state: "in-progress",
        meta: "RUN-2027 · awaiting SLA terms",
        modified: "Today",
      },
      {
        id: "o3",
        name: "Assign owner on Composio deal",
        kind: "decision",
        state: "pending-you",
        meta: "Charlie or Art · both viable",
        modified: "Today",
        needsYou: true,
      },
      {
        id: "o4",
        name: "Aged-bug triage (3 over 2 weeks)",
        kind: "task",
        state: "pending-you",
        meta: "Need owner per ticket",
        modified: "Today",
        needsYou: true,
      },
    ],
  },
  {
    id: "inbox-zero",
    name: "Inbox zero · daily",
    icon: <Inbox size={14} strokeWidth={1.75} />,
    status: "needs-you",
    source: "auto",
    activitySeed: 28 * 60,
    latest:
      "Morning batch ran 09:00 EST · 14 archived · 3 drafts awaiting review · 1 stuck on Composio response",
    needsCount: 3,
    materials: [
      {
        id: "m1",
        name: "Becca · investor cal — reply draft",
        kind: "email",
        meta: "Drafted from her calendly window",
        modified: "Today, 09:11",
        highlight: true,
      },
      {
        id: "m2",
        name: "Adam/Gorgias · cal move to 10:30 am ET",
        kind: "email",
        meta: "Drafted · invite already adjusted",
        modified: "Today, 09:12",
        highlight: true,
      },
      {
        id: "m3",
        name: "Manu · reply",
        kind: "email",
        meta: "Drafted · 1 paragraph",
        modified: "Today, 09:12",
        highlight: true,
      },
      {
        id: "m4",
        name: "14 archived this morning",
        kind: "doc",
        meta: "Auto-archived per stance",
        modified: "Today, 09:00",
      },
    ],
    operations: [
      {
        id: "o1",
        name: "/email-triage-inbox-zero",
        kind: "routine",
        state: "watching",
        meta: "18 in · 14 archived · 3 drafted",
        modified: "Today, 09:00",
        schedule: "Daily · 9 am EST",
      },
      {
        id: "o2",
        name: "Review 3 drafts",
        kind: "decision",
        state: "pending-you",
        meta: "Send / revise / hold per draft",
        modified: "Today, 09:12",
        needsYou: true,
      },
      {
        id: "o3",
        name: "Adam/Gorgias cal at 10:30 am ET",
        kind: "task",
        state: "pending-you",
        meta: "Invite adjusted · draft ready",
        modified: "Today, 09:12",
        needsYou: true,
      },
      {
        id: "o4",
        name: "Jai cal slot · approve",
        kind: "decision",
        state: "pending-you",
        meta: "Holding before send",
        modified: "Today, 09:12",
        needsYou: true,
      },
    ],
  },
  {
    id: "memos-writing",
    name: "Memos · weekly writing review",
    icon: <Notebook size={14} strokeWidth={1.75} />,
    status: "watching",
    source: "auto",
    activitySeed: 4 * 3600 + 12 * 60,
    latest:
      "6 seed pieces mined from last 7d of journal · 2 candidates ready for evergreen promotion",
    needsCount: 2,
    materials: [
      {
        id: "m1",
        name: "memos/reviews/2026-05-19.md",
        kind: "doc",
        meta: "Today's brief · top recommendation pending",
        modified: "Today, 10:00",
        size: "16 KB",
        highlight: true,
      },
      {
        id: "m2",
        name: "Death of SaaS — seed",
        kind: "doc",
        meta: "Drafted May 14",
        modified: "May 14",
        size: "32 KB",
      },
      {
        id: "m3",
        name: "Capabilities overhang — seed",
        kind: "doc",
        meta: "3 fragments merged",
        modified: "May 12",
        size: "24 KB",
      },
      {
        id: "m4",
        name: "../journal/ (last 7d)",
        kind: "doc",
        meta: "12 entries · mined for seed material",
        modified: "Today",
      },
    ],
    operations: [
      {
        id: "o1",
        name: "/writing-review weekly",
        kind: "routine",
        state: "watching",
        meta: "Last ran Sat May 17",
        modified: "May 17",
        schedule: "Saturday · 10 am PT",
      },
      {
        id: "o2",
        name: "Promote 'Death of SaaS' to evergreen",
        kind: "decision",
        state: "pending-you",
        meta: "Sacred-rule stage gate — needs explicit yes",
        modified: "Today",
        needsYou: true,
      },
      {
        id: "o3",
        name: "Promote 'Capabilities overhang' to evergreen",
        kind: "decision",
        state: "pending-you",
        meta: "Sacred-rule stage gate — needs explicit yes",
        modified: "Today",
        needsYou: true,
      },
      {
        id: "o4",
        name: "Mine journal last 7d",
        kind: "task",
        state: "done",
        meta: "6 seed pieces extracted",
        modified: "Today, 10:00",
      },
    ],
  },
  {
    id: "life-admin",
    name: "Life admin",
    icon: <Coffee size={14} strokeWidth={1.75} />,
    status: "needs-you",
    source: "auto",
    activitySeed: 5 * 3600 + 41 * 60,
    latest:
      "3 active todos · 2 done this week · gardener no-show on Tuesday, follow-up drafted",
    needsCount: 2,
    materials: [
      {
        id: "m1",
        name: "Gardener · iMessage group (Kartik + Bask)",
        kind: "chat",
        meta: "Draft pending · 'nobody came Tues, reschedule?'",
        modified: "Yesterday",
        highlight: true,
      },
      {
        id: "m2",
        name: "Oura sizing kit · email + tracking",
        kind: "email",
        meta: "Arrived May 11 · 7 + 8 included",
        modified: "May 11",
      },
      {
        id: "m3",
        name: "wedding-events.md",
        kind: "doc",
        meta: "Paolo (declined), Kevin & Grace (registry done)",
        modified: "May 8",
        size: "5 KB",
      },
      {
        id: "m4",
        name: "Aeron chair size B · receipt",
        kind: "pdf",
        meta: "Delivered Apr 30",
        modified: "Apr 30",
        size: "212 KB",
      },
    ],
    operations: [
      {
        id: "o1",
        name: "Gardener follow-up",
        kind: "task",
        state: "pending-you",
        meta: "Draft ready · awaiting send to group chat",
        modified: "Yesterday",
        needsYou: true,
      },
      {
        id: "o2",
        name: "Oura sizing for Laura",
        kind: "decision",
        state: "pending-you",
        meta: "Pick 7 or 8 · gift deadline 10 days",
        modified: "May 11",
        needsYou: true,
      },
      {
        id: "o3",
        name: "Aeron chair size B",
        kind: "task",
        state: "done",
        meta: "Delivered Apr 30",
        modified: "Apr 30",
      },
      {
        id: "o4",
        name: "India shipment received",
        kind: "task",
        state: "done",
        meta: "Confirmed May 8",
        modified: "May 8",
      },
    ],
  },
  {
    id: "travel-cards",
    name: "Travel points & cards",
    icon: <Wallet size={14} strokeWidth={1.75} />,
    status: "idle",
    source: "manual",
    activitySeed: 3 * 24 * 3600,
    latest:
      "Plan locked May 14 · cancel AMEX Business Plat, apply United Club, keep personal AMEX Plat",
    needsCount: 3,
    materials: [
      {
        id: "m1",
        name: "travel-points.md",
        kind: "doc",
        meta: "Obsidian · life-admin/ · 5 questions answered",
        modified: "May 14",
        size: "12 KB",
        highlight: true,
      },
      {
        id: "m2",
        name: "prince-of-travel guide notes",
        kind: "doc",
        meta: "Compiled from May 14 research",
        modified: "May 14",
      },
      {
        id: "m3",
        name: "United MileagePlus Club page",
        kind: "link",
        meta: "Application URL ready",
        modified: "May 14",
      },
    ],
    operations: [
      {
        id: "o1",
        name: "Cancel AMEX Business Plat",
        kind: "task",
        state: "pending-you",
        meta: "5 min on phone · $695 fee imminent",
        modified: "May 14",
        needsYou: true,
      },
      {
        id: "o2",
        name: "Apply for United Club",
        kind: "task",
        state: "pending-you",
        meta: "30 min online",
        modified: "May 14",
        needsYou: true,
      },
      {
        id: "o3",
        name: "Cancel AMEX Gold (haven't used)",
        kind: "decision",
        state: "pending-you",
        meta: "Awaiting your call",
        modified: "May 14",
        needsYou: true,
      },
    ],
  },
  {
    id: "power-user-research",
    name: "Power-user research",
    icon: <BarChart3 size={14} strokeWidth={1.75} />,
    status: "watching",
    source: "auto",
    activitySeed: 2 * 3600 + 18 * 60,
    latest:
      "9 power users analyzed in last 5d · 4 over 100B tokens / 30d · usage clusters identified",
    needsCount: 1,
    materials: [
      {
        id: "m1",
        name: "Logfire usage dump · 9 users",
        kind: "doc",
        meta: "May 15 · token counts + tool calls",
        modified: "May 15",
        size: "1.4 MB",
        highlight: true,
      },
      {
        id: "m2",
        name: "User shortlist + bios",
        kind: "doc",
        meta: "9 users · ranked by spend × diversity",
        modified: "May 15",
      },
      {
        id: "m3",
        name: "Outreach email template",
        kind: "doc",
        meta: "15-min coffee chat ask",
        modified: "May 15",
      },
    ],
    operations: [
      {
        id: "o1",
        name: "Logfire watch · 9 users",
        kind: "monitor",
        state: "watching",
        meta: "Alerts on session > 1M tokens",
        modified: "Today, 08:00",
        schedule: "Daily · 8 am PT",
      },
      {
        id: "o2",
        name: "Categorize usage by token bucket",
        kind: "task",
        state: "done",
        meta: "Done May 15",
        modified: "May 15",
      },
      {
        id: "o3",
        name: "Pick 3 to interview",
        kind: "decision",
        state: "pending-you",
        meta: "Shortlist ranked",
        modified: "May 15",
        needsYou: true,
      },
    ],
  },
];

/* ────────────────────────── Icon maps ────────────────────────── */

const MATERIAL_ICON: Record<MaterialKind, ReactNode> = {
  doc: <FileText size={14} strokeWidth={1.75} />,
  sheet: <Sheet size={14} strokeWidth={1.75} />,
  slides: <Presentation size={14} strokeWidth={1.75} />,
  email: <Mail size={14} strokeWidth={1.75} />,
  image: <ImageIcon size={14} strokeWidth={1.75} />,
  link: <LinkIcon size={14} strokeWidth={1.75} />,
  note: <Pencil size={14} strokeWidth={1.75} />,
  pdf: <FileText size={14} strokeWidth={1.75} />,
  csv: <Sheet size={14} strokeWidth={1.75} />,
  audio: <Mic size={14} strokeWidth={1.75} />,
  chat: <Slack size={14} strokeWidth={1.75} />,
  person: <Linkedin size={14} strokeWidth={1.75} />,
};

const MATERIAL_KIND_LABEL: Record<MaterialKind, string> = {
  doc: "Document",
  sheet: "Spreadsheet",
  slides: "Presentation",
  email: "Email",
  image: "Image",
  link: "Link",
  note: "Note",
  pdf: "PDF",
  csv: "CSV",
  audio: "Audio",
  chat: "Chat",
  person: "Contact",
};

const OPERATION_ICON: Record<OperationKind, ReactNode> = {
  task: <CheckCircle2 size={14} strokeWidth={1.75} />,
  monitor: <Eye size={14} strokeWidth={1.75} />,
  routine: <Repeat size={14} strokeWidth={1.75} />,
  decision: <CircleDot size={14} strokeWidth={1.75} />,
  review: <Search size={14} strokeWidth={1.75} />,
};

const OPERATION_KIND_LABEL: Record<OperationKind, string> = {
  task: "Task",
  monitor: "Monitor",
  routine: "Routine",
  decision: "Decision",
  review: "Review",
};

/* ────────────────────────── Window geometry ────────────────────────── */

const MENU_BAR_H = 28;

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isFullScreen: boolean;
  prevRect: { x: number; y: number; width: number; height: number } | null;
}

function defaultWindow(viewport: { w: number; h: number }): WindowState {
  const width = Math.min(1080, viewport.w - 60);
  const height = Math.min(700, viewport.h - 60);
  return {
    x: Math.max(24, (viewport.w - width) / 2),
    y: Math.max(MENU_BAR_H + 16, (viewport.h - height) / 2),
    width,
    height,
    isFullScreen: false,
    prevRect: null,
  };
}

function useViewport() {
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1280,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  }));
  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return viewport;
}

function formatClock(date: Date): string {
  const hour = ((date.getHours() + 11) % 12) + 1;
  const min = date.getMinutes().toString().padStart(2, "0");
  const ampm = date.getHours() >= 12 ? "PM" : "AM";
  return `${hour}:${min} ${ampm}`;
}

function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

/* ────────────────────────── Main component ────────────────────────── */

export default function Folders() {
  const viewport = useViewport();
  const [selectedId, setSelectedId] = useState<string>(FOLDERS[0].id);
  const [win, setWin] = useState<WindowState>(() => defaultWindow(viewport));
  const [winInit, setWinInit] = useState(false);

  useEffect(() => {
    if (winInit) return;
    setWin(defaultWindow(viewport));
    setWinInit(true);
  }, [viewport, winInit]);

  const folder = useMemo(
    () => FOLDERS.find((f) => f.id === selectedId) ?? FOLDERS[0],
    [selectedId],
  );

  const totalItems = folder.materials.length + folder.operations.length;

  /* drag */
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const onTitleBarDown = useCallback(
    (event: React.PointerEvent) => {
      if (win.isFullScreen) return;
      dragRef.current = {
        offsetX: event.clientX - win.x,
        offsetY: event.clientY - win.y,
      };
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    },
    [win.isFullScreen, win.x, win.y],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setWin((current) => {
        if (current.isFullScreen) return current;
        const nextX = Math.min(
          Math.max(event.clientX - d.offsetX, -current.width + 120),
          viewport.w - 120,
        );
        const nextY = Math.min(
          Math.max(event.clientY - d.offsetY, MENU_BAR_H + 4),
          viewport.h - 60,
        );
        return { ...current, x: nextX, y: nextY };
      });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [viewport.w, viewport.h]);

  const toggleFullScreen = useCallback(() => {
    setWin((current) => {
      if (current.isFullScreen && current.prevRect) {
        return {
          ...current,
          isFullScreen: false,
          x: current.prevRect.x,
          y: current.prevRect.y,
          width: current.prevRect.width,
          height: current.prevRect.height,
          prevRect: null,
        };
      }
      return {
        ...current,
        isFullScreen: true,
        prevRect: {
          x: current.x,
          y: current.y,
          width: current.width,
          height: current.height,
        },
      };
    });
  }, []);

  const winStyle: CSSProperties = win.isFullScreen
    ? {
        transform: `translate(0px, ${MENU_BAR_H}px)`,
        width: viewport.w,
        height: viewport.h - MENU_BAR_H,
      }
    : {
        transform: `translate(${win.x}px, ${win.y}px)`,
        width: win.width,
        height: win.height,
      };

  return (
    <div className="folders-os">
      <MenuBar />

      <div
        className={`folders-os-window${win.isFullScreen ? " is-fullscreen" : ""}`}
        style={winStyle}
      >
        <TitleBar
          title={`${folder.name} — Finder`}
          onTitleBarDown={onTitleBarDown}
          onGreenClick={toggleFullScreen}
          isFullScreen={win.isFullScreen}
        />

        <FinderToolbar folderName={folder.name} />

        <PathBar folder={folder} />

        <div className="folders-finder-body">
          <FolderSidebar
            folders={FOLDERS}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <main className="folders-main">
            <LatestCard folder={folder} />
            <FileList folder={folder} />
          </main>
        </div>

        <StatusBar
          totalItems={totalItems}
          needsCount={folder.needsCount}
          activitySeed={folder.activitySeed}
        />
      </div>
    </div>
  );
}

/* ────────────────────────── Menu bar ────────────────────────── */

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="folders-os-menubar">
      <div className="folders-os-menubar-left">
        <span className="folders-os-menubar-apple" aria-hidden="true" />
        <span className="folders-os-menubar-app">Finder</span>
        <span className="folders-os-menubar-item">File</span>
        <span className="folders-os-menubar-item">Edit</span>
        <span className="folders-os-menubar-item">View</span>
        <span className="folders-os-menubar-item">Go</span>
        <span className="folders-os-menubar-item">Window</span>
        <span className="folders-os-menubar-item">Help</span>
      </div>
      <div className="folders-os-menubar-right">
        <Battery size={13} strokeWidth={1.75} />
        <Wifi size={13} strokeWidth={1.75} />
        <span className="folders-os-menubar-time">
          {formatWeekday(now)} {formatClock(now)}
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────── Title bar with traffic lights ────────────────────────── */

function TitleBar({
  title,
  onTitleBarDown,
  onGreenClick,
  isFullScreen,
}: {
  title: string;
  onTitleBarDown: (e: React.PointerEvent) => void;
  onGreenClick: () => void;
  isFullScreen: boolean;
}) {
  return (
    <div className="folders-os-titlebar" onPointerDown={onTitleBarDown}>
      <div className="folders-os-traffic">
        <button
          type="button"
          className="folders-os-light red"
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Close"
        />
        <button
          type="button"
          className="folders-os-light yellow"
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Minimize"
        />
        <button
          type="button"
          className="folders-os-light green"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onGreenClick();
          }}
          aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
        />
      </div>
      <div className="folders-os-title">{title}</div>
    </div>
  );
}

/* ────────────────────────── Finder toolbar ────────────────────────── */

function FinderToolbar({ folderName }: { folderName: string }) {
  return (
    <div className="folders-toolbar">
      <div className="folders-toolbar-nav">
        <button
          type="button"
          className="folders-toolbar-arrow"
          disabled
          aria-label="Back"
        >
          <ArrowLeft size={13} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="folders-toolbar-arrow"
          disabled
          aria-label="Forward"
        >
          <ArrowRight size={13} strokeWidth={1.75} />
        </button>
      </div>

      <div className="folders-toolbar-spacer" />

      <label className="folders-toolbar-search">
        <Search size={12} strokeWidth={1.75} />
        <input
          type="text"
          placeholder={`Search ${folderName.split("·")[0].trim()}`}
          aria-label="Search"
        />
      </label>
    </div>
  );
}

/* ────────────────────────── Path bar ────────────────────────── */

function PathBar({ folder }: { folder: Folder }) {
  return (
    <div className="folders-pathbar">
      <span className="folders-pathbar-crumb">
        <FolderIcon size={12} strokeWidth={1.75} />
        Runner
      </span>
      <ChevronRight
        size={11}
        strokeWidth={1.75}
        className="folders-pathbar-sep"
      />
      <span className="folders-pathbar-crumb">
        <FolderIcon size={12} strokeWidth={1.75} />
        Folders
      </span>
      <ChevronRight
        size={11}
        strokeWidth={1.75}
        className="folders-pathbar-sep"
      />
      <span className="folders-pathbar-crumb folders-pathbar-crumb--current">
        <FolderOpen size={12} strokeWidth={1.75} />
        {folder.name}
      </span>
    </div>
  );
}

/* ────────────────────────── Sidebar ────────────────────────── */

function FolderSidebar({
  folders,
  selectedId,
  onSelect,
}: {
  folders: Folder[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const manual = folders.filter((f) => f.source === "manual");
  const auto = folders.filter((f) => f.source === "auto");
  return (
    <aside className="folders-sidebar" aria-label="Folder sidebar">
      <SidebarSection
        label="Yours"
        folders={manual}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <SidebarSection
        label="Auto-created"
        folders={auto}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </aside>
  );
}

function SidebarSection({
  label,
  folders,
  selectedId,
  onSelect,
}: {
  label: string;
  folders: Folder[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="folders-sidebar-section">
      <p className="folders-sidebar-section-label">{label}</p>
      <ul className="folders-sidebar-list">
        {folders.map((f) => {
          const selected = f.id === selectedId;
          return (
            <li key={f.id}>
              <button
                type="button"
                className={`folders-sidebar-row${selected ? " is-selected" : ""}`}
                onClick={() => onSelect(f.id)}
              >
                <span className="folders-sidebar-row-icon" aria-hidden="true">
                  {f.icon}
                </span>
                <span className="folders-sidebar-row-text">{f.name}</span>
                {f.needsCount > 0 && (
                  <span
                    className="folders-sidebar-row-badge"
                    aria-label={`${f.needsCount} need you`}
                  >
                    {f.needsCount}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ────────────────────────── Latest card (the only AI surface) ────────────────────────── */

function LatestCard({ folder }: { folder: Folder }) {
  return (
    <div className="folders-latest" role="note" aria-label="Latest from Runner">
      <span className="folders-latest-glyph" aria-hidden="true">
        <Sparkles size={13} strokeWidth={1.75} />
      </span>
      <div className="folders-latest-text">
        <p className="folders-latest-line">{folder.latest}</p>
      </div>
      <div className="folders-latest-meta">
        {folder.needsCount > 0 && (
          <span className="folders-latest-needs">
            {folder.needsCount} need you
          </span>
        )}
        <span className="folders-latest-sep" aria-hidden="true">
          ·
        </span>
        <span className="folders-latest-time">
          <LiveDuration seedSeconds={folder.activitySeed} /> ago
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────── File list ────────────────────────── */

function FileList({ folder }: { folder: Folder }) {
  const [open, setOpen] = useState({ materials: true, operations: true });
  const toggle = (k: keyof typeof open) =>
    setOpen((s) => ({ ...s, [k]: !s[k] }));

  return (
    <section className="folders-list" aria-label="Folder contents">
      <div className="folders-list-head" role="row">
        <span className="folders-list-col col-name">Name</span>
        <span className="folders-list-col col-kind">Kind</span>
        <span className="folders-list-col col-mod">Date Modified</span>
        <span className="folders-list-col col-size">Size</span>
      </div>

      <ListGroup
        title="Materials"
        count={folder.materials.length}
        open={open.materials}
        onToggle={() => toggle("materials")}
      >
        {folder.materials.map((m) => (
          <ListRowMaterial key={m.id} m={m} />
        ))}
      </ListGroup>

      <ListGroup
        title="Operations"
        count={folder.operations.length}
        open={open.operations}
        onToggle={() => toggle("operations")}
      >
        {folder.operations.map((op) => (
          <ListRowOperation key={op.id} op={op} />
        ))}
      </ListGroup>
    </section>
  );
}

function ListGroup({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        className="folders-list-group-head"
        onClick={onToggle}
        aria-expanded={open}
      >
        <ChevronDown
          size={11}
          strokeWidth={2}
          className={`folders-section-chev${open ? "" : " is-collapsed"}`}
        />
        <span>{title}</span>
        <span className="folders-list-group-count">{count}</span>
      </button>
      {open && children}
    </>
  );
}

function ListRowMaterial({ m }: { m: Material }) {
  return (
    <div
      className={`folders-list-row${m.highlight ? " is-highlighted" : ""}`}
      role="row"
    >
      <span className="folders-list-col col-name">
        <span className="folders-list-name-tag" aria-hidden="true" />
        <span className="folders-list-name-icon" aria-hidden="true">
          {MATERIAL_ICON[m.kind]}
        </span>
        <span className="folders-list-name-text">{m.name}</span>
      </span>
      <span className="folders-list-col col-kind">
        {MATERIAL_KIND_LABEL[m.kind]}
      </span>
      <span className="folders-list-col col-mod">{m.modified}</span>
      <span className="folders-list-col col-size">{m.size ?? "—"}</span>
    </div>
  );
}

function ListRowOperation({ op }: { op: Operation }) {
  return (
    <div
      className={`folders-list-row folders-list-row--op folders-list-row--${op.state}${
        op.needsYou ? " is-needs-you" : ""
      }`}
      role="row"
    >
      <span className="folders-list-col col-name">
        <span
          className="folders-list-name-tag"
          aria-hidden="true"
          title={op.needsYou ? "Needs you" : undefined}
        />
        <span className="folders-list-name-icon" aria-hidden="true">
          {OPERATION_ICON[op.kind]}
        </span>
        <span className="folders-list-name-text">{op.name}</span>
        <span className="folders-list-name-meta">{op.meta}</span>
      </span>
      <span className="folders-list-col col-kind">
        {OPERATION_KIND_LABEL[op.kind]}
      </span>
      <span className="folders-list-col col-mod">{op.modified}</span>
      <span className="folders-list-col col-size">{op.schedule ?? "—"}</span>
    </div>
  );
}

/* ────────────────────────── Status bar ────────────────────────── */

function StatusBar({
  totalItems,
  needsCount,
  activitySeed,
}: {
  totalItems: number;
  needsCount: number;
  activitySeed: number;
}) {
  return (
    <div className="folders-statusbar">
      <span>{totalItems} items</span>
      {needsCount > 0 && (
        <>
          <span className="folders-statusbar-sep">·</span>
          <span className="folders-statusbar-needs">
            {needsCount} need you
          </span>
        </>
      )}
      <span className="folders-statusbar-sep">·</span>
      <span>
        Last change <LiveDuration seedSeconds={activitySeed} /> ago
      </span>
    </div>
  );
}
