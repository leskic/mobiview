import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";

import demoProject from "../data/demoProject";

function getMaterial(project, materialId) {
  return project.materials.find((material) => material.id === materialId);
}

function getPieceSize(piece) {
  const { width, height, thickness } = piece.dimensions;

  if (piece.type === "LATERAL") {
    return [thickness / 100, height / 350, width / 1000];
  }

  if (piece.type === "PORTA") {
    return [width / 700, height / 350, thickness / 100];
  }

  return [1, 1, 1];
}

function PieceMesh({ piece, project, explodeAmount, selectedPiece, onSelectPiece }) {
  const material = getMaterial(project, piece.materialId);
  const finalPosition = piece.getExplodedPosition(explodeAmount);
  const isSelected = selectedPiece?.id === piece.id;

  function handleClick(event) {
    event.stopPropagation();
    onSelectPiece(piece);
  }

  return (
    <mesh position={finalPosition} castShadow onClick={handleClick}>
      <boxGeometry args={getPieceSize(piece)} />
      <meshStandardMaterial color={isSelected ? "#22c55e" : material.color} />
    </mesh>
  );
}

function ProjectModel({ project, explodeAmount, selectedPiece, onSelectPiece }) {
  return (
    <group>
      {project.modules.map((module) =>
        module.pieces.map((piece) => (
          <PieceMesh
            key={piece.id}
            piece={piece}
            project={project}
            explodeAmount={explodeAmount}
            selectedPiece={selectedPiece}
            onSelectPiece={onSelectPiece}
          />
        ))
      )}
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

function Scene({ explodeAmount, onSelectPiece, selectedPiece }) {
  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 45 }}>
      <ambientLight intensity={1.3} />
      <directionalLight position={[5, 8, 5]} intensity={2} castShadow />

      <ProjectModel
        project={demoProject}
        explodeAmount={explodeAmount}
        selectedPiece={selectedPiece}
        onSelectPiece={onSelectPiece}
      />

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