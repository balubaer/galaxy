/** Ausdehnung einer Welt samt Flotten und InfoBox relativ zu ihrem Mittelpunkt. */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

type CollideNode = {
  id: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

/**
 * d3-Kraft, die überlappende Rechtecke (Welt, Flotten, InfoBox) auseinanderschiebt,
 * entlang der Achse mit der kleineren Überlappung. Fixierte Welten bewegen sich nicht,
 * die andere Welt weicht dann allein aus.
 */
export function forceBoxCollide(boxOf: (node: CollideNode) => Box | undefined, padding = 3, strength = 1) {
  let nodes: CollideNode[] = [];

  function force() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        separate(nodes[i], nodes[j]);
      }
    }
  }

  function separate(a: CollideNode, b: CollideNode) {
    const boxA = boxOf(a);
    const boxB = boxOf(b);
    if (!boxA || !boxB || a.x === undefined || a.y === undefined || b.x === undefined || b.y === undefined) {
      return;
    }
    const overlapX =
      Math.min(a.x + boxA.right, b.x + boxB.right) - Math.max(a.x + boxA.left, b.x + boxB.left) + padding;
    const overlapY =
      Math.min(a.y + boxA.bottom, b.y + boxB.bottom) - Math.max(a.y + boxA.top, b.y + boxB.top) + padding;
    if (overlapX <= 0 || overlapY <= 0) {
      return;
    }
    const fixedA = a.fx != null;
    const fixedB = b.fx != null;
    if (fixedA && fixedB) {
      return;
    }
    // Anteil der Verschiebung: eine fixierte Welt gibt ihren Anteil an die andere ab.
    const shareA = fixedA ? 0 : fixedB ? 1 : 0.5;
    const shareB = 1 - shareA;
    if (overlapX < overlapY) {
      const dir = a.x + (boxA.left + boxA.right) / 2 <= b.x + (boxB.left + boxB.right) / 2 ? -1 : 1;
      a.vx = (a.vx ?? 0) + dir * overlapX * strength * shareA;
      b.vx = (b.vx ?? 0) - dir * overlapX * strength * shareB;
    } else {
      const dir = a.y + (boxA.top + boxA.bottom) / 2 <= b.y + (boxB.top + boxB.bottom) / 2 ? -1 : 1;
      a.vy = (a.vy ?? 0) + dir * overlapY * strength * shareA;
      b.vy = (b.vy ?? 0) - dir * overlapY * strength * shareB;
    }
  }

  force.initialize = (newNodes: CollideNode[]) => {
    nodes = newNodes;
  };

  return force;
}
