import { World } from './world';
import { Player } from './player';
import { Fleet } from './fleet';
import { Port } from './port';
import { CommandFactory } from './command-factory';
import { FinalPhaseClassicGame } from './final-phase-classic-game';
import { PersistenceManager } from './persistence-manager';
import { destroyShips, fleetShots } from './classic-combat';
import { consumerGoodsPoints, metalCapacity } from './classic-trader';

interface Setup {
  worlds: Array<World>;
  a: Player;
  b: Player;
  fleets: Array<Fleet>;
  players: Map<string, Player>;
}

/** W1 (Heimat von A, Trader) - W2 - W3 (Heimat von B, Emperor), W1 - W3. A: F1..F5 auf W1, B: F6 auf W3. */
function setup(): Setup {
  const a = new Player('A'); a.points = 0; a.characterType = 'trader';
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

function endTurn(s: Setup) {
  new FinalPhaseClassicGame(s.worlds, s.players).doFinal();
}

function moveFleet(s: Setup, fleet: Fleet, to: World) {
  for (const w of s.worlds) {
    const i = w.fleets.indexOf(fleet);
    if (i !== -1) { w.fleets.splice(i, 1); }
  }
  to.fleets.push(fleet);
}

/** F1 des Traders steht mit Schiffen und Metall über W3 von B. */
function atB(ships: number, metal: number, industry = 30): Setup {
  const s = setup();
  s.fleets[0].ships = ships;
  s.fleets[0].metal = metal;
  s.worlds[2].industry = industry;
  moveFleet(s, s.fleets[0], s.worlds[2]);
  return s;
}

describe('Classic Trader: Laderaum und Kampf', () => {
  it('Trader trägt 2 Metall je Schiff, andere 1', () => {
    const s = setup();
    s.fleets[0].ships = 10;
    expect(metalCapacity(s.fleets[0])).toBe(20);
    s.fleets[0].player = s.b;
    expect(metalCapacity(s.fleets[0])).toBe(10);
  });

  it('FaaL lädt beim Trader bis zu 2 Metall je Schiff', () => {
    const s = setup();
    // Ohne Industrie bleibt das Metall der Welt zum Laden liegen.
    s.worlds[0].industry = 0;
    s.fleets[0].ships = 10;
    const f = run(s, { A: 'F1L' });
    expect(errorsOf(f, 'A')).toEqual([]);
    expect(s.fleets[0].metal).toBe(20);
  });

  it('FaaLxx über dem doppelten Laderaum scheitert', () => {
    const s = setup();
    s.fleets[0].ships = 5;
    const f = run(s, { A: 'F1L11' });
    expect(errorsOf(f, 'A').length).toBe(1);
    expect(s.fleets[0].metal).toBe(0);
  });

  it('überladene Schiffe feuern nicht', () => {
    const s = setup();
    Object.assign(s.fleets[0], { ships: 10, metal: 14 });
    expect(fleetShots(s.fleets[0])).toBe(6);
    Object.assign(s.fleets[0], { ships: 10, metal: 10 });
    expect(fleetShots(s.fleets[0])).toBe(10);
  });

  it('Treffer zuerst auf unbeladene, dann einfach, zuletzt doppelt beladene Schiffe', () => {
    const s = setup();
    // 3 mit einer Einheit, 2 überladen
    Object.assign(s.fleets[0], { ships: 5, metal: 7 });
    // 4 Schuss: 3 einfach beladene und 1 überladenes
    expect(destroyShips(s.fleets[0], [4], false)).toBe(4);
    expect(s.fleets[0].ships).toBe(1);
    expect(s.fleets[0].metal).toBe(2);
  });

  it('Metall über dem neuen Laderaum geht bei Besitzwechsel verloren', () => {
    const s = setup();
    Object.assign(s.fleets[0], { ships: 4, metal: 8 });
    new FinalPhaseClassicGame(s.worlds, s.players).changeFleetOwner(s.worlds[0], s.fleets[0], s.b);
    expect(s.fleets[0].metal).toBe(4);
  });

  it('Transfer von einer überladenen Flotte kappt das Metall', () => {
    const s = setup();
    Object.assign(s.fleets[0], { ships: 6, metal: 12 });
    run(s, { A: 'F1T2F2' });
    expect(s.fleets[0].ships).toBe(4);
    expect(s.fleets[0].metal).toBe(8);
  });
});

describe('Classic Trader: Punkte', () => {
  it('8 Punkte je Metall, das auf der Welt eines anderen Spielers entladen wird', () => {
    const s = atB(5, 10);
    run(s, { A: 'F1U' });
    expect(s.a.points).toBe(80);
    expect(s.fleets[0].metal).toBe(0);
  });

  it('je Welt und Runde höchstens das Doppelte ihrer Industrie', () => {
    const s = atB(5, 10, 2);
    run(s, { A: 'F1U3 F2U0' });
    expect(s.a.points).toBe(24);
    const t = atB(5, 10, 2);
    moveFleet(t, t.fleets[1], t.worlds[2]);
    Object.assign(t.fleets[1], { ships: 3, metal: 3 });
    run(t, { A: 'F1U3 F2U3' });
    expect(t.a.points).toBe(4 * 8);
  });

  it('nach dem Rundenende zählt die Grenze neu', () => {
    const s = atB(5, 10, 2);
    run(s, { A: 'F1U4' });
    endTurn(s);
    const before = s.a.points;
    run(s, { A: 'F1U4' });
    expect(s.a.points - before).toBe(32);
  });

  it('kein Punkt für Metall auf eigener oder herrenloser Welt und nicht für andere Charaktere', () => {
    const s = setup();
    Object.assign(s.fleets[0], { ships: 5, metal: 5 });
    run(s, { A: 'F1U' });
    expect(s.a.points).toBe(0);
    const t = atB(5, 5);
    t.worlds[2].player = null;
    run(t, { A: 'F1U' });
    expect(t.a.points).toBe(0);
    const u = atB(5, 5);
    u.a.characterType = 'emperor';
    run(u, { A: 'F1U' });
    expect(u.a.points).toBe(0);
  });

  it('Konsumgüter: 10, 8, 5, 3, danach 1 Punkt je Entladung und Welt, egal wie viel', () => {
    expect([1, 2, 3, 4, 5, 8].map(consumerGoodsPoints)).toEqual([10, 8, 5, 3, 1, 1]);
    const s = setup();
    Object.assign(s.fleets[0], { ships: 10, metal: 10 });
    run(s, { A: 'F1N5' });
    expect(s.a.points).toBe(10);
    expect(s.fleets[0].metal).toBe(5);
    run(s, { A: 'F1N1' });
    expect(s.a.points).toBe(18);
    expect(s.fleets[0].metal).toBe(4);
  });

  it('Konsumgüter-Zähler wird je Welt gespeichert', () => {
    const s = setup();
    s.worlds[0].consumerGoodsBy = { A: 3 };
    const persist = new PersistenceManager(s.worlds).createWorldsPersist();
    const loaded = new PersistenceManager([]).createWorldsWithWorldsPersist(JSON.parse(JSON.stringify(persist)));
    expect(loaded[0].consumerGoodsBy).toEqual({ A: 3 });
    expect(loaded[1].consumerGoodsBy).toEqual({});
  });

  it('andere Charaktere bekommen keine Konsumgüter-Punkte', () => {
    const s = setup();
    s.a.characterType = 'emperor';
    Object.assign(s.fleets[0], { ships: 5, metal: 5 });
    run(s, { A: 'F1N1' });
    expect(s.a.points).toBe(0);
  });
});
