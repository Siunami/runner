import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import Home from "./Home";
import SplitView from "./SplitView";
import TabView from "./TabView";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/action-board" element={<App />} />
        <Route path="/split" element={<SplitView />} />
        <Route path="/tab" element={<TabView />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
