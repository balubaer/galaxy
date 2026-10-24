import { applyRingLayout, ringDepths } from './ring-layout';

describe('ring-layout', () => {
  const links = [
    { source: 'W1', target: 'W2' },
    { source: 'W1', target: 'W3' },
    { source: 'W2', target: 'W4' },
    { source: { id: 'W3' }, target: { id: 'W5' } },
  ];

  it('bestimmt den Ring über die Zahl der Sprünge', () => {
    const nodes = ['W1', 'W2', 'W3', 'W4', 'W5', 'W9'].map((id) => ({ id }));
    const depths = ringDepths(nodes, links, 'W1');
    expect(Object.fromEntries(depths)).toEqual({ W1: 0, W2: 1, W3: 1, W4: 2, W5: 2, W9: 3 });
  });

  it('legt die Welten gleichmäßig auf Ringe um die Mitte', () => {
    const nodes: { id: string; x?: number; y?: number }[] = ['W1', 'W2', 'W3', 'W4', 'W5'].map((id) => ({ id }));
    applyRingLayout(nodes, links, 'W1', 250, 250, 200);
    const radius = (n: { x?: number; y?: number }) => Math.hypot((n.x ?? 0) - 250, (n.y ?? 0) - 250);
    expect(nodes[0]).toEqual({ id: 'W1', x: 250, y: 250 });
    expect(radius(nodes[1])).toBeCloseTo(100);
    expect(radius(nodes[2])).toBeCloseTo(100);
    expect(radius(nodes[3])).toBeCloseTo(200);
    expect(radius(nodes[4])).toBeCloseTo(200);
    // Zwei Welten pro Ring liegen sich gegenüber.
    expect((nodes[1].x ?? 0) + (nodes[2].x ?? 0)).toBeCloseTo(500);
    expect((nodes[1].y ?? 0) + (nodes[2].y ?? 0)).toBeCloseTo(500);
  });

  it('legt äußere Welten auf die Seite ihres inneren Nachbarn', () => {
    const nodes: { id: string; x?: number; y?: number }[] = ['W1', 'W2', 'W3', 'W4', 'W5'].map((id) => ({ id }));
    applyRingLayout(nodes, links, 'W1', 250, 250, 200);
    const [, w2, w3, w4, w5] = nodes;
    const dist = (a: typeof w2, b: typeof w2) => Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0));
    expect(dist(w4, w2)).toBeLessThan(dist(w4, w3));
    expect(dist(w5, w3)).toBeLessThan(dist(w5, w2));
  });
});
