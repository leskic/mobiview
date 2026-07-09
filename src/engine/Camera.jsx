import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";

function CameraController({ selectedPiece, explodeAmount, controlsRef }) {
  const { camera } = useThree();

  const target = useRef(new Vector3());
  const cameraPosition = useRef(new Vector3());
  const lastSelected = useRef(null);

  useFrame(() => {
    if (!selectedPiece) return;

    if (lastSelected.current !== selectedPiece.id) {
      const pos = selectedPiece.getExplodedPosition(explodeAmount);

      target.current.set(pos[0], pos[1], pos[2]);
      cameraPosition.current.set(pos[0] + 2.8, pos[1] + 1.8, pos[2] + 2.8);

      lastSelected.current = selectedPiece.id;
    }

    camera.position.lerp(cameraPosition.current, 0.08);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(target.current, 0.08);
      controlsRef.current.update();
    }
  });

  return null;
}

export default CameraController;