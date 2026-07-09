function Header({ onOpenProject }) {
  return (
    <header className="header">
      <div>
        <h1>MobiView</h1>
        <span>Visualização inteligente para móveis planejados</span>
      </div>

      <button
        className="primary-button"
        onClick={onOpenProject}
      >
        Abrir Projeto
      </button>
    </header>
  );
}

export default Header;