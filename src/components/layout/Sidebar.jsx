function Sidebar({ selectedPiece }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h2>MobiView</h2>

        <button>📁 Projetos</button>
        <button>🧱 Módulos</button>
        <button>🎨 Materiais</button>
        <button>📏 Medidas</button>
        <button>⚙ Configurações</button>
      </div>

      <div className="piece-info">
        <h3>MANUAL 3D</h3>

        {!selectedPiece ? (
          <div className="empty-selection">
            <p>Selecione uma peça no modelo.</p>
          </div>
        ) : (
          <>
            <div className="property">
              <span>Nome</span>
              <strong>{selectedPiece.name}</strong>
            </div>

            <div className="property">
              <span>Código</span>
              <strong>{selectedPiece.id}</strong>
            </div>

            <div className="property">
              <span>Tipo</span>
              <strong>{selectedPiece.type}</strong>
            </div>

            <div className="property">
              <span>Material</span>
              <strong>{selectedPiece.materialId || "--"}</strong>
            </div>

            <div className="property">
              <span>Dimensões</span>
              <strong>
                {selectedPiece.dimensions?.height} ×{" "}
                {selectedPiece.dimensions?.width} ×{" "}
                {selectedPiece.dimensions?.thickness} mm
              </strong>
            </div>

            <div className="property">
              <span>Módulo</span>
              <strong>{selectedPiece.moduleId}</strong>
            </div>

            <div className="sidebar-actions">
              <button>👁 Isolar</button>
              <button>💥 Explodir</button>
              <button>📷 Gerar Vista</button>
              <button>📏 Medidas</button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;