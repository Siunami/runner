import {
  Archive,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  FileText,
  Inbox,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { ArtifactView } from "./Artifact";
import {
  CSSProperties,
  FocusEvent as ReactFocusEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ACTIVE,
  ActionCard,
  CardState,
  ChatMessage,
  ConfirmAttachment,
  DoneArtifact,
  DONE,
  Mode,
  PROPOSALS,
  Project,
  Task,
} from "./data";

const modeItems: Array<{ key: Mode; label: string }> = [
  { key: "proposed", label: "Proposed" },
  { key: "active", label: "Active" },
  { key: "done", label: "Done" },
];

const nowLabel = () =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(
    new Date(),
  );

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const makeTask = (title: string, detail: string): Task => ({
  id: uid("task"),
  title,
  detail,
});

const tasksFromProposal = (proposal: string): Task[] => {
  const text = proposal.toLowerCase();

  if (text.includes("hotel") || text.includes("trip") || text.includes("travel")) {
    return [
      makeTask("Lock dates and city sequence", "Confirm dates and order before any spend."),
      makeTask("Compare options", "Shortlist 2-3 with transit, cost, and notes."),
      makeTask("Plan transit", "Map travel legs and booking timing."),
      makeTask("Draft approval note", "Concise summary before final commitments."),
    ];
  }

  if (text.includes("email") || text.includes("draft") || text.includes("send")) {
    return [
      makeTask("Clarify audience and outcome", "Who needs the message; what decision should it create."),
      makeTask("Draft the message", "Subject, body, and call to action."),
      makeTask("Collect approval criteria", "Facts, risks, and open questions."),
      makeTask("Prepare send checklist", "Recipients, timing, attachments, follow-up owner."),
    ];
  }

  if (text.includes("hire") || text.includes("source") || text.includes("candidate")) {
    return [
      makeTask("Define the bar", "Must-haves, nice-to-haves, deal-breakers."),
      makeTask("Source the pipeline", "Pull candidates from existing networks + outbound."),
      makeTask("Run early conversations", "Fast filter — 30 min calls."),
      makeTask("Decide on offers", "Compare top finalists; commit."),
    ];
  }

  return [
    makeTask("Clarify the desired outcome", "Name the final artifact, decision, or completed state."),
    makeTask("Break work into action cards", "Separate research, drafting, approvals, execution."),
    makeTask("Identify unresolved questions", "Capture what to ask before work starts."),
    makeTask("Define completion evidence", "What proves the project is done."),
  ];
};

const inferTitle = (proposal: string) => {
  const text = proposal.trim();
  const firstLine = text.split("\n")[0].replace(/^#+\s*/, "");
  if (firstLine.length > 4) return firstLine.replace(/[.?!]$/, "");
  return "Untitled Project";
};

const applyChatInstruction = (
  message: string,
  currentTasks: Task[],
): { tasks: Task[]; reply: string } => {
  const lower = message.toLowerCase();
  let tasks = [...currentTasks];

  if (lower.includes("remove") && lower.includes("email")) {
    tasks = tasks.filter((task) => !task.title.toLowerCase().includes("email"));
    return {
      tasks,
      reply:
        "Removed the email-specific task. The plan stays focused on decisions and action cards.",
    };
  }

  if (lower.includes("simpler") || lower.includes("shorter")) {
    tasks = tasks.slice(0, 3);
    return {
      tasks,
      reply:
        "Trimmed to three cards so the active stack opens with only the highest-friction decisions.",
    };
  }

  if (
    lower.includes("looks good") ||
    lower.includes("ready") ||
    lower.includes("submit") ||
    lower.includes("ship it")
  ) {
    return {
      tasks,
      reply:
        "Looks ready. Submit when you're set — each task becomes an action card in the active stack.",
    };
  }

  tasks = tasks.map((task, index) =>
    index === 0
      ? {
          ...task,
          detail: `${task.detail} Include any owner, deadline, or approval constraint mentioned in chat.`,
        }
      : task,
  );

  return {
    tasks,
    reply:
      "Folded that into the plan and tightened the first card so it carries the key constraint into active work.",
  };
};

const cardForTask = (task: Task): ActionCard => ({
  id: uid("card"),
  title: task.title,
  state: "todo",
  artifact: { kind: "note", body: task.detail },
});

const cardsFromTasks = (tasks: Task[]) => tasks.map(cardForTask);

const initialProjects: Project[] = [...PROPOSALS, ...ACTIVE, ...DONE];

export default function App() {
  const [mode, setMode] = useState<Mode>("proposed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [newProposal, setNewProposal] = useState("");
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});

  const filteredProjects = useMemo(
    () => projects.filter((project) => project.status === mode),
    [projects, mode],
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? null,
    [projects, selectedId],
  );

  const updateProject = (id: string, updater: (project: Project) => Project) => {
    setProjects((current) =>
      current.map((project) => (project.id === id ? updater(project) : project)),
    );
  };

  const handleNewProposal = () => {
    const trimmed = newProposal.trim();
    if (!trimmed) return;

    const project: Project = {
      id: uid("project"),
      title: inferTitle(trimmed),
      status: "proposed",
      summary: trimmed,
      proposal: trimmed,
      tasks: tasksFromProposal(trimmed),
      chatMessages: [
        { id: uid("chat"), role: "user", body: trimmed, timestamp: nowLabel() },
        {
          id: uid("chat"),
          role: "assistant",
          body: "I drafted a starting plan from this. Edit the list directly or tell me what to change before submitting.",
          timestamp: nowLabel(),
        },
      ],
      updatedAt: "Just now",
    };

    setProjects((current) => [project, ...current]);
    setSelectedId(project.id);
    setNewProposal("");
  };

  const ensureProposedTasks = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || project.status !== "proposed") return;
    if (project.tasks && project.tasks.length > 0) return;
    const generated = tasksFromProposal(project.proposal || project.summary);
    updateProject(projectId, (p) => ({
      ...p,
      tasks: generated,
      chatMessages:
        p.chatMessages.length > 0
          ? p.chatMessages
          : [
              {
                id: uid("chat"),
                role: "user",
                body: p.summary,
                timestamp: nowLabel(),
              },
              {
                id: uid("chat"),
                role: "assistant",
                body: "Drafted a starter plan. Edit the list directly or tell me what to change before submitting.",
                timestamp: nowLabel(),
              },
            ],
    }));
  };

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProject) return;
    const draft = (chatDrafts[selectedProject.id] || "").trim();
    if (!draft) return;

    if (selectedProject.status === "proposed") {
      const result = applyChatInstruction(
        draft,
        selectedProject.tasks ?? [],
      );
      updateProject(selectedProject.id, (project) => ({
        ...project,
        tasks: result.tasks,
        chatMessages: [
          ...project.chatMessages,
          {
            id: uid("chat"),
            role: "user",
            body: draft,
            timestamp: nowLabel(),
          },
          {
            id: uid("chat"),
            role: "assistant",
            body: result.reply,
            timestamp: nowLabel(),
          },
        ],
        updatedAt: "Just now",
      }));
    } else {
      const reply =
        selectedProject.status === "active"
          ? "I can revise this card or fetch more options. Edit the artifact on the left or tell me what to change."
          : "Logged the question against this archive. I can reopen any artifact if you need to act on it again.";
      updateProject(selectedProject.id, (project) => ({
        ...project,
        chatMessages: [
          ...project.chatMessages,
          {
            id: uid("chat"),
            role: "user",
            body: draft,
            timestamp: nowLabel(),
          },
          {
            id: uid("chat"),
            role: "assistant",
            body: reply,
            timestamp: nowLabel(),
          },
        ],
        updatedAt: "Just now",
      }));
    }

    setChatDrafts((drafts) => ({ ...drafts, [selectedProject.id]: "" }));
  };

  const updateTask = (
    projectId: string,
    taskId: string,
    field: "title" | "detail",
    value: string,
  ) => {
    updateProject(projectId, (project) => ({
      ...project,
      tasks: (project.tasks ?? []).map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task,
      ),
    }));
  };

  const removeTask = (projectId: string, taskId: string) => {
    updateProject(projectId, (project) => ({
      ...project,
      tasks: (project.tasks ?? []).filter((task) => task.id !== taskId),
    }));
  };

  const addTask = (projectId: string) => {
    updateProject(projectId, (project) => ({
      ...project,
      tasks: [
        ...(project.tasks ?? []),
        makeTask("New action card", "Describe the decision or output needed."),
      ],
    }));
  };

  const updateProjectTitle = (projectId: string, title: string) => {
    updateProject(projectId, (project) => ({ ...project, title }));
  };

  const submitProposal = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const tasks = (project.tasks ?? []).filter((task) => task.title.trim());
    if (!tasks.length) return;

    updateProject(projectId, (current) => ({
      ...current,
      status: "active",
      tasks,
      cards: cardsFromTasks(tasks),
      chatMessages: [
        ...current.chatMessages,
        {
          id: uid("chat"),
          role: "assistant",
          body: `Accepted. ${tasks.length} action cards are in the active stack — work through them top to bottom.`,
          timestamp: nowLabel(),
        },
      ],
      updatedAt: "Just now",
    }));
    setMode("active");
    setSelectedId(projectId);
  };

  const updateCard = (
    projectId: string,
    cardId: string,
    updater: (card: ActionCard) => ActionCard,
  ) => {
    updateProject(projectId, (project) => ({
      ...project,
      cards: (project.cards ?? []).map((card) =>
        card.id === cardId ? updater(card) : card,
      ),
      updatedAt: "Just now",
    }));
  };

  const acceptCard = (projectId: string, cardId: string) => {
    updateCard(projectId, cardId, (card) => ({
      ...card,
      state: "done",
      triageNote: undefined,
    }));
  };

  const reviseCard = (projectId: string, cardId: string) => {
    updateCard(projectId, cardId, (card) => ({
      ...card,
      state: "triage",
      triageNote:
        card.triageNote ?? "Revision requested — agent looking for alternatives.",
    }));
  };

  const setSelectedOption = (
    projectId: string,
    cardId: string,
    optionId: string,
  ) => {
    updateCard(projectId, cardId, (card) => {
      if (card.artifact?.kind !== "options") return card;
      return {
        ...card,
        artifact: { ...card.artifact, selectedOptionId: optionId },
      };
    });
  };

  const setDecisionChoice = (
    projectId: string,
    cardId: string,
    choiceId: string,
  ) => {
    updateCard(projectId, cardId, (card) => {
      if (card.artifact?.kind !== "decision") return card;
      return {
        ...card,
        artifact: { ...card.artifact, chosen: choiceId },
      };
    });
  };

  const updateEmailField = (
    projectId: string,
    cardId: string,
    field: "to" | "subject" | "body",
    value: string,
  ) => {
    updateCard(projectId, cardId, (card) => {
      if (card.artifact?.kind !== "email") return card;
      return {
        ...card,
        artifact: { ...card.artifact, [field]: value },
      };
    });
  };

  const updateConfirmNote = (
    projectId: string,
    cardId: string,
    value: string,
  ) => {
    updateCard(projectId, cardId, (card) => ({ ...card, confirmNote: value }));
  };

  const setConfirmAttachment = (
    projectId: string,
    cardId: string,
    attachment: ConfirmAttachment | undefined,
  ) => {
    updateCard(projectId, cardId, (card) => ({
      ...card,
      confirmAttachment: attachment,
    }));
  };

  const submitConfirm = (projectId: string, cardId: string) => {
    updateCard(projectId, cardId, (card) => ({
      ...card,
      state: "done",
      triageNote: undefined,
    }));
  };

  const updateFormField = (
    projectId: string,
    cardId: string,
    key: string,
    value: string,
  ) => {
    updateCard(projectId, cardId, (card) => ({
      ...card,
      formFields: (card.formFields ?? []).map((field) =>
        field.key === key ? { ...field, value } : field,
      ),
      verifyState: card.verifyState === "failed" ? "idle" : card.verifyState,
      verifyMessage: card.verifyState === "failed" ? undefined : card.verifyMessage,
    }));
  };

  const submitForm = (projectId: string, cardId: string) => {
    updateCard(projectId, cardId, (card) => ({
      ...card,
      verifyState: "verifying",
      verifyMessage: undefined,
    }));
    window.setTimeout(() => {
      updateCard(projectId, cardId, (card) => {
        const fields = card.formFields ?? [];
        const empty = fields.find((field) => !field.value.trim());
        if (empty) {
          return {
            ...card,
            verifyState: "failed",
            verifyMessage: `${empty.label} looks empty — paste it in and try again.`,
          };
        }
        return {
          ...card,
          state: "done",
          verifyState: "verified",
          verifyMessage: undefined,
          triageNote: undefined,
        };
      });
    }, 900);
  };

  const moveProjectToDone = (projectId: string) => {
    updateProject(projectId, (project) => {
      const cards = project.cards ?? [];
      const completedCards = cards.map((card) => ({
        ...card,
        state: "done" as CardState,
      }));
      const artifacts: DoneArtifact[] = completedCards.map((card) => ({
        id: uid("art"),
        title: card.title,
        artifact: card.artifact,
      }));
      return {
        ...project,
        status: "done",
        cards: completedCards,
        artifacts,
        chatMessages: [
          ...project.chatMessages,
          {
            id: uid("chat"),
            role: "assistant",
            body: "Filed each card as an artifact in the done archive. Ask follow-ups here.",
            timestamp: nowLabel(),
          },
        ],
        updatedAt: "Just now",
      };
    });
    setMode("done");
    setSelectedId(projectId);
  };

  const renderBody = () => {
    if (selectedProject) {
      if (selectedProject.status === "proposed") {
        return (
          <ProposedDetail
            project={selectedProject}
            chatDraft={chatDrafts[selectedProject.id] || ""}
            setChatDraft={(value) =>
              setChatDrafts((drafts) => ({
                ...drafts,
                [selectedProject.id]: value,
              }))
            }
            onChatSubmit={handleChatSubmit}
            onBack={() => setSelectedId(null)}
            ensureTasks={() => ensureProposedTasks(selectedProject.id)}
            updateTask={updateTask}
            removeTask={removeTask}
            addTask={addTask}
            updateTitle={updateProjectTitle}
            submitProposal={submitProposal}
          />
        );
      }
      if (selectedProject.status === "active") {
        return (
          <ActiveDetail
            project={selectedProject}
            chatDraft={chatDrafts[selectedProject.id] || ""}
            setChatDraft={(value) =>
              setChatDrafts((drafts) => ({
                ...drafts,
                [selectedProject.id]: value,
              }))
            }
            onChatSubmit={handleChatSubmit}
            onBack={() => setSelectedId(null)}
            acceptCard={acceptCard}
            reviseCard={reviseCard}
            setSelectedOption={setSelectedOption}
            setDecisionChoice={setDecisionChoice}
            updateEmailField={updateEmailField}
            updateConfirmNote={updateConfirmNote}
            setConfirmAttachment={setConfirmAttachment}
            submitConfirm={submitConfirm}
            updateFormField={updateFormField}
            submitForm={submitForm}
            moveProjectToDone={moveProjectToDone}
          />
        );
      }
      return (
        <DoneDetail
          project={selectedProject}
          chatDraft={chatDrafts[selectedProject.id] || ""}
          setChatDraft={(value) =>
            setChatDrafts((drafts) => ({
              ...drafts,
              [selectedProject.id]: value,
            }))
          }
          onChatSubmit={handleChatSubmit}
          onBack={() => setSelectedId(null)}
        />
      );
    }

    if (mode === "proposed") {
      return (
        <ProposedList
          projects={filteredProjects}
          newProposal={newProposal}
          setNewProposal={setNewProposal}
          onSubmit={handleNewProposal}
          openProject={(id) => setSelectedId(id)}
        />
      );
    }
    if (mode === "active") {
      return (
        <ActiveList
          projects={filteredProjects}
          openProject={(id) => setSelectedId(id)}
          acceptCard={acceptCard}
          reviseCard={reviseCard}
          setSelectedOption={setSelectedOption}
          setDecisionChoice={setDecisionChoice}
          updateEmailField={updateEmailField}
          updateConfirmNote={updateConfirmNote}
          setConfirmAttachment={setConfirmAttachment}
          submitConfirm={submitConfirm}
          updateFormField={updateFormField}
          submitForm={submitForm}
        />
      );
    }
    return (
      <DoneList
        projects={filteredProjects}
        openProject={(id) => setSelectedId(id)}
      />
    );
  };

  const activeModeIndex = modeItems.findIndex((item) => item.key === mode);

  return (
    <div className="app-shell">
      <header className="top-bar" aria-label="Workspace navigation">
        <div
          className="mode-toggle"
          role="tablist"
          aria-label="Board modes"
          data-active={activeModeIndex}
        >
          <span className="mode-toggle-slider" aria-hidden="true" />
          {modeItems.map((item) => {
            const isActive = item.key === mode;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`mode-toggle-option ${isActive ? "is-active" : ""}`}
                onClick={() => {
                  setMode(item.key);
                  setSelectedId(null);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="workspace">{renderBody()}</main>
    </div>
  );
}

function ProposedList({
  projects,
  newProposal,
  setNewProposal,
  onSubmit,
  openProject,
}: {
  projects: Project[];
  newProposal: string;
  setNewProposal: (value: string) => void;
  onSubmit: () => void;
  openProject: (id: string) => void;
}) {
  return (
    <section className="single-column" aria-label="Proposed work">
      <MarkdownEditor
        value={newProposal}
        onChange={setNewProposal}
        onSubmit={onSubmit}
        placeholder="New job proposal"
      />

      <div className="list-stack scrollable">
        {projects.map((project) => (
          <button
            type="button"
            className="proposal-card"
            key={project.id}
            onClick={() => openProject(project.id)}
          >
            <h4>{project.title}</h4>
            <MarkdownView source={project.summary} />
          </button>
        ))}
        {projects.length === 0 && (
          <div className="empty-state">
            <Inbox size={22} aria-hidden="true" />
            <p>No proposed work yet. Write something above to get started.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ActiveList({
  projects,
  openProject,
  ...handlers
}: {
  projects: Project[];
  openProject: (id: string) => void;
} & JobStackHandlers) {
  const visible = projects.filter((project) =>
    (project.cards ?? []).some((card) => card.state !== "done"),
  );

  return (
    <section className="single-column" aria-label="Active projects">
      <div className="job-stack-list list-stack scrollable">
        {visible.map((project) => (
          <JobStack
            key={project.id}
            project={project}
            variant="list"
            onOpenDetail={() => openProject(project.id)}
            {...handlers}
          />
        ))}
        {visible.length === 0 && (
          <div className="empty-state">
            <Inbox size={22} aria-hidden="true" />
            <p>Nothing active. Submit a proposal to start a stack.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function DoneList({
  projects,
  openProject,
}: {
  projects: Project[];
  openProject: (id: string) => void;
}) {
  return (
    <section className="single-column" aria-label="Done projects">
      <div className="list-stack scrollable">
        {projects.map((project) => (
          <button
            type="button"
            className="job-card"
            key={project.id}
            onClick={() => openProject(project.id)}
          >
            <h4>{project.title}</h4>
            <p>{project.summary}</p>

            <ul className="artifact-list">
              {(project.artifacts ?? []).map((art) => (
                <li key={art.id}>
                  <FileText size={14} aria-hidden="true" />
                  <span>{art.title}</span>
                </li>
              ))}
            </ul>

            <div className="job-card-footer">
              <span>
                {(project.artifacts ?? []).length} artifacts
                {project.decisions && project.decisions.length > 0
                  ? ` · ${project.decisions.length} decisions`
                  : ""}
              </span>
              <span>{project.updatedAt}</span>
            </div>
          </button>
        ))}
        {projects.length === 0 && (
          <div className="empty-state">
            <Archive size={22} aria-hidden="true" />
            <p>Nothing done yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function DetailFrame({
  onBack,
  eyebrow,
  title,
  children,
  rightSlot,
  topMeta,
}: {
  onBack: () => void;
  eyebrow?: string;
  title?: ReactNode;
  children: ReactNode;
  rightSlot: ReactNode;
  topMeta?: ReactNode;
}) {
  const hasTitle = Boolean(eyebrow || title);
  return (
    <section className="detail-frame">
      <div className="detail-topbar">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
        {hasTitle ? (
          <div className="detail-title-block">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h3>{title}</h3>}
          </div>
        ) : (
          <div className="detail-title-block detail-title-block-empty" />
        )}
        {topMeta}
      </div>
      <div className="detail-body">
        <div className="detail-left">{children}</div>
        <aside className="detail-right">{rightSlot}</aside>
      </div>
    </section>
  );
}

function ChatPanel({
  messages,
  draft,
  setDraft,
  onSubmit,
  hint,
}: {
  messages: ChatMessage[];
  draft: string;
  setDraft: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  hint?: string;
}) {
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  return (
    <div className="chat-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Single thread</p>
          <h3>AI chat</h3>
        </div>
        <MessageSquare size={18} aria-hidden="true" />
      </div>

      <div className="chat-thread" ref={threadRef}>
        {messages.length === 0 && (
          <div className="empty-thread">
            <Bot size={22} aria-hidden="true" />
            <p>No messages yet. Ask the agent for a draft or refinement.</p>
          </div>
        )}
        {messages.map((message) => (
          <article className={`chat-message ${message.role}`} key={message.id}>
            <div className="message-avatar" aria-hidden="true">
              {message.role === "assistant" ? <Bot size={16} /> : <Pencil size={16} />}
            </div>
            <div>
              <div className="message-meta">
                <strong>{message.role === "assistant" ? "AI" : "You"}</strong>
                <span>{message.timestamp}</span>
              </div>
              <p>{message.body}</p>
            </div>
          </article>
        ))}
      </div>

      <form className="chat-input" onSubmit={onSubmit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={hint || "Ask for changes, more options, or a final draft..."}
          aria-label="Chat message"
        />
        <button className="send-button" type="submit" title="Send">
          <Send size={16} aria-hidden="true" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

function ProposedDetail({
  project,
  chatDraft,
  setChatDraft,
  onChatSubmit,
  onBack,
  ensureTasks,
  updateTask,
  removeTask,
  addTask,
  updateTitle,
  submitProposal,
}: {
  project: Project;
  chatDraft: string;
  setChatDraft: (value: string) => void;
  onChatSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  ensureTasks: () => void;
  updateTask: (
    projectId: string,
    taskId: string,
    field: "title" | "detail",
    value: string,
  ) => void;
  removeTask: (projectId: string, taskId: string) => void;
  addTask: (projectId: string) => void;
  updateTitle: (projectId: string, title: string) => void;
  submitProposal: (projectId: string) => void;
}) {
  useEffect(() => {
    ensureTasks();
  }, [project.id]);

  const tasks = project.tasks ?? [];

  return (
    <DetailFrame
      onBack={onBack}
      eyebrow=""
      title=""
      rightSlot={
        <ChatPanel
          messages={project.chatMessages}
          draft={chatDraft}
          setDraft={setChatDraft}
          onSubmit={onChatSubmit}
          hint="Ask to add steps, refine details, or shorten the list..."
        />
      }
    >
      <div className="todo-panel">
        <input
          id={`title-${project.id}`}
          aria-label="Project title"
          className="todo-title"
          value={project.title}
          onChange={(event) => updateTitle(project.id, event.target.value)}
          placeholder="Untitled"
        />

        <ul className="todo-list">
          {tasks.map((task, index) => (
            <li className="todo-item" key={task.id}>
              <span className="todo-bullet" aria-hidden="true" />
              <div className="todo-fields">
                <input
                  className="todo-item-title"
                  value={task.title}
                  onChange={(event) =>
                    updateTask(project.id, task.id, "title", event.target.value)
                  }
                  aria-label={`Task ${index + 1} title`}
                  placeholder="What needs doing"
                />
                <input
                  className="todo-item-detail"
                  value={task.detail}
                  onChange={(event) =>
                    updateTask(project.id, task.id, "detail", event.target.value)
                  }
                  aria-label={`Task ${index + 1} note`}
                  placeholder="Add note"
                />
              </div>
              <button
                className="todo-remove"
                type="button"
                onClick={() => removeTask(project.id, task.id)}
                title="Remove task"
                aria-label={`Remove ${task.title}`}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <button
          className="todo-add"
          type="button"
          onClick={() => addTask(project.id)}
        >
          <Plus size={15} aria-hidden="true" />
          Add task
        </button>

        <div className="todo-footer">
          <button
            className="primary-button"
            type="button"
            onClick={() => submitProposal(project.id)}
            disabled={!tasks.length}
          >
            <Check size={16} aria-hidden="true" />
            Submit todo list
          </button>
        </div>
      </div>
    </DetailFrame>
  );
}

interface JobStackHandlers {
  acceptCard: (projectId: string, cardId: string) => void;
  reviseCard: (projectId: string, cardId: string) => void;
  setSelectedOption: (projectId: string, cardId: string, optionId: string) => void;
  setDecisionChoice: (projectId: string, cardId: string, choiceId: string) => void;
  updateEmailField: (
    projectId: string,
    cardId: string,
    field: "to" | "subject" | "body",
    value: string,
  ) => void;
  updateConfirmNote: (projectId: string, cardId: string, value: string) => void;
  setConfirmAttachment: (
    projectId: string,
    cardId: string,
    attachment: ConfirmAttachment | undefined,
  ) => void;
  submitConfirm: (projectId: string, cardId: string) => void;
  updateFormField: (
    projectId: string,
    cardId: string,
    key: string,
    value: string,
  ) => void;
  submitForm: (projectId: string, cardId: string) => void;
}

function JobStack({
  project,
  variant,
  onOpenDetail,
  ...handlers
}: {
  project: Project;
  variant: "list" | "detail";
  onOpenDetail?: () => void;
} & JobStackHandlers) {
  const liveCards = (project.cards ?? []).filter((card) => card.state !== "done");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [project.id]);

  // Clamp activeIndex if a card was accepted and the list shrank.
  const safeIndex = Math.min(activeIndex, Math.max(liveCards.length - 1, 0));

  useEffect(() => {
    if (variant !== "detail") return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, liveCards.length - 1));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [liveCards.length, variant]);

  const stripeStyle = (offsetFromCurrent: number, side: "above" | "below"): CSSProperties => {
    // First neighbor: full strip. Second: smaller, slightly indented. Third: barely peeking. >3 hidden.
    const distance = Math.abs(offsetFromCurrent);
    if (distance > 3) return { display: "none" };
    const inset = (distance - 1) * 8; // each further strip is 8px narrower on each side
    const opacity = distance === 1 ? 1 : distance === 2 ? 0.7 : 0.4;
    return {
      marginLeft: `${inset}px`,
      marginRight: `${inset}px`,
      opacity,
      zIndex: 10 - distance,
      ...(side === "above" ? { marginBottom: -8 } : { marginTop: -8 }),
    };
  };

  const goTo = (index: number) =>
    setActiveIndex(Math.max(0, Math.min(index, liveCards.length - 1)));

  return (
    <div className={`job-stack variant-${variant}`}>
      <header className="deck-header">
        {variant === "list" ? (
          <h3 className="deck-title-list">{project.title}</h3>
        ) : (
          <>
            <h2 className="deck-title">{project.title}</h2>
            {project.summary && (
              <p className="deck-summary">{project.summary}</p>
            )}
          </>
        )}
      </header>

      {liveCards.length > 0 ? (
        <div className="deck">
          {liveCards.slice(0, safeIndex).reverse().map((card, i) => {
            const distance = i + 1; // 1 = closest above
            return (
              <button
                key={card.id}
                type="button"
                className={`deck-stripe deck-stripe-above distance-${Math.min(distance, 3)}`}
                style={stripeStyle(-distance, "above")}
                onClick={(event) => {
                  event.stopPropagation();
                  goTo(safeIndex - distance);
                }}
                aria-label={`Previous card: ${card.title}`}
              >
                <span className="card-eyebrow">{kindLabel[card.kind ?? "decide"]}</span>
                <span className="deck-stripe-title">{card.title}</span>
              </button>
            );
          })}

          <div className="deck-current">
            <DeckCard
              card={liveCards[safeIndex]}
              projectId={project.id}
              onAccept={handlers.acceptCard}
              onRevise={handlers.reviseCard}
              onSelectOption={handlers.setSelectedOption}
              onChoose={handlers.setDecisionChoice}
              onEmailChange={handlers.updateEmailField}
              onConfirmNote={handlers.updateConfirmNote}
              onConfirmAttachment={handlers.setConfirmAttachment}
              onConfirmSubmit={handlers.submitConfirm}
              onFormField={handlers.updateFormField}
              onFormSubmit={handlers.submitForm}
            />
            {variant === "list" && onOpenDetail && (
              <button
                type="button"
                className="deck-open"
                aria-label="Open in detail view"
                title="Open in detail view"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDetail();
                }}
              >
                <ExternalLinkIcon />
              </button>
            )}
          </div>

          {liveCards.slice(safeIndex + 1).map((card, i) => {
            const distance = i + 1; // 1 = closest below
            return (
              <button
                key={card.id}
                type="button"
                className={`deck-stripe deck-stripe-below distance-${Math.min(distance, 3)}`}
                style={stripeStyle(distance, "below")}
                onClick={(event) => {
                  event.stopPropagation();
                  goTo(safeIndex + distance);
                }}
                aria-label={`Next card: ${card.title}`}
              >
                <span className="card-eyebrow">{kindLabel[card.kind ?? "decide"]}</span>
                <span className="deck-stripe-title">{card.title}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="empty-state subdued">
          <CheckCircle2 size={20} aria-hidden="true" />
          <p>All caught up — nothing waiting.</p>
        </div>
      )}

    </div>
  );
}

function ActiveDetail({
  project,
  chatDraft,
  setChatDraft,
  onChatSubmit,
  onBack,
  moveProjectToDone,
  ...handlers
}: {
  project: Project;
  chatDraft: string;
  setChatDraft: (value: string) => void;
  onChatSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  moveProjectToDone: (projectId: string) => void;
} & JobStackHandlers) {
  const cards = project.cards ?? [];
  const liveCards = cards.filter((card) => card.state !== "done");
  const doneCards = cards.filter((card) => card.state === "done");
  const canFinish = liveCards.length === 0 && cards.length > 0;

  const stackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = stackRef.current;
    if (!node) return;
    node.scrollIntoView({ block: "start" });
  }, [project.id]);

  return (
    <section className="detail-frame deck-frame">
      <div className="detail-topbar">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
        <div className="detail-title-block deck-title-block" />
        <button
          className="secondary-button"
          type="button"
          onClick={() => moveProjectToDone(project.id)}
          disabled={!canFinish}
        >
          <Archive size={16} aria-hidden="true" />
          Move to done
        </button>
      </div>

      <div className="detail-body">
        <div className="detail-left deck-left">
          {doneCards.length > 0 && (
            <section className="completed-history" aria-label="Completed cards">
              <p className="eyebrow completed-history-label">
                Completed · {doneCards.length}
              </p>
              <ul className="completed-history-list">
                {doneCards.map((card) => (
                  <CompletedCardRow key={card.id} card={card} />
                ))}
              </ul>
            </section>
          )}
          <div ref={stackRef} className="deck-anchor">
            <JobStack project={project} variant="detail" {...handlers} />
          </div>
        </div>
        <aside className="detail-right">
          <ChatPanel
            messages={project.chatMessages}
            draft={chatDraft}
            setDraft={setChatDraft}
            onSubmit={onChatSubmit}
            hint="Ask for more options, edits, or a final accept summary..."
          />
        </aside>
      </div>
    </section>
  );
}

function CompletedCardRow({ card }: { card: ActionCard }) {
  const [open, setOpen] = useState(false);
  const hasArtifact = Boolean(card.artifact);

  return (
    <li className={`completed-card-row ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="completed-card-head"
        onClick={() => hasArtifact && setOpen((value) => !value)}
        disabled={!hasArtifact}
      >
        <span className="completed-card-dot" aria-hidden="true">
          <Check size={11} />
        </span>
        <span className="completed-card-title">{card.title}</span>
        <span className="completed-card-tag">Done</span>
      </button>
      {open && card.artifact && (
        <div className="completed-card-body">
          <ArtifactView artifact={card.artifact} readOnly />
        </div>
      )}
    </li>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3h4v4" />
      <path d="m13 3-6 6" />
      <path d="M11 9.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2.5" />
    </svg>
  );
}

const kindLabel: Record<"decide" | "confirm" | "form", string> = {
  decide: "Decision",
  confirm: "Confirm offline",
  form: "Form input",
};

function DeckCard({
  card,
  projectId,
  onAccept,
  onRevise,
  onSelectOption,
  onChoose,
  onEmailChange,
  onConfirmNote,
  onConfirmAttachment,
  onConfirmSubmit,
  onFormField,
  onFormSubmit,
}: {
  card: ActionCard;
  projectId: string;
  onAccept: (projectId: string, cardId: string) => void;
  onRevise: (projectId: string, cardId: string) => void;
  onSelectOption: (projectId: string, cardId: string, optionId: string) => void;
  onChoose: (projectId: string, cardId: string, choiceId: string) => void;
  onEmailChange: (
    projectId: string,
    cardId: string,
    field: "to" | "subject" | "body",
    value: string,
  ) => void;
  onConfirmNote: (projectId: string, cardId: string, value: string) => void;
  onConfirmAttachment: (
    projectId: string,
    cardId: string,
    attachment: ConfirmAttachment | undefined,
  ) => void;
  onConfirmSubmit: (projectId: string, cardId: string) => void;
  onFormField: (
    projectId: string,
    cardId: string,
    key: string,
    value: string,
  ) => void;
  onFormSubmit: (projectId: string, cardId: string) => void;
}) {
  const kind: "decide" | "confirm" | "form" = card.kind ?? "decide";
  const isDone = card.state === "done";

  return (
    <article className={`deck-card ${card.state} kind-${kind}`}>
      <p className="card-eyebrow">{kindLabel[kind]}</p>
      <h3 className="card-title">{card.title}</h3>
      {card.triageNote && !isDone && (
        <p className="card-summary">{card.triageNote}</p>
      )}

      {card.artifact && (
        <div className="card-body">
          <ArtifactView
            artifact={card.artifact}
            onSelectOption={(optionId) =>
              onSelectOption(projectId, card.id, optionId)
            }
            onChoose={(choiceId) => onChoose(projectId, card.id, choiceId)}
            onEmailChange={(field, value) =>
              onEmailChange(projectId, card.id, field, value)
            }
            readOnly={isDone}
          />
        </div>
      )}

      {!isDone && (
        <div className="card-resolution">
          {kind === "decide" && (
            <div className="card-resolution-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => onRevise(projectId, card.id)}
              >
                <Pencil size={15} aria-hidden="true" />
                Ask to revise
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => onAccept(projectId, card.id)}
              >
                <CheckCircle2 size={15} aria-hidden="true" />
                Accept
              </button>
            </div>
          )}

          {kind === "confirm" && (
            <ConfirmResolution
              card={card}
              onNote={(value) => onConfirmNote(projectId, card.id, value)}
              onAttachment={(attachment) =>
                onConfirmAttachment(projectId, card.id, attachment)
              }
              onSubmit={() => onConfirmSubmit(projectId, card.id)}
              onRevise={() => onRevise(projectId, card.id)}
            />
          )}

          {kind === "form" && (
            <FormResolution
              card={card}
              onField={(key, value) => onFormField(projectId, card.id, key, value)}
              onSubmit={() => onFormSubmit(projectId, card.id)}
            />
          )}
        </div>
      )}

      {isDone && (
        <div className="card-resolution card-resolution-done">
          <span className="resolution-done-tag">
            <CheckCircle2 size={14} aria-hidden="true" />
            {kind === "form" ? "Verified" : "Accepted"}
          </span>
        </div>
      )}
    </article>
  );
}

function ConfirmResolution({
  card,
  onNote,
  onAttachment,
  onSubmit,
  onRevise,
}: {
  card: ActionCard;
  onNote: (value: string) => void;
  onAttachment: (attachment: ConfirmAttachment | undefined) => void;
  onSubmit: () => void;
  onRevise: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onAttachment({ name: file.name, dataUrl: String(reader.result ?? "") });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="confirm-form">
      <textarea
        className="confirm-note"
        value={card.confirmNote ?? ""}
        onChange={(event) => onNote(event.target.value)}
        placeholder="What did you do? (optional note)"
        aria-label="Confirmation note"
      />

      <div className="confirm-row">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="confirm-file-input"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        {card.confirmAttachment ? (
          <span className="confirm-attachment-chip">
            <FileText size={13} aria-hidden="true" />
            <span>{card.confirmAttachment.name}</span>
            <button
              type="button"
              onClick={() => {
                onAttachment(undefined);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              aria-label="Remove attachment"
            >
              ×
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="confirm-attach-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus size={13} aria-hidden="true" />
            Attach screenshot
          </button>
        )}
      </div>

      <div className="card-resolution-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={onRevise}
        >
          <Pencil size={15} aria-hidden="true" />
          Ask to revise
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={onSubmit}
        >
          <CheckCircle2 size={15} aria-hidden="true" />
          I've done it
        </button>
      </div>
    </div>
  );
}

function FormResolution({
  card,
  onField,
  onSubmit,
}: {
  card: ActionCard;
  onField: (key: string, value: string) => void;
  onSubmit: () => void;
}) {
  const fields = card.formFields ?? [];
  const verifying = card.verifyState === "verifying";
  const failed = card.verifyState === "failed";

  return (
    <div className="form-resolution">
      <div className="form-fields">
        {fields.map((field) => (
          <label key={field.key} className="form-field">
            <span>{field.label}</span>
            <input
              type={field.type}
              value={field.value}
              placeholder={field.placeholder}
              onChange={(event) => onField(field.key, event.target.value)}
              disabled={verifying}
              autoComplete="off"
            />
          </label>
        ))}
      </div>

      {failed && card.verifyMessage && (
        <p className="form-verify-error" role="alert">
          {card.verifyMessage}
        </p>
      )}

      <div className="card-resolution-actions">
        <button
          className="primary-button"
          type="button"
          onClick={onSubmit}
          disabled={verifying}
        >
          {verifying ? (
            <>
              <span className="form-spinner" aria-hidden="true" />
              Verifying…
            </>
          ) : (
            <>
              <CheckCircle2 size={15} aria-hidden="true" />
              Submit & verify
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function DoneDetail({
  project,
  chatDraft,
  setChatDraft,
  onChatSubmit,
  onBack,
}: {
  project: Project;
  chatDraft: string;
  setChatDraft: (value: string) => void;
  onChatSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
  const artifacts = project.artifacts ?? [];
  const decisions = project.decisions ?? [];
  const [openId, setOpenId] = useState<string | null>(
    artifacts[0]?.id ?? null,
  );

  return (
    <DetailFrame
      onBack={onBack}
      eyebrow="Completed"
      title={project.title}
      rightSlot={
        <ChatPanel
          messages={project.chatMessages}
          draft={chatDraft}
          setDraft={setChatDraft}
          onSubmit={onChatSubmit}
          hint="Ask why a decision landed where it did, or pull a card forward..."
        />
      }
    >
      <p className="job-summary">{project.summary}</p>

      {decisions.length > 0 && (
        <div className="decision-strip">
          <span className="eyebrow">Key decisions</span>
          <ul>
            {decisions.map((decision, index) => (
              <li key={index}>{decision}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="done-artifact-list">
        {artifacts.map((art) => {
          const isOpen = openId === art.id;
          return (
            <article
              key={art.id}
              className={`done-artifact-card ${isOpen ? "is-open" : ""}`}
            >
              <button
                type="button"
                className="done-artifact-head"
                onClick={() => setOpenId(isOpen ? null : art.id)}
              >
                <FileText size={15} aria-hidden="true" />
                <strong>{art.title}</strong>
              </button>
              {isOpen && art.artifact && (
                <div className="done-artifact-body">
                  <ArtifactView artifact={art.artifact} readOnly />
                </div>
              )}
            </article>
          );
        })}
        {artifacts.length === 0 && (
          <div className="empty-state subdued">
            <p>No artifacts in this archive.</p>
          </div>
        )}
      </div>
    </DetailFrame>
  );
}

/* ---------- Markdown editor + renderer (barebones) ---------- */

function MarkdownEditor({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editing && taRef.current) {
      const el = taRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [editing]);

  // Auto-grow textarea so it never shows a scrollbar — height tracks content.
  useEffect(() => {
    if (!editing || !taRef.current) return;
    const el = taRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, editing]);

  const focusAndSelect = (start: number, end: number) => {
    requestAnimationFrame(() => {
      const el = taRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
    });
  };

  const wrapSelection = (wrapper: string) => {
    const el = taRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const w = wrapper;
    const wl = w.length;

    const before = value.slice(Math.max(0, start - wl), start);
    const after = value.slice(end, end + wl);
    if (before === w && after === w && selected.length > 0) {
      const next = value.slice(0, start - wl) + selected + value.slice(end + wl);
      onChange(next);
      focusAndSelect(start - wl, end - wl);
      return;
    }

    if (selected.length === 0) {
      const next = value.slice(0, start) + w + w + value.slice(end);
      onChange(next);
      focusAndSelect(start + wl, start + wl);
      return;
    }

    const next = value.slice(0, start) + w + selected + w + value.slice(end);
    onChange(next);
    focusAndSelect(start + wl, end + wl);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    const meta = event.metaKey || event.ctrlKey;
    if (meta && event.key === "Enter") {
      event.preventDefault();
      onSubmit();
      setEditing(false);
      return;
    }
    if (meta && event.key.toLowerCase() === "b") {
      event.preventDefault();
      wrapSelection("**");
      return;
    }
    if (meta && event.key.toLowerCase() === "i") {
      event.preventDefault();
      wrapSelection("*");
      return;
    }
  };

  // Keep textarea focused when toolbar buttons are clicked.
  const preventBlur = (event: ReactMouseEvent) => {
    event.preventDefault();
  };

  // Exit edit mode when focus leaves the wrapper entirely.
  const handleBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && wrapperRef.current && wrapperRef.current.contains(next)) {
      return;
    }
    setEditing(false);
  };

  const submitButton = (
    <button
      type="button"
      title="Submit (⌘⏎)"
      onMouseDown={preventBlur}
      onClick={(event) => {
        event.stopPropagation();
        onSubmit();
        setEditing(false);
      }}
      className="md-submit"
      disabled={!value.trim()}
      aria-label="Submit"
    >
      <Send size={14} aria-hidden="true" />
    </button>
  );

  if (!editing) {
    const isEmpty = value.trim() === "";
    return (
      <div
        className={`md-editor md-preview ${isEmpty ? "is-empty" : ""}`}
        onClick={() => setEditing(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setEditing(true);
          }
        }}
      >
        {isEmpty ? (
          <p className="md-placeholder">{placeholder}</p>
        ) : (
          <MarkdownView source={value} />
        )}
        {submitButton}
      </div>
    );
  }

  return (
    <div className="md-editor md-editing" ref={wrapperRef} onBlur={handleBlur}>
      <textarea
        ref={taRef}
        className="md-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="New job proposal"
      />
      {submitButton}
    </div>
  );
}

function renderInline(text: string, keyBase: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  let cursor = 0;
  let count = 0;
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > cursor) {
      tokens.push(text.slice(cursor, match.index));
    }
    if (match[2] !== undefined) {
      tokens.push(<strong key={`${keyBase}-b-${count++}`}>{match[2]}</strong>);
    } else if (match[4] !== undefined) {
      tokens.push(<em key={`${keyBase}-i-${count++}`}>{match[4]}</em>);
    } else if (match[6] !== undefined) {
      tokens.push(<em key={`${keyBase}-u-${count++}`}>{match[6]}</em>);
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    tokens.push(text.slice(cursor));
  }
  return tokens;
}

function MarkdownView({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(<h1 key={key++}>{renderInline(line.slice(2), `h1-${key}`)}</h1>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(<h2 key={key++}>{renderInline(line.slice(3), `h2-${key}`)}</h2>);
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={key++}>{renderInline(line.slice(4), `h3-${key}`)}</h3>);
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(
          <li key={`${key}-${items.length}`}>
            {renderInline(lines[i].slice(2), `li-${key}-${items.length}`)}
          </li>,
        );
        i++;
      }
      blocks.push(<ul key={key++}>{items}</ul>);
      continue;
    }
    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        buf.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <blockquote key={key++}>{renderInline(buf.join(" "), `q-${key}`)}</blockquote>,
      );
      continue;
    }
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("# ") &&
      !lines[i].startsWith("## ") &&
      !lines[i].startsWith("### ") &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith("> ")
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(<p key={key++}>{renderInline(buf.join(" "), `p-${key}`)}</p>);
  }

  return <div className="md-view">{blocks}</div>;
}
