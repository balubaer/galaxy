import { outwardAngle, stubAngles } from './hidden-links';

describe('hidden-links', () => {
  it('zeigt weg vom Schwerpunkt der Nachbarn', () => {
    // Nachbarn links von der Welt → Arm zeigt nach rechts (Winkel 0).
    expect(outwardAngle({ x: 100, y: 100 }, [{ x: 50, y: 90 }, { x: 50, y: 110 }], { x: 250, y: 250 })).toBeCloseTo(0);
  });

  it('zeigt ohne Nachbarn weg von der Mitte', () => {
    expect(outwardAngle({ x: 250, y: 100 }, [], { x: 250, y: 250 })).toBeCloseTo(-Math.PI / 2);
  });

  it('nutzt nach oben, wenn die Welt auf dem Schwerpunkt liegt', () => {
    expect(outwardAngle({ x: 250, y: 250 }, [], { x: 250, y: 250 })).toBeCloseTo(-Math.PI / 2);
  });

  it('verteilt Arme symmetrisch um die Grundrichtung', () => {
    expect(stubAngles(1, 1)).toEqual([1]);
    const angles = stubAngles(3, 0, 0.5);
    expect(angles).toEqual([-0.5, 0, 0.5]);
  });
});
