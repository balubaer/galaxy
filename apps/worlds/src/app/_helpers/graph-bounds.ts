/**
 * Begrenzt einen Wert auf die Darstellungsfläche [margin, size - margin],
 * damit Welten beim Ziehen und in der Simulation sichtbar bleiben.
 */
export function clampToArea(value: number, size: number, margin: number): number {
  return Math.max(margin, Math.min(size - margin, value));
}

/** Setzt x/y (und fixierte fx/fy) aller Knoten auf die Darstellungsfläche zurück. */
export function keepNodesInArea(
  nodes: { x?: number; y?: number; fx?: number | null; fy?: number | null }[],
  width: number,
  height: number,
  margin: number
): void {
  for (const node of nodes) {
    if (node.x !== undefined) node.x = clampToArea(node.x, width, margin);
    if (node.y !== undefined) node.y = clampToArea(node.y, height, margin);
    if (node.fx != null) node.fx = clampToArea(node.fx, width, margin);
    if (node.fy != null) node.fy = clampToArea(node.fy, height, margin);
  }
}

/**
 * Setzt die Welt `worldId` in die Mitte (cx, cy). Gespeicherte (fixierte) Positionen
 * werden gemeinsam verschoben, damit das Layout erhalten bleibt; ohne gespeicherte
 * Position wird die Welt in der Mitte fixiert. Liefert false, wenn die Welt fehlt.
 */
export function centerOnWorld(
  nodes: { id: string; x?: number; y?: number; fx?: number | null; fy?: number | null }[],
  worldId: string,
  cx: number,
  cy: number
): boolean {
  const world = nodes.find((n) => n.id === worldId);
  if (!world) {
    return false;
  }
  if (world.fx != null && world.fy != null) {
    const dx = cx - world.fx;
    const dy = cy - world.fy;
    for (const node of nodes) {
      if (node.fx != null && node.fy != null) {
        node.fx += dx;
        node.fy += dy;
        node.x = node.fx;
        node.y = node.fy;
      }
    }
  } else {
    world.x = world.fx = cx;
    world.y = world.fy = cy;
  }
  return true;
}
