import { useMemo } from "react";
import DimensionHorizontal from "./DimensionHorizontal";
import DimensionVertical from "./DimensionVertical";
import {
  internalDimensions,
  materialColor,
  pieceBounds,
  projectPieces,
  projectProjection,
} from "./projectUtils";

function RackDetail({ project }) {
  const drawing = useMemo(() => {
    const projection = projectProjection(project);
    const pieces = projectPieces(project)
      .map((piece) => ({ piece, bounds: pieceBounds(piece, projection) }))
      .filter((item) => item.bounds);
    const internal = internalDimensions(pieces);
    const detail = internal.detailed;
    if (!detail) return null;
    const rack = detail.rack;
    const rackPieces = pieces.filter((item) => {
      const name = String(item.piece.name || "").trim().toUpperCase();
      return (
        name === "TAMPONAMENTO" &&
        item.bounds.minX >= rack.x1 - 1 &&
        item.bounds.maxX <= rack.x2 + 1 &&
        item.bounds.minZ >= rack.z1 - 1 &&
        item.bounds.maxZ <= rack.z2 + 25
      );
    });
    return { ...detail, rackPieces };
  }, [project]);

  if (!drawing) return <div className="detail-empty">Detalhe da colmeia não encontrado.</div>;

  const { rack, rackColumns, rackRows, rackPieces } = drawing;
  const width = rack.x2 - rack.x1;
  const height = rack.z2 - rack.z1;
  const paddingX = width * 0.42;
  const paddingY = height * 0.32;
  const fontSize = Math.max(width, height) * 0.035;
  const viewBox = [
    rack.x1 - paddingX,
    -rack.z2 - paddingY,
    width + paddingX * 2,
    height + paddingY * 2,
  ].join(" ");

  return (
    <svg className="detail-elevation" viewBox={viewBox} aria-label="Detalhe ampliado da colmeia">
      <rect
        x={rack.x1}
        y={-rack.z2}
        width={width}
        height={height}
        fill="#fff"
        stroke="#202020"
        strokeWidth={0.8}
        vectorEffect="non-scaling-stroke"
      />
      {rackPieces.map(({ piece, bounds }, index) => (
        <rect
          key={piece.id || index}
          x={bounds.minX}
          y={-bounds.maxZ}
          width={bounds.maxX - bounds.minX}
          height={bounds.maxZ - bounds.minZ}
          fill={materialColor(project, piece)}
          stroke="#202020"
          strokeWidth={0.75}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      <DimensionHorizontal
        x1={rack.x1}
        x2={rack.x2}
        sourceY={-rack.z2}
        y={-rack.z2 - paddingY * 0.48}
        color="#059669"
        fontSize={fontSize}
        label={`${Math.round(width)}`}
        name="LARGURA TOTAL"
      />
      <DimensionVertical
        y1={-rack.z2}
        y2={-rack.z1}
        sourceX={rack.x1}
        x={rack.x1 - paddingX * 0.42}
        color="#059669"
        fontSize={fontSize}
        label={`${Math.round(height)}`}
      />

      {rackColumns.map((column, index) => (
        <DimensionHorizontal
          key={`detail-column-${index}`}
          x1={column.x1}
          x2={column.x2}
          sourceY={-rack.z1}
          y={-rack.z1 + paddingY * 0.42}
          color="#dc2626"
          fontSize={fontSize * 0.72}
          label={`${Math.round(column.x2 - column.x1)}`}
        />
      ))}

      {rackRows.map((row, index) => (
        <DimensionVertical
          key={`detail-row-${index}`}
          y1={-row.z2}
          y2={-row.z1}
          sourceX={rack.x2}
          x={rack.x2 + paddingX * 0.38}
          color="#dc2626"
          fontSize={fontSize * 0.72}
          label={`${Math.round(row.z2 - row.z1)}`}
        />
      ))}

      <circle
        cx={rack.x1 - paddingX * 0.62}
        cy={-rack.z2 - paddingY * 0.58}
        r={fontSize * 0.8}
        fill="#fff"
        stroke="#7c3aed"
        strokeWidth={0.7}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={rack.x1 - paddingX * 0.62}
        y={-rack.z2 - paddingY * 0.58 + fontSize * 0.28}
        textAnchor="middle"
        fontSize={fontSize * 0.85}
        fontWeight="700"
        fill="#7c3aed"
      >
        A
      </text>
    </svg>
  );
}


export default RackDetail;
