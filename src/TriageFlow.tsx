import { useEffect, useRef, useState } from "react";
import { Activity, AlertCircle, Pause, Play, RotateCcw } from "lucide-react";
import {
  Button,
  Chip,
  DSRoot,
  Eyebrow,
  Heading,
  Meta,
  Row,
  SourceCluster,
  Stack,
  Text,
} from "./design-system/primitives";
import "./design-system/primitives.css";
import "./TriageFlow.css";

type Stage = 0 | 1 | 2;
type Theme = "light" | "dark";

const STAGE_LABEL: Record<Stage, string> = {
  0: "Bullet",
  1: "Triaged",
  2: "Card",
};

const STAGE_NARRATION: Record<Stage, { eyebrow: string; body: string }> = {
  0: {
    eyebrow: "Step 1 · Raw",
    body: "You jot a thought as a bullet. It's lightweight, low-custody — Runner hasn't decided what kind of work it is yet.",
  },
  1: {
    eyebrow: "Step 2 · Triaged",
    body: "Runner classifies it as a Task. A chip snaps onto the line — the same chip that will later anchor the card. The bullet hasn't changed shape, just gained identity.",
  },
  2: {
    eyebrow: "Step 3 · Card",
    body: "Custody promotes. The Task chip slides to the card header, the line grows into a packet, and Runner shows what it's working, watching, and needing you for. Same chip, two worlds.",
  },
};

export default function TriageFlow() {
  const [theme, setTheme] = useState<Theme>("light");
  const [stage, setStage] = useState<Stage>(0);
  const [playing, setPlaying] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!playing) {
      clearTimer();
      return;
    }
    const delay = stage === 0 ? 1400 : stage === 1 ? 1800 : 2600;
    timeoutRef.current = window.setTimeout(() => {
      setStage((s) => ((s + 1) % 3) as Stage);
    }, delay);
    return clearTimer;
  }, [playing, stage]);

  const reset = () => {
    clearTimer();
    setPlaying(false);
    setStage(0);
  };

  const togglePlay = () => {
    if (stage === 2 && !playing) {
      setStage(0);
    }
    setPlaying((p) => !p);
  };

  const jumpTo = (s: Stage) => {
    clearTimer();
    setPlaying(false);
    setStage(s);
  };

  return (
    <DSRoot theme={theme} className="tf">
      <div className="tf__inner">
        <header className="tf__header">
          <Stack gap="snug">
            <Eyebrow>Runner · Triage flow</Eyebrow>
            <Heading size="xl" as="h1">
              From a bullet, a card grows
            </Heading>
            <Text tone="muted">
              A single thought transforms. The triage label is the throughline —
              same chip on the bullet, same chip on the card. One identity, two
              levels of custody.
            </Text>
          </Stack>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>

        <section className="tf__stage-wrap">
          <Scene stage={stage} />
        </section>

        <StageNarration stage={stage} />

        <section className="tf__controls">
          <Row className="tf__controls-row">
            <div className="tf__dots" role="tablist" aria-label="Stage">
              {([0, 1, 2] as Stage[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={s === stage}
                  className={`tf__dot ${s === stage ? "is-active" : ""}`}
                  onClick={() => jumpTo(s)}
                >
                  <span className="tf__dot-index">{s + 1}</span>
                  <span className="tf__dot-label">{STAGE_LABEL[s]}</span>
                </button>
              ))}
            </div>
            <Row className="tf__buttons">
              <Button variant="ghost" onClick={reset}>
                <RotateCcw size={13} />
                Reset
              </Button>
              <Button variant="primary" onClick={togglePlay}>
                {playing ? <Pause size={13} /> : <Play size={13} />}
                {playing ? "Pause" : stage === 2 ? "Replay" : "Play"}
              </Button>
            </Row>
          </Row>
          <div className="tf__rail" aria-hidden="true">
            <div
              className="tf__rail-fill"
              style={{ width: `${(stage / 2) * 100}%` }}
            />
          </div>
        </section>
      </div>
    </DSRoot>
  );
}

/* ────────────────────────── Scene ────────────────────────── */

const CARD_SOURCES: Array<{
  kind:
    | "calendar"
    | "google-doc"
    | "figma"
    | "email"
    | "slack"
    | "linear"
    | "linkedin";
  label: string;
}> = [
  { kind: "calendar", label: "Mon 2pm · Design review" },
  { kind: "google-doc", label: "Q3 launch notes" },
  { kind: "figma", label: "Hero comp v3" },
  { kind: "google-doc", label: "Maya's comment" },
];

function Scene({ stage }: { stage: Stage }) {
  return (
    <div className={`tf-scene tf-scene--stage-${stage}`}>
      {/* Card surface — fades and grows in at stage 2. The amber-tinted top
       *  edge mirrors the operational card's "needs you" accent. */}
      <div className="tf-scene__card" aria-hidden="true">
        <div className="tf-scene__card-accent" aria-hidden="true" />
      </div>

      {/* The bullet glyph — present in stages 0/1, fades out in stage 2 */}
      <span className="tf-scene__bullet" aria-hidden="true">
        •
      </span>

      {/* Title text — slides into card title position at stage 2 */}
      <h3 className="tf-scene__title">Prepare design review brief</h3>

      {/* The Task chip — the throughline. Single DOM node, transforms across
       *  stages. The transition is uninterrupted, so triaged → card is one
       *  continuous slide, not a fade-out / fade-in. */}
      <span className="tf-scene__chip tf-scene__chip--op">
        <Chip tone="accent">
          <Activity size={11} />
          Task
        </Chip>
      </span>

      {/* Secondary chip — fades in as part of the staircase at stage 2 */}
      <span className="tf-scene__chip tf-scene__chip--needs">
        <Chip tone="info">
          <AlertCircle size={11} />
          Needs you
        </Chip>
      </span>

      {/* State line — the answer to "what is Runner doing?" */}
      <p className="tf-scene__state">
        Drafted agenda and risk sections from 4 sources — holding for your
        framing decision before finalizing.
      </p>

      {/* "Looking at" cluster — icon-only source preview */}
      <div className="tf-scene__cluster">
        <Meta className="tf-scene__cluster-label">Looking at</Meta>
        <SourceCluster sources={CARD_SOURCES} max={4} />
      </div>
    </div>
  );
}

/* ────────────────────────── Narration ────────────────────────── */

function StageNarration({ stage }: { stage: Stage }) {
  const { eyebrow, body } = STAGE_NARRATION[stage];
  return (
    <div className="tf-narration" key={stage}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text size="sm" tone="muted">
        {body}
      </Text>
    </div>
  );
}

/* ────────────────────────── Theme toggle ────────────────────────── */

function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  return (
    <Row className="tf__theme">
      <Eyebrow>Theme</Eyebrow>
      <div className="tf__theme-toggle">
        <button
          type="button"
          className={theme === "light" ? "is-active" : ""}
          onClick={() => setTheme("light")}
        >
          Light
        </button>
        <button
          type="button"
          className={theme === "dark" ? "is-active" : ""}
          onClick={() => setTheme("dark")}
        >
          Dark
        </button>
      </div>
    </Row>
  );
}
