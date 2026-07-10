import { useMemo, useState } from "react";
import DoorElevation from "./DoorElevation";
import FrontElevation from "./FrontElevation";
import MountingElevation from "./MountingElevation";
import PlanElevation from "./PlanElevation";
import IsometricElevation from "./IsometricElevation";
import PartsList from "./PartsList";
import RackDetail from "./RackDetail";
import TitleBlock from "./TitleBlock";
import { detailingCapabilities, projectPieces, projectViews, sheetCode } from "./projectUtils";

function DetailingMode({ project, onClose }) {
  const views = useMemo(() => projectViews(project), [project]);
  const [activeViewId, setActiveViewId] = useState(views[0]?.id || "V01");
  const [showOverall, setShowOverall] = useState(true);
  const [showModules, setShowModules] = useState(true);
  const [showInternal, setShowInternal] = useState(true);
  const [activeSheet, setActiveSheet] = useState("DT1.1");
  const [printAll, setPrintAll] = useState(false);
  const activeView =
    views.find((view) => view.id === activeViewId) || views[0];
  const viewProject = useMemo(
    () => ({
      ...project,
      pieces: activeView?.pieces || [],
      active_view: activeView,
    }),
    [project, activeView]
  );
  const capabilities = useMemo(() => detailingCapabilities(viewProject), [viewProject]);
  const sheets = useMemo(() => [
    { id: "DT1.1", label: "Cotas" },
    { id: "PLAN", label: "Planta" },
    { id: "ISO", label: "Isométrica" },
    ...(capabilities.hasDoors ? [{ id: "DT1.2", label: "Portas" }] : []),
    { id: "DT1.3", label: "Montagem" },
    ...(capabilities.hasFronts ? [{ id: "DT1.4", label: "Interna" }] : []),
    ...(capabilities.hasRackDetail ? [{ id: "DT1.5", label: "Detalhe A" }] : []),
    { id: "DT1.6", label: "Peças" },
  ].map((sheet, index) => ({ ...sheet, number: `DT1.${index + 1}` })), [capabilities]);
  const sheetNumber = (id) => sheets.find((sheet) => sheet.id === id)?.number;
  const code = (id) => sheetCode(activeView?.id || "V01", sheetNumber(id), views.length);
  const visibleActiveSheet = sheets.some((sheet) => sheet.id === activeSheet)
    ? activeSheet : sheets[0].id;
  const sheetClass = (sheet) =>
    `detail-sheet ${!printAll && visibleActiveSheet !== sheet ? "is-hidden" : ""}`;

  function printAllSheets() {
    setPrintAll(true);
    window.setTimeout(() => {
      window.print();
      setPrintAll(false);
    }, 250);
  }

  return (
    <section className="detailing-workspace">
      <div className="detailing-toolbar">
        <button onClick={onClose}>← Voltar ao 3D</button>
        <strong>Modo Detalhamento</strong>
        <div className="detailing-view-tabs">
          {views.map((view) => (
            <button
              key={view.id}
              className={activeView?.id === view.id ? "active" : ""}
              onClick={() => setActiveViewId(view.id)}
              title={`${view.pieces.length} peças`}
            >
              {view.id} {view.name}
            </button>
          ))}
        </div>
        <div className="detailing-sheet-tabs">
          {sheets.map((sheet) => (
            <button key={sheet.id} className={visibleActiveSheet === sheet.id ? "active" : ""}
              onClick={() => setActiveSheet(sheet.id)}>
              {sheet.number} {sheet.label}
            </button>
          ))}
        </div>
        <div className="detailing-dimension-controls">
          <label>
            <input
              type="checkbox"
              checked={showOverall}
              onChange={(event) => setShowOverall(event.target.checked)}
            />
            <span className="dimension-dot overall" /> Cota total
          </label>
          <label>
            <input
              type="checkbox"
              checked={showModules}
              onChange={(event) => setShowModules(event.target.checked)}
            />
            <span className="dimension-dot module" /> Módulos
          </label>
          <label>
            <input
              type="checkbox"
              checked={showInternal}
              onChange={(event) => setShowInternal(event.target.checked)}
            />
            <span className="dimension-dot internal" /> Internas
          </label>
        </div>
        <button onClick={printAllSheets}>Imprimir / Salvar PDF</button>
      </div>

      <div className="detail-stage">
        <article className={sheetClass("DT1.1")}>
          <div className="detail-content">
            <h2>VISTA FRONTAL</h2>
            <FrontElevation
              project={viewProject}
              showOverall={showOverall}
              showModules={showModules}
              showInternal={showInternal}
            />
            <div className="detail-caption">
              <span>ESCALA AUTOMÁTICA</span>
              <span>{projectPieces(viewProject).length} PEÇAS</span>
            </div>
          </div>
          <TitleBlock project={viewProject} sheetNumber={code("DT1.1")} />
        </article>

        <article className={sheetClass("PLAN")}>
          <div className="detail-content">
            <h2>PLANTA BAIXA - INDICAÇÃO DAS VISTAS</h2>
            <PlanElevation project={project} />
            <div className="detail-caption"><span>PROJEÇÃO SUPERIOR</span><span>SETAS INDICAM O SENTIDO DAS ELEVAÇÕES</span></div>
          </div>
          <TitleBlock project={project} content="PLANTA BAIXA" sheetNumber={code("PLAN")} />
        </article>

        <article className={sheetClass("ISO")}>
          <div className="detail-content">
            <h2>VISTA ISOMÉTRICA</h2>
            <IsometricElevation project={viewProject} />
            <div className="detail-caption"><span>PROJEÇÃO ISOMÉTRICA AUTOMÁTICA</span><span>{projectPieces(viewProject).length} PEÇAS</span></div>
          </div>
          <TitleBlock project={viewProject} content="VISTA ISOMÉTRICA" sheetNumber={code("ISO")} />
        </article>

        {capabilities.hasDoors && <article className={sheetClass("DT1.2")}>
          <div className="detail-content">
            <h2>VISTA FRONTAL - DIMENSÕES DAS PORTAS</h2>
            <DoorElevation project={viewProject} />
            <div className="detail-caption">
              <span>ESCALA AUTOMÁTICA</span>
              <span>{capabilities.doors.length} PORTAS IDENTIFICADAS</span>
            </div>
          </div>
          <TitleBlock
            project={viewProject}
            content="DIMENSÕES DAS PORTAS"
            sheetNumber={code("DT1.2")}
          />
        </article>}

        <article className={sheetClass("DT1.3")}>
          <div className="detail-content">
            <h2>VISTA FRONTAL - DETALHES DE MONTAGEM E MATERIAIS</h2>
            <MountingElevation project={viewProject} />
            <div className="detail-caption">
              <span>ESPECIFICAÇÕES INDICADAS POR SETAS</span>
              <span>CORES EXTRAÍDAS DO PROJETO</span>
            </div>
          </div>
          <TitleBlock
            project={viewProject}
            content="MONTAGEM E MATERIAIS"
            sheetNumber={code("DT1.3")}
          />
        </article>

        {capabilities.hasFronts && <article className={sheetClass("DT1.4")}>
          <div className="detail-content">
            <h2>VISTA INTERNA - PORTAS E PUXADORES REMOVIDOS</h2>
            <FrontElevation
              project={viewProject}
              showOverall={false}
              showModules={false}
              showInternal
              hideFronts
            />
            <div className="detail-caption">
              <span>ESTRUTURA INTERNA E VÃOS ÚTEIS</span>
              <span>{capabilities.fronts.length} FRENTES/FERRAGENS OCULTADAS</span>
            </div>
          </div>
          <TitleBlock
            project={viewProject}
            content="VISTA INTERNA"
            sheetNumber={code("DT1.4")}
          />
        </article>}

        {capabilities.hasRackDetail && <article className={sheetClass("DT1.5")}>
          <div className="detail-content">
            <h2>DETALHE A - COLMEIA DE GARRAFAS</h2>
            <RackDetail project={viewProject} />
            <div className="detail-caption">
              <span>DETALHE AMPLIADO</span>
              <span>COTAS INTERNAS EM MILÍMETROS</span>
            </div>
          </div>
          <TitleBlock
            project={viewProject}
            content="DETALHE DA COLMEIA"
            sheetNumber={code("DT1.5")}
          />
        </article>}

        <article className={sheetClass("DT1.6")}>
          <div className="detail-content">
            <h2>LISTA DE PEÇAS</h2>
            <PartsList project={viewProject} />
            <div className="detail-caption">
              <span>DIMENSÕES EM MILÍMETROS</span>
              <span>PEÇAS IDÊNTICAS AGRUPADAS</span>
            </div>
          </div>
          <TitleBlock
            project={viewProject}
            content="LISTA DE PEÇAS"
            sheetNumber={code("DT1.6")}
          />
        </article>
      </div>
    </section>
  );
}

export default DetailingMode;
