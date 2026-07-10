import { useMemo } from "react";
import DetailCallout from "./DetailCallout";
import { layoutCallouts, pointFromBounds } from "./smartCallouts";
import {
  isDoorPiece,
  isHandlePiece,
  materialColor,
  mergeBounds,
  pieceBounds,
  projectPieces,
  projectProjection,
} from "./projectUtils";

function MountingElevation({ project }) {
  const drawing = useMemo(() => {
    const projection = projectProjection(project);
    const pieces = projectPieces(project)
      .map((piece) => ({ piece, bounds: pieceBounds(piece, projection) }))
      .filter((item) => item.bounds);
    const limits = mergeBounds(pieces);
    const doors = pieces
      .filter((item) => isDoorPiece(item.piece))
      .sort((a, b) => a.bounds.minX - b.bounds.minX);
    const handles = pieces
      .filter((item) => isHandlePiece(item.piece))
      .sort((a, b) => a.bounds.minX - b.bounds.minX);
    const rightSide = limits.minX + (limits.maxX - limits.minX) * 0.45;
    const brownPiece = pieces
      .filter(
        (item) =>
          (item.piece.material || item.piece.materialId) === "DB1641393920" &&
          item.bounds.minX > rightSide
      )
      .sort((a, b) => b.bounds.minX - a.bounds.minX)[0];
    const whitePiece = pieces
      .filter(
        (item) =>
          (item.piece.material || item.piece.materialId) === "DB1609847226" &&
          item.bounds.minX > rightSide
      )
      .sort((a, b) => b.bounds.minX - a.bounds.minX)[0];
    return { pieces, limits, doors, handles, brownPiece, whitePiece };
  }, [project]);

  if (!drawing.pieces.length) return <div className="detail-empty">Sem geometria para detalhar.</div>;

  const width = drawing.limits.maxX - drawing.limits.minX;
  const height = drawing.limits.maxZ - drawing.limits.minZ;
  const measure = Math.max(width, height);
  const padding = measure * 0.1;
  const fontSize = measure * 0.017;
  const viewBox = [
    drawing.limits.minX - padding,
    -drawing.limits.maxZ - padding,
    width + padding * 2,
    height + padding * 2,
  ].join(" ");

  const firstDoor = drawing.doors[0];
  const firstHandle = drawing.handles[0];
  const doorCenter = firstDoor
    ? pointFromBounds(firstDoor.bounds)
    : { x: drawing.limits.minX, y: -drawing.limits.minZ };
  const handleCenter = firstHandle
    ? pointFromBounds(firstHandle.bounds)
    : doorCenter;
  const whiteCenter = drawing.whitePiece
    ? pointFromBounds(drawing.whitePiece.bounds)
    : { x: drawing.limits.maxX * 0.7, y: -drawing.limits.maxZ * 0.4 };
  const brownCenter = drawing.brownPiece
    ? pointFromBounds(drawing.brownPiece.bounds)
    : doorCenter;
  const calloutX = drawing.limits.minX + width * 0.56;
  const callouts = layoutCallouts(
    [
      {
        id: "hinge",
        targetX: firstDoor?.bounds.minX || doorCenter.x,
        targetY: doorCenter.y - 420,
        title: "DOBRADIÇA COM AMORTECIMENTO",
        subtitle: "5 POR PORTA ALTA - 20 UNIDADES",
      },
      {
        id: "handle",
        targetX: handleCenter.x,
        targetY: handleCenter.y,
        title: "PUXADOR USINADO RETO",
        subtitle: "4 PORTAS - POSIÇÃO CENTRAL",
      },
      {
        id: "brown-material",
        targetX: brownCenter.x,
        targetY: brownCenter.y,
        title: "MDF FREIJÓ GUARARAPES",
        subtitle: "#A18158 - FRENTES E ACABAMENTOS",
        swatch: "#a18158",
      },
      {
        id: "white-material",
        targetX: whiteCenter.x,
        targetY: whiteCenter.y,
        title: "MDF BRANCO TX",
        subtitle: "#FFFFFF - INTERIORES",
        swatch: "#ffffff",
      },
    ],
    {
      x: calloutX,
      top: -drawing.limits.maxZ * 0.84,
      bottom: -drawing.limits.maxZ * 0.25,
      baseElbow: measure * 0.035,
      elbowStep: measure * 0.013,
    }
  );

  return (
    <svg className="detail-elevation" viewBox={viewBox} aria-label="Códigos e detalhes de montagem">
      <defs>
        <marker
          id="detail-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5.5"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#111827" />
        </marker>
      </defs>
      {drawing.pieces.map(({ piece, bounds }, index) => (
        <rect
          key={piece.id || piece.mv_uuid || index}
          x={bounds.minX}
          y={-bounds.maxZ}
          width={Math.max(bounds.maxX - bounds.minX, 0.8)}
          height={Math.max(bounds.maxZ - bounds.minZ, 0.8)}
          fill={materialColor(project, piece)}
          stroke="#303030"
          strokeWidth={0.8}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {callouts.map((callout) => (
        <DetailCallout
          key={callout.id}
          {...callout}
          fontSize={fontSize * 0.82}
        />
      ))}
    </svg>
  );
}


export default MountingElevation;
