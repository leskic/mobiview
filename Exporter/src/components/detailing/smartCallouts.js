export function layoutCallouts(items, options) {
  const {
    x,
    top,
    bottom,
    baseElbow = 150,
    elbowStep = 55,
  } = options;

  if (!items.length) return [];

  const ordered = [...items].sort(
    (a, b) => a.targetY - b.targetY || a.targetX - b.targetX
  );
  const available = Math.max(bottom - top, 1);
  const step = items.length > 1 ? available / (items.length - 1) : 0;

  return ordered.map((item, index) => ({
    ...item,
    x,
    y: top + step * index,
    elbowOffset: baseElbow + elbowStep * index,
  }));
}

export function pointFromBounds(bounds) {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: -(bounds.minZ + bounds.maxZ) / 2,
  };
}
