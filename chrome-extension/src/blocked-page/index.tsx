import React from "react";
import { createRoot } from "react-dom/client";
import BlockedPage from "./BlockedPage";
import "./blocked.css";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<BlockedPage />);
}
