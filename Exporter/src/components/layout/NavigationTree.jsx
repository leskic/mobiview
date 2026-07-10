import { useProject } from "../../context/ProjectContext";
import { useViewer } from "../../context/ViewerContext";

function getModules(project) {
  if (!project) return [];

  if (Array.isArray(project.modules)) {
    return project.modules;
  }

  if (Array.isArray(project.pieces)) {
    const grouped = {};

    project.pieces.forEach((piece) => {
      const moduleId = piece.moduleId || "sem_modulo";

      if (!grouped[moduleId]) {
        grouped[moduleId] = {
          id: moduleId,
          name: `Módulo ${moduleId}`,
          pieces: [],
        };
      }

      grouped[moduleId].pieces.push(piece);
    });

    return Object.values(grouped);
  }

  return [];
}

function NavigationTree() {
  const { project } = useProject();
  const { selectedPiece, setSelectedPiece, setIsolateMode } = useViewer();

  const modules = getModules(project);

  function handleSelectPiece(piece) {
    setSelectedPiece(piece);
    setIsolateMode("none");
  }

  return (
    <div className="navigation-tree">
      <h3>📁 Projeto</h3>

      {modules.map((module) => (
        <div key={module.id} className="tree-module">
          <div className="tree-module-title">📦 {module.name}</div>

          <div className="tree-pieces">
            {module.pieces.map((piece) => (
              <button
                key={piece.uuid || piece.id}
                className={
                  selectedPiece?.uuid === piece.uuid || selectedPiece?.id === piece.id
                    ? "tree-piece selected"
                    : "tree-piece"
                }
                onClick={() => handleSelectPiece(piece)}
              >
                📄 {piece.name || piece.id}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default NavigationTree;