import { createContext, useContext, useState } from "react";

const ViewerContext = createContext();

export function ViewerProvider({ children }) {
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [explodeAmount, setExplodeAmount] = useState(0);
  const [isolateMode, setIsolateMode] = useState("none");
  const [cameraView, setCameraView] = useState("front");
  const [cameraRequest, setCameraRequest] = useState(0);
  const [focusRequest, setFocusRequest] = useState(0);
  const [playbackStep, setPlaybackStep] = useState(0);

  function focusSelection() {
    setFocusRequest((value) => value + 1);
  }

  function requestCameraView(view) {
    setCameraView(view);
    setCameraRequest((value) => value + 1);
  }

  return (
    <ViewerContext.Provider
      value={{
        selectedPiece,
        setSelectedPiece,

        explodeAmount,
        setExplodeAmount,

        isolateMode,
        setIsolateMode,

        cameraView,
        setCameraView,
        cameraRequest,
        requestCameraView,

        focusRequest,
        focusSelection,

        playbackStep,
        setPlaybackStep,
      }}
    >
      {children}
    </ViewerContext.Provider>
  );
}

export function useViewer() {
  return useContext(ViewerContext);
}
