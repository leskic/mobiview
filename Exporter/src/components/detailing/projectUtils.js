export function materialColor(project, piece) {
  const id = piece.materialId || piece.material;
  return project.materials?.find((material) => material.id === id)?.color || "#d1d5db";
}

export function projectProjection(project) {
  return project?.active_view?.projection || project?.activeView?.projection || "xz";
}

export function pieceBounds(piece, projection = "xz") {
  const positions = piece.geometry?.mesh?.positions;
  if (!Array.isArray(positions) || positions.length < 3) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let index = 0; index < positions.length; index += 3) {
    const worldX = Number(positions[index]);
    const worldY = Number(positions[index + 1]);
    const worldZ = Number(positions[index + 2]);
    const horizontal = projection === "yz" ? worldY : worldX;
    const vertical = projection === "xy" ? worldY : worldZ;
    minX = Math.min(minX, horizontal);
    maxX = Math.max(maxX, horizontal);
    minZ = Math.min(minZ, vertical);
    maxZ = Math.max(maxZ, vertical);
  }

  return { minX, maxX, minZ, maxZ };
}

export function projectPieces(project) {
  if (Array.isArray(project?.pieces)) return project.pieces;
  return (project?.modules || []).flatMap((module) => module.pieces || []);
}

function searchablePieceText(piece) {
  const attributes = piece?.dynamic_attributes || piece?.dynamicAttributes || {};
  return [piece?.name, piece?.type, piece?.category, piece?.layer, piece?.tag,
    piece?.sketchup?.layer, piece?.sketchup?.tag,
    piece?.dinabox?.type, piece?.dinabox?.parsed?.family,
    piece?.dinabox?.parsed?.description,
    piece?.definition_name, piece?.definitionName,
    ...Object.keys(attributes), ...Object.values(attributes)]
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function normalizedTag(piece) {
  return String(piece?.sketchup?.layer || piece?.sketchup?.tag || piece?.layer || piece?.tag || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

export function isDoorPiece(piece) {
  return /(^|[\s_-])(PORTA|DOOR|FRENTE[\s_-]*(DE[\s_-]*)?GAVETA|DRAWER[\s_-]*FRONT|FACHADA)([\s_-]|$)/
    .test(searchablePieceText(piece));
}

export function isHandlePiece(piece) {
  return /(^|[\s_-])(PUXADOR|HANDLE|PERFIL[\s_-]*(PUXADOR|GOLA))([\s_-]|$)/
    .test(searchablePieceText(piece));
}

export function isFrontPiece(piece) {
  const tag = normalizedTag(piece);
  if (!tag || tag === "LAYER0" || tag === "UNTAGGED") return false;
  return /(^|[\s_-])(PORTAS?|FRENTES?|FACHADAS?|PUXADORES?|HANDLES?|DOORS?)([\s_-]|$)/
    .test(tag);
}

export function isRackPiece(piece) {
  return /(^|[\s_-])(COLMEIA|GARRAFEIRO|WINE[\s_-]*RACK|PORTA[\s_-]*GARRAFAS)([\s_-]|$)/
    .test(searchablePieceText(piece));
}

export function detailingCapabilities(project) {
  const pieces = projectPieces(project);
  const doors = pieces.filter(isDoorPiece);
  const fronts = pieces.filter(isFrontPiece);
  const racks = pieces.filter(isRackPiece);
  return { pieces, doors, fronts, racks, hasDoors: doors.length > 0,
    hasFronts: fronts.length > 0, hasRackDetail: racks.length > 0 };
}

export function projectViews(project) {
  const pieces = projectPieces(project);
  const declaredViews = Array.isArray(project?.views) ? project.views : [];

  if (declaredViews.length) {
    return declaredViews.map((view, index) => {
      const ids = new Set(view.piece_ids || view.pieceIds || []);
      return {
        id: view.id || `V${String(index + 1).padStart(2, "0")}`,
        name: view.name || `Vista ${index + 1}`,
        direction: view.direction || "front",
        projection: view.projection || "xz",
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
      projection: "xz",
      pieces: viewPieces,
    }));
  }

  return [{ id: "V01", name: "Principal", direction: "front", projection: "xz", pieces }];
}

export function sheetCode(viewId, code, totalViews) {
  return totalViews > 1 ? `${viewId}-${code}` : code;
}

export function moduleId(piece) {
  return piece.moduleId || piece.module_id || piece.dynamic_attributes?.moduloid || "sem_modulo";
}

export function pieceTechnicalDimensions(piece) {
  const technical = piece.geometry?.technical || piece.technical;
  if (technical?.width && technical?.height && technical?.thickness) {
    return {
      width: Math.round(Number(technical.width)),
      height: Math.round(Number(technical.height)),
      thickness: Math.round(Number(technical.thickness) * 10) / 10,
    };
  }

  const dimensions = piece.geometry?.dimensions || piece.dimensions || {};
  const values = [dimensions.x, dimensions.y, dimensions.z]
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  return {
    width: Math.round(values[0] || dimensions.width || 0),
    height: Math.round(values[1] || dimensions.height || 0),
    thickness: Math.round((values[2] || dimensions.thickness || 0) * 10) / 10,
  };
}

export function materialDisplayName(project, materialId) {
  const known = {
    DB1641393920: "MDF Freijó Guararapes",
    DB1609847226: "MDF Branco TX",
  };
  if (known[materialId]) return known[materialId];
  return project.materials?.find((material) => material.id === materialId)?.name || materialId || "-";
}

export function projectClient(project) {
  const path = project?.project?.path || "";
  const match = path.match(/PROJETOS plano de corte\\([^\\]+)/i);
  return match?.[1] || "CLIENTE";
}

export function formatDate(value) {
  if (!value) return new Date().toLocaleDateString("pt-BR");
  const date = String(value).split(" ")[0].split("-");
  return date.length === 3 ? `${date[2]}/${date[1]}/${date[0]}` : value;
}

export function mergeBounds(items) {
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

export function logicalModules(pieces, limits) {
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

export function internalDimensions(pieces) {
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
