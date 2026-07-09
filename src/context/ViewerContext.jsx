import { createContext, useContext, useState } from "react";

const ViewerContext = createContext();

export function ViewerProvider({ children }) {
  const [selectedPiece, setSelectedPiece] = useState(null);

  const [explodeAmount, setExplodeAmount] = useState(0);

  const [isolateMode, setIsolateMode] = useState("none");

  const [cameraTarget, setCameraTarget] = useState(null);

  const [playbackStep, setPlaybackStep] = useState(0);

  return (
    <ViewerContext.Provider
      value={{
        selectedPiece,
        setSelectedPiece,

        explodeAmount,
        setExplodeAmount,

        isolateMode,
        setIsolateMode,

        cameraTarget,
        setCameraTarget,

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