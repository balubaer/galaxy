type LayoutNode = { id: string; x?: number; y?: number };
type LayoutLink = { source: string | { id: string }; target: string | { id: string } };

const idOf = (end: string | { id: string }) => (typeof end === 'string' ? end : end.id);

/**
 * Ring jeder Welt = Anzahl Sprünge von `centerId` (Breitensuche über die Links).
 * Nicht erreichbare Welten bekommen einen eigenen Ring außerhalb der übrigen.
 */
export function ringDepths(nodes: LayoutNode[], links: LayoutLink[], centerId: string): Map<string, number> {
  const neighbors = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  for (const link of links) {
    const source = idOf(link.source);
    const target = idOf(link.target);
    neighbors.get(source)?.push(target);
    neighbors.get(target)?.push(source);
  }
  const depths = new Map<string, number>();
  if (neighbors.has(centerId)) {
    depths.set(centerId, 0);
    const queue = [centerId];
    while (queue.length > 0) {
      const id = queue.shift() as string;
      for (const next of neighbors.get(id) ?? []) {
        if (!depths.has(next)) {
          depths.set(next, (depths.get(id) as number) + 1);
          queue.push(next);
        }
      }
    }
  }
  const outer = Math.max(0, ...depths.values()) + 1;
  for (const node of nodes) {
    if (!depths.has(node.id)) {
      depths.set(node.id, outer);
    }
  }
  return depths;
}

/**
 * Ordnet die Welten auf Ringen um `centerId` an: Ring k liegt bei k / maxRing · maxRadius,
 * die Welten eines Rings sind gleichmäßig verteilt und folgen der Richtung ihrer
 * Nachbarn im inneren Ring, damit sich möglichst wenige Verbindungen kreuzen.
 * Setzt nur x/y; liefert den Ring jeder Welt.
 */
export function applyRingLayout(
  nodes: LayoutNode[],
  links: LayoutLink[],
  centerId: string,
  cx: number,
  cy: number,
  maxRadius: number
): Map<string, number> {
  const depths = ringDepths(nodes, links, centerId);
  const maxRing = Math.max(1, ...depths.values());
  const angles = new Map<string, number>();
  const innerNeighbors = new Map<string, string[]>();
  for (const link of links) {
    const source = idOf(link.source);
    const target = idOf(link.target);
    if (depths.get(source) === (depths.get(target) ?? 0) - 1) {
      innerNeighbors.set(target, [...(innerNeighbors.get(target) ?? []), source]);
    }
    if (depths.get(target) === (depths.get(source) ?? 0) - 1) {
      innerNeighbors.set(source, [...(innerNeighbors.get(source) ?? []), target]);
    }
  }

  for (let ring = 0; ring <= maxRing; ring++) {
    const members = nodes.filter((n) => depths.get(n.id) === ring).sort((a, b) => a.id.localeCompare(b.id));
    if (members.length === 0) {
      continue;
    }
    if (ring === 0) {
      for (const node of members) {
        node.x = cx;
        node.y = cy;
        angles.set(node.id, 0);
      }
      continue;
    }
    // Gewünschte Richtung: mittlere Richtung der Nachbarn im inneren Ring (Ring 1: -90° + gleichmäßig).
    const preferred = members.map((node, i) => {
      const parents = (innerNeighbors.get(node.id) ?? []).filter((id) => angles.has(id) && depths.get(id) !== 0);
      return parents.length > 0
        ? circularMean(parents.map((id) => angles.get(id) as number))
        : -Math.PI / 2 + (2 * Math.PI * i) / members.length;
    });
    const order = members.map((node, i) => ({ node, angle: preferred[i] })).sort((a, b) => a.angle - b.angle);
    const step = (2 * Math.PI) / order.length;
    // Gleichmäßige Abstände, als Ganzes so gedreht, dass die Welten nah an ihrer Wunschrichtung liegen.
    const offset = circularMean(order.map((entry, i) => entry.angle - i * step));
    const radius = (ring / maxRing) * maxRadius;
    order.forEach((entry, i) => {
      const angle = offset + i * step;
      angles.set(entry.node.id, angle);
      entry.node.x = cx + Math.cos(angle) * radius;
      entry.node.y = cy + Math.sin(angle) * radius;
    });
  }
  return depths;
}

function circularMean(angles: number[]): number {
  const sin = angles.reduce((sum, a) => sum + Math.sin(a), 0);
  const cos = angles.reduce((sum, a) => sum + Math.cos(a), 0);
  return Math.atan2(sin, cos);
}
