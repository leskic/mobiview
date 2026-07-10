import { useMemo } from "react";
import DimensionHorizontal from "./DimensionHorizontal";
import DimensionVertical from "./DimensionVertical";
import {
  isDoorPiece,
  materialColor,
  mergeBounds,
  pieceBounds,
  projectPieces,
  projectProjection,
} from "./projectUtils";

function DoorElevation({ project }) {
  const drawing = useMemo(() => {
    const projection = projectProjection(project);
    const pieces = projectPieces(project)
      .map((piece) => ({ piece, bounds: pieceBounds(piece, projection) }))
      .filter((item) => item.bounds);
    const limits = mergeBounds(pieces);
    const doors = pieces
      .filter((item) => isDoorPiece(item.piece))
      .sort((a, b) => a.bounds.minX - b.bounds.minX);
    return { pieces, limits, doors };
  }, [project]);

  if (!drawing.pieces.length) return <div className="detail-empty">Sem geometria para detalhar.</div>;

  const width = drawing.limits.maxX - drawing.limits.minX;
  const height = drawing.limits.maxZ - drawing.limits.minZ;
  const measure = Math.max(width, height);
  const padding = measure * 0.13;
  const fontSize = measure * 0.018;
  const top = -drawing.limits.maxZ;
  const viewBox = [
    drawing.limits.minX - padding,
    -drawing.limits.maxZ - padding,
    width + padding * 2,
    height + padding * 2,
  ].join(" ");

  return (
    <svg className="detail-elevation" viewBox={viewBox} aria-label="Dimensões das portas">
      <g className="door-background">
        {drawing.pieces.map(({ piece, bounds }, index) => (
          <rect
            key={piece.id || piece.mv_uuid || index}
            x={bounds.minX}
            y={-bounds.maxZ}
            width={Math.max(bounds.maxX - bounds.minX, 0.8)}
            height={Math.max(bounds.maxZ - bounds.minZ, 0.8)}
            fill="#f3f4f6"
            stroke="#9ca3af"
            strokeWidth={0.7}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      {drawing.doors.map(({ piece, bounds }, index) => {
        const x1 = bounds.minX;
        const x2 = bounds.maxX;
        const y1 = -bounds.maxZ;
        const y2 = -bounds.minZ;
        const opensLeft = index % 2 === 0;
        return (
          <g key={`door-${piece.id || index}`} className="door-detail">
            <rect
              x={x1}
              y={y1}
              width={x2 - x1}
              height={y2 - y1}
              fill={materialColor(project, piece)}
              stroke="#202020"
              strokeWidth={0.85}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={opensLeft ? x1 : x2}
              y1={y1}
              x2={opensLeft ? x2 : x1}
              y2={(y1 + y2) / 2}
              stroke="#7c3aed"
              strokeWidth={0.65}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={opensLeft ? x1 : x2}
              y1={y2}
              x2={opensLeft ? x2 : x1}
              y2={(y1 + y2) / 2}
              stroke="#7c3aed"
              strokeWidth={0.65}
              vectorEffect="non-scaling-stroke"
            />
            <DimensionHorizontal
              x1={x1}
              x2={x2}
              sourceY={y1}
              y={top - measure * 0.035}
              color="#111827"
              fontSize={fontSize * 0.82}
              label={`${Math.round(x2 - x1)}`}
            />
            <DimensionVertical
              y1={y1}
              y2={y2}
              sourceX={opensLeft ? x1 : x2}
              x={(x1 + x2) / 2}
              color="#7c3aed"
              fontSize={fontSize * 0.76}
              label={`${Math.round(y2 - y1)}`}
            />
          </g>
        );
      })}
    </svg>
  );
}


export default DoorElevation;
