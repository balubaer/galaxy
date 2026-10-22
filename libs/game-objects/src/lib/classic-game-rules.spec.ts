import { classicGameDefaults, classicGamePref } from './classic-game-rules';
import { GamePref, gameTypeOf } from './game-pref.interface';
import { CommandFactory } from './command-factory';
import { World } from './world';
import { Player } from './player';

const pref: GamePref = {
  distanceLevelHomes: 1, fleetCount: 1, fleetsOnHomeWorld: 1, worldCount: 1,
  playName: 'T', player: ['A', 'B', 'C'], startShipCount: 6, round: 0
};

describe('classic-game-rules', () => {
  it('classicGameDefaults: 5 leere Flotten, 30 Industrie, 13-20 Welten pro Spieler', () => {
    const d = classicGameDefaults(3);
    expect(d.fleetsOnHomeWorld).toBe(5);
    expect(d.startShipCount).toBe(0);
    expect(d.startIndustry).toBe(30);
    expect(d.worldCount / 3).toBeGreaterThanOrEqual(13);
    expect(d.worldCount / 3).toBeLessThanOrEqual(20);
    expect(d.fleetCount).toBeGreaterThan(3 * 5);
  });

  it('classicGamePref setzt Spieltyp und Standardwerte, behält Name und Spieler', () => {
    const result = classicGamePref(pref);
    expect(result.gameType).toBe('classic');
    expect(result.playName).toBe('T');
    expect(result.player).toEqual(['A', 'B', 'C']);
    expect(result.startShipCount).toBe(0);
    expect(result.fleetsOnHomeWorld).toBe(5);
  });

  it('gameTypeOf: ohne Angabe ist es ein Core Game', () => {
    expect(gameTypeOf(pref)).toBe('core');
    expect(gameTypeOf({ ...pref, gameType: 'classic' })).toBe('classic');
  });

  it('CommandFactory.coreGame bleibt mit gameType synchron', () => {
    const factory = new CommandFactory(new Array<World>(), new Map<string, Player>());
    expect(factory.gameType).toBeNull();
    factory.coreGame = true;
    expect(factory.gameType).toBe('core');
    factory.gameType = 'classic';
    expect(factory.coreGame).toBe(false);
  });
});
