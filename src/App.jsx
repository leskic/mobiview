import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <h1>MobiView 3D</h1>
        <span>Visualizador para móveis planejados</span>
      </header>

      <main className="viewer">
        <Canvas camera={{ position: [3, 3, 5], fov: 45 }}>
          <Stage environment="city" intensity={0.6}>
            <mesh>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="#c9a66b" />
            </mesh>
          </Stage>

          <OrbitControls makeDefault />
        </Canvas>
      </main>

      <footer className="toolbar">
        <button>Frente</button>
        <button>Lado</button>
        <button>Topo</button>
        <button>Isométrica</button>
      </footer>
    </div>
  );
}

export default App;