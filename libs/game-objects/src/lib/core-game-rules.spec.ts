import { checkGameEnd, coreGameDefaults, publicGamePref, randomTargetScore, startGamePref, keepHiddenGamePref } from './core-game-rules';
import { GamePref } from './game-pref.interface';
import { Player } from './player';

const pref: GamePref = {
  distanceLevelHomes: 3, fleetCount: 14, fleetsOnHomeWorld: 5, worldCount: 33,
  playName: 'T', player: ['A', 'B'], startShipCount: 6, round: 0
};

function player(name: string, points: number): Player {
  const p = new Player(name);
  p.points = points;
  return p;
}

describe('core-game-rules', () => {
  it('coreGameDefaults: 5 Flotten à 6 Schiffe, 13-20 Welten pro Spieler', () => {
    const d = coreGameDefaults(3);
    expect(d.fleetsOnHomeWorld).toBe(5);
    expect(d.startShipCount).toBe(6);
    expect(d.worldCount / 3).toBeGreaterThanOrEqual(13);
    expect(d.worldCount / 3).toBeLessThanOrEqual(20);
    expect(d.fleetCount).toBeGreaterThan(3 * 5);
  });

  it('randomTargetScore liegt zwischen 6000 und 9000', () => {
    expect(randomTargetScore(() => 0)).toBe(6000);
    expect(randomTargetScore(() => 0.999999)).toBe(9000);
  });

  it('publicGamePref entfernt die Zielpunktzahl, keepHiddenGamePref stellt sie wieder her', () => {
    const started = startGamePref(pref, () => 0.5);
    expect(started.targetScore).toBe(7500);
    expect(started.finished).toBe(false);
    const pub = publicGamePref(started);
    expect(pub.targetScore).toBeUndefined();
    expect(keepHiddenGamePref(pub, started).targetScore).toBe(7500);
  });

  it('checkGameEnd beendet das Spiel erst bei erreichter Zielpunktzahl', () => {
    const started = startGamePref(pref, () => 0);
    checkGameEnd(started, [player('A', 5999), player('B', 100)]);
    expect(started.finished).toBe(false);
    checkGameEnd(started, [player('A', 6020), player('B', 6100)]);
    expect(started.finished).toBe(true);
    expect(started.winner).toBe('B');
  });

  it('checkGameEnd ohne Zielpunktzahl tut nichts', () => {
    const g = { ...pref };
    checkGameEnd(g, [player('A', 99999)]);
    expect(g.finished).toBeUndefined();
  });
});
