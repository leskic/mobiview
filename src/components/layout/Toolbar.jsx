import { useViewer } from "../../context/ViewerContext";

function Toolbar() {
  const { explodeAmount, setExplodeAmount } = useViewer();

  return (
    <footer className="toolbar">
      <button>ISO</button>
      <button>Frente</button>
      <button>Lado</button>
      <button>Topo</button>
      <button>Medir</button>
      <button>Tela Cheia</button>

      <div className="explode-control">
        <span>Explodir</span>

        <input
          type="range"
          min="0"
          max="100"
          value={explodeAmount}
          onChange={(event) => setExplodeAmount(Number(event.target.value))}
        />

        <strong>{explodeAmount}%</strong>
      </div>
    </footer>
  );
}

export default Toolbar;