function Toolbar({ explodeAmount, onExplodeChange }) {
  return (
    <footer className="toolbar">
      <button>🏠 ISO</button>
      <button>⬅ Frente</button>
      <button>➡ Lado</button>
      <button>⬆ Topo</button>
      <button>📏 Medir</button>
      <button>⛶ Tela Cheia</button>

      <div className="explode-control">
        <span>Explodir</span>
        <input
          type="range"
          min="0"
          max="100"
          value={explodeAmount}
          onChange={(event) => onExplodeChange(Number(event.target.value))}
        />
        <strong>{explodeAmount}%</strong>
      </div>
    </footer>
  );
}

export default Toolbar;