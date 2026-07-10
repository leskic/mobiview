import { formatDate, projectClient } from "./projectUtils";

function TitleBlock({ project, content = "VISTA FRONTAL", sheetNumber = "DT1.1" }) {
  return (
    <aside className="detail-title-block">
      <div className="detail-company">MARCHELI<br />MÓVEIS</div>
      <dl>
        <dt>AMBIENTE</dt>
        <dd>{project?.project?.name || project?.name || "PROJETO"}</dd>
        <dt>CLIENTE</dt>
        <dd>{projectClient(project)}</dd>
        <dt>DATA</dt>
        <dd>{formatDate(project?.project?.exported_at)}</dd>
        <dt>PROJETISTA</dt>
        <dd>CHARLES KICHELESKI</dd>
        <dt>CONTEÚDO</dt>
        <dd>{content}</dd>
      </dl>
      <strong className="detail-sheet-number">{sheetNumber}</strong>
    </aside>
  );
}


export default TitleBlock;
