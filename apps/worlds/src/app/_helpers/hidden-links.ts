type Point = { x?: number; y?: number };

/**
 * Richtung (Winkel), in die die Arme zu verborgenen Welten zeigen: weg vom Schwerpunkt
 * der sichtbaren Nachbarn, ohne Nachbarn weg von `fallback` (Mitte der Fläche).
 */
export function outwardAngle(world: Point, neighbors: Point[], fallback: Point): number {
  const from = neighbors.length > 0 ? centroid(neighbors) : { x: fallback.x ?? 0, y: fallback.y ?? 0 };
  const dx = (world.x ?? 0) - from.x;
  const dy = (world.y ?? 0) - from.y;
  return dx === 0 && dy === 0 ? -Math.PI / 2 : Math.atan2(dy, dx);
}

/** Verteilt `count` Arme fächerförmig um `baseAngle` mit `spread` Abstand. */
export function stubAngles(count: number, baseAngle: number, spread = Math.PI / 6): number[] {
  return Array.from({ length: count }, (_, i) => baseAngle + (i - (count - 1) / 2) * spread);
}

function centroid(points: Point[]): { x: number; y: number } {
  const sum = points.reduce((acc, p) => ({ x: acc.x + (p.x ?? 0), y: acc.y + (p.y ?? 0) }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}
