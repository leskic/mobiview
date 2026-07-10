import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";

function cloneMaterial(material) {
  if (Array.isArray(material)) return material.map((m) => m.clone());
  return material?.clone ? material.clone() : material;
}

function prepareMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach(prepareMaterial);
    return;
  }

  if (!material) return;

  material.userData.originalColor = material.color?.clone();
  material.userData.originalEmissive = material.emissive?.clone();
  material.userData.originalEmissiveIntensity = material.emissiveIntensity || 0;
}

function updateMaterial(material, isSelected) {
  if (Array.isArray(material)) {
    material.forEach((m) => updateMaterial(m, isSelected));
    return;
  }

  if (!material) return;

  if (isSelected) {
    material.color?.set("#22c55e");
    material.emissive?.set("#14532d");
    material.emissiveIntensity = 0.8;
    return;
  }

  if (material.userData.originalColor) material.color?.copy(material.userData.originalColor);
  if (material.userData.originalEmissive) material.emissive?.copy(material.userData.originalEmissive);

  material.emissiveIntensity = material.userData.originalEmissiveIntensity || 0;
}

function formatDimensionsFromBox(size) {
  const x = Math.round(Math.abs(size.x) * 1000);
  const y = Math.round(Math.abs(size.y) * 1000);
  const z = Math.round(Math.abs(size.z) * 1000);

  const sorted = [x, y, z].sort((a, b) => b - a);

  return {
    width: sorted[0] || 0,
    height: sorted[1] || 0,
    thickness: sorted[2] || 0,
    raw: { x, y, z },
  };
}

function getObjectData(object) {
  const box = new Box3().setFromObject(object);
  const size = new Vector3();
  const center = new Vector3();

  box.getSize(size);
  box.getCenter(center);

  return {
    position: [center.x, center.y, center.z],
    dimensions: formatDimensionsFromBox(size),
  };
}

function ModelLoader({ url, selectedPiece, onSelectPiece }) {
  const { scene } = useGLTF(url);

  const model = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((object) => {
      if (object.isMesh) {
        object.material = cloneMaterial(object.material);
        prepareMaterial(object.material);
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return cloned;
  }, [scene]);

  useEffect(() => {
    model.traverse((object) => {
      if (!object.isMesh) return;

      const isSelected =
        selectedPiece?.source === "glb" &&
        selectedPiece?.objectUuid === object.uuid;

      updateMaterial(object.material, isSelected);
    });
  }, [model, selectedPiece]);

  function handleClick(event) {
    event.stopPropagation();

    const object = event.object;
    if (!object?.isMesh) return;

    const data = getObjectData(object);

    onSelectPiece({
      id: object.uuid,
      objectUuid: object.uuid,
      source: "glb",
      name: object.name || object.parent?.name || "Peça GLB",
      type: "GLB",
      materialName:
        object.material?.name ||
        object.material?.[0]?.name ||
        "Material do GLB",
      position: data.position,
      dimensions: data.dimensions,
    });
  }

  return <primitive object={model} onClick={handleClick} />;
}

export default ModelLoader;