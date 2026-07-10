import { useMemo } from "react";
import {
  materialDisplayName,
  pieceTechnicalDimensions,
  projectPieces,
} from "./projectUtils";

function PartsTable({ rows }) {
  return (
    <table className="parts-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Peça</th>
          <th>L × A × E (mm)</th>
          <th>Material</th>
          <th>Qtd.</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <td>{row.code}</td>
            <td>{row.name}</td>
            <td>{row.dimensions}</td>
            <td>{row.material}</td>
            <td>{row.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PartsList({ project }) {
  const rows = useMemo(() => {
    const grouped = new Map();
    projectPieces(project).forEach((piece) => {
      const dimensions = pieceTechnicalDimensions(piece);
      const materialId = piece.material || piece.materialId;
      const name = piece.name || piece.dinabox?.parsed?.description || "Peça";
      const code = piece.code || piece.dinabox?.parsed?.code || "-";
      const key = [
        code,
        name,
        dimensions.width,
        dimensions.height,
        dimensions.thickness,
        materialId,
      ].join("|");
      const current = grouped.get(key);
      if (current) {
        current.quantity += 1;
      } else {
        grouped.set(key, {
          key,
          code,
          name,
          dimensions: `${dimensions.width} × ${dimensions.height} × ${dimensions.thickness}`,
          material: materialDisplayName(project, materialId),
          quantity: 1,
        });
      }
    });
    return [...grouped.values()].sort(
      (a, b) => a.code.localeCompare(b.code, "pt-BR", { numeric: true }) ||
        a.name.localeCompare(b.name, "pt-BR")
    );
  }, [project]);

  const middle = Math.ceil(rows.length / 2);
  return (
    <div className="parts-list">
      <div className="parts-list-summary">
        <strong>{projectPieces(project).length} peças</strong>
        <span>{rows.length} tipos agrupados</span>
      </div>
      <div className="parts-table-columns">
        <PartsTable rows={rows.slice(0, middle)} />
        <PartsTable rows={rows.slice(middle)} />
      </div>
    </div>
  );
}

export default PartsList;
