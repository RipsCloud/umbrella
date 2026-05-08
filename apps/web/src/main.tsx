import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import * as React from "react";

import { router } from "./router";
import "./i18n";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

createRoot(rootEl).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
