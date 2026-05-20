import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface Prototype {
  slug: string;
  name: string;
  description: string;
}

const PROTOTYPES: Prototype[] = [
  {
    slug: "folders",
    name: "Folders · macOS Finder, lightly enriched",
    description:
      "A simulated macOS desktop hosting a draggable Finder window. The folder itself is regular Finder — sidebar, list view, status bar. The only AI addition is a small Latest card at the top of the file list that summarizes what's happening with the contents. Mock data anchored to Charlie's real prompt traffic.",
  },
  {
    slug: "runner-flow",
    name: "Runner flow · end-to-end demo",
    description:
      "The whole system on one route. Six bullets get triaged into Tasks and Automations, sorted into two sections (strip-minimal chrome on the automations), then click any task card to expand into the live /action-card-detail decision UI for flights, hotel, calendar, and outreach.",
  },
  {
    slug: "scratchpad-to-cards",
    name: "Scratchpad → Cards",
    description:
      "End-to-end morph. Six brain-dump bullets get triaged in place — chips drop, stripes extend through the children — then each item promotes to the right family of card. Titles polish themselves on the way via a per-letter scramble, so a raw phrase like \"Book flights SFO → YYZ, May 18-20\" lands as \"Toronto trip · SFO ↔ YYZ\" by the time it's a card.",
  },
  {
    slug: "automate-silhouettes",
    name: "Automate silhouettes",
    description:
      "Comparison harness for differentiating Automate cards from Task cards by silhouette alone, without leaning on the chip label. Toggle between baseline, schedule rail, ledger row, and header strip — applied to the same small sample of cards.",
  },
  {
    slug: "scratchpad",
    name: "Scratchpad · Outliner",
    description:
      "Capture surface seeded with Charlie's real prompt traffic. One line per item, two-level nesting. Hit Triage and Runner labels each top-level item — Task, Automate, or Todo — staggered like an AI thinking out loud. Children inherit the parent's label color.",
  },
  {
    slug: "triage-flow",
    name: "Triage flow · bullet → card",
    description:
      "A single thought transitions across three stages: raw bullet, triaged bullet (with chip), full task card. The Task chip is the throughline — same identity, two levels of custody. Play, scrub, and step through the morph.",
  },
  {
    slug: "triaged-cards",
    name: "Triaged item cards",
    description:
      "Three card families — Operational, Recurring, Lightweight — showing how Runner communicates the kind of burden it's carrying. Compact + inline-expanded states, built on the new design system.",
  },
  {
    slug: "action-card-detail",
    name: "Action card · next action",
    description:
      "Focused exploration of the UI for taking the next action inside one card. Options are the action targets — click Points or Cash to commit. A chat input at the bottom is the escape hatch: ask for other flights, an earlier outbound, or a different cabin and the new results stream in below the original.",
  },
  {
    slug: "design-system",
    name: "Design system",
    description:
      "Canonical tokens and primitives ported from the core product. Colors, type, radius, shadow, chips, cards, fields — the source of truth for every new prototype. Light/dark toggle.",
  },
  {
    slug: "runner-os",
    name: "Runner — Integrations in context",
    description:
      "Mock macOS desktop with movable Notes, Slack, and Chrome windows. The Runner character attaches to the focused window and suggests context-aware todos and workflows.",
  },
  {
    slug: "sprite-positioning",
    name: "Sprite positioning · placement rules",
    description:
      "Stripped-down demo of the sprite's four placement rules. One window, one sprite, no panel. Drag the window to flip Tier 1 ↔ Tier 2 (top-right outside ↔ top-left outside). Maximize to drop into the bottom-right corner (Tier 3). Double-click the sprite while in a bottom corner to flip to the other corner. Unmaximize and it returns to the outside anchor.",
  },
  {
    slug: "dashboard-todolist",
    name: "Dashboard + Todolist",
    description:
      "Active Work System. Dashboard surfaces consequence-ranked attention; list shows live work state at a glance; detail turns ambiguity into structured action cards you can accept, redirect, or reject.",
  },
  {
    slug: "agent-todolist",
    name: "Agent todolist",
    description:
      "Ported from the Runner home view: every running, pending, blocked, and completed agent session in one partitioned list. State icons, label pills, schedule chips, and hover affordances.",
  },
  {
    slug: "dashboard-subscriptions",
    name: "Dashboard — Subscriptions",
    description:
      "Subscribe to the things top of mind right now. Each subscription rolls up its work as a natural-language status, with consequence-framed callouts for what needs you.",
  },
  {
    slug: "runner-style",
    name: "Runner — Orchestrator look",
    description:
      "Same Dashboard + Todolist prototype re-skinned in the Orchestrator's warm-paper / macOS-window aesthetic. Same dashboard rails, list groups, and action-card detail view — just a different visual language.",
  },
  {
    slug: "action-board",
    name: "Action Board",
    description:
      "Knowledge-work agent board with proposed jobs, an active triage stack, and a done archive. Each active card surfaces a typed artifact — email draft, hotel options, decision, metrics — so review is one glance and one click.",
  },
  {
    slug: "split",
    name: "Split view",
    description:
      "Two-column todo layout. The left column groups by time; the right column groups by project — same items, two ways in.",
  },
  {
    slug: "tab",
    name: "Tab view",
    description:
      "Browser-style tabs for categories. One tab per project, time-sensitive on its own tab, and a new-tab page with a category grid and recently viewed.",
  },
  {
    slug: "action-cards",
    name: "Action cards",
    description:
      "Side-by-side comparison of the original Runner session view and a proposed action-cards rendering. Sidebar lists six prototyped sessions; clicking one loads both views — verbatim transcript on the left, distilled cards on the right.",
  },
];

export default function Home() {
  return (
    <div className="home">
      <header className="home-header">
        <h1>Prototypes</h1>
        <p>Quick previews of what we're exploring.</p>
      </header>
      <div className="prototype-grid">
        {PROTOTYPES.map((prototype) => (
          <PrototypeCard key={prototype.slug} prototype={prototype} />
        ))}
      </div>
    </div>
  );
}

function PrototypeCard({ prototype }: { prototype: Prototype }) {
  return (
    <Link to={`/${prototype.slug}`} className="prototype-card">
      <PrototypePreview slug={prototype.slug} title={prototype.name} />
      <div className="prototype-meta">
        <h3>{prototype.name}</h3>
        <p>{prototype.description}</p>
      </div>
    </Link>
  );
}

function PrototypePreview({ slug, title }: { slug: string; title: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    if (!wrapRef.current) return;
    const node = wrapRef.current;
    const update = () => {
      const w = node.clientWidth;
      if (w > 0) setScale(w / 1280);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="prototype-preview" aria-hidden="true">
      <iframe
        title={`${title} preview`}
        src={`${import.meta.env.BASE_URL}#/${slug}`}
        loading="lazy"
        tabIndex={-1}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: "1280px",
          height: "800px",
        }}
      />
    </div>
  );
}
