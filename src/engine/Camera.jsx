import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Box3, Vector3 } from "three";
import { useViewer } from "../context/ViewerContext";

function CameraController({ selectedPiece, explodeAmount, controlsRef }) {
  const { camera, scene } = useThree();
  const { cameraView, cameraRequest, focusRequest } = useViewer();

  const target = useRef(new Vector3(0, 0.5, 0));
  const cameraPosition = useRef(new Vector3(4, 3, 4));

  const lastSelected = useRef(null);
  const lastView = useRef(null);
  const lastModel = useRef(null);
  const lastCameraRequest = useRef(-1);
  const lastFocusRequest = useRef(0);

  const isAnimating = useRef(false);

  function getPiecePosition(piece) {
    if (!piece) return [0, 0, 0];

    if (piece.source === "glb" && piece.position) {
      return piece.position;
    }

    if (typeof piece.getExplodedPosition === "function") {
      return piece.getExplodedPosition(explodeAmount);
    }

    if (piece.transform?.origin) {
      const origin = piece.transform.center || piece.transform.origin;
      return [origin.x / 1000, origin.z / 1000, -origin.y / 1000];
    }

    if (Array.isArray(piece.position)) {
      return [
        piece.position[0] / 1000,
        piece.position[2] / 1000,
        -piece.position[1] / 1000,
      ];
    }

    if (piece.position && typeof piece.position === "object") {
      const position = piece.position;
      const axes = piece.rotation;
      const dynamic = piece.dynamic_attributes;

      if (axes?.x && axes?.y && axes?.z && dynamic?.lenx) {
        const center = new Vector3(position.x, position.y, position.z);
        const sizes = [dynamic.lenx, dynamic.leny, dynamic.lenz].map(
          (value) => Number(value) * 25.4
        );
        [axes.x, axes.y, axes.z].forEach((axis, index) => {
          center.addScaledVector(
            new Vector3(axis[0], axis[1], axis[2]).normalize(),
            sizes[index] / 2
          );
        });
        return [center.x / 1000, center.z / 1000, -center.y / 1000];
      }

      return [position.x / 1000, position.z / 1000, -position.y / 1000];
    }

    return [0, 0, 0];
  }

  function startAnimation() {
    isAnimating.current = true;
  }

  function focusPiece(piece) {
    const pos = getPiecePosition(piece);

    target.current.set(pos[0], pos[1], pos[2]);

    cameraPosition.current.set(
      pos[0] + 2.8,
      pos[1] + 1.8,
      pos[2] + 2.8
    );

    startAnimation();
  }

  function setView(view) {
    const model = scene.getObjectByName("project-model");
    if (!model) return false;

    const box = new Box3().setFromObject(model);
    if (box.isEmpty()) return false;

    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const maxSize = Math.max(size.x, size.y, size.z, 0.1);
    const distance = (maxSize * 0.62) / Math.tan((camera.fov * Math.PI) / 360);

    target.current.copy(center);

    if (view === "front" || view === "fit") {
      cameraPosition.current.set(center.x, center.y, center.z + distance);
    }
    if (view === "back") {
      cameraPosition.current.set(center.x, center.y, center.z - distance);
    }
    if (view === "right") {
      cameraPosition.current.set(center.x + distance, center.y, center.z);
    }
    if (view === "top") {
      cameraPosition.current.set(center.x, center.y + distance, center.z + 0.001);
    }
    if (view === "iso") {
      const offset = distance * 0.72;
      cameraPosition.current.set(
        center.x + offset,
        center.y + offset * 0.65,
        center.z + offset
      );
    }

    startAnimation();
    return true;
  }

  useFrame(() => {
    const model = scene.getObjectByName("project-model");
    if (model?.uuid !== lastModel.current) {
      lastModel.current = model?.uuid || null;
      lastView.current = null;
    }

    if (
      cameraView !== lastView.current ||
      cameraRequest !== lastCameraRequest.current
    ) {
      if (setView(cameraView)) lastView.current = cameraView;
      lastCameraRequest.current = cameraRequest;
    }

    const selectionId = selectedPiece?.id || selectedPiece?.uuid || selectedPiece?.mv_uuid;

    if (selectedPiece && lastSelected.current !== selectionId) {
      focusPiece(selectedPiece);
      lastSelected.current = selectionId;
    }

    if (selectedPiece && focusRequest !== lastFocusRequest.current) {
      focusPiece(selectedPiece);
      lastFocusRequest.current = focusRequest;
    }

    if (!isAnimating.current) return;

    camera.position.lerp(cameraPosition.current, 0.08);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(target.current, 0.08);
      controlsRef.current.update();
    }

    const distance = camera.position.distanceTo(cameraPosition.current);
    const targetDistance = controlsRef.current
      ? controlsRef.current.target.distanceTo(target.current)
      : 0;

    if (distance < 0.08 && targetDistance < 0.08) {
      isAnimating.current = false;

      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    }
  });

  return null;
}

export default CameraController;
