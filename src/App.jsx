import { useRef, useState } from "react";
import "./App.css";

import Viewer from "./components/viewer/Viewer";
import { useProject } from "./context/ProjectContext";
import { useViewer } from "./context/ViewerContext";
import { loadProject } from "./services/projectLoader";

function App() {
  const fileInputRef = useRef(null);
  const { project, setProject } = useProject();
  const {
    selectedPiece,
    setSelectedPiece,
    cameraView,
    requestCameraView,
  } = useViewer();

  const [modelUrl, setModelUrl] = useState(null);

  function openFile() {
    fileInputRef.current.click();
  }

  async function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "glb" || ext === "gltf") {
      setProject(null);
      setSelectedPiece(null);
      setModelUrl(URL.createObjectURL(file));
      return;
    }

    if (ext === "json") {
      const data = await loadProject(file);
      setModelUrl(null);
      setProject(data);
      setSelectedPiece(null);
      return;
    }

    alert("Arquivo não suportado.");
  }

  const pieces = Array.isArray(project?.pieces)
    ? project.pieces
    : Array.isArray(project?.modules)
      ? project.modules.flatMap((module) => module.pieces || [])
      : [];

  function selectedDimensions() {
    if (!selectedPiece) return {};

    const dynamic = selectedPiece.dynamic_attributes;
    if (dynamic?.lenx && dynamic?.leny && dynamic?.lenz) {
      const values = [dynamic.lenx, dynamic.leny, dynamic.lenz]
        .map((value) => Number(value) * 25.4)
        .sort((a, b) => b - a);
      return {
        height: values[0].toFixed(1),
        width: values[1].toFixed(1),
        thickness: values[2].toFixed(1),
      };
    }

    return {
      height:
        selectedPiece.geometry?.technical?.height ||
        selectedPiece.dimensions?.height,
      width:
        selectedPiece.geometry?.technical?.width ||
        selectedPiece.dimensions?.width,
      thickness:
        selectedPiece.geometry?.technical?.thickness ||
        selectedPiece.dimensions?.thickness,
    };
  }

  const dimensions = selectedDimensions();

  const modules = {};

  pieces.forEach((piece) => {
    const moduleId = piece.module_id || piece.moduleId || "sem_modulo";

    if (!modules[moduleId]) {
      modules[moduleId] = [];
    }

    modules[moduleId].push(piece);
  });

  return (
    <div className="mv-app">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.glb,.gltf"
        hidden
        onChange={handleFile}
      />

      <header className="mv-header">
        <div className="mv-brand">
          <div className="mv-logo">◆</div>
          <div>
            <h1>MobiView</h1>
            <span>Visualização inteligente para móveis planejados</span>
          </div>
        </div>

        <div className="mv-toolbar">
          <button onClick={openFile}>Abrir</button>
          <button>Medir</button>
          <button>Explodir</button>
          <button>Isolar</button>
          <button>Ocultar</button>
          <button>Configurações</button>
        </div>
      </header>

      <main className="mv-main">
        <aside className="mv-left">
          <section className="mv-panel">
            <h2>Estrutura do Projeto</h2>

            <input
              className="mv-search"
              placeholder="Buscar peça ou módulo..."
            />

            <div className="mv-tree">
              <div className="mv-tree-title">
                Projeto: {project?.project?.name || project?.name || "Sem projeto"}
              </div>

              {Object.keys(modules).map((moduleId) => (
                <div key={moduleId} className="mv-module">
                  <div className="mv-module-title">▾ Módulo {moduleId}</div>

                  {modules[moduleId].map((piece) => (
                    <button
                      key={piece.id || piece.mv_uuid || piece.persistent_id}
                      className={
                        selectedPiece === piece
                          ? "mv-piece selected"
                          : "mv-piece"
                      }
                      onClick={() => setSelectedPiece(piece)}
                    >
                      {piece.name || "Peça"}{" "}
                      <span>{piece.code ? `(${piece.code})` : ""}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="mv-panel mv-materials">
            <h2>Materiais</h2>
            <div>MDF Branco 18mm</div>
            <div>MDF Carvalho 18mm</div>
            <div>Fita de Borda</div>
          </section>
        </aside>

        <section className="mv-viewer">
          <Viewer modelUrl={modelUrl} />

          <div className="mv-bottom-controls">
            <button
              className={cameraView === "front" ? "active" : ""}
              onClick={() => requestCameraView("front")}
            >
              Frente
            </button>
            <button
              className={cameraView === "iso" ? "active" : ""}
              onClick={() => requestCameraView("iso")}
            >
              Isométrica
            </button>
            <button
              className={cameraView === "back" ? "active" : ""}
              onClick={() => requestCameraView("back")}
            >
              Traseira
            </button>
            <button onClick={() => requestCameraView("fit")}>Enquadrar</button>
            <button onClick={() => document.documentElement.requestFullscreen?.()}>
              Tela Cheia
            </button>
          </div>
        </section>

        <aside className="mv-right">
          <section className="mv-panel">
            <h2>Propriedades</h2>

            {selectedPiece ? (
              <>
                <h3>Informações da Peça</h3>

                <Prop label="Código" value={selectedPiece.code} />
                <Prop label="Nome" value={selectedPiece.name} />
                <Prop label="Material" value={selectedPiece.material} />
                <Prop
                  label="Espessura"
                  value={`${dimensions.thickness || "-"} mm`}
                />
                <Prop
                  label="Largura"
                  value={`${dimensions.width || "-"} mm`}
                />
                <Prop
                  label="Altura"
                  value={`${dimensions.height || "-"} mm`}
                />
                <Prop
                  label="Área"
                  value={selectedPiece.geometry?.area_mm2 || "-"}
                />
                <Prop
                  label="Volume"
                  value={selectedPiece.geometry?.volume_mm3 || "-"}
                />

                <h3>Dinabox</h3>

                <Prop
                  label="Tipo"
                  value={selectedPiece.dinabox?.type || "-"}
                />
                <Prop
                  label="Família"
                  value={selectedPiece.dinabox?.parsed?.family || "-"}
                />
                <Prop
                  label="Veio"
                  value={selectedPiece.dinabox?.parsed?.grain || "-"}
                />
                <Prop
                  label="Fita"
                  value={[
                    selectedPiece.dinabox?.parsed?.edge1,
                    selectedPiece.dinabox?.parsed?.edge2,
                    selectedPiece.dinabox?.parsed?.edge3,
                    selectedPiece.dinabox?.parsed?.edge4,
                  ].join(" / ")}
                />
              </>
            ) : (
              <p className="mv-empty">Selecione uma peça na árvore.</p>
            )}
          </section>
        </aside>
      </main>

      <footer className="mv-footer">
        <span>Projeto carregado</span>
        <span>{pieces.length} peças</span>
        <span>{Object.keys(modules).length} módulos</span>
        <span>v0.2.0</span>
      </footer>
    </div>
  );
}

function Prop({ label, value }) {
  return (
    <div className="mv-prop">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

export default App;
