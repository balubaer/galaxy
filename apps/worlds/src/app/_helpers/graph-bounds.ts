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
