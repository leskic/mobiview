import Scene from "../../engine/Scene";
import { useViewer } from "../../context/ViewerContext";

function Viewer() {
  const {
    selectedPiece,
    setSelectedPiece,
    explodeAmount,
  } = useViewer();

  return (
    <main className="viewer-area">
      <Scene
        explodeAmount={explodeAmount}
        selectedPiece={selectedPiece}
        onSelectPiece={setSelectedPiece}
      />
    </main>
  );
}

export default Viewer;