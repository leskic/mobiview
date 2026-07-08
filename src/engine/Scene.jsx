import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";

function Cube() {
  return (
    <mesh position={[0, 0, 0]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#f59e0b" />
    </mesh>
  );
}

function Floor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
    >
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#dddddd" />
    </mesh>
  );
}

function Scene() {
  return (
    <Canvas
      shadows
      camera={{
        position: [4, 3, 4],
        fov: 45,
      }}
    >
      {/* Luz ambiente */}
      <ambientLight intensity={1.3} />

      {/* Luz principal */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={2}
        castShadow
      />

      <Cube />

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

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}

export default Scene;