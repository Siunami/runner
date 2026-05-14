import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface Prototype {
  slug: string;
  name: string;
  description: string;
}

const PROTOTYPES: Prototype[] = [
  {
    slug: "runner-os",
    name: "Runner — Integrations in context",
    description:
      "Mock macOS desktop with movable Notes, Slack, and Chrome windows. The Runner character attaches to the focused window and suggests context-aware todos and workflows.",
  },
  {
    slug: "dashboard-todolist",
    name: "Dashboard + Todolist",
    description:
      "Active Work System. Dashboard surfaces consequence-ranked attention; list shows live work state at a glance; detail turns ambiguity into structured action cards you can accept, redirect, or reject.",
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
