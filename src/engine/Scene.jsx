import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";

import demoProject from "../data/demoProject";
import CameraController from "./Camera";
import { useViewer } from "../context/ViewerContext";

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

function shouldShowPiece(piece, selectedPiece, isolateMode) {
  if (!selectedPiece) return true;

  if (isolateMode === "piece") {
    return piece.id === selectedPiece.id;
  }

  if (isolateMode === "module") {
    return piece.moduleId === selectedPiece.moduleId;
  }

  return true;
}

function PieceMesh({ piece, project, explodeAmount, selectedPiece, onSelectPiece }) {
  const { isolateMode } = useViewer();

  if (!shouldShowPiece(piece, selectedPiece, isolateMode)) {
    return null;
  }

  const material = getMaterial(project, piece.materialId);
  const finalPosition = piece.getExplodedPosition(explodeAmount);

  const isSelected = selectedPiece?.id === piece.id;
  const hasSelection = Boolean(selectedPiece);
  const isMuted = hasSelection && !isSelected;

  function handleClick(event) {
    event.stopPropagation();
    onSelectPiece(piece);
  }

  return (
    <mesh position={finalPosition} castShadow receiveShadow onClick={handleClick}>
      <boxGeometry args={getPieceSize(piece)} />

      <meshStandardMaterial
        color={isSelected ? "#22c55e" : isMuted ? "#64748b" : material?.color || "#cccccc"}
        emissive={isSelected ? "#14532d" : "#000000"}
        emissiveIntensity={isSelected ? 0.8 : 0}
      />
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
  const controlsRef = useRef(null);

  return (
    <Canvas
      shadows
      camera={{ position: [4, 3, 4], fov: 45 }}
      onPointerMissed={() => onSelectPiece(null)}
    >
      <ambientLight intensity={1.3} />
      <directionalLight position={[5, 8, 5]} intensity={2} castShadow />

      <CameraController
        selectedPiece={selectedPiece}
        explodeAmount={explodeAmount}
        controlsRef={controlsRef}
      />

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

      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}

export default Scene;