/*
 * Copyright (c) 2026 Hardik Nishad (@hardikxro-commits)
 */

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

console.log(
  "%c\ud83c\udf6c Ramen style loaded %c\u2014 Hokage level analysis incoming!",
  "color: #ff0064; font-size: 14px; font-weight: bold;",
  "color: #a78bfa; font-size: 12px;"
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
