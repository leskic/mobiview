import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, Grid } from "@react-three/drei";
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from "three";

import CameraController from "./Camera";
import ModelLoader from "./ModelLoader";
import { useViewer } from "../context/ViewerContext";
import { useProject } from "../context/ProjectContext";

function getMaterial(project, materialId) {
  return project.materials?.find((material) => material.id === materialId);
}

const textureLoader = new TextureLoader();
const textureCache = new Map();

function getTexture(material) {
  const source = material?.texture?.data || material?.textureData;
  if (!source) return null;

  if (!textureCache.has(source)) {
    const texture = textureLoader.load(source);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.anisotropy = 8;
    textureCache.set(source, texture);
  }

  return textureCache.get(source);
}

function pieceId(piece) {
  return piece.id || piece.uuid || piece.mv_uuid || piece.persistent_id;
}

function getPieceSize(piece) {
  const dynamic = piece.dynamic_attributes;
  if (dynamic?.lenx && dynamic?.leny && dynamic?.lenz) {
    return [dynamic.lenx, dynamic.leny, dynamic.lenz].map(
      (value) => Math.max(Number(value) * 0.0254, 0.001)
    );
  }

  if (piece.geometry?.dimensions) {
    const dimensions = piece.geometry.dimensions;
    return [dimensions.x, dimensions.z, dimensions.y].map(
      (value) => Math.max(Number(value) || 1, 1) / 1000
    );
  }

  const { width, height, thickness } = piece.dimensions;

  if (piece.source || piece.uuid || piece.mv_uuid) {
    const depth = piece.dimensions.depth || thickness || 1;
    return [width, height || 1, depth].map(
      (value) => Math.max(Number(value) || 1, 1) / 1000
    );
  }

  if (piece.type === "LATERAL") {
    return [thickness / 100, height / 350, width / 1000];
  }

  if (piece.type === "PORTA") {
    return [width / 700, height / 350, thickness / 100];
  }

  return [1, 1, 1];
}

function getPieceTransform(piece) {
  const transform = piece.transform;

  if (transform?.origin) {
    const xAxis = transform.x_axis || { x: 1, y: 0, z: 0 };
    const yAxis = transform.y_axis || { x: 0, y: 1, z: 0 };
    const zAxis = transform.z_axis || { x: 0, y: 0, z: 1 };
    const dynamic = piece.dynamic_attributes;
    const hasExportedCenter = transform.center &&
      Number.isFinite(transform.center.x) &&
      Number.isFinite(transform.center.y) &&
      Number.isFinite(transform.center.z);
    const origin = new Vector3(
      hasExportedCenter ? transform.center.x : transform.origin.x,
      hasExportedCenter ? transform.center.y : transform.origin.y,
      hasExportedCenter ? transform.center.z : transform.origin.z
    );
    const sketchAxes = [xAxis, yAxis, zAxis].map(
      (axis) => new Vector3(axis.x, axis.y, axis.z).normalize()
    );

    if (!hasExportedCenter && dynamic?.lenx && dynamic?.leny && dynamic?.lenz) {
      [dynamic.lenx, dynamic.leny, dynamic.lenz].forEach((value, index) => {
        origin.addScaledVector(sketchAxes[index], Number(value) * 25.4 / 2);
      });
    }

    const convertAxis = (axis) =>
      new Vector3(axis.x, axis.z, -axis.y).normalize();
    let renderX = convertAxis(xAxis);
    const renderY = convertAxis(yAxis);
    const renderZ = convertAxis(zAxis);
    let basis = new Matrix4().makeBasis(renderX, renderY, renderZ);

    // Componentes espelhados possuem reflexão (determinante negativo), que
    // não pode ser representada por quaternion. Para uma caixa, inverter um
    // eixo mantém a mesma geometria e produz uma rotação válida.
    if (basis.determinant() < 0) {
      renderX = renderX.negate();
      basis = new Matrix4().makeBasis(renderX, renderY, renderZ);
    }

    return {
      position: [
        origin.x / 1000,
        origin.z / 1000,
        -origin.y / 1000,
      ],
      quaternion: new Quaternion().setFromRotationMatrix(basis),
    };
  }

  if (piece.position && !Array.isArray(piece.position)) {
    const position = piece.position;
    const axes = piece.rotation;
    let quaternion;
    let center = new Vector3(position.x, position.y, position.z);

    if (axes?.x && axes?.y && axes?.z) {
      const dynamic = piece.dynamic_attributes;
      const sizeMm = dynamic?.lenx && dynamic?.leny && dynamic?.lenz
        ? [dynamic.lenx, dynamic.leny, dynamic.lenz].map(
            (value) => Number(value) * 25.4
          )
        : [
            piece.dimensions?.width || 1,
            piece.dimensions?.height || 1,
            piece.dimensions?.thickness || piece.dimensions?.depth || 1,
          ];

      const sketchAxes = [axes.x, axes.y, axes.z].map(
        (axis) => new Vector3(axis[0], axis[1], axis[2]).normalize()
      );

      sketchAxes.forEach((axis, index) => {
        center.addScaledVector(axis, sizeMm[index] / 2);
      });

      const convertAxis = (axis) =>
        new Vector3(axis[0], axis[2], -axis[1]).normalize();
      let renderX = convertAxis(axes.x);
      const renderY = convertAxis(axes.y);
      const renderZ = convertAxis(axes.z);
      let basis = new Matrix4().makeBasis(renderX, renderY, renderZ);
      if (basis.determinant() < 0) {
        renderX = renderX.negate();
        basis = new Matrix4().makeBasis(renderX, renderY, renderZ);
      }
      quaternion = new Quaternion().setFromRotationMatrix(basis);
    }

    return {
      position: [center.x / 1000, center.z / 1000, -center.y / 1000],
      quaternion,
    };
  }

  const position = Array.isArray(piece.position) ? piece.position : [0, 0, 0];
  const rotation = Array.isArray(piece.rotation) ? piece.rotation : [0, 0, 0];

  return {
    position: [position[0] / 1000, position[2] / 1000, -position[1] / 1000],
    rotation: rotation.map((value) => (Number(value) * Math.PI) / 180),
  };
}

function shouldShowPiece(piece, selectedPiece, isolateMode, playbackStep) {
  if (playbackStep > 0) {
    const step = piece.assemblyStep || 1;
    if (step > playbackStep) return false;
  }

  if (!selectedPiece) return true;

  if (isolateMode === "piece") {
    return pieceId(piece) === pieceId(selectedPiece);
  }

  if (isolateMode === "module") {
    return piece.moduleId === selectedPiece.moduleId;
  }

  return true;
}

function PieceMesh({ piece, project, explodeAmount, selectedPiece, onSelectPiece }) {
  const { isolateMode, playbackStep } = useViewer();

  const realGeometry = useMemo(() => {
    const source = piece.geometry?.mesh?.positions;
    if (!Array.isArray(source) || source.length < 9) return null;

    const positions = new Float32Array(source.length);
    for (let index = 0; index < source.length; index += 3) {
      // SketchUp: X direita, Y profundidade, Z altura (mm)
      // Three.js: X direita, Y altura, Z profundidade (m)
      positions[index] = source[index] / 1000;
      positions[index + 1] = source[index + 2] / 1000;
      positions[index + 2] = -source[index + 1] / 1000;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

    const sourceColors = piece.geometry?.mesh?.colors;
    if (Array.isArray(sourceColors) && sourceColors.length === source.length) {
      geometry.setAttribute(
        "color",
        new Float32BufferAttribute(new Float32Array(sourceColors), 3)
      );
    }

    const sourceUvs = piece.geometry?.mesh?.uvs;
    if (Array.isArray(sourceUvs) && sourceUvs.length === source.length / 3 * 2) {
      geometry.setAttribute(
        "uv",
        new Float32BufferAttribute(new Float32Array(sourceUvs), 2)
      );
    }

    const sourceMaterialIds = piece.geometry?.mesh?.material_ids;
    const triangleCount = source.length / 9;
    const triangleMaterials =
      Array.isArray(sourceMaterialIds) && sourceMaterialIds.length === triangleCount
        ? sourceMaterialIds
        : Array(triangleCount).fill(piece.material || piece.materialId || "__default");
    const materialKeys = [...new Set(triangleMaterials)];

    let groupStart = 0;
    let groupMaterial = triangleMaterials[0];
    for (let triangle = 1; triangle <= triangleMaterials.length; triangle += 1) {
      const nextMaterial = triangleMaterials[triangle];
      if (triangle === triangleMaterials.length || nextMaterial !== groupMaterial) {
        geometry.addGroup(
          groupStart * 3,
          (triangle - groupStart) * 3,
          Math.max(materialKeys.indexOf(groupMaterial), 0)
        );
        groupStart = triangle;
        groupMaterial = nextMaterial;
      }
    }
    geometry.userData.materialKeys = materialKeys.length ? materialKeys : ["__default"];

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }, [piece.geometry?.mesh?.positions, piece.geometry?.mesh?.colors, piece.geometry?.mesh?.uvs, piece.geometry?.mesh?.material_ids, piece.material, piece.materialId]);

  const isSelected = selectedPiece && pieceId(selectedPiece) === pieceId(piece);
  const hasSelection = Boolean(selectedPiece);
  const isMuted = hasSelection && !isSelected;

  const meshMaterials = useMemo(() => {
    if (!realGeometry) return null;

    return realGeometry.userData.materialKeys.map((materialId) => {
      const definition = getMaterial(project, materialId);
      const texture = !isSelected && !isMuted ? getTexture(definition) : null;

      return new MeshStandardMaterial({
        side: DoubleSide,
        vertexColors:
          Boolean(realGeometry.getAttribute("color")) &&
          !texture &&
          !isSelected &&
          !isMuted,
        color: isSelected ? "#22c55e" : isMuted ? "#64748b" : "#ffffff",
        map: texture,
        transparent: Number(definition?.alpha) < 1,
        opacity: Number.isFinite(Number(definition?.alpha))
          ? Number(definition.alpha)
          : 1,
        emissive: isSelected ? "#14532d" : "#000000",
        emissiveIntensity: isSelected ? 0.8 : 0,
      });
    });
  }, [realGeometry, project, isSelected, isMuted]);

  useEffect(
    () => () => meshMaterials?.forEach((material) => material.dispose()),
    [meshMaterials]
  );

  if (!shouldShowPiece(piece, selectedPiece, isolateMode, playbackStep)) {
    return null;
  }

  const material = getMaterial(project, piece.materialId);
  const transform = getPieceTransform(piece);
  const finalPosition =
    realGeometry
      ? [0, 0, 0]
      : typeof piece.getExplodedPosition === "function"
      ? piece.getExplodedPosition(explodeAmount)
      : transform.position;

  function handleClick(event) {
    event.stopPropagation();
    onSelectPiece(piece);
  }

  return (
    <mesh
      position={finalPosition}
      rotation={realGeometry ? undefined : transform.rotation}
      quaternion={realGeometry ? undefined : transform.quaternion}
      castShadow
      receiveShadow
      onClick={handleClick}
      material={realGeometry ? meshMaterials : undefined}
    >
      {realGeometry ? (
        <primitive object={realGeometry} attach="geometry" />
      ) : (
        <boxGeometry args={getPieceSize(piece)} />
      )}

      {!realGeometry && (
        <meshStandardMaterial
          side={DoubleSide}
          color={
            isSelected
              ? "#22c55e"
              : isMuted
              ? "#64748b"
              : material?.color || piece.color || "#d8c6a4"
          }
          emissive={isSelected ? "#14532d" : "#000000"}
          emissiveIntensity={isSelected ? 0.8 : 0}
        />
      )}
    </mesh>
  );
}

function ProjectModel({ project, explodeAmount, selectedPiece, onSelectPiece }) {
  const pieces = useMemo(
    () =>
      Array.isArray(project?.pieces)
        ? project.pieces
        : (project?.modules || []).flatMap((module) => module.pieces || []),
    [project]
  );

  return (
    <group name="project-model">
      {pieces.map((piece, index) => (
        <PieceMesh
          key={piece.id || piece.uuid || piece.mv_uuid || index}
          piece={piece}
          project={project}
          explodeAmount={explodeAmount}
          selectedPiece={selectedPiece}
          onSelectPiece={onSelectPiece}
        />
      ))}
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

function Scene({ modelUrl, explodeAmount, onSelectPiece, selectedPiece }) {
  const controlsRef = useRef(null);
  const { project } = useProject();

  const projectPieces = useMemo(() => {
    if (Array.isArray(project?.pieces)) return project.pieces;

    if (Array.isArray(project?.modules)) {
      return project.modules.flatMap((module) => module.pieces || []);
    }

    return [];
  }, [project]);

  // Quando um JSON é aberto, ele deve ter prioridade sobre qualquer URL de
  // modelo carregada anteriormente. Isso evita que um GLB antigo continue
  // cobrindo a cena e esconda as peças exportadas.
  const hasProject = Boolean(project) && projectPieces.length > 0;
  const sceneKey = hasProject
    ? `project-${project?.project?.guid || project?.project?.name || project?.name || "loaded"}-${projectPieces.length}`
    : `model-${modelUrl || "empty"}`;

  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.5, 8], fov: 38 }}
      onPointerMissed={() => onSelectPiece(null)}
    >
      <ambientLight intensity={1.3} />
      <directionalLight position={[5, 8, 5]} intensity={2} castShadow />

      <CameraController
        selectedPiece={selectedPiece}
        explodeAmount={explodeAmount}
        controlsRef={controlsRef}
      />

      <Suspense fallback={null}>
        <Bounds
          key={sceneKey}
          fit
          clip
          observe
          margin={1.15}
        >
          {hasProject ? (
            <ProjectModel
              project={project}
              explodeAmount={explodeAmount}
              selectedPiece={selectedPiece}
              onSelectPiece={onSelectPiece}
            />
          ) : modelUrl ? (
            <group name="external-model">
              <ModelLoader
                url={modelUrl}
                selectedPiece={selectedPiece}
                onSelectPiece={onSelectPiece}
              />
            </group>
          ) : null}
        </Bounds>
      </Suspense>

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