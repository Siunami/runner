import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import ActionCards from "./ActionCards";
import App from "./App";
import Home from "./Home";
import Runner from "./Runner";
import RunnerOS from "./RunnerOS";
import RunnerStyle from "./RunnerStyle";
import RunnerSubscriptions from "./RunnerSubscriptions";
import SplitView from "./SplitView";
import TabView from "./TabView";
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
        <Route path="/dashboard-subscriptions" element={<RunnerSubscriptions />} />
        <Route path="/runner-style" element={<RunnerStyle />} />
        <Route path="/runner-os" element={<RunnerOS />} />
        <Route path="/action-cards" element={<ActionCards />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
