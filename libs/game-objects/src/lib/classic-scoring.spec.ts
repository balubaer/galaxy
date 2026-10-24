import { World } from './world';
import { Player } from './player';
import { Fleet } from './fleet';
import { Port } from './port';
import { CommandFactory } from './command-factory';
import { FinalPhaseClassicGame } from './final-phase-classic-game';
import { emperorWorldPoints, turnPoints } from './classic-scoring';
import { checkGameEnd } from './core-game-rules';
import { GamePref } from './game-pref.interface';
import { PersistenceManager } from './persistence-manager';

interface Setup {
  worlds: Array<World>;
  a: Player;
  b: Player;
  fleets: Array<Fleet>;
  players: Map<string, Player>;
}

/** W1 (Heimat von A) - W2 - W3, W1 - W3. A: 5 Flotten auf W1, B: Heimat W3. */
function setup(): Setup {
  const a = new Player('A'); a.points = 0; a.characterType = 'emperor';
  const b = new Player('B'); b.points = 0; b.characterType = 'emperor';
  const worlds = [1, 2, 3].map(n => { const w = new World(); w.setNumber(n); return w; });
  const links: Array<[number, Array<number>]> = [[1, [2, 3]], [2, [1, 3]], [3, [1, 2]]];
  for (const [n, neighbors] of links) {
    const port = new Port();
    port.setWorld(worlds[n - 1]);
    port.worlds = neighbors.map(m => worlds[m - 1]);
    worlds[n - 1].port = port;
  }
  const [w1, w2, w3] = worlds;
  Object.assign(w1, { player: a, industry: 30, metal: 30, mines: 2, population: 50, populationLimit: 100, iShips: 1, pShips: 1, turnsOwned: 1 });
  Object.assign(w2, { population: 20, populationLimit: 40, mines: 3, metal: 4 });
  Object.assign(w3, { player: b, industry: 30, metal: 30, mines: 2, population: 50, populationLimit: 100, iShips: 1, pShips: 1, turnsOwned: 1 });
  const fleets: Array<Fleet> = [];
  for (let i = 1; i <= 5; i++) {
    const f = new Fleet(); f.number = i; f.player = a; w1.fleets.push(f); fleets.push(f);
  }
  const fb = new Fleet(); fb.number = 6; fb.player = b; w3.fleets.push(fb); fleets.push(fb);
  return { worlds, a, b, fleets, players: new Map([['A', a], ['B', b]]) };
}

function run(s: Setup, commands: { A?: string; B?: string }): CommandFactory {
  const factory = new CommandFactory(s.worlds, s.players);
  factory.gameType = 'classic';
  for (const name of Object.keys(commands)) {
    factory.setCommandStringsWithLongString(name, commands[name]);
  }
  factory.executeCommands();
  return factory;
}

function errorsOf(factory: CommandFactory, player: string): Array<number> {
  return (factory.commandErrors.get(player) ?? []).map(e => e.error.errorNumber);
}


function endTurn(s: Setup, random: () => number = () => 0) {
  new FinalPhaseClassicGame(s.worlds, s.players, random).doFinal();
}

/** Ohne Metall baut die Industrie keine zusätzlichen I-Schiffe, die mitfeuern würden. */
function noBuild(s: Setup) {
  s.worlds[0].metal = 0;
  s.worlds[2].metal = 0;
}

function place(s: Setup, fleet: Fleet, to: World, ships: number, metal = 0) {
  for (const w of s.worlds) {
    const i = w.fleets.indexOf(fleet);
    if (i !== -1) { w.fleets.splice(i, 1); }
  }
  to.fleets.push(fleet);
  fleet.ships = ships;
  fleet.metal = metal;
}


describe('Classic Emperor-Punkte', () => {
  it('1 Punkt je 10 Bevölkerung, je Industrie und je Mine, nur eigene Welten', () => {
    const s = setup();
    expect(emperorWorldPoints(s.worlds[0])).toBe(5 + 30 + 2);
    expect(turnPoints(s.a, s.worlds)).toBe(37);
    s.worlds[1].player = s.a;
    expect(turnPoints(s.a, s.worlds)).toBe(37 + 2 + 0 + 3);
    s.a.characterType = null;
    expect(turnPoints(s.a, s.worlds)).toBe(0);
  });

  it('Punkte werden je Runde addiert', () => {
    const s = setup();
    noBuild(s);
    endTurn(s);
    endTurn(s);
    // Runde 1: Bev. 55 -> 5 + 30 + 2; Runde 2: Bev. 61 -> 6 + 30 + 2
    expect(s.a.points).toBe(37 + 38);
  });

  it('Spielende, sobald jemand die Zielpunktzahl erreicht', () => {
    const s = setup();
    const pref: GamePref = {
      gameType: 'classic', distanceLevelHomes: 1, fleetCount: 1, fleetsOnHomeWorld: 1, worldCount: 3,
      playName: 'T', player: ['A', 'B'], startShipCount: 0, round: 1, targetScore: 70
    };
    endTurn(s);
    checkGameEnd(pref, s.players.values());
    expect(pref.finished).toBeFalsy();
    endTurn(s);
    checkGameEnd(pref, s.players.values());
    expect(pref.finished).toBe(true);
    expect(pref.winner).toBe('A, B');
  });
});

describe('Classic Strafen', () => {
  it('getötete Bevölkerung kostet 1 Punkt je Person', () => {
    const s = setup();
    noBuild(s);
    s.worlds[0].pShips = 0;
    place(s, s.fleets[5], s.worlds[0], 10);
    run(s, { B: 'F6AP' });
    endTurn(s);
    // 5 Treffer auf Bevölkerung; B besitzt W3: 5 + 30 + 2 Punkte
    expect(s.b.points).toBe(-5 + 37);
  });

  it('PBB kostet 50 Punkte plus 1 je getöteter Bevölkerung', () => {
    const s = setup();
    noBuild(s);
    place(s, s.fleets[0], s.worlds[1], 2);
    s.fleets[0].pbb = true;
    s.worlds[1].player = s.b;
    run(s, { A: 'F1D' });
    endTurn(s);
    expect(s.a.points).toBe(-50 - 20 + 37);
  });

  it('Plündern kostet 5 Punkte und macht die Welt drei Runden unproduktiv', () => {
    const s = setup();
    noBuild(s);
    s.worlds[0].metal = 0;
    const f = run(s, { A: 'W1X' });
    expect(errorsOf(f, 'A')).toEqual([]);
    endTurn(s);
    const home = s.worlds[0];
    expect(home.plunderCount).toBe(1);
    expect(home.plunderRecovery).toBe(3);
    expect(home.description()).toContain('Plunder=1/3');
    // Diese Runde noch normal (Metall 2, Bev. 55), dann -5
    expect(s.a.points).toBe(37 - 5);
    expect(home.metal).toBe(2);

    // Erholung: kein Bauen, keine Förderung, kein Wachstum, Besitzdauer steht
    const g = run(s, { A: 'W1B1I W1X' });
    expect(errorsOf(g, 'A')).toEqual([19, 35]);
    endTurn(s);
    expect(home.metal).toBe(2);
    expect(home.population).toBe(55);
    expect(home.turnsOwned).toBe(2);
    expect(home.plunderRecovery).toBe(2);
    endTurn(s);
    endTurn(s);
    expect(home.plunderRecovery).toBe(0);
    // Danach wächst die Welt wieder
    run(s, {});
    endTurn(s);
    expect(home.population).toBeGreaterThan(55);
    expect(home.turnsOwned).toBe(3);
  });

  it('Plündern scheitert, wenn die Welt in derselben Runde den Besitzer wechselt', () => {
    const s = setup();
    noBuild(s);
    s.worlds[0].iShips = 0; s.worlds[0].pShips = 0;
    place(s, s.fleets[5], s.worlds[0], 3);
    run(s, { A: 'W1X' });
    endTurn(s);
    expect(s.worlds[0].player).toBe(s.b);
    expect(s.worlds[0].plunderCount).toBe(0);
  });

  it('Plünderung wird gespeichert', () => {
    const s = setup();
    s.worlds[0].plunderCount = 2; s.worlds[0].plunderRecovery = 1;
    const persist = new PersistenceManager(s.worlds).createWorldsPersist();
    const loaded = new PersistenceManager([]).createWorldsWithWorldsPersist(JSON.parse(JSON.stringify(persist)));
    expect([loaded[0].plunderCount, loaded[0].plunderRecovery]).toEqual([2, 1]);
  });
});
