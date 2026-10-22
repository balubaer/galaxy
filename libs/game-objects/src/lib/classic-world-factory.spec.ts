import { ClassicWorldFactory } from './classic-world-factory';
import { WorldGenerator } from './world-generator';
import { PersistenceManager } from './persistence-manager';
import { classicGamePref } from './classic-game-rules';
import { GamePref } from './game-pref.interface';
import { World } from './world';
import { Fleet } from './fleet';
import { Player } from './player';

const basePref: GamePref = {
  distanceLevelHomes: 1, fleetCount: 1, fleetsOnHomeWorld: 1, worldCount: 1,
  playName: 'T', player: ['A', 'B'], startShipCount: 6, round: 0
};

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function generate(): { generator: WorldGenerator; worlds: Array<World> } {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  const generator = new WorldGenerator(classicGamePref(basePref));
  generator.generate();
  return { generator, worlds: generator.worlds };
}

describe('ClassicWorldFactory', () => {
  afterEach(() => jest.restoreAllMocks());

  it('Heimatwelt: Industrie 30, Metall 30, 2 Minen, Bev. 50/100, 1 I- und 1 P-Schiff, Emperor', () => {
    const { worlds } = generate();
    const homes = worlds.filter(w => w.player !== null);
    expect(homes.length).toBe(2);
    for (const home of homes) {
      expect(home.industry).toBe(30);
      expect(home.metal).toBe(30);
      expect(home.mines).toBe(2);
      expect(home.population).toBe(50);
      expect(home.populationLimit).toBe(100);
      expect(home.iShips).toBe(1);
      expect(home.pShips).toBe(1);
      expect(home.turnsOwned).toBe(1);
      expect(home.player.characterType).toBe('emperor');
      expect(home.blackHole).toBe(false);
    }
  });

  it('jeder Spieler startet mit 5 leeren Flotten auf der Heimatwelt', () => {
    const { worlds } = generate();
    for (const home of worlds.filter(w => w.player !== null)) {
      const own = home.fleets.filter(f => f.player === home.player);
      expect(own.length).toBe(5);
      expect(own.every(f => f.ships === 0 && f.metal === 0)).toBe(true);
    }
  });

  it('übrige Welten sind unbesetzt, bevölkert und haben Minen (außer Schwarze Löcher)', () => {
    const { worlds } = generate();
    for (const world of worlds.filter(w => w.player === null)) {
      expect(world.turnsOwned).toBe(0);
      if (world.blackHole) {
        expect(world.population).toBe(0);
      } else {
        expect(world.population).toBeGreaterThan(0);
        expect(world.populationLimit).toBeGreaterThanOrEqual(world.population);
        expect(world.mines).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('Schwarze Löcher: weder Heimatwelt noch Nachbar, Galaxie bleibt verbunden, keine Flotten darin', () => {
    for (let i = 0; i < 5; i++) {
      const { generator, worlds } = generate();
      const factory = new ClassicWorldFactory();
      const homes = worlds.filter(w => w.player !== null);
      for (const world of worlds.filter(w => w.blackHole)) {
        expect(homes.includes(world)).toBe(false);
        expect(homes.some(h => h.hasConnectionToWorld(world))).toBe(false);
        expect(world.fleets.length).toBe(0);
      }
      expect(factory.isConnectedWithoutBlackHoles(worlds)).toBe(true);
      expect(generator.worlds.length).toBeGreaterThan(0);
    }
  });

  it('Core Game bleibt ohne Classic-Werte', () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const generator = new WorldGenerator({ ...classicGamePref(basePref), gameType: 'core' });
    generator.generate();
    expect(generator.worlds.every(w => w.industry === 0 && w.population === 0 && !w.blackHole)).toBe(true);
  });

  it('placeBlackHoles mit festem Zufall setzt Löcher deterministisch', () => {
    const a = generate().worlds;
    const factory = new ClassicWorldFactory(seeded(1));
    for (const w of a) { w.blackHole = false; }
    factory.placeBlackHoles(a, a.filter(w => w.player !== null));
    const count = a.filter(w => w.blackHole).length;
    expect(count).toBe(Math.round(a.length * 0.03));
  });
});

describe('PersistenceManager Classic-Felder', () => {
  it('speichert und lädt Wirtschaft, Metall, At-Peace, Charakter, Verbündete und Loader', () => {
    const w1 = new World(); w1.setNumber(1);
    const w2 = new World(); w2.setNumber(2);
    const player = new Player('A'); player.points = 0; player.characterType = 'emperor';
    const other = new Player('B'); other.points = 0;
    player.allies.add(other); player.loaders.add(other);
    w1.player = player; w2.player = other;
    Object.assign(w1, { population: 50, populationLimit: 100, industry: 30, metal: 30, mines: 2, turnsOwned: 1, iShips: 1, pShips: 1 });
    w2.blackHole = false;
    const fleet = new Fleet(); fleet.number = 1; fleet.player = player; fleet.metal = 4; fleet.atPeace = true;
    w1.fleets.push(fleet);
    for (const [a, b] of [[w1, w2], [w2, w1]] as Array<[World, World]>) {
      a.port = { number: a.number, worlds: [b], getWorld: () => a } as never;
    }
    const persist = new PersistenceManager([w1, w2]).createWorldsPersist();
    const loaded = new PersistenceManager([]).createWorldsWithWorldsPersist(JSON.parse(JSON.stringify(persist)));
    const l1 = loaded[0];
    expect(l1.industry).toBe(30);
    expect(l1.iShips).toBe(1);
    expect(l1.fleets[0].metal).toBe(4);
    expect(l1.fleets[0].atPeace).toBe(true);
    expect(l1.player.characterType).toBe('emperor');
    expect(Array.from(l1.player.allies).map(p => p.playerName)).toEqual(['B']);
    expect(Array.from(l1.player.loaders).map(p => p.playerName)).toEqual(['B']);
    expect(loaded[1].population).toBe(0);
  });

  it('Core-Daten bekommen keine Classic-Felder und alte Daten ohne Felder laden mit 0', () => {
    const w1 = new World(); w1.setNumber(1);
    const persist = new PersistenceManager([w1]).getWorldPersistWithWorld(w1);
    expect(Object.keys(persist).sort()).toEqual(['dShips', 'fleets', 'name', 'number', 'player']);
  });
});
