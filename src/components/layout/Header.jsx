import { useState } from "react";
import SearchEngine from "../../engine/SearchEngine";
import demoProject from "../../data/demoProject";

function Header({ onOpenProject, onSelectPiece }) {
  const [search, setSearch] = useState("");

  function handleSearch(event) {
    const value = event.target.value;

    setSearch(value);

    if (!value) {
      onSelectPiece(null);
      return;
    }

    const engine = new SearchEngine(demoProject);

    const result = engine.search(value);

    if (
      result &&
      result.type === "piece"
    ) {
      onSelectPiece(result.object);
    }
  }

  return (
    <header className="header">

      <button onClick={onOpenProject}>
        📁 Abrir Projeto
      </button>

      <input
        type="text"
        placeholder="🔍 Buscar peça..."
        value={search}
        onChange={handleSearch}
      />

      <h2>
        MobiView
      </h2>

    </header>
  );
}

export default Header;