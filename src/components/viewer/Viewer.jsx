import Scene from "../../engine/Scene";

function Viewer({ modelUrl, explodeAmount, onSelectPiece, selectedPiece }) {
  return (
    <main className="viewer-area">
      <Scene
        modelUrl={modelUrl}
        explodeAmount={explodeAmount}
        onSelectPiece={onSelectPiece}
        selectedPiece={selectedPiece}
      />
    </main>
  );
}

export default Viewer;