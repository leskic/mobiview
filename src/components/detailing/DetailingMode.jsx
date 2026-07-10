import { useMemo, useState } from "react";

function materialColor(project, piece) {
  const id = piece.materialId || piece.material;
  return project.materials?.find((material) => material.id === id)?.color || "#d1d5db";
}

function pieceBounds(piece) {
  const positions = piece.geometry?.mesh?.positions;
  if (!Array.isArray(positions) || positions.length < 3) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let index = 0; index < positions.length; index += 3) {
    minX = Math.min(minX, Number(positions[index]));
    maxX = Math.max(maxX, Number(positions[index]));
    minZ = Math.min(minZ, Number(positions[index + 2]));
    maxZ = Math.max(maxZ, Number(positions[index + 2]));
  }

  return { minX, maxX, minZ, maxZ };
}

function projectPieces(project) {
  if (Array.isArray(project?.pieces)) return project.pieces;
  return (project?.modules || []).flatMap((module) => module.pieces || []);
}

function projectViews(project) {
  const pieces = projectPieces(project);
  const declaredViews = Array.isArray(project?.views) ? project.views : [];

  if (declaredViews.length) {
    return declaredViews.map((view, index) => {
      const ids = new Set(view.piece_ids || view.pieceIds || []);
      return {
        id: view.id || `V${String(index + 1).padStart(2, "0")}`,
        name: view.name || `Vista ${index + 1}`,
        direction: view.direction || "front",
        pieces: ids.size
          ? pieces.filter((piece) => ids.has(piece.id || piece.uuid || piece.mv_uuid))
          : pieces.filter(
              (piece) => (piece.view_id || piece.viewId) === view.id
            ),
      };
    });
  }

  const grouped = pieces.reduce((result, piece) => {
    const id = piece.view_id || piece.viewId;
    if (id) (result[id] ||= []).push(piece);
    return result;
  }, {});

  if (Object.keys(grouped).length) {
    return Object.entries(grouped).map(([id, viewPieces], index) => ({
      id,
      name: `Vista ${index + 1}`,
      direction: "front",
      pieces: viewPieces,
    }));
  }

  return [{ id: "V01", name: "Principal", direction: "front", pieces }];
}

function sheetCode(viewId, code, totalViews) {
  return totalViews > 1 ? `${viewId}-${code}` : code;
}

function moduleId(piece) {
  return piece.moduleId || piece.module_id || piece.dynamic_attributes?.moduloid || "sem_modulo";
}

function mergeBounds(items) {
  return items.reduce(
    (result, item) => ({
      minX: Math.min(result.minX, item.bounds.minX),
      maxX: Math.max(result.maxX, item.bounds.maxX),
      minZ: Math.min(result.minZ, item.bounds.minZ),
      maxZ: Math.max(result.maxZ, item.bounds.maxZ),
    }),
    { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
  );
}

function logicalModules(pieces, limits) {
  const normalizedName = (piece) => String(piece.name || "").trim().toUpperCase();
  const towerShells = pieces.filter(
    (item) => normalizedName(item.piece) === "TORRE"
  );
  const falseAirFronts = pieces.filter((item) =>
    normalizedName(item.piece).includes("TAMPA FRONTAL AR FALSO")
  );

  if (towerShells.length && falseAirFronts.length) {
    const towerEnd = Math.max(...towerShells.map((item) => item.bounds.maxX));
    const falseAirStart = Math.min(
      ...falseAirFronts.map((item) => item.bounds.minX)
    );
    const falseAirEnd = Math.max(
      ...falseAirFronts.map((item) => item.bounds.maxX)
    );

    return [
      { id: "torres", name: "TORRES", minX: limits.minX, maxX: towerEnd },
      { id: "adega", name: "ADEGA", minX: towerEnd, maxX: falseAirStart },
      {
        id: "ar-falso",
        name: "AR FALSO",
        minX: falseAirStart,
        maxX: falseAirEnd,
      },
    ];
  }

  const grouped = pieces.reduce((result, item) => {
    const id = moduleId(item.piece);
    (result[id] ||= []).push(item);
    return result;
  }, {});

  return Object.entries(grouped)
    .map(([id, items]) => {
      const bounds = mergeBounds(items);
      return { id, name: `MÓDULO ${id}`, minX: bounds.minX, maxX: bounds.maxX };
    })
    .filter((module) => module.maxX - module.minX > 30)
    .sort((a, b) => a.minX - b.minX);
}

function internalDimensions(pieces) {
  const nameOf = (item) => String(item.piece.name || "").trim().toUpperCase();
  const towerMarkers = pieces
    .filter((item) => /^TORRE\s*\d+$/i.test(String(item.piece.name || "").trim()))
    .sort((a, b) => a.bounds.minX - b.bounds.minX);

  const towers = towerMarkers.map((tower) => {
    const shelves = pieces
      .filter((item) => {
        if (nameOf(item) !== "PRATELEIRA") return false;
        const centerX = (item.bounds.minX + item.bounds.maxX) / 2;
        return centerX > tower.bounds.minX && centerX < tower.bounds.maxX;
      })
      .sort((a, b) => a.bounds.minZ - b.bounds.minZ);

    const gaps = [];
    let previousZ = tower.bounds.minZ;
    shelves.forEach((shelf) => {
      if (shelf.bounds.minZ - previousZ > 40) {
        gaps.push({ z1: previousZ, z2: shelf.bounds.minZ });
      }
      previousZ = Math.max(previousZ, shelf.bounds.maxZ);
    });
    if (tower.bounds.maxZ - previousZ > 40) {
      gaps.push({ z1: previousZ, z2: tower.bounds.maxZ });
    }

    const widthReference = shelves.reduce(
      (widest, shelf) =>
        !widest || shelf.bounds.maxX - shelf.bounds.minX > widest.bounds.maxX - widest.bounds.minX
          ? shelf
          : widest,
      null
    );

    return { tower, gaps, widthReference };
  });

  const mainVertical = pieces
    .filter((item) => nameOf(item) === "DIVISORIA VERTICAL")
    .sort(
      (a, b) =>
        b.bounds.maxZ - b.bounds.minZ - (a.bounds.maxZ - a.bounds.minZ)
    )[0];
  const mainHorizontal = pieces
    .filter((item) => nameOf(item) === "DIVISORIA HORIZONTAL")
    .sort(
      (a, b) =>
        b.bounds.maxX - b.bounds.minX - (a.bounds.maxX - a.bounds.minX)
    )[0];
  const base = pieces.find((item) => nameOf(item) === "BASE ADEGA");
  const top = pieces.find((item) => nameOf(item) === "TOPO ADEGA");
  const falseAir = pieces.find((item) =>
    nameOf(item).includes("TAMPA FRONTAL AR FALSO")
  );

  const adega =
    mainVertical && mainHorizontal && base && top && falseAir
      ? {
          x1: base.bounds.minX,
          dividerX1: mainVertical.bounds.minX,
          dividerX2: mainVertical.bounds.maxX,
          x2: falseAir.bounds.minX,
          bottom: base.bounds.maxZ,
          horizontalBottom: mainHorizontal.bounds.minZ,
          horizontalTop: mainHorizontal.bounds.maxZ,
          top: top.bounds.minZ,
        }
      : null;

  const secondaryVertical = pieces
    .filter((item) => nameOf(item) === "DIVISORIA VERTICAL")
    .sort(
      (a, b) =>
        a.bounds.maxZ - a.bounds.minZ - (b.bounds.maxZ - b.bounds.minZ)
    )[0];
  const rightHorizontalPieces = pieces
    .filter((item) => {
      const name = nameOf(item);
      return (
        item.bounds.minX >= (mainVertical?.bounds.maxX || Infinity) - 1 &&
        item.bounds.maxX <= (falseAir?.bounds.minX || -Infinity) + 1 &&
        (name === "DIVISORIA HORIZONTAL" || name.includes("RODATETO"))
      );
    })
    .filter((item) => item.bounds.minZ > 850 && item.bounds.maxZ < 1500);

  const horizontalClusters = rightHorizontalPieces
    .sort((a, b) => a.bounds.minZ - b.bounds.minZ)
    .reduce((clusters, item) => {
      const last = clusters[clusters.length - 1];
      if (!last || item.bounds.minZ > last.maxZ + 20) {
        clusters.push({ minZ: item.bounds.minZ, maxZ: item.bounds.maxZ });
      } else {
        last.minZ = Math.min(last.minZ, item.bounds.minZ);
        last.maxZ = Math.max(last.maxZ, item.bounds.maxZ);
      }
      return clusters;
    }, []);

  const rackHorizontal = pieces
    .filter((item) => {
      const width = item.bounds.maxX - item.bounds.minX;
      const height = item.bounds.maxZ - item.bounds.minZ;
      return (
        nameOf(item) === "TAMPONAMENTO" &&
        width > 400 &&
        height < 40 &&
        item.bounds.maxZ < 800
      );
    })
    .sort((a, b) => a.bounds.minZ - b.bounds.minZ);
  const rackVertical = pieces
    .filter((item) => {
      const width = item.bounds.maxX - item.bounds.minX;
      const height = item.bounds.maxZ - item.bounds.minZ;
      return (
        nameOf(item) === "TAMPONAMENTO" &&
        width < 40 &&
        height > 400 &&
        item.bounds.maxZ < 800
      );
    })
    .sort((a, b) => a.bounds.minX - b.bounds.minX);

  let detailed = null;
  if (adega && secondaryVertical && rackHorizontal.length && rackVertical.length) {
    const rackX1 = Math.min(...rackHorizontal.map((item) => item.bounds.minX));
    const rackX2 = Math.max(...rackHorizontal.map((item) => item.bounds.maxX));
    const rackBottom = adega.bottom;
    const rackTop = Math.max(...rackVertical.map((item) => item.bounds.maxZ));
    const rackColumns = [];
    let previousX = rackX1;
    rackVertical.forEach((panel) => {
      if (panel.bounds.minX - previousX > 30) {
        rackColumns.push({ x1: previousX, x2: panel.bounds.minX });
      }
      previousX = panel.bounds.maxX;
    });
    if (rackX2 - previousX > 30) {
      rackColumns.push({ x1: previousX, x2: rackX2 });
    }

    const rackRows = [];
    let previousZ = rackBottom;
    rackHorizontal.forEach((panel) => {
      if (panel.bounds.minZ - previousZ > 30) {
        rackRows.push({ z1: previousZ, z2: panel.bounds.minZ });
      }
      previousZ = panel.bounds.maxZ;
    });

    const shelfGaps = [];
    if (horizontalClusters.length >= 2) {
      shelfGaps.push({
        z1: horizontalClusters[0].maxZ,
        z2: horizontalClusters[1].minZ,
      });
      shelfGaps.push({
        z1: horizontalClusters[1].maxZ,
        z2: adega.horizontalBottom,
      });
    }

    detailed = {
      topOpening: {
        x1: adega.x1,
        x2: adega.x2,
        z1: adega.horizontalTop,
        z2: adega.top,
      },
      middleLower: {
        x1: adega.dividerX2,
        x2: secondaryVertical.bounds.minX,
        z1: adega.bottom,
        z2: horizontalClusters[0]?.minZ || adega.horizontalBottom,
      },
      rightZone: {
        x1: secondaryVertical.bounds.maxX,
        x2: adega.x2,
      },
      shelfGaps,
      rack: { x1: rackX1, x2: rackX2, z1: rackBottom, z2: rackTop },
      rackColumns,
      rackRows,
      rackUpper: {
        z1: Math.max(...rackHorizontal.map((item) => item.bounds.maxZ)),
        z2: horizontalClusters[0]?.minZ || adega.horizontalBottom,
      },
    };
  }

  return { towers, adega, detailed };
}

function DimensionHorizontal({
  x1,
  x2,
  sourceY,
  y,
  color,
  fontSize,
  label,
  name,
}) {
  const tick = fontSize * 0.55;
  return (
    <g className="detail-dimension" stroke={color} fill={color}>
      <line x1={x1} y1={sourceY} x2={x1} y2={y + tick} />
      <line x1={x2} y1={sourceY} x2={x2} y2={y + tick} />
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - tick} x2={x1} y2={y + tick} />
      <line x1={x2} y1={y - tick} x2={x2} y2={y + tick} />
      <text
        x={(x1 + x2) / 2}
        y={y - fontSize * 0.35}
        fontSize={fontSize}
        textAnchor="middle"
        stroke="#ffffff"
        strokeWidth={fontSize * 0.34}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {label}
      </text>
      {name && (
        <text
          x={(x1 + x2) / 2}
          y={y + fontSize * 1.25}
          fontSize={Math.min(
            fontSize * 0.72,
            (x2 - x1) / Math.max(name.length * 0.72, 1)
          )}
          textAnchor="middle"
          stroke="#ffffff"
          strokeWidth={fontSize * 0.3}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {name}
        </text>
      )}
    </g>
  );
}

function DimensionVertical({ y1, y2, sourceX, x, color, fontSize, label }) {
  const tick = fontSize * 0.55;
  const middle = (y1 + y2) / 2;
  return (
    <g className="detail-dimension" stroke={color} fill={color}>
      <line x1={sourceX} y1={y1} x2={x - tick} y2={y1} />
      <line x1={sourceX} y1={y2} x2={x - tick} y2={y2} />
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - tick} y1={y1} x2={x + tick} y2={y1} />
      <line x1={x - tick} y1={y2} x2={x + tick} y2={y2} />
      <text
        x={x - fontSize * 0.45}
        y={middle}
        fontSize={fontSize}
        textAnchor="middle"
        stroke="#ffffff"
        strokeWidth={fontSize * 0.34}
        strokeLinejoin="round"
        paintOrder="stroke"
        transform={`rotate(-90 ${x - fontSize * 0.45} ${middle})`}
      >
        {label}
      </text>
    </g>
  );
}

function projectClient(project) {
  const path = project?.project?.path || "";
  const match = path.match(/PROJETOS plano de corte\\([^\\]+)/i);
  return match?.[1] || "CLIENTE";
}

function formatDate(value) {
  if (!value) return new Date().toLocaleDateString("pt-BR");
  const date = String(value).split(" ")[0].split("-");
  return date.length === 3 ? `${date[2]}/${date[1]}/${date[0]}` : value;
}

function FrontElevation({
  project,
  showOverall,
  showModules,
  showInternal,
  hideFronts = false,
}) {
  const drawing = useMemo(() => {
    const allPieces = projectPieces(project)
      .map((piece) => ({ piece, bounds: pieceBounds(piece) }))
      .filter((item) => item.bounds);
    const pieces = hideFronts
      ? allPieces.filter((item) => {
          const name = String(item.piece.name || "").trim();
          return !/^PORTA\s/i.test(name) &&
            !/^PUXADOR$/i.test(name) &&
            !/^TORRE\s*\d+$/i.test(name);
        })
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

function RackDetail({ project }) {
  const drawing = useMemo(() => {
    const pieces = projectPieces(project)
      .map((piece) => ({ piece, bounds: pieceBounds(piece) }))
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
        strokeWidth={3}
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
          strokeWidth={2.2}
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
        strokeWidth={2}
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

function DoorElevation({ project }) {
  const drawing = useMemo(() => {
    const pieces = projectPieces(project)
      .map((piece) => ({ piece, bounds: pieceBounds(piece) }))
      .filter((item) => item.bounds);
    const limits = mergeBounds(pieces);
    const doors = pieces
      .filter((item) => /^PORTA\s/i.test(String(item.piece.name || "")))
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
            strokeWidth={2}
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
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={opensLeft ? x1 : x2}
              y1={y1}
              x2={opensLeft ? x2 : x1}
              y2={(y1 + y2) / 2}
              stroke="#7c3aed"
              strokeWidth={1.4}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={opensLeft ? x1 : x2}
              y1={y2}
              x2={opensLeft ? x2 : x1}
              y2={(y1 + y2) / 2}
              stroke="#7c3aed"
              strokeWidth={1.4}
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

function DetailCallout({
  x,
  y,
  targetX,
  targetY,
  title,
  subtitle,
  fontSize,
  swatch,
  elbowOffset = 150,
}) {
  const textWidth = Math.max(title.length * fontSize * 0.58, 560);
  const boxX = x - fontSize * 0.35;
  const boxY = y - fontSize * 1.05;
  const elbowX = x - elbowOffset;
  return (
    <g className="mounting-callout">
      <polyline
        points={`${boxX},${y} ${elbowX},${y} ${elbowX},${targetY} ${targetX},${targetY}`}
        markerEnd="url(#detail-arrow)"
      />
      <rect
        className="callout-background"
        x={boxX}
        y={boxY}
        width={textWidth + fontSize * 0.9}
        height={fontSize * 2.05}
        rx={fontSize * 0.12}
      />
      {swatch && (
        <rect
          x={x}
          y={y - fontSize * 0.72}
          width={fontSize * 0.72}
          height={fontSize * 0.72}
          fill={swatch}
          stroke="#111827"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <text
        x={x + (swatch ? fontSize : 0)}
        y={y - fontSize * 0.2}
        fontSize={fontSize}
        fontWeight="700"
      >
        {title}
      </text>
      <text
        x={x + (swatch ? fontSize : 0)}
        y={y + fontSize * 0.72}
        fontSize={fontSize * 0.76}
      >
        {subtitle}
      </text>
    </g>
  );
}

function MountingElevation({ project }) {
  const drawing = useMemo(() => {
    const pieces = projectPieces(project)
      .map((piece) => ({ piece, bounds: pieceBounds(piece) }))
      .filter((item) => item.bounds);
    const limits = mergeBounds(pieces);
    const doors = pieces
      .filter((item) => /^PORTA\s/i.test(String(item.piece.name || "")))
      .sort((a, b) => a.bounds.minX - b.bounds.minX);
    const handles = pieces
      .filter((item) => /^PUXADOR$/i.test(String(item.piece.name || "").trim()))
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
    ? {
        x: (firstDoor.bounds.minX + firstDoor.bounds.maxX) / 2,
        y: -(firstDoor.bounds.minZ + firstDoor.bounds.maxZ) / 2,
      }
    : { x: drawing.limits.minX, y: -drawing.limits.minZ };
  const handleCenter = firstHandle
    ? {
        x: (firstHandle.bounds.minX + firstHandle.bounds.maxX) / 2,
        y: -(firstHandle.bounds.minZ + firstHandle.bounds.maxZ) / 2,
      }
    : doorCenter;
  const whiteCenter = drawing.whitePiece
    ? {
        x: (drawing.whitePiece.bounds.minX + drawing.whitePiece.bounds.maxX) / 2,
        y: -(drawing.whitePiece.bounds.minZ + drawing.whitePiece.bounds.maxZ) / 2,
      }
    : { x: drawing.limits.maxX * 0.7, y: -drawing.limits.maxZ * 0.4 };
  const brownCenter = drawing.brownPiece
    ? {
        x: (drawing.brownPiece.bounds.minX + drawing.brownPiece.bounds.maxX) / 2,
        y: -(drawing.brownPiece.bounds.minZ + drawing.brownPiece.bounds.maxZ) / 2,
      }
    : doorCenter;
  const calloutX = drawing.limits.minX + width * 0.56;

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
          strokeWidth={2.2}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      <DetailCallout
        x={calloutX}
        y={-drawing.limits.maxZ * 0.84}
        targetX={firstDoor?.bounds.minX || doorCenter.x}
        targetY={doorCenter.y - 420}
        title="DOBRADIÇA COM AMORTECIMENTO"
        subtitle="5 POR PORTA ALTA - 20 UNIDADES"
        fontSize={fontSize * 0.82}
        elbowOffset={150}
      />
      <DetailCallout
        x={calloutX}
        y={-drawing.limits.maxZ * 0.64}
        targetX={handleCenter.x}
        targetY={handleCenter.y}
        title="PUXADOR USINADO RETO"
        subtitle="4 PORTAS - POSIÇÃO CENTRAL"
        fontSize={fontSize * 0.82}
        elbowOffset={205}
      />
      <DetailCallout
        x={calloutX}
        y={-drawing.limits.maxZ * 0.43}
        targetX={brownCenter.x}
        targetY={brownCenter.y}
        title="MDF FREIJÓ GUARARAPES"
        subtitle="#A18158 - FRENTES E ACABAMENTOS"
        fontSize={fontSize * 0.82}
        swatch="#a18158"
        elbowOffset={260}
      />
      <DetailCallout
        x={calloutX}
        y={-drawing.limits.maxZ * 0.25}
        targetX={whiteCenter.x}
        targetY={whiteCenter.y}
        title="MDF BRANCO TX"
        subtitle="#FFFFFF - INTERIORES"
        fontSize={fontSize * 0.82}
        swatch="#ffffff"
        elbowOffset={315}
      />
    </svg>
  );
}

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

function DetailingMode({ project, onClose }) {
  const views = useMemo(() => projectViews(project), [project]);
  const [activeViewId, setActiveViewId] = useState(views[0]?.id || "V01");
  const [showOverall, setShowOverall] = useState(true);
  const [showModules, setShowModules] = useState(true);
  const [showInternal, setShowInternal] = useState(true);
  const [activeSheet, setActiveSheet] = useState("DT1.1");
  const activeView =
    views.find((view) => view.id === activeViewId) || views[0];
  const viewProject = useMemo(
    () => ({ ...project, pieces: activeView?.pieces || [] }),
    [project, activeView]
  );
  const code = (value) => sheetCode(activeView?.id || "V01", value, views.length);

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
          <button
            className={activeSheet === "DT1.1" ? "active" : ""}
            onClick={() => setActiveSheet("DT1.1")}
          >
            DT1.1 Cotas
          </button>
          <button
            className={activeSheet === "DT1.2" ? "active" : ""}
            onClick={() => setActiveSheet("DT1.2")}
          >
            DT1.2 Portas
          </button>
          <button
            className={activeSheet === "DT1.3" ? "active" : ""}
            onClick={() => setActiveSheet("DT1.3")}
          >
            DT1.3 Montagem
          </button>
          <button
            className={activeSheet === "DT1.4" ? "active" : ""}
            onClick={() => setActiveSheet("DT1.4")}
          >
            DT1.4 Interna
          </button>
          <button
            className={activeSheet === "DT1.5" ? "active" : ""}
            onClick={() => setActiveSheet("DT1.5")}
          >
            DT1.5 Detalhe A
          </button>
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
        <button onClick={() => window.print()}>Imprimir / Salvar PDF</button>
      </div>

      <div className="detail-stage">
        <article className={`detail-sheet ${activeSheet !== "DT1.1" ? "is-hidden" : ""}`}>
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

        <article className={`detail-sheet ${activeSheet !== "DT1.2" ? "is-hidden" : ""}`}>
          <div className="detail-content">
            <h2>VISTA FRONTAL - DIMENSÕES DAS PORTAS</h2>
            <DoorElevation project={viewProject} />
            <div className="detail-caption">
              <span>ESCALA AUTOMÁTICA</span>
              <span>4 PORTAS IDENTIFICADAS</span>
            </div>
          </div>
          <TitleBlock
            project={viewProject}
            content="DIMENSÕES DAS PORTAS"
            sheetNumber={code("DT1.2")}
          />
        </article>

        <article className={`detail-sheet ${activeSheet !== "DT1.3" ? "is-hidden" : ""}`}>
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

        <article className={`detail-sheet ${activeSheet !== "DT1.4" ? "is-hidden" : ""}`}>
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
              <span>PORTAS OCULTADAS</span>
            </div>
          </div>
          <TitleBlock
            project={viewProject}
            content="VISTA INTERNA"
            sheetNumber={code("DT1.4")}
          />
        </article>

        <article className={`detail-sheet ${activeSheet !== "DT1.5" ? "is-hidden" : ""}`}>
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
        </article>
      </div>
    </section>
  );
}

export default DetailingMode;