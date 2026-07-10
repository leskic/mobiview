import NavigationTree from "./NavigationTree";
import { useProject } from "../../context/ProjectContext";
import { useViewer } from "../../context/ViewerContext";

function Sidebar() {
  const { project } = useProject();

  const {
    selectedPiece,
    setIsolateMode,
  } = useViewer();

  function findModuleName(piece) {
    if (piece.source === "glb") return "Modelo GLB";

    const module = project.modules.find(
      (module) => module.id === piece.moduleId
    );

    return module?.name || piece.moduleId || "--";
  }

  function findMaterialName(piece) {
    if (piece.source === "glb") {
      return piece.materialName || "--";
    }

    const material = project.materials.find(
      (material) => material.id === piece.materialId
    );

    return material?.name || piece.materialId || "--";
  }

  function getDimensions(piece) {
    if (!piece.dimensions) return "--";

    return `${piece.dimensions.width} × ${piece.dimensions.height} × ${piece.dimensions.thickness} mm`;
  }

  return (
    <aside className="sidebar">
      <NavigationTree />

      <div className="piece-info">
        <h3>MANUAL 3D</h3>

        {!selectedPiece ? (
          <p>Selecione uma peça.</p>
        ) : (
          <>
            <div className="property">
              <label>Nome</label>
              <strong>{selectedPiece.name}</strong>
            </div>

            <div className="property">
              <label>Código</label>
              <strong>{selectedPiece.id}</strong>
            </div>

            <div className="property">
              <label>Tipo</label>
              <strong>{selectedPiece.type}</strong>
            </div>

            <div className="property">
              <label>Material</label>
              <strong>{findMaterialName(selectedPiece)}</strong>
            </div>

            <div className="property">
              <label>Dimensão</label>
              <strong>{getDimensions(selectedPiece)}</strong>
            </div>

            <div className="property">
              <label>Módulo</label>
              <strong>{findModuleName(selectedPiece)}</strong>
            </div>

            <div className="sidebar-actions">
              <button onClick={() => setIsolateMode("none")}>
                👁 Mostrar Tudo
              </button>

              <button onClick={() => setIsolateMode("module")}>
                📦 Mostrar Módulo
              </button>

              <button onClick={() => setIsolateMode("piece")}>
                🔍 Mostrar Peça
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;