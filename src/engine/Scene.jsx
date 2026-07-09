import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import ModelLoader from "./ModelLoader";

function Piece({ name, size, position, color, explodeDirection, explodeAmount }) {
  const factor = explodeAmount / 100;

  const finalPosition = [
    position[0] + explodeDirection[0] * factor,
    position[1] + explodeDirection[1] * factor,
    position[2] + explodeDirection[2] * factor,
  ];

  return (
    <mesh position={finalPosition} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function TestCabinet({ explodeAmount }) {
  return (
    <group>
      <Piece
        name="Lateral Esquerda"
        size={[0.12, 2, 0.8]}
        position={[-0.56, 0.5, 0]}
        color="#d97706"
        explodeDirection={[-1.2, 0, 0]}
        explodeAmount={explodeAmount}
      />

      <Piece
        name="Lateral Direita"
        size={[0.12, 2, 0.8]}
        position={[0.56, 0.5, 0]}
        color="#d97706"
        explodeDirection={[1.2, 0, 0]}
        explodeAmount={explodeAmount}
      />

      <Piece
        name="Base"
        size={[1.2, 0.12, 0.8]}
        position={[0, -0.44, 0]}
        color="#f59e0b"
        explodeDirection={[0, -0.8, 0]}
        explodeAmount={explodeAmount}
      />

      <Piece
        name="Tampo"
        size={[1.2, 0.12, 0.8]}
        position={[0, 1.44, 0]}
        color="#f59e0b"
        explodeDirection={[0, 0.8, 0]}
        explodeAmount={explodeAmount}
      />

      <Piece
        name="Prateleira"
        size={[1.05, 0.08, 0.75]}
        position={[0, 0.45, 0]}
        color="#fbbf24"
        explodeDirection={[0, 0.4, 0]}
        explodeAmount={explodeAmount}
      />

      <Piece
        name="Porta"
        size={[1.15, 1.8, 0.08]}
        position={[0, 0.5, 0.44]}
        color="#92400e"
        explodeDirection={[0, 0, 1.4]}
        explodeAmount={explodeAmount}
      />

      <Piece
        name="Fundo"
        size={[1.15, 1.9, 0.06]}
        position={[0, 0.5, -0.43]}
        color="#b45309"
        explodeDirection={[0, 0, -1.0]}
        explodeAmount={explodeAmount}
      />
    </group>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#dddddd" />
    </mesh>
  );
}

function Scene({ modelUrl, explodeAmount }) {
  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 45 }}>
      <ambientLight intensity={1.3} />
      <directionalLight position={[5, 8, 5]} intensity={2} castShadow />

      {modelUrl ? (
        <ModelLoader url={modelUrl} />
      ) : (
        <TestCabinet explodeAmount={explodeAmount} />
      )}

      <Floor />

      <Grid
        position={[0, -0.49, 0]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.6}
        sectionSize={5}
        sectionThickness={1.4}
        fadeDistance={40}
        fadeStrength={1}
      />

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}

export default Scene;