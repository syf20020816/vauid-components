import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Page } from "../components/layout/__tests__/layout";
import "./global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
