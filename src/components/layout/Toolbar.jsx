import { useEffect, useState } from "react";
import { useViewer } from "../../context/ViewerContext";

function Toolbar() {
  const {
    explodeAmount,
    setExplodeAmount,
    playbackStep,
    setPlaybackStep,
    setCameraView,
    selectedPiece,
    focusSelection,
  } = useViewer();

  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;

    const timer = setInterval(() => {
      setPlaybackStep((step) => {
        if (step >= 6) {
          setPlaying(false);
          return 0;
        }

        return step + 1;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [playing, setPlaybackStep]);

  useEffect(() => {
    function handleKeyDown(event) {
      const tag = event.target.tagName.toLowerCase();

      if (tag === "input" || tag === "textarea") return;

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();

        if (selectedPiece) {
          focusSelection();
        } else {
          setCameraView("fit");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPiece, focusSelection, setCameraView]);

  function handleFrameClick() {
    if (selectedPiece) {
      focusSelection();
    } else {
      setCameraView("fit");
    }
  }

  return (
    <footer className="toolbar">
      <button onClick={() => setCameraView("iso")}>ISO</button>
      <button onClick={() => setCameraView("front")}>Frente</button>
      <button onClick={() => setCameraView("right")}>Direita</button>
      <button onClick={() => setCameraView("top")}>Topo</button>
      <button onClick={handleFrameClick}>🎯 Enquadrar</button>

      <button onClick={() => setPlaybackStep(0)}>⏮</button>
      <button onClick={() => setPlaybackStep((p) => Math.max(0, p - 1))}>
        ◀
      </button>
      <button onClick={() => setPlaying((v) => !v)}>
        {playing ? "⏸" : "▶"}
      </button>
      <button onClick={() => setPlaybackStep((p) => Math.min(6, p + 1))}>
        ▶▶
      </button>
      <button onClick={() => setPlaybackStep(6)}>⏭</button>

      <span>Passo {playbackStep} / 6</span>

      <div className="explode-control">
        <span>Explodir</span>

        <input
          type="range"
          min="0"
          max="100"
          value={explodeAmount}
          onChange={(e) => setExplodeAmount(Number(e.target.value))}
        />

        <strong>{explodeAmount}%</strong>
      </div>
    </footer>
  );
}

export default Toolbar;