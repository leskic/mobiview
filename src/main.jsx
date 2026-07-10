import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import "./index.css";

import { ProjectProvider } from "./context/ProjectContext";
import { ViewerProvider } from "./context/ViewerContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProjectProvider>
      <ViewerProvider>
        <App />
      </ViewerProvider>
    </ProjectProvider>
  </React.StrictMode>
);