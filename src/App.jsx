import { useRef } from "react";
import "./App.css";

import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Viewer from "./components/viewer/Viewer";
import Toolbar from "./components/layout/Toolbar";

function App() {
  const fileInputRef = useRef(null);

  function handleOpenProject() {
    fileInputRef.current.click();
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    URL.createObjectURL(file);
  }

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <Header onOpenProject={handleOpenProject} />

      <Sidebar />

      <Viewer />

      <Toolbar />
    </div>
  );
}

export default App;