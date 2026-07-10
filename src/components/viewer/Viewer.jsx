import Scene from "../../engine/Scene";
import { useViewer } from "../../context/ViewerContext";

function Viewer({ modelUrl }) {
  const {
    selectedPiece,
    setSelectedPiece,
    explodeAmount,
  } = useViewer();

  return (
    <main className="viewer-area">
      <Scene
        modelUrl={modelUrl}
        explodeAmount={explodeAmount}
        selectedPiece={selectedPiece}
        onSelectPiece={setSelectedPiece}
      />
    </main>
  );
}

export default Viewer;