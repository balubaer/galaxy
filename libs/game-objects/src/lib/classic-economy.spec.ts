import { World } from './world';
import { Player } from './player';
import { Fleet } from './fleet';
import { Port } from './port';
import { CommandFactory } from './command-factory';
import { FinalPhaseClassicGame } from './final-phase-classic-game';
import { availableMetal, shelterPenalty, usableIndustry } from './classic-economy';

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

describe('Classic Wirtschaft: Bauen', () => {
  it('Erste Runde: 30 Schiffe auf 5 Flotten gebaut, Metall und Industrie verbraucht', () => {
    const s = setup();
    const f = run(s, { A: 'W1B6F1 W1B6F2 W1B6F3 W1B6F4 W1B6F5' });
    expect(errorsOf(f, 'A')).toEqual([]);
    expect(s.fleets.slice(0, 5).map(x => x.ships)).toEqual([6, 6, 6, 6, 6]);
    expect(s.worlds[0].metal).toBe(0);
    expect(s.worlds[0].iShips).toBe(1);
  });

  it('Mehr bauen als nutzbare Industrie wird abgelehnt', () => {
    const s = setup();
    const f = run(s, { A: 'W1B31F1' });
    expect(errorsOf(f, 'A')).toEqual([19]);
    expect(s.fleets[0].ships).toBe(0);
  });

  it('Nutzbare Industrie ist das Kleinste aus Industrie, Metall und Bevölkerung', () => {
    const s = setup();
    s.worlds[0].metal = 2;
    expect(usableIndustry(s.worlds[0])).toBe(2);
    s.worlds[0].metal = 30; s.worlds[0].population = 7;
    expect(usableIndustry(s.worlds[0])).toBe(7);
  });

  it('Ungenutzte Industrie baut I-Schiffe', () => {
    const s = setup();
    run(s, { A: 'W1B10P' });
    expect(s.worlds[0].pShips).toBe(11);
    expect(s.worlds[0].iShips).toBe(1 + 20);
    expect(s.worlds[0].metal).toBe(0);
  });

  it('I-Schiffe auf die Welt bauen mit WaaBxxI', () => {
    const s = setup();
    run(s, { A: 'W1B5I' });
    expect(s.worlds[0].iShips).toBe(1 + 5 + 25);
  });

  it('fremde Welt kann nicht bebaut werden', () => {
    const s = setup();
    const f = run(s, { A: 'W3B5I' });
    expect(errorsOf(f, 'A')).toEqual([6]);
  });

  it('Industrie bauen kostet 4 Metall und Industrie für den Emperor, 5 für andere', () => {
    const s = setup();
    run(s, { A: 'W1I2I' });
    expect(s.worlds[0].industry).toBe(32);
    expect(s.worlds[0].metal).toBe(0);
    expect(s.worlds[0].iShips).toBe(1 + 22);
    const t = setup();
    t.a.characterType = null;
    run(t, { A: 'W1I2I' });
    expect(t.worlds[0].industry).toBe(32);
    expect(t.worlds[0].iShips).toBe(1 + 20);
  });

  it('Bevölkerungslimit anheben kostet 5 Metall je Einheit', () => {
    const s = setup();
    run(s, { A: 'W1I3L' });
    expect(s.worlds[0].populationLimit).toBe(103);
    expect(s.worlds[0].metal).toBe(0);
  });

  it('Industrie durch Verschrotten: Emperor 4 I-Schiffe, andere 6', () => {
    const s = setup();
    s.worlds[0].iShips = 9;
    run(s, { A: 'W1S2' });
    expect(s.worlds[0].industry).toBe(32);
    // 9 - 8 verschrottet + 30 vom Standardbau (Industrie 32, Metall 30)
    expect(s.worlds[0].iShips).toBe(31);
    const t = setup();
    t.a.characterType = null;
    t.worlds[0].iShips = 5;
    const f = run(t, { A: 'W1S1' });
    expect(errorsOf(f, 'A')).toEqual([8]);
  });

  it('Verschrottete I-Schiffe stehen für Industrie schon in derselben Runde bereit', () => {
    const s = setup();
    s.worlds[0].iShips = 8;
    s.worlds[0].industry = 5; // 1 Einheit durch 4 I-Schiffe -> 6
    run(s, { A: 'W1S1 W1B6F1' });
    expect(s.fleets[0].ships).toBe(6);
  });
});

describe('Classic Wirtschaft: Metall laden und entladen', () => {
  it('Entladen bringt Metall auf die Welt, das erst nächste Runde zum Bauen bereitsteht', () => {
    const s = setup();
    s.worlds[0].metal = 2;
    s.fleets[0].ships = 6; s.fleets[0].metal = 6;
    const f = run(s, { A: 'F1U W1B6F2' });
    expect(s.worlds[0].metal).toBe(8 - 2);
    expect(s.fleets[0].metal).toBe(0);
    expect(errorsOf(f, 'A')).toEqual([19]);
    expect(availableMetal(s.worlds[0])).toBe(0);
  });

  it('Entladen mit Menge, Wegwerfen und Konsumgüter', () => {
    const s = setup();
    s.fleets[0].ships = 6; s.fleets[0].metal = 6;
    run(s, { A: 'F1U2 F1J1 F1N1' });
    expect(s.fleets[0].metal).toBe(2);
    expect(s.worlds[0].metal).toBeGreaterThanOrEqual(0);
  });

  it('zu viel entladen wird abgelehnt', () => {
    const s = setup();
    s.fleets[0].ships = 6; s.fleets[0].metal = 3;
    const f = run(s, { A: 'F1U4' });
    expect(errorsOf(f, 'A')).toEqual([20]);
  });

  it('Laden begrenzt durch Schiffe und Metall der Welt', () => {
    const s = setup();
    s.worlds[0].industry = 0; // nichts verbraucht Metall
    s.fleets[0].ships = 6;
    run(s, { A: 'F1L' });
    expect(s.fleets[0].metal).toBe(6);
    expect(s.worlds[0].metal).toBe(24);
    const f = run(s, { A: 'F1L1' });
    expect(errorsOf(f, 'A')).toEqual([22]);
  });

  it('Fremdes Metall nur mit Loader-Erlaubnis laden', () => {
    const s = setup();
    s.worlds[1].player = s.b;
    s.worlds[1].population = 10;
    s.fleets[0].ships = 3;
    s.worlds[1].fleets.push(s.fleets[0]);
    s.worlds[0].fleets.splice(s.worlds[0].fleets.indexOf(s.fleets[0]), 1);
    let f = run(s, { A: 'F1L2' });
    expect(errorsOf(f, 'A')).toEqual([23]);
    s.b.loaders.add(s.a);
    f = run(s, { A: 'F1L2' });
    expect(errorsOf(f, 'A')).toEqual([]);
    expect(s.fleets[0].metal).toBe(2);
    expect(s.worlds[1].metal).toBe(2);
  });
});

describe('Classic Wirtschaft: Migration', () => {
  it('verschiebt Bevölkerung zur Nachbarwelt und verbraucht Industrie und Metall', () => {
    const s = setup();
    run(s, { A: 'P1M10W2' });
    expect(s.worlds[0].population).toBe(40);
    expect(s.worlds[1].population).toBe(30);
    expect(s.worlds[0].metal).toBe(0);
  });

  it('nur ein Ziel pro Welt und Runde, nur Nachbarwelten', () => {
    const s = setup();
    const f = run(s, { A: 'P1M1W2 P1M1W3' });
    expect(errorsOf(f, 'A')).toEqual([24]);
    const t = setup();
    t.worlds[0].port.worlds = [t.worlds[1]];
    expect(errorsOf(run(t, { A: 'P1M1W3' }), 'A')).toEqual([9]);
  });
});

describe('Classic Wirtschaft: Schutzräume', () => {
  it('feindliche Schiffe, die Verteidiger übersteigen, blockieren Industrie', () => {
    const s = setup();
    const enemy = new Fleet(); enemy.number = 20; enemy.player = s.b; enemy.ships = 10;
    s.worlds[0].fleets.push(enemy);
    // Verteidiger: I-Schiff zählt doppelt (2) + P-Schiff (1) = 3 -> 7 Industrie bauen nicht.
    expect(shelterPenalty(s.worlds[0])).toBe(7);
    expect(usableIndustry(s.worlds[0])).toBe(23);
    enemy.atPeace = true;
    expect(shelterPenalty(s.worlds[0])).toBe(0);
    enemy.atPeace = false;
    s.a.allies.add(s.b);
    expect(shelterPenalty(s.worlds[0])).toBe(0);
  });
});

describe('Classic Wirtschaft: Rundenende', () => {
  function endTurn(s: Setup) {
    new FinalPhaseClassicGame(s.worlds, s.players).doFinal();
  }

  it('Mine fördert Metall, Bevölkerung wächst um 10 %, Besitzdauer steigt (Handbuch: Runde 2 hat 2 Metall)', () => {
    const s = setup();
    run(s, { A: 'W1B6F1 W1B6F2 W1B6F3 W1B6F4 W1B6F5' });
    endTurn(s);
    const home = s.worlds[0];
    expect(home.metal).toBe(2);
    expect(home.population).toBe(55);
    expect(home.turnsOwned).toBe(2);
    expect(home.buildBudget).toBeNull();
  });

  it('Bevölkerung wächst höchstens bis zum Limit, darüber stirbt sie', () => {
    const s = setup();
    s.worlds[0].population = 98;
    endTurn(s);
    expect(s.worlds[0].population).toBe(100);
    s.worlds[0].population = 130;
    endTurn(s);
    expect(s.worlds[0].population).toBe(100);
  });

  it('Arbeiter in der Industrie fehlen in den Minen', () => {
    const s = setup();
    s.worlds[0].population = 31;
    run(s, {});
    endTurn(s);
    // 30 Arbeiter in der Industrie, nur 1 in den Minen
    expect(s.worlds[0].metal).toBe(0 + 1);
  });

  it('nach 7 Runden im Besitz beginnt der Zähler neu und es gibt eine Mine mehr', () => {
    const s = setup();
    s.worlds[0].turnsOwned = 7;
    endTurn(s);
    expect(s.worlds[0].turnsOwned).toBe(1);
    expect(s.worlds[0].mines).toBe(3);
  });

  it('unbesetzte Welt wächst und fördert nicht', () => {
    const s = setup();
    endTurn(s);
    expect(s.worlds[1].population).toBe(20);
    expect(s.worlds[1].metal).toBe(4);
    expect(s.worlds[1].turnsOwned).toBe(0);
  });

  it('Eroberung setzt Besitzdauer auf 1', () => {
    const s = setup();
    const f = s.fleets[0]; f.ships = 2; s.worlds[1].fleets.push(f);
    s.worlds[0].fleets.splice(s.worlds[0].fleets.indexOf(f), 1);
    endTurn(s);
    expect(s.worlds[1].player).toBe(s.a);
    expect(s.worlds[1].turnsOwned).toBe(1);
  });

  it('Welt mit I-/P-Schiffen wird nicht von einem fremden Besucher erobert', () => {
    const s = setup();
    const f = s.fleets[5]; f.ships = 3; s.worlds[0].fleets.push(f);
    s.worlds[2].fleets.splice(s.worlds[2].fleets.indexOf(f), 1);
    endTurn(s);
    expect(s.worlds[0].player).toBe(s.a);
  });

  it('vergibt noch keine Punkte', () => {
    const s = setup();
    endTurn(s);
    expect(s.a.points).toBe(0);
  });
});

describe('Classic Befehle im CommandFactory', () => {
  it('D-Schiff-Befehle gibt es im Classic Game nicht', () => {
    const s = setup();
    const f = run(s, { A: 'F1T1D D1T1F2 F1AD D1AF6' });
    expect(errorsOf(f, 'A')).toEqual([18, 18, 18, 18]);
  });

  it('unvollständige Classic-Befehle sind unbekannt', () => {
    const s = setup();
    const f = run(s, { A: 'W1B5 F1U1U2U3 W1I2' });
    expect(errorsOf(f, 'A')).toEqual([2, 2, 2]);
  });

  it('Befehle sind unabhängig von der Eingabereihenfolge: Entladen vor Bauen, Laden danach', () => {
    const s = setup();
    s.worlds[0].industry = 5;
    s.fleets[0].ships = 6; s.fleets[0].metal = 6;
    s.fleets[1].ships = 6;
    const f = run(s, { A: 'F2L5 W1B5F3 F1U' });
    expect(errorsOf(f, 'A')).toEqual([]);
    expect(s.fleets[2].ships).toBe(5);
    // Gebaut mit Altmetall (30 - 5), danach 5 aus dem Bestand geladen
    expect(s.fleets[1].metal).toBe(5);
  });
});
