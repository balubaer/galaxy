import { clampToArea, keepNodesInArea } from './graph-bounds';

describe('graph-bounds', () => {
  it('lässt Werte innerhalb der Fläche unverändert', () => {
    expect(clampToArea(250, 500, 10)).toBe(250);
  });

  it('begrenzt Werte auf den Rand abzüglich Abstand', () => {
    expect(clampToArea(-40, 500, 10)).toBe(10);
    expect(clampToArea(620, 500, 10)).toBe(490);
  });

  it('setzt Knoten und fixierte Positionen in die Fläche zurück', () => {
    const nodes = [
      { x: -5, y: 700, fx: -5, fy: 700 },
      { x: 100, y: 100, fx: null, fy: null },
    ];
    keepNodesInArea(nodes, 500, 500, 10);
    expect(nodes[0]).toEqual({ x: 10, y: 490, fx: 10, fy: 490 });
    expect(nodes[1]).toEqual({ x: 100, y: 100, fx: null, fy: null });
  });
});
