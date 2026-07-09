function Sidebar({ selectedPiece }) {
  return (
    <aside className="sidebar">
      <button>📁 Projetos</button>
      <button>🧱 Componentes</button>
      <button>🎨 Materiais</button>
      <button>📏 Medidas</button>
      <button>⚙ Configurações</button>

      <div className="piece-info">
        <h3>Peça selecionada</h3>

        {selectedPiece ? (
          <>
            <strong>{selectedPiece.name}</strong>
            <span>Tipo: {selectedPiece.type}</span>
          </>
        ) : (
          <span>Nenhuma peça selecionada</span>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;