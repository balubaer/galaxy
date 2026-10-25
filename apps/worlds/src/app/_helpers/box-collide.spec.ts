import { Box, forceBoxCollide } from './box-collide';

describe('box-collide', () => {
  const box: Box = { left: -20, right: 20, top: -10, bottom: 60 };

  it('schiebt überlappende Welten entlang der kleineren Überlappung auseinander', () => {
    const a = { id: 'W1', x: 100, y: 100, vx: 0, vy: 0 };
    const b = { id: 'W2', x: 130, y: 110, vx: 0, vy: 0 };
    const force = forceBoxCollide(() => box, 0);
    force.initialize([a, b]);
    force();
    // Überlappung x = 10, y = 60: Ausweichen nach links/rechts.
    expect(a.vx).toBeCloseTo(-5);
    expect(b.vx).toBeCloseTo(5);
    expect(a.vy).toBe(0);
    expect(b.vy).toBe(0);
  });

  it('lässt Welten mit genug Abstand in Ruhe', () => {
    const a = { id: 'W1', x: 100, y: 100, vx: 0, vy: 0 };
    const b = { id: 'W2', x: 150, y: 100, vx: 0, vy: 0 };
    const force = forceBoxCollide(() => box, 3);
    force.initialize([a, b]);
    force();
    expect(a.vx).toBe(0);
    expect(b.vx).toBe(0);
  });

  it('bewegt eine fixierte Welt nicht, die andere weicht allein aus', () => {
    const a = { id: 'W1', x: 100, y: 100, vx: 0, vy: 0, fx: 100, fy: 100 };
    const b = { id: 'W2', x: 100, y: 150, vx: 0, vy: 0 };
    const force = forceBoxCollide(() => box, 0);
    force.initialize([a, b]);
    force();
    // Überlappung x = 40, y = 20: Ausweichen nach unten.
    expect(a.vy).toBe(0);
    expect(b.vy).toBeCloseTo(20);
  });
});
