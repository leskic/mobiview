import demoProject from "../../data/demoProject";
import NavigationTree from "./NavigationTree";

function findModuleName(piece) {
  const module = demoProject.modules.find(
    (module) => module.id === piece.moduleId
  );

  return module?.name || piece.moduleId || "--";
}

function findMaterialName(piece) {
  const material = demoProject.materials.find(
    (material) => material.id === piece.materialId
  );

  return material?.name || piece.materialId || "--";
}

function Sidebar({ selectedPiece, onSelectPiece }) {
  return (
    <aside className="sidebar">
      <NavigationTree
        selectedPiece={selectedPiece}
        onSelectPiece={onSelectPiece}
      />

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
              <strong>
                {selectedPiece.dimensions?.width} ×{" "}
                {selectedPiece.dimensions?.height} ×{" "}
                {selectedPiece.dimensions?.thickness} mm
              </strong>
            </div>

            <div className="property">
              <label>Módulo</label>
              <strong>{findModuleName(selectedPiece)}</strong>
            </div>

            <div className="sidebar-actions">
              <button>👁 Isolar</button>
              <button>💥 Explodir</button>
              <button>📷 Vista</button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;