import { useState } from "react";

import SearchEngine from "../../engine/SearchEngine";
import { useProject } from "../../context/ProjectContext";
import { useViewer } from "../../context/ViewerContext";

function Header({ onOpenProject }) {
  const { project } = useProject();
  const { setSelectedPiece } = useViewer();

  const [search, setSearch] = useState("");

  function handleSearch(event) {
    const value = event.target.value;
    setSearch(value);

    if (!value) {
      setSelectedPiece(null);
      return;
    }

    const engine = new SearchEngine(project);
    const result = engine.search(value);

    if (result?.type === "piece") {
      setSelectedPiece(result.object);
    }
  }

  return (
    <header className="header">
      <button onClick={onOpenProject}>📁 Abrir Projeto</button>

      <input
        type="text"
        placeholder="🔍 Buscar peça..."
        value={search}
        onChange={handleSearch}
      />

      <h2>MobiView</h2>
    </header>
  );
}

export default Header;