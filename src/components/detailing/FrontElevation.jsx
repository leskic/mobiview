import { useMemo } from "react";
import DimensionHorizontal from "./DimensionHorizontal";
import DimensionVertical from "./DimensionVertical";
import {
  internalDimensions,
  isFrontPiece,
  logicalModules,
  materialColor,
  mergeBounds,
  pieceBounds,
  projectPieces,
  projectProjection,
} from "./projectUtils";

function FrontElevation({
  project,
  showOverall,
  showModules,
  showInternal,
  hideFronts = false,
}) {
  const drawing = useMemo(() => {
    const projection = projectProjection(project);
    const allPieces = projectPieces(project)
      .map((piece) => ({ piece, bounds: pieceBounds(piece, projection) }))
      .filter((item) => item.bounds);
    const pieces = hideFronts
      ? allPieces.filter((item) =>
          !isFrontPiece(item.piece) &&
          !/^TORRE\s*\d+$/i.test(String(item.piece.name || "").trim()))
      : allPieces;

    const limits = mergeBounds(allPieces);

    const modules = logicalModules(allPieces, limits);

    return {
      pieces,
      limits,
      modules,
      internal: internalDimensions(allPieces),
    };
  }, [project, hideFronts]);

  if (!drawing.pieces.length) return <div className="detail-empty">Sem geometria para detalhar.</div>;

  const width = Math.max(drawing.limits.maxX - drawing.limits.minX, 1);
  const height = Math.max(drawing.limits.maxZ - drawing.limits.minZ, 1);
  const measure = Math.max(width, height);
  const padding = measure * 0.16;
  const fontSize = measure * 0.018;
  const top = -drawing.limits.maxZ;
  const bottom = -drawing.limits.minZ;
  const overallDimensionY = top - measure * 0.105;
  const moduleDimensionY = top - measure * 0.055;
  const overallDimensionX = drawing.limits.minX - measure * 0.105;
  const viewBox = [
    drawing.limits.minX - padding,
    -drawing.limits.maxZ - padding,
    width + padding * 2,
    height + padding * 2,
  ].join(" ");

  return (
    <svg className="detail-elevation" viewBox={viewBox} aria-label="Elevação frontal">
      <g>
        {drawing.pieces.map(({ piece, bounds }, index) => (
          <rect
            key={piece.id || piece.mv_uuid || index}
            x={bounds.minX}
            y={-bounds.maxZ}
            width={Math.max(bounds.maxX - bounds.minX, 0.8)}
            height={Math.max(bounds.maxZ - bounds.minZ, 0.8)}
            fill={materialColor(project, piece)}
            stroke="#202020"
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {showModules && drawing.modules.map((module) => (
          <DimensionHorizontal
            key={module.id}
            x1={module.minX}
            x2={module.maxX}
            sourceY={top}
            y={moduleDimensionY}
            color="#2563eb"
            fontSize={fontSize}
            label={`${Math.floor(module.maxX - module.minX)}`}
            name={module.name}
          />
        ))}

        {showOverall && (
          <>
            <DimensionHorizontal
              x1={drawing.limits.minX}
              x2={drawing.limits.maxX}
              sourceY={top}
              y={overallDimensionY}
              color="#059669"
              fontSize={fontSize}
              label={`${Math.floor(width)}`}
            />
            <DimensionVertical
              y1={top}
              y2={bottom}
              sourceX={drawing.limits.minX}
              x={overallDimensionX}
              color="#059669"
              fontSize={fontSize}
              label={`${Math.floor(height)}`}
            />
          </>
        )}

        {showInternal && drawing.internal.towers.map(({ tower, gaps, widthReference }, towerIndex) => (
          <g key={`tower-internal-${towerIndex}`}>
            {widthReference && (
              <DimensionHorizontal
                x1={widthReference.bounds.minX}
                x2={widthReference.bounds.maxX}
                sourceY={-tower.bounds.maxZ}
                y={-tower.bounds.maxZ + measure * 0.032}
                color="#ef4444"
                fontSize={fontSize * 0.82}
                label={`${Math.round(widthReference.bounds.maxX - widthReference.bounds.minX)}`}
              />
            )}
            {gaps.map((gap, gapIndex) => (
              <DimensionVertical
                key={`tower-gap-${gapIndex}`}
                y1={-gap.z2}
                y2={-gap.z1}
                sourceX={tower.bounds.maxX}
                x={tower.bounds.maxX - measure * 0.018}
                color="#ef4444"
                fontSize={fontSize * 0.72}
                label={`${Math.round(gap.z2 - gap.z1)}`}
              />
            ))}
          </g>
        ))}

        {showInternal && drawing.internal.adega && (
          <>
            <DimensionHorizontal
              x1={drawing.internal.adega.x1}
              x2={drawing.internal.adega.dividerX1}
              sourceY={-(drawing.internal.adega.bottom + drawing.internal.adega.horizontalBottom) / 2}
              y={-(drawing.internal.adega.bottom + drawing.internal.adega.horizontalBottom) / 2}
              color="#ef4444"
              fontSize={fontSize * 0.82}
              label={`${Math.round(drawing.internal.adega.dividerX1 - drawing.internal.adega.x1)}`}
            />
            <DimensionHorizontal
              x1={drawing.internal.adega.dividerX2}
              x2={drawing.internal.adega.x2}
              sourceY={-(drawing.internal.adega.bottom + drawing.internal.adega.horizontalBottom) / 2}
              y={-(drawing.internal.adega.bottom + drawing.internal.adega.horizontalBottom) / 2}
              color="#ef4444"
              fontSize={fontSize * 0.82}
              label={`${Math.round(drawing.internal.adega.x2 - drawing.internal.adega.dividerX2)}`}
            />
            <DimensionVertical
              y1={-drawing.internal.adega.horizontalBottom}
              y2={-drawing.internal.adega.bottom}
              sourceX={drawing.internal.adega.x1}
              x={drawing.internal.adega.x1 + measure * 0.035}
              color="#ef4444"
              fontSize={fontSize * 0.82}
              label={`${Math.round(drawing.internal.adega.horizontalBottom - drawing.internal.adega.bottom)}`}
            />
            <DimensionVertical
              y1={-drawing.internal.adega.top}
              y2={-drawing.internal.adega.horizontalTop}
              sourceX={drawing.internal.adega.x1}
              x={drawing.internal.adega.x1 + measure * 0.035}
              color="#ef4444"
              fontSize={fontSize * 0.82}
              label={`${Math.round(drawing.internal.adega.top - drawing.internal.adega.horizontalTop)}`}
            />
          </>
        )}

        {hideFronts && showInternal && drawing.internal.detailed && (
          <>
            <DimensionHorizontal
              x1={drawing.internal.detailed.topOpening.x1}
              x2={drawing.internal.detailed.topOpening.x2}
              sourceY={-(drawing.internal.detailed.topOpening.z1 + drawing.internal.detailed.topOpening.z2) / 2}
              y={-(drawing.internal.detailed.topOpening.z1 + drawing.internal.detailed.topOpening.z2) / 2}
              color="#dc2626"
              fontSize={fontSize * 0.78}
              label={`${Math.round(drawing.internal.detailed.topOpening.x2 - drawing.internal.detailed.topOpening.x1)}`}
            />
            <DimensionHorizontal
              x1={drawing.internal.detailed.middleLower.x1}
              x2={drawing.internal.detailed.middleLower.x2}
              sourceY={-(drawing.internal.detailed.middleLower.z1 + drawing.internal.detailed.middleLower.z2) / 2}
              y={-(drawing.internal.detailed.middleLower.z1 + drawing.internal.detailed.middleLower.z2) / 2}
              color="#dc2626"
              fontSize={fontSize * 0.72}
              label={`${Math.round(drawing.internal.detailed.middleLower.x2 - drawing.internal.detailed.middleLower.x1)}`}
            />
            <DimensionVertical
              y1={-drawing.internal.detailed.middleLower.z2}
              y2={-drawing.internal.detailed.middleLower.z1}
              sourceX={drawing.internal.detailed.middleLower.x1}
              x={drawing.internal.detailed.middleLower.x1 + measure * 0.018}
              color="#dc2626"
              fontSize={fontSize * 0.72}
              label={`${Math.round(drawing.internal.detailed.middleLower.z2 - drawing.internal.detailed.middleLower.z1)}`}
            />

            {drawing.internal.detailed.shelfGaps.map((gap, index) => (
              <DimensionVertical
                key={`shelf-gap-${index}`}
                y1={-gap.z2}
                y2={-gap.z1}
                sourceX={drawing.internal.detailed.rightZone.x1}
                x={drawing.internal.detailed.rightZone.x1 + measure * 0.02}
                color="#dc2626"
                fontSize={fontSize * 0.66}
                label={`${Math.round(gap.z2 - gap.z1)}`}
              />
            ))}

            <g className="detail-reference">
              <rect
                x={drawing.internal.detailed.rack.x1 - measure * 0.012}
                y={-drawing.internal.detailed.rack.z2 - measure * 0.012}
                width={drawing.internal.detailed.rack.x2 - drawing.internal.detailed.rack.x1 + measure * 0.024}
                height={drawing.internal.detailed.rack.z2 - drawing.internal.detailed.rack.z1 + measure * 0.024}
                rx={measure * 0.012}
              />
              <circle
                cx={drawing.internal.detailed.rack.x2 + measure * 0.035}
                cy={-drawing.internal.detailed.rack.z2 - measure * 0.025}
                r={fontSize * 0.7}
              />
              <text
                x={drawing.internal.detailed.rack.x2 + measure * 0.035}
                y={-drawing.internal.detailed.rack.z2 - measure * 0.025 + fontSize * 0.26}
                textAnchor="middle"
                fontSize={fontSize * 0.72}
              >
                A
              </text>
            </g>

            <DimensionVertical
              y1={-drawing.internal.detailed.rackUpper.z2}
              y2={-drawing.internal.detailed.rackUpper.z1}
              sourceX={drawing.internal.detailed.rightZone.x2}
              x={drawing.internal.detailed.rightZone.x2 - measure * 0.018}
              color="#dc2626"
              fontSize={fontSize * 0.62}
              label={`${Math.round(drawing.internal.detailed.rackUpper.z2 - drawing.internal.detailed.rackUpper.z1)}`}
            />
          </>
        )}
      </g>
    </svg>
  );
}


export default FrontElevation;
