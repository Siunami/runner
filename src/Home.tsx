import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface Prototype {
  slug: string;
  name: string;
  description: string;
}

const PROTOTYPES: Prototype[] = [
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
        src={`/${slug}`}
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
