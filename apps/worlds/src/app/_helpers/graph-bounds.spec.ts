import { centerOnWorld, clampToArea, keepNodesInArea } from './graph-bounds';

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

  it('fixiert eine Welt ohne gespeicherte Position in der Mitte', () => {
    const nodes: { id: string; x?: number; y?: number; fx?: number | null; fy?: number | null }[] = [
      { id: 'W1' },
      { id: 'W2' },
    ];
    expect(centerOnWorld(nodes, 'W2', 250, 250)).toBe(true);
    expect(nodes[1]).toEqual({ id: 'W2', x: 250, y: 250, fx: 250, fy: 250 });
    expect(nodes[0]).toEqual({ id: 'W1' });
  });

  it('verschiebt ein gespeichertes Layout, sodass die Welt in der Mitte liegt', () => {
    const nodes = [
      { id: 'W1', x: 100, y: 100, fx: 100, fy: 100 },
      { id: 'W2', x: 150, y: 80, fx: 150, fy: 80 },
    ];
    centerOnWorld(nodes, 'W1', 250, 250);
    expect(nodes[0]).toEqual({ id: 'W1', x: 250, y: 250, fx: 250, fy: 250 });
    expect(nodes[1]).toEqual({ id: 'W2', x: 300, y: 230, fx: 300, fy: 230 });
  });

  it('meldet eine fehlende Welt', () => {
    expect(centerOnWorld([{ id: 'W1' }], 'W9', 250, 250)).toBe(false);
  });
});
