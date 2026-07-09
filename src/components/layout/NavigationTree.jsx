import { useProject } from "../../context/ProjectContext";
import { useViewer } from "../../context/ViewerContext";

function NavigationTree() {
  const { project } = useProject();
  const { selectedPiece, setSelectedPiece, setIsolateMode } = useViewer();

  function handleSelectPiece(piece) {
    setSelectedPiece(piece);
    setIsolateMode("none");
  }

  return (
    <div className="navigation-tree">
      <h3>📁 Projeto</h3>

      {project.modules.map((module) => (
        <div key={module.id} className="tree-module">
          <div className="tree-module-title">📦 {module.name}</div>

          <div className="tree-pieces">
            {module.pieces.map((piece) => (
              <button
                key={piece.id}
                className={
                  selectedPiece?.id === piece.id
                    ? "tree-piece selected"
                    : "tree-piece"
                }
                onClick={() => handleSelectPiece(piece)}
              >
                📄 {piece.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default NavigationTree;