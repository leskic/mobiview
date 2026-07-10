import { useMemo } from "react";
import DimensionHorizontal from "./DimensionHorizontal";
import DimensionVertical from "./DimensionVertical";
import { materialColor, mergeBounds, pieceBounds, projectPieces, projectViews } from "./projectUtils";

function PlanElevation({ project }) {
  const drawing = useMemo(() => {
    const pieces = projectPieces(project)
      .map((piece) => ({ piece, bounds: pieceBounds(piece, "xy") }))
      .filter((item) => item.bounds);
    return { pieces, limits: pieces.length ? mergeBounds(pieces) : null, views: projectViews(project) };
  }, [project]);
  if (!drawing.limits) return <div className="detail-empty">Sem geometria para gerar planta.</div>;
  const { minX, maxX, minZ, maxZ } = drawing.limits;
  const width = Math.max(maxX - minX, 1);
  const depth = Math.max(maxZ - minZ, 1);
  const measure = Math.max(width, depth);
  const padding = measure * .24;
  const fontSize = measure * .018;
  const arrows = drawing.views.map((view, index) => {
    const direction = String(view.direction || "front").toLowerCase();
    const horizontal = direction === "left" || direction === "right";
    const side = direction === "back" || direction === "right" ? 1 : -1;
    return horizontal
      ? { ...view, x1: side > 0 ? maxX + padding * .55 : minX - padding * .55,
          y1: minZ + depth * ((index + 1) / (drawing.views.length + 1)), x2: (minX + maxX) / 2, y2: minZ + depth / 2 }
      : { ...view, x1: minX + width * ((index + 1) / (drawing.views.length + 1)),
          y1: side > 0 ? maxZ + padding * .55 : minZ - padding * .55, x2: minX + width / 2, y2: minZ + depth / 2 };
  });
  return <svg className="detail-elevation" viewBox={`${minX-padding} ${minZ-padding} ${width+padding*2} ${depth+padding*2}`}>
    <defs><marker id="plan-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs>
    {drawing.pieces.map(({ piece, bounds }, index) => <rect key={piece.id || index}
      x={bounds.minX} y={bounds.minZ} width={Math.max(bounds.maxX-bounds.minX,.8)}
      height={Math.max(bounds.maxZ-bounds.minZ,.8)} fill={materialColor(project,piece)}
      stroke="#202020" className="technical-outline" />)}
    <DimensionHorizontal x1={minX} x2={maxX} sourceY={minZ} y={minZ-padding*.34}
      color="#059669" fontSize={fontSize} label={`${Math.round(width)}`} />
    <DimensionVertical y1={minZ} y2={maxZ} sourceX={minX} x={minX-padding*.34}
      color="#059669" fontSize={fontSize} label={`${Math.round(depth)}`} />
    {arrows.map((arrow) => <g className="plan-view-marker" key={arrow.id}>
      <line x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2} markerEnd="url(#plan-arrow)" />
      <circle cx={arrow.x1} cy={arrow.y1} r={fontSize*1.05} />
      <text x={arrow.x1} y={arrow.y1+fontSize*.32} fontSize={fontSize} textAnchor="middle">{arrow.id}</text>
    </g>)}
  </svg>;
}
export default PlanElevation;
