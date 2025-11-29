import React from "react";
import { createRoot } from "react-dom/client";
import Popup from "./Popup";
import "./popup.css";

console.log("Popup script loaded");

const container = document.getElementById("root");
if (container) {
  console.log("Root container found, initializing React...");
  try {
    const root = createRoot(container);
    console.log("React root created, rendering Popup component...");
    root.render(<Popup />);
    console.log("Popup component rendered successfully");
  } catch (error) {
    console.error("Error rendering popup:", error);
    container.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: red;">
        <h2>Error loading extension</h2>
        <p><strong>Error:</strong> ${
          error instanceof Error ? error.message : String(error)
        }</p>
        <p>Check the console (right-click → Inspect) for more details.</p>
        <pre style="background: #f0f0f0; padding: 10px; overflow: auto;">${
          error instanceof Error ? error.stack : String(error)
        }</pre>
      </div>
    `;
  }
} else {
  console.error("Root container (#root) not found!");
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; color: red;">
      <h2>Error: Root container not found</h2>
      <p>The #root element is missing from popup.html</p>
    </div>
  `;
}
