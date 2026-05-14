import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AppKind = "notes" | "slack" | "chrome";
type AnchorSide = "tr-out" | "tl-out" | "br-in";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WindowState extends Rect {
  id: AppKind;
  title: string;
  z: number;
  isFullScreen: boolean;
  prevRect: Rect | null;
}

interface WorkflowSuggestion {
  kind?: "workflow" | "monitor";
  name: string;
  description: string;
  appIcons: string[];
}

interface QuickReply {
  label: string;
  response: string;
}

interface IntegrationRequirement {
  name: string;
  icon: string;
  blurb: string;
}

interface Suggestion {
  app: AppKind;
  appLabel: string;
  contextLabel: string;
  reasoning: string;
  suggestedTodo?: string;
  suggestedProject?: string;
  suggestedNextCard?: string;
  workflows?: WorkflowSuggestion[];
  primaryAction: string;
  secondaryAction: string;
  dismissAction: string;
  quickReplies: QuickReply[];
  requiresIntegration?: IntegrationRequirement;
  postConnectMessage?: string;
  postConnectPrimary?: string;
}

type Block =
  | {
      kind: "todo";
      title: string;
      project?: string;
      nextCard?: string;
    }
  | {
      kind: "workflow";
      name: string;
      description: string;
      icons: string[];
    }
  | {
      kind: "monitor";
      target: string;
      description: string;
      icons: string[];
    }
  | {
      kind: "connect";
      integrationName: string;
      icon: string;
      blurb: string;
    };

type BlockStatus = "open" | "done" | "dismissed";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text?: string;
  block?: Block;
  status?: BlockStatus;
}

const BUNNY_W = 56;
const BUNNY_H = 56;
const PAD = 12;
const PAD_FULLSCREEN = 20;
const PANEL_W = 340;
const MENU_BAR_H = 28;

const INITIAL_WINDOWS: WindowState[] = [
  { id: "notes", title: "Notes", x: 60, y: 80, width: 540, height: 460, z: 1, isFullScreen: false, prevRect: null },
  { id: "slack", title: "Slack — Hiring", x: 660, y: 100, width: 520, height: 500, z: 3, isFullScreen: false, prevRect: null },
  { id: "chrome", title: "Chrome — Docs", x: 220, y: 300, width: 660, height: 640, z: 2, isFullScreen: false, prevRect: null },
];

const SUGGESTIONS: Record<AppKind, Suggestion> = {
  notes: {
    app: "notes",
    appLabel: "Notes",
    contextLabel: "Notes · Q2 Hiring Plan",
    reasoning:
      "I noticed four action items under 'Action items' in your Q2 Hiring Plan that aren't tracked anywhere yet. Want me to pull them into a checklist and keep them in sync?",
    suggestedTodo: "Q2 Hiring Plan checklist (4 items)",
    suggestedProject: "Hiring",
    workflows: [
      {
        kind: "workflow",
        name: "Sync action items to Linear",
        description: "Auto-create Linear issues from any new bullets in this note",
        appIcons: ["📝", "🟣"],
      },
    ],
    primaryAction: "Create checklist",
    secondaryAction: "Edit",
    dismissAction: "Ignore",
    quickReplies: [
      {
        label: "Tell me more",
        response:
          "The four items I'd extract are: Send offer to Priya, Schedule loop for Marcus, Update JD for senior role, and Confirm budget with finance. Each becomes its own todo, and the source line in your note stays linked.",
      },
      {
        label: "How does Linear sync work?",
        response:
          "Once Linear is connected, every new bullet you add to this note gets a matching Linear issue auto-created. Edits stay in sync both ways, and checking the bullet closes the issue.",
      },
      {
        label: "What other notes do you watch?",
        response:
          "Right now, just notes in your Hiring folder. You can add or remove folders anytime in settings — I'll only watch what you opt in to.",
      },
    ],
  },
  slack: {
    app: "slack",
    appLabel: "Slack",
    contextLabel: "Slack · #hiring-2026",
    reasoning:
      "This looks like a hiring follow-up. Priya replied with availability, but no interview has been scheduled yet.",
    suggestedTodo: "Schedule Priya intro call",
    suggestedProject: "Hiring",
    suggestedNextCard: "Draft scheduling reply",
    primaryAction: "Create",
    secondaryAction: "Edit",
    dismissAction: "Ignore",
    quickReplies: [
      {
        label: "Tell me more",
        response:
          "Priya offered Thursday 2–4pm or Friday after 11am PT. If you create the todo, I'll attach the thread, suggest a calendar slot that works for both of you, and have a draft reply waiting for review.",
      },
      {
        label: "How would this work?",
        response:
          "I'll add the todo to your Hiring project and keep an eye on this thread. If Priya messages again before you act — or if Thursday gets close without a scheduled call — I'll surface a follow-up card. Nothing else needs your attention until then.",
      },
      {
        label: "What else can you do here?",
        response:
          "I can draft your reply, check your calendar and the rest of the interview loop for overlap, send a calendar invite once you confirm, and watch the thread for cancellations or reschedules.",
      },
    ],
  },
  chrome: {
    app: "chrome",
    appLabel: "Chrome",
    contextLabel: "Chrome · Q3 Roadmap",
    reasoning:
      "Dana asked you to confirm Q3 hiring slots by Friday. I can watch this doc and the email thread alongside it — but I need Gmail access first.",
    suggestedTodo: "Confirm Q3 hiring slots with Dana",
    suggestedProject: "Roadmap",
    suggestedNextCard: "Reply by Friday",
    workflows: [
      {
        kind: "monitor",
        name: "Watch Q3 Roadmap for stale comments",
        description: "Surface unresolved comments after 3 days",
        appIcons: ["📄", "✉️"],
      },
      {
        kind: "workflow",
        name: "Auto-summarize new doc revisions",
        description: "Daily summary of edits from collaborators",
        appIcons: ["📄", "🤖"],
      },
    ],
    primaryAction: "Connect Gmail",
    secondaryAction: "Show example",
    dismissAction: "Not now",
    requiresIntegration: {
      name: "Gmail",
      icon: "✉️",
      blurb:
        "Read-only access so I can watch the email thread that mirrors this doc.",
    },
    postConnectMessage:
      "Gmail is connected. I'll keep an eye on this doc and the matching email thread, and only nudge you if Friday gets close without a confirmation.",
    postConnectPrimary: "Got it",
    quickReplies: [
      {
        label: "What does monitoring look like?",
        response:
          "I'll watch this doc, its comments, and any related Gmail thread. If everyone responds on time, you'll never hear from me. If Friday gets close without a confirmation, I'll surface a card with the open thread, what's missing, and a draft nudge.",
      },
      {
        label: "Why do you need Gmail?",
        response:
          "Read-only access. I look at sender, recipients, subject, and timing — never message bodies unless you explicitly link a thread. You can revoke access from settings anytime.",
      },
      {
        label: "Can I try without connecting?",
        response:
          "Yes — I can still watch the doc itself for comments and revisions. Gmail just adds the email side of the same conversation. You can connect it later from any suggestion.",
      },
    ],
  },
};

function getDisplayRect(w: WindowState, viewport: { w: number; h: number }): Rect {
  if (w.isFullScreen) {
    return {
      x: 0,
      y: MENU_BAR_H,
      width: viewport.w,
      height: viewport.h - MENU_BAR_H,
    };
  }
  return { x: w.x, y: w.y, width: w.width, height: w.height };
}

export default function RunnerOS() {
  const [windows, setWindows] = useState<WindowState[]>(INITIAL_WINDOWS);
  const [focusedId, setFocusedId] = useState<AppKind>("slack");
  const [panelOpen, setPanelOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<AppKind>>(new Set());
  const [connected, setConnected] = useState<Set<AppKind>>(new Set());
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [bunnyFrame, setBunnyFrame] = useState<"idle_1" | "idle_2">("idle_1");
  const [chats, setChats] = useState<Record<AppKind, ChatMessage[]>>(() => ({
    notes: seedMessages("notes", false),
    slack: seedMessages("slack", false),
    chrome: seedMessages("chrome", false),
  }));

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setBunnyFrame((f) => (f === "idle_1" ? "idle_2" : "idle_1"));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const focusWindow = useCallback((id: AppKind) => {
    setWindows((ws) => {
      const maxZ = Math.max(...ws.map((w) => w.z));
      return ws.map((w) => (w.id === id ? { ...w, z: maxZ + 1 } : w));
    });
    setFocusedId(id);
    setPanelOpen(false);
  }, []);

  const toggleFullScreen = useCallback((id: AppKind) => {
    setPanelOpen(false);
    setWindows((ws) => {
      const maxZ = Math.max(...ws.map((w) => w.z));
      return ws.map((w) => {
        if (w.id !== id) return w;
        if (w.isFullScreen && w.prevRect) {
          return {
            ...w,
            isFullScreen: false,
            x: w.prevRect.x,
            y: w.prevRect.y,
            width: w.prevRect.width,
            height: w.prevRect.height,
            prevRect: null,
            z: maxZ + 1,
          };
        }
        return {
          ...w,
          isFullScreen: true,
          prevRect: { x: w.x, y: w.y, width: w.width, height: w.height },
          z: maxZ + 1,
        };
      });
    });
    setFocusedId(id);
  }, []);

  const dragRef = useRef<{ id: AppKind; offsetX: number; offsetY: number } | null>(null);

  const startDrag = useCallback(
    (e: React.PointerEvent, id: AppKind) => {
      const win = windows.find((w) => w.id === id);
      if (!win || win.isFullScreen) return;
      focusWindow(id);
      dragRef.current = {
        id,
        offsetX: e.clientX - win.x,
        offsetY: e.clientY - win.y,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [windows, focusWindow],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setWindows((ws) =>
        ws.map((w) => {
          if (w.id !== d.id || w.isFullScreen) return w;
          const nextX = Math.min(
            Math.max(e.clientX - d.offsetX, -w.width + 80),
            viewport.w - 80,
          );
          const nextY = Math.min(
            Math.max(e.clientY - d.offsetY, MENU_BAR_H + 4),
            viewport.h - 40,
          );
          return { ...w, x: nextX, y: nextY };
        }),
      );
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

  const focusedWindow = useMemo(
    () => windows.find((w) => w.id === focusedId) ?? windows[0],
    [windows, focusedId],
  );
  const focusedRect = useMemo(
    () => getDisplayRect(focusedWindow, viewport),
    [focusedWindow, viewport],
  );

  const BUNNY_BLOCK = BUNNY_H + PAD;

  const layout = useMemo(() => {
    const r = focusedRect;
    // Inside-window placement: bunny bottom-right, panel pops up above bunny
    const popupLayout = (pad: number) => {
      const bunnyX = r.x + r.width - BUNNY_W - pad;
      const bunnyY = r.y + r.height - BUNNY_H - pad;
      const popupH = Math.min(540, bunnyY - r.y - 32);
      const panelX = Math.max(16, bunnyX + BUNNY_W - PANEL_W);
      const panelY = Math.max(MENU_BAR_H + 16, bunnyY - PAD - popupH);
      return {
        anchor: { x: bunnyX, y: bunnyY, side: "br-in" as AnchorSide },
        panel: {
          x: panelX,
          y: panelY,
          width: PANEL_W,
          height: popupH,
          variant: "popup" as const,
        },
      };
    };

    if (focusedWindow.isFullScreen) return popupLayout(PAD_FULLSCREEN);

    const rightSpace = viewport.w - (r.x + r.width);
    const leftSpace = r.x;
    const needed = PANEL_W + PAD + 8;
    if (rightSpace >= needed) {
      return {
        anchor: { x: r.x + r.width + PAD, y: r.y, side: "tr-out" as AnchorSide },
        panel: {
          x: r.x + r.width + PAD,
          y: r.y + BUNNY_BLOCK,
          width: PANEL_W,
          height: r.height - BUNNY_BLOCK,
          variant: "sidebar-right" as const,
        },
      };
    }
    if (leftSpace >= needed) {
      return {
        anchor: { x: r.x - BUNNY_W - PAD, y: r.y, side: "tl-out" as AnchorSide },
        panel: {
          x: r.x - PANEL_W - PAD,
          y: r.y + BUNNY_BLOCK,
          width: PANEL_W,
          height: r.height - BUNNY_BLOCK,
          variant: "sidebar-left" as const,
        },
      };
    }
    return popupLayout(PAD);
  }, [focusedRect, focusedWindow.isFullScreen, viewport.w, BUNNY_BLOCK]);

  const anchor = layout.anchor;
  const panelLayout = layout.panel;

  const suggestion = SUGGESTIONS[focusedId];
  const isDismissed = dismissed.has(focusedId);
  const isConnected = connected.has(focusedId);
  const needsConnect = !!suggestion.requiresIntegration && !isConnected;
  const hasUnread = !isDismissed && !panelOpen;

  const handleDismiss = () => {
    setDismissed((s) => {
      const next = new Set(s);
      next.add(focusedId);
      return next;
    });
    setPanelOpen(false);
  };

  const appendMessage = useCallback(
    (app: AppKind, msg: ChatMessage) => {
      setChats((prev) => ({ ...prev, [app]: [...prev[app], msg] }));
    },
    [],
  );

  const sendUserMessage = useCallback(
    (text: string, prefabResponse?: string) => {
      const app = focusedId;
      appendMessage(app, {
        id: `u-${Date.now()}`,
        role: "user",
        text,
      });
      const reply = prefabResponse ?? cannedReply(app, text);
      window.setTimeout(() => {
        appendMessage(app, {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: reply,
        });
      }, 480);
    },
    [focusedId, appendMessage],
  );

  const markConnectBlockDone = (app: AppKind) => {
    setChats((prev) => ({
      ...prev,
      [app]: prev[app].map((m) =>
        m.block?.kind === "connect" ? { ...m, status: "done" } : m,
      ),
    }));
  };

  const setBlockStatus = (msgId: string, status: BlockStatus) => {
    setChats((prev) => ({
      ...prev,
      [focusedId]: prev[focusedId].map((m) =>
        m.id === msgId ? { ...m, status } : m,
      ),
    }));
  };

  const handleConnect = () => {
    const app = focusedId;
    appendMessage(app, {
      id: `u-${Date.now()}`,
      role: "user",
      text: `Connect ${suggestion.requiresIntegration?.name ?? "integration"}`,
    });
    window.setTimeout(() => {
      setConnected((s) => {
        const next = new Set(s);
        next.add(app);
        return next;
      });
      markConnectBlockDone(app);
      const s = SUGGESTIONS[app];
      const postMessages: ChatMessage[] = [
        {
          id: `a-${Date.now()}-text`,
          role: "assistant",
          text:
            s.postConnectMessage ??
            "Connected. I'll take it from here and surface a card only if something needs you.",
        },
      ];
      if (s.suggestedTodo) {
        postMessages.push({
          id: `a-${Date.now()}-todo`,
          role: "assistant",
          block: {
            kind: "todo",
            title: s.suggestedTodo,
            project: s.suggestedProject,
            nextCard: s.suggestedNextCard,
          },
          status: "open",
        });
      }
      s.workflows?.forEach((wf, i) => {
        const kind = wf.kind === "monitor" ? "monitor" : "workflow";
        postMessages.push({
          id: `a-${Date.now()}-${kind}-${i}`,
          role: "assistant",
          block:
            kind === "monitor"
              ? { kind: "monitor", target: wf.name, description: wf.description, icons: wf.appIcons }
              : { kind: "workflow", name: wf.name, description: wf.description, icons: wf.appIcons },
          status: "open",
        });
      });
      setChats((prev) => ({ ...prev, [app]: [...prev[app], ...postMessages] }));
    }, 520);
  };

  const handleBlockAction = (
    msgId: string,
    action: "primary" | "dismiss",
    block: Block,
  ) => {
    const app = focusedId;
    if (action === "dismiss") {
      setBlockStatus(msgId, "dismissed");
      const dismissText =
        block.kind === "todo" ? "Ignore"
          : block.kind === "monitor" ? "Skip"
          : block.kind === "workflow" ? "Skip"
          : "Not now";
      appendMessage(app, { id: `u-${Date.now()}`, role: "user", text: dismissText });
      window.setTimeout(() => {
        appendMessage(app, {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "No problem — I'll leave that one. Anything else you want me to look at?",
        });
      }, 400);
      return;
    }
    if (block.kind === "connect") {
      handleConnect();
      return;
    }
    setBlockStatus(msgId, "done");
    const userText =
      block.kind === "todo" ? "Create"
        : block.kind === "monitor" ? "Start monitoring"
        : "Set up";
    appendMessage(app, { id: `u-${Date.now()}`, role: "user", text: userText });
    const reply =
      block.kind === "todo"
        ? `Done — '${block.title}' is on your ${block.project ?? "list"}. ${block.nextCard ? `I'll start drafting '${block.nextCard}'.` : "I'll let you know when something needs you."}`
        : block.kind === "monitor"
          ? `On it — I'm watching '${block.target}'. You'll only hear from me if something needs you.`
          : `Set up — '${block.name}' is running. I'll keep it quietly working in the background.`;
    window.setTimeout(() => {
      appendMessage(app, { id: `a-${Date.now()}`, role: "assistant", text: reply });
    }, 480);
  };

  return (
    <div className="ros-desktop" onPointerDown={() => setPanelOpen(false)}>
      <MenuBar />
      <div className="ros-window-layer">
        {windows.map((w) => (
          <AppWindow
            key={w.id}
            window={w}
            isFocused={w.id === focusedId}
            viewport={viewport}
            onFocus={() => focusWindow(w.id)}
            onTitleBarDown={(e) => startDrag(e, w.id)}
            onToggleFullScreen={() => toggleFullScreen(w.id)}
          />
        ))}
      </div>

      {panelOpen && !isDismissed && (
        <div
          className={`ros-panel-wrap is-${panelLayout.variant}`}
          style={{
            transform: `translate(${panelLayout.x}px, ${panelLayout.y}px)`,
            width: panelLayout.width,
            height: panelLayout.height,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ChatPanel
            suggestion={suggestion}
            messages={chats[focusedId]}
            needsConnect={needsConnect}
            isConnected={isConnected}
            onSend={sendUserMessage}
            onBlockAction={handleBlockAction}
            onDismissPanel={handleDismiss}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}

      <button
        type="button"
        className={`ros-bunny ${hasUnread ? "has-unread" : ""}`}
        style={{ transform: `translate(${anchor.x}px, ${anchor.y}px)` }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setPanelOpen((p) => !p);
        }}
        aria-label="Runner suggestion"
      >
        <img
          src={hasUnread ? "/bunny/unread.gif" : `/bunny/${bunnyFrame}.gif`}
          alt=""
          draggable={false}
        />
        {hasUnread && <span className="ros-bunny-dot" aria-hidden="true" />}
      </button>
    </div>
  );
}

function seedMessages(app: AppKind, isConnected: boolean): ChatMessage[] {
  const s = SUGGESTIONS[app];
  const usePostConnect = isConnected && s.requiresIntegration && s.postConnectMessage;
  const msgs: ChatMessage[] = [];

  msgs.push({
    id: `seed-${app}-text`,
    role: "assistant",
    text: usePostConnect ? (s.postConnectMessage as string) : s.reasoning,
  });

  if (s.requiresIntegration && !isConnected) {
    msgs.push({
      id: `seed-${app}-connect`,
      role: "assistant",
      block: {
        kind: "connect",
        integrationName: s.requiresIntegration.name,
        icon: s.requiresIntegration.icon,
        blurb: s.requiresIntegration.blurb,
      },
      status: "open",
    });
    return msgs;
  }

  if (s.suggestedTodo) {
    msgs.push({
      id: `seed-${app}-todo`,
      role: "assistant",
      block: {
        kind: "todo",
        title: s.suggestedTodo,
        project: s.suggestedProject,
        nextCard: s.suggestedNextCard,
      },
      status: "open",
    });
  }

  s.workflows?.forEach((wf, i) => {
    const kind = wf.kind === "monitor" ? "monitor" : "workflow";
    msgs.push({
      id: `seed-${app}-${kind}-${i}`,
      role: "assistant",
      block:
        kind === "monitor"
          ? { kind: "monitor", target: wf.name, description: wf.description, icons: wf.appIcons }
          : { kind: "workflow", name: wf.name, description: wf.description, icons: wf.appIcons },
      status: "open",
    });
  });

  return msgs;
}

function cannedReply(app: AppKind, text: string): string {
  const lower = text.toLowerCase().trim();
  const s = SUGGESTIONS[app];
  if (/(yes|sure|do it|create|connect|go ahead|sounds good)/.test(lower)) {
    return "On it — I'll set this up and let you know when there's a next step worth your attention.";
  }
  if (/(no|nope|later|not now|skip|ignore)/.test(lower)) {
    return "No problem — I'll back off here. You can call me back anytime from the menu bar.";
  }
  if (/(how|work|monitor)/.test(lower)) {
    return s.quickReplies.find((q) => /how|monitor/i.test(q.label))?.response
      ?? "Here's how it works: I watch the surfaces you connect, and only surface a card when something needs you. The rest stays out of your way.";
  }
  if (/(else|other|more|capab|do for me)/.test(lower)) {
    return s.quickReplies.find((q) => /else|more|workflows/i.test(q.label))?.response
      ?? "I can draft replies, watch threads, suggest workflows, and surface follow-ups when a deadline is at risk. Connect more integrations and I get more useful.";
  }
  return "Got it — let me know if you want me to go ahead, or ask me anything about how I'd handle this.";
}

function MenuBar() {
  const [time, setTime] = useState(() => formatTime(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="ros-menubar">
      <div className="ros-menubar-left">
        <span className="ros-menubar-apple"></span>
        <span className="ros-menubar-app">Runner</span>
        <span className="ros-menubar-item">File</span>
        <span className="ros-menubar-item">Edit</span>
        <span className="ros-menubar-item">View</span>
        <span className="ros-menubar-item">Window</span>
        <span className="ros-menubar-item">Help</span>
      </div>
      <div className="ros-menubar-right">
        <span className="ros-menubar-item">🔋</span>
        <span className="ros-menubar-item">📶</span>
        <span className="ros-menubar-item">{time}</span>
      </div>
    </div>
  );
}

function formatTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = ((h + 11) % 12) + 1;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${hh}:${mm} ${h >= 12 ? "PM" : "AM"}`;
}

function AppWindow({
  window: w,
  isFocused,
  viewport,
  onFocus,
  onTitleBarDown,
  onToggleFullScreen,
}: {
  window: WindowState;
  isFocused: boolean;
  viewport: { w: number; h: number };
  onFocus: () => void;
  onTitleBarDown: (e: React.PointerEvent) => void;
  onToggleFullScreen: () => void;
}) {
  const rect = getDisplayRect(w, viewport);
  return (
    <div
      className={`ros-window ros-window-${w.id} ${isFocused ? "is-focused" : ""} ${w.isFullScreen ? "is-fullscreen" : ""}`}
      style={{
        transform: `translate(${rect.x}px, ${rect.y}px)`,
        width: rect.width,
        height: rect.height,
        zIndex: w.z,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (!isFocused) onFocus();
      }}
    >
      <div className="ros-titlebar" onPointerDown={onTitleBarDown}>
        <div className="ros-traffic">
          <button
            type="button"
            className="ros-light red"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            aria-label="Close"
          />
          <button
            type="button"
            className="ros-light yellow"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            aria-label="Minimize"
          />
          <button
            type="button"
            className="ros-light green"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullScreen();
            }}
            aria-label={w.isFullScreen ? "Exit full screen" : "Enter full screen"}
          />
        </div>
        <div className="ros-title">{w.title}</div>
        <div className="ros-traffic-spacer" />
      </div>
      <div className="ros-window-body">
        {w.id === "notes" && <NotesBody />}
        {w.id === "slack" && <SlackBody />}
        {w.id === "chrome" && <ChromeBody />}
      </div>
    </div>
  );
}

function NotesBody() {
  return (
    <div className="ros-notes">
      <aside className="ros-notes-sidebar">
        <div className="ros-notes-header">Folders</div>
        <div className="ros-notes-folder is-active">Hiring</div>
        <div className="ros-notes-folder">Planning</div>
        <div className="ros-notes-folder">Meetings</div>
        <div className="ros-notes-folder">Personal</div>
        <div className="ros-notes-header" style={{ marginTop: 16 }}>Notes</div>
        <div className="ros-notes-note is-active">Q2 Hiring Plan</div>
        <div className="ros-notes-note">Interview rubric</div>
        <div className="ros-notes-note">Onboarding doc</div>
      </aside>
      <section className="ros-notes-main">
        <h1>Q2 Hiring Plan</h1>
        <p className="ros-skel ros-skel-line" style={{ width: "92%" }} />
        <p className="ros-skel ros-skel-line" style={{ width: "78%" }} />
        <p className="ros-skel ros-skel-line" style={{ width: "84%" }} />
        <h2>Action items</h2>
        <ul className="ros-notes-list">
          <li><span className="ros-bullet">—</span> Send offer to Priya</li>
          <li><span className="ros-bullet">—</span> Schedule loop for Marcus</li>
          <li><span className="ros-bullet">—</span> Update JD for senior role</li>
          <li><span className="ros-bullet">—</span> Confirm budget with finance</li>
        </ul>
      </section>
    </div>
  );
}

function SlackBody() {
  return (
    <div className="ros-slack">
      <aside className="ros-slack-rail">
        <div className="ros-slack-ws is-active" style={{ background: "#611f69" }}>R</div>
        <div className="ros-slack-ws" style={{ background: "#3b6ea5" }}>D</div>
        <div className="ros-slack-ws" style={{ background: "#1f7a4a" }}>P</div>
      </aside>
      <aside className="ros-slack-channels">
        <div className="ros-slack-team">Runner HQ</div>
        <div className="ros-slack-section">Channels</div>
        <div className="ros-slack-channel"># general</div>
        <div className="ros-slack-channel"># product</div>
        <div className="ros-slack-channel is-active"># hiring-2026</div>
        <div className="ros-slack-channel"># engineering</div>
        <div className="ros-slack-channel"># random</div>
        <div className="ros-slack-section">Direct messages</div>
        <div className="ros-slack-channel">● Priya Patel</div>
        <div className="ros-slack-channel">○ Marcus Lee</div>
      </aside>
      <section className="ros-slack-main">
        <div className="ros-slack-header"># hiring-2026</div>
        <div className="ros-slack-msg">
          <div className="ros-avatar" style={{ background: "#c98a3a" }}>M</div>
          <div className="ros-slack-body">
            <div className="ros-slack-meta">
              <b>Matt</b> <span>10:14 AM</span>
            </div>
            <div>Hey Priya — when works for a 30-min intro this week?</div>
          </div>
        </div>
        <div className="ros-slack-msg">
          <div className="ros-avatar" style={{ background: "#6b4ca8" }}>P</div>
          <div className="ros-slack-body">
            <div className="ros-slack-meta">
              <b>Priya</b> <span>10:42 AM</span>
            </div>
            <div>I'm open Thu 2–4pm or Fri after 11am PT. Either works!</div>
          </div>
        </div>
        <div className="ros-slack-composer">
          <span>Message #hiring-2026</span>
        </div>
      </section>
    </div>
  );
}

function ChromeBody() {
  return (
    <div className="ros-chrome">
      <div className="ros-chrome-tabs">
        <div className="ros-chrome-tab">Inbox (12)</div>
        <div className="ros-chrome-tab is-active">Q3 Roadmap — Google Docs</div>
        <div className="ros-chrome-tab">GitHub · runner</div>
        <div className="ros-chrome-tab-new">+</div>
      </div>
      <div className="ros-chrome-toolbar">
        <span className="ros-chrome-nav">‹</span>
        <span className="ros-chrome-nav">›</span>
        <span className="ros-chrome-nav">↻</span>
        <div className="ros-chrome-url">docs.google.com/document/d/1aB…/q3-roadmap</div>
        <span className="ros-chrome-nav">★</span>
      </div>
      <div className="ros-chrome-page">
        <h1>Q3 Roadmap — Draft v3</h1>
        <p className="ros-skel ros-skel-line" style={{ width: "94%" }} />
        <p className="ros-skel ros-skel-line" style={{ width: "82%" }} />
        <p className="ros-skel ros-skel-line" style={{ width: "88%" }} />
        <h2>Goals</h2>
        <p className="ros-skel ros-skel-line" style={{ width: "76%" }} />
        <p className="ros-skel ros-skel-line" style={{ width: "90%" }} />
        <div className="ros-chrome-comment">
          <div className="ros-avatar" style={{ background: "#3b6ea5" }}>D</div>
          <div>
            <div className="ros-slack-meta"><b>Dana</b> <span>Mon</span></div>
            <div>Can you confirm Q3 hiring slots before Fri?</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({
  suggestion,
  messages,
  needsConnect,
  isConnected,
  onSend,
  onBlockAction,
  onDismissPanel,
  onClose,
}: {
  suggestion: Suggestion;
  messages: ChatMessage[];
  needsConnect: boolean;
  isConnected: boolean;
  onSend: (text: string, response?: string) => void;
  onBlockAction: (msgId: string, action: "primary" | "dismiss", block: Block) => void;
  onDismissPanel: () => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const lastMessage = messages[messages.length - 1];
  const showQuickReplies = lastMessage?.role === "assistant";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    setInput("");
    onSend(t);
  };

  return (
    <div className="ros-panel">
      <div className="ros-panel-head">
        <span className={`ros-panel-context app-${suggestion.app}`}>
          <span className="ros-panel-context-icon" aria-hidden="true" />
          {suggestion.contextLabel}
        </span>
        {needsConnect && (
          <span className="ros-panel-status is-attention">
            <span className="ros-panel-status-dot" />
            Setup needed
          </span>
        )}
        {isConnected && (
          <span className="ros-panel-status is-active">
            <span className="ros-panel-status-dot" />
            Monitoring
          </span>
        )}
        <button
          type="button"
          className="ros-panel-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="ros-panel-thread" ref={scrollerRef}>
        {messages.map((m) => {
          if (m.block) {
            return (
              <BlockCard
                key={m.id}
                msgId={m.id}
                block={m.block}
                status={m.status ?? "open"}
                onAction={onBlockAction}
              />
            );
          }
          if (m.text) {
            return (
              <div key={m.id} className={`ros-bubble ros-bubble-${m.role}`}>
                <div className="ros-bubble-text">{m.text}</div>
              </div>
            );
          }
          return null;
        })}
      </div>

      {showQuickReplies && (
        <div className="ros-quick-replies">
          {suggestion.quickReplies.map((q) => (
            <button
              key={q.label}
              type="button"
              className="ros-quick-reply"
              onClick={() => onSend(q.label, q.response)}
            >
              {q.label}
            </button>
          ))}
          <button
            type="button"
            className="ros-quick-reply ros-quick-reply-ghost"
            onClick={onDismissPanel}
          >
            Dismiss all
          </button>
        </div>
      )}

      <form className="ros-composer" onSubmit={submit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Runner anything…"
          autoComplete="off"
        />
        <button
          type="submit"
          className="ros-composer-send"
          disabled={!input.trim()}
          aria-label="Send"
        >
          ↑
        </button>
      </form>
    </div>
  );
}

function BlockCard({
  msgId,
  block,
  status,
  onAction,
}: {
  msgId: string;
  block: Block;
  status: BlockStatus;
  onAction: (msgId: string, action: "primary" | "dismiss", block: Block) => void;
}) {
  if (block.kind === "todo") {
    return (
      <div className={`ros-card ros-card-todo is-${status}`}>
        <div className="ros-card-kind">
          <span className="ros-card-kind-dot ros-kind-todo" />
          Suggested task
          {status === "done" && <span className="ros-card-tag is-done">Created</span>}
          {status === "dismissed" && <span className="ros-card-tag is-dismissed">Ignored</span>}
        </div>
        <div className="ros-card-title">{block.title}</div>
        {(block.project || block.nextCard) && (
          <div className="ros-card-meta">
            {block.project && <span className="ros-card-pill">{block.project}</span>}
            {block.nextCard && (
              <span className="ros-card-hint">Next: {block.nextCard}</span>
            )}
          </div>
        )}
        {status === "open" && (
          <div className="ros-card-actions">
            <button
              type="button"
              className="ros-btn-primary"
              onClick={() => onAction(msgId, "primary", block)}
            >
              Create
            </button>
            <button
              type="button"
              className="ros-btn-ghost"
              onClick={() => onAction(msgId, "dismiss", block)}
            >
              Ignore
            </button>
          </div>
        )}
      </div>
    );
  }

  if (block.kind === "monitor") {
    return (
      <div className={`ros-card ros-card-monitor is-${status}`}>
        <div className="ros-card-kind">
          <span className="ros-card-kind-dot ros-kind-monitor" />
          Suggested monitoring
          {status === "done" && <span className="ros-card-tag is-done">Active</span>}
          {status === "dismissed" && <span className="ros-card-tag is-dismissed">Skipped</span>}
        </div>
        <div className="ros-card-body">
          <div className="ros-card-icons">
            {block.icons.map((icon, i) => (
              <span key={i} className="ros-card-icon">{icon}</span>
            ))}
          </div>
          <div className="ros-card-text">
            <div className="ros-card-title">{block.target}</div>
            <div className="ros-card-desc">{block.description}</div>
          </div>
        </div>
        {status === "open" && (
          <div className="ros-card-actions">
            <button
              type="button"
              className="ros-btn-primary"
              onClick={() => onAction(msgId, "primary", block)}
            >
              Start monitoring
            </button>
            <button
              type="button"
              className="ros-btn-ghost"
              onClick={() => onAction(msgId, "dismiss", block)}
            >
              Skip
            </button>
          </div>
        )}
      </div>
    );
  }

  if (block.kind === "workflow") {
    return (
      <div className={`ros-card ros-card-workflow is-${status}`}>
        <div className="ros-card-kind">
          <span className="ros-card-kind-dot ros-kind-workflow" />
          Suggested workflow
          {status === "done" && <span className="ros-card-tag is-done">Set up</span>}
          {status === "dismissed" && <span className="ros-card-tag is-dismissed">Skipped</span>}
        </div>
        <div className="ros-card-body">
          <div className="ros-card-icons">
            {block.icons.map((icon, i) => (
              <span key={i} className="ros-card-icon">{icon}</span>
            ))}
          </div>
          <div className="ros-card-text">
            <div className="ros-card-title">{block.name}</div>
            <div className="ros-card-desc">{block.description}</div>
          </div>
        </div>
        {status === "open" && (
          <div className="ros-card-actions">
            <button
              type="button"
              className="ros-btn-primary"
              onClick={() => onAction(msgId, "primary", block)}
            >
              Set up
            </button>
            <button
              type="button"
              className="ros-btn-ghost"
              onClick={() => onAction(msgId, "dismiss", block)}
            >
              Skip
            </button>
          </div>
        )}
      </div>
    );
  }

  // connect
  return (
    <div className={`ros-card ros-card-connect is-${status}`}>
      <div className="ros-card-kind">
        <span className="ros-card-kind-dot ros-kind-connect" />
        Integration required
        {status === "done" && <span className="ros-card-tag is-done">Connected</span>}
      </div>
      <div className="ros-card-body">
        <div className="ros-card-icon ros-card-icon-lg" aria-hidden="true">{block.icon}</div>
        <div className="ros-card-text">
          <div className="ros-card-title">Connect {block.integrationName}</div>
          <div className="ros-card-desc">{block.blurb}</div>
        </div>
      </div>
      {status === "open" && (
        <div className="ros-card-actions">
          <button
            type="button"
            className="ros-btn-primary"
            onClick={() => onAction(msgId, "primary", block)}
          >
            Connect {block.integrationName}
          </button>
          <button
            type="button"
            className="ros-btn-ghost"
            onClick={() => onAction(msgId, "dismiss", block)}
          >
            Not now
          </button>
        </div>
      )}
    </div>
  );
}
