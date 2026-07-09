import { useRef, useState } from "react";
import "./App.css";

import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Viewer from "./components/viewer/Viewer";
import Toolbar from "./components/layout/Toolbar";

function App() {
  const fileInputRef = useRef(null);

  const [modelUrl, setModelUrl] = useState(null);
  const [explodeAmount, setExplodeAmount] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState(null);

  function handleOpenProject() {
    fileInputRef.current.click();
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    setModelUrl(URL.createObjectURL(file));
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

      <Header
  onOpenProject={handleOpenProject}
  onSelectPiece={setSelectedPiece}
/>

      <Sidebar
        selectedPiece={selectedPiece}
        onSelectPiece={setSelectedPiece}
      />

      <Viewer
        modelUrl={modelUrl}
        explodeAmount={explodeAmount}
        selectedPiece={selectedPiece}
        onSelectPiece={setSelectedPiece}
      />

      <Toolbar
        explodeAmount={explodeAmount}
        onExplodeChange={setExplodeAmount}
      />
    </div>
  );
}

export default App;