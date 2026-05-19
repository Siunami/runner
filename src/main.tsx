import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import ActionCardDetail from "./ActionCardDetail";
import ActionCards from "./ActionCards";
import AgentTodolist from "./AgentTodolist";
import App from "./App";
import AutomateSilhouettes from "./AutomateSilhouettes";
import DesignSystem from "./design-system/DesignSystem";
import Home from "./Home";
import Outliner from "./Outliner";
import Runner from "./Runner";
import RunnerFlow from "./RunnerFlow";
import RunnerOS from "./RunnerOS";
import RunnerStyle from "./RunnerStyle";
import RunnerSubscriptions from "./RunnerSubscriptions";
import ScratchpadToCards from "./ScratchpadToCards";
import SplitView from "./SplitView";
import TabView from "./TabView";
import TriagedCards from "./TriagedCards";
import TriageFlow from "./TriageFlow";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/action-board" element={<App />} />
        <Route path="/split" element={<SplitView />} />
        <Route path="/tab" element={<TabView />} />
        <Route path="/dashboard-todolist" element={<Runner />} />
        <Route path="/agent-todolist" element={<AgentTodolist />} />
        <Route path="/dashboard-subscriptions" element={<RunnerSubscriptions />} />
        <Route path="/runner-style" element={<RunnerStyle />} />
        <Route path="/runner-os" element={<RunnerOS />} />
        <Route path="/action-cards" element={<ActionCards />} />
        <Route path="/action-card-detail" element={<ActionCardDetail />} />
        <Route path="/triaged-cards" element={<TriagedCards />} />
        <Route path="/triage-flow" element={<TriageFlow />} />
        <Route path="/scratchpad" element={<Outliner />} />
        <Route path="/scratchpad-to-cards" element={<ScratchpadToCards />} />
        <Route path="/automate-silhouettes" element={<AutomateSilhouettes />} />
        <Route path="/runner-flow" element={<RunnerFlow />} />
        <Route path="/design-system" element={<DesignSystem />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
