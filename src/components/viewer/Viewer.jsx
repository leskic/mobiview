import Scene from "../../engine/Scene";

function Viewer({ modelUrl, explodeAmount }) {
  return (
    <main className="viewer-area">
      <Scene modelUrl={modelUrl} explodeAmount={explodeAmount} />
    </main>
  );
}

export default Viewer;