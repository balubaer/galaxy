import { World } from './world';
import { Player } from './player';
import { Fleet } from './fleet';
import { Port } from './port';
import { CommandFactory } from './command-factory';
import { FinalPhaseClassicGame } from './final-phase-classic-game';
import { destroyShips } from './classic-combat';
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

describe('Classic Schussrechnung', () => {
  function fleet(ships: number, metal = 0): Fleet {
    const f = new Fleet(); f.number = 99; f.ships = ships; f.metal = metal; return f;
  }

  it('zwei Schuss je Schiff, Rundung je Feuernder', () => {
    const f = fleet(10);
    expect(destroyShips(f, [10], false)).toBe(5);
    expect(f.ships).toBe(5);
    expect(destroyShips(fleet(10), [3, 3], false)).toBe(2);
    expect(destroyShips(fleet(10), [6], false)).toBe(3);
  });

  it('beladene Schiffe fallen mit einem Schuss, zuerst werden unbeladene getroffen', () => {
    const f = fleet(10, 4);
    expect(destroyShips(f, [15], false)).toBe(6 + 3);
    expect(f.ships).toBe(1);
    expect(f.metal).toBe(1);
    const g = fleet(10, 4);
    expect(destroyShips(g, [10], false)).toBe(5);
    expect(g.metal).toBe(4);
  });

  it('wegfliegende Flotte nimmt halben Schaden (abgerundet)', () => {
    expect(destroyShips(fleet(10), [10], true)).toBe(2);
    expect(destroyShips(fleet(10), [12], true)).toBe(3);
  });
});

describe('Classic Feuerbefehle', () => {
  it('Flotten beschießen sich gleichzeitig', () => {
    const s = setup();
    place(s, s.fleets[0], s.worlds[1], 10);
    place(s, s.fleets[5], s.worlds[1], 6);
    const f = run(s, { A: 'F1AF6', B: 'F6AF1' });
    expect(errorsOf(f, 'A')).toEqual([]);
    endTurn(s);
    expect(s.fleets[5].ships).toBe(1);
    expect(s.fleets[0].ships).toBe(7);
  });

  it('I- und P-Schiffe feuern halb so stark und je Gruppe nur einmal', () => {
    const s = setup();
    noBuild(s);
    s.worlds[0].iShips = 7; s.worlds[0].pShips = 4;
    place(s, s.fleets[5], s.worlds[0], 6);
    const f = run(s, { A: 'I1AF6 P1AF6 I1CF6' });
    expect(errorsOf(f, 'A')).toEqual([29]);
    endTurn(s);
    // I: 3 Schuss -> 1 Schiff, P: 2 Schuss -> 1 Schiff
    expect(s.fleets[5].ships).toBe(4);
  });

  it('eigene Flotte, eigene Welt und I-Schiffe auf den Boden werden abgelehnt', () => {
    const s = setup();
    s.fleets[0].ships = 5; s.fleets[1].ships = 5;
    const f = run(s, { A: 'F1AF2 F2AI' });
    expect(errorsOf(f, 'A')).toEqual([12, 30]);
  });

  it('Beschuss von I-Schiffen und Industrie bzw. P-Schiffen und Bevölkerung', () => {
    const s = setup();
    noBuild(s);
    place(s, s.fleets[5], s.worlds[0], 10);
    const f6 = new Fleet(); f6.number = 7; f6.player = s.b;
    place(s, f6, s.worlds[0], 10);
    run(s, { B: 'F6AI F7AP' });
    endTurn(s);
    const w = s.worlds[0];
    expect(w.iShips).toBe(0);
    expect(w.pShips).toBe(0);
    // 5 Treffer: 1 I-Schiff + 4 Industrie, 1 P-Schiff + 4 Bevölkerung (danach Wachstum)
    expect(w.industry).toBe(26);
    expect(w.events.join('\n')).toContain('4 Bevölkerung getötet');
  });

  it('Beschuss der I- und P-Schiffe mit 2 Schuss Überschuss neutralisiert die Welt', () => {
    const s = setup();
    noBuild(s);
    place(s, s.fleets[5], s.worlds[0], 6);
    run(s, { B: 'F6AH' });
    endTurn(s);
    expect(s.worlds[0].events.join('\n')).toContain('Welt neutralisiert');
    // B ist danach als Einziger mit Schiffen da und erobert sie
    expect(s.worlds[0].player).toBe(s.b);
    const t = setup();
    noBuild(t);
    place(t, t.fleets[5], t.worlds[0], 5);
    run(t, { B: 'F6AH' });
    endTurn(t);
    // 5 Schuss: 4 nötig für 1 I- und 1 P-Schiff, nur 1 übrig -> nicht neutralisiert
    // (danach ist B trotzdem allein mit Schiffen da und erobert die Welt)
    expect(t.worlds[0].events.join('\n')).not.toContain('neutralisiert');
  });
});

describe('Classic bedingtes Feuern', () => {
  it('feuert nur, wenn der Gegner auf derselben Welt angreift; zählt als Aktion', () => {
    const s = setup();
    place(s, s.fleets[0], s.worlds[1], 10);
    place(s, s.fleets[5], s.worlds[1], 6);
    const f = run(s, { A: 'F1CF6 F1W1' });
    expect(errorsOf(f, 'A')).toEqual([10]);
    endTurn(s);
    expect(s.fleets[5].ships).toBe(6);
    expect(s.fleets[0].ships).toBe(10);
  });

  it('wird durch einen Angriff ausgelöst, auch durch Angriff auf eine andere eigene Flotte', () => {
    const s = setup();
    place(s, s.fleets[0], s.worlds[1], 10);
    place(s, s.fleets[1], s.worlds[1], 4);
    place(s, s.fleets[5], s.worlds[1], 6);
    run(s, { A: 'F1CF6', B: 'F6AF2' });
    endTurn(s);
    expect(s.fleets[5].ships).toBe(1);
    expect(s.fleets[1].ships).toBe(1);
  });

  it('zwei bedingte Befehle lösen sich nicht gegenseitig aus', () => {
    const s = setup();
    place(s, s.fleets[0], s.worlds[1], 10);
    place(s, s.fleets[5], s.worlds[1], 6);
    run(s, { A: 'F1CF6', B: 'F6CF1' });
    endTurn(s);
    expect(s.fleets[0].ships).toBe(10);
    expect(s.fleets[5].ships).toBe(6);
  });

  it('bedingt feuernde Flotte schießt nicht aus dem Hinterhalt', () => {
    const s = setup();
    noBuild(s);
    s.worlds[0].iShips = 0; s.worlds[0].pShips = 0;
    const enemy = new Fleet(); enemy.number = 8; enemy.player = s.b;
    place(s, enemy, s.worlds[0], 3);
    place(s, s.fleets[0], s.worlds[0], 10);
    place(s, s.fleets[5], s.worlds[2], 6);
    run(s, { A: 'F1CF8', B: 'F6W1W2' });
    endTurn(s);
    expect(s.fleets[5].ships).toBe(6);
  });
});

describe('Classic Hinterhalt, Schwarze Löcher, Sonden', () => {
  it('I- und P-Schiffe feuern aus dem Hinterhalt mit voller Stärke, beladene Schiffe doppelt', () => {
    const s = setup();
    noBuild(s);
    place(s, s.fleets[5], s.worlds[2], 5);
    run(s, { B: 'F6W1W2' });
    endTurn(s);
    expect(s.fleets[5].ships).toBe(3);
    expect(s.worlds[1].fleets).toContain(s.fleets[5]);
    expect(s.worlds[0].description()).toContain('Hinterhalt');
    const t = setup();
    noBuild(t);
    place(t, t.fleets[5], t.worlds[2], 5, 5);
    run(t, { B: 'F6W1W2' });
    endTurn(t);
    expect(t.fleets[5].ships).toBe(1);
    expect(t.fleets[5].metal).toBe(1);
  });

  it('I-Schiffe, die gefeuert haben, schießen nicht aus dem Hinterhalt', () => {
    const s = setup();
    s.worlds[0].iShips = 4; s.worlds[0].pShips = 0;
    const enemy = new Fleet(); enemy.number = 8; enemy.player = s.b;
    place(s, enemy, s.worlds[0], 2);
    place(s, s.fleets[5], s.worlds[2], 5);
    run(s, { A: 'I1AF8', B: 'F6W1W2' });
    endTurn(s);
    expect(s.fleets[5].ships).toBe(5);
  });

  it('Flug in ein Schwarzes Loch zerstört Schiffe und Metall, der Schlüssel taucht woanders auf', () => {
    const s = setup();
    Object.assign(s.worlds[1], { blackHole: true, population: 0, populationLimit: 0, mines: 0, metal: 0 });
    place(s, s.fleets[0], s.worlds[0], 6, 3);
    run(s, { A: 'F1W2W3' });
    endTurn(s, () => 0);
    expect(s.fleets[0].ships).toBe(0);
    expect(s.fleets[0].metal).toBe(0);
    expect(s.worlds[1].fleets).not.toContain(s.fleets[0]);
    expect(s.worlds[2].fleets).not.toContain(s.fleets[0]);
    expect(s.worlds[0].fleets).toContain(s.fleets[0]);
    expect(s.worlds[1].events.join()).toContain('Schwarzen Loch');
  });

  it('Sonde kostet ein Schiff und liefert einen Bericht der Nachbarwelt', () => {
    const s = setup();
    s.fleets[0].ships = 3;
    s.worlds[0].port.worlds = [s.worlds[1]];
    const f = run(s, { A: 'F1P2 I1P2 F1P3' });
    expect(errorsOf(f, 'A')).toEqual([9]);
    expect(s.fleets[0].ships).toBe(2);
    expect(s.worlds[1].reportPlayers).toContain(s.a);
  });
});

describe('Classic Befehlsreihenfolge', () => {
  function shootWithProbes(commands: string) {
    const s = setup();
    noBuild(s);
    s.worlds[0].iShips = 1; s.worlds[0].pShips = 0; s.worlds[0].industry = 5;
    place(s, s.fleets[5], s.worlds[0], 8);
    const f = run(s, { B: commands });
    endTurn(s);
    return { s, f };
  }

  it('Sonden verringern die Schüsse derselben Runde nicht, egal in welcher Reihenfolge', () => {
    const before = shootWithProbes('F6P2 F6P3 F6AI');
    const after = shootWithProbes('F6AI F6P2 F6P3');
    for (const { s, f } of [before, after]) {
      expect(errorsOf(f, 'B')).toEqual([]);
      // 8 Schuss -> 4 Treffer: 1 I-Schiff und 3 Industrie; danach verglühen 2 Schiffe als Sonden
      expect(s.worlds[0].industry).toBe(2);
      expect(s.fleets[5].ships).toBe(6);
      expect(s.worlds[1].reportPlayers).toContain(s.b);
    }
  });

  it('mehr Sonden als Schiffe werden abgelehnt, auch über mehrere Befehle', () => {
    const s = setup();
    s.fleets[0].ships = 2;
    const f = run(s, { A: 'F1P2 F1P3 F1W2' });
    expect(errorsOf(f, 'A')).toEqual([]);
    const t = setup();
    t.fleets[0].ships = 1;
    expect(errorsOf(run(t, { A: 'F1P2 F1P3' }), 'A')).toEqual([8]);
  });

  it('Bericht: eine nach dem Feuern übernommene Flotte zeigt, wer gefeuert hat', () => {
    const s = setup();
    noBuild(s);
    s.worlds[1].player = s.b; s.worlds[1].pShips = 2;
    place(s, s.fleets[0], s.worlds[1], 3);
    place(s, s.fleets[5], s.worlds[1], 7);
    run(s, { A: 'F1AF6', B: 'F6AF1 P2AF1' });
    endTurn(s);
    expect(s.fleets[0].player).toBe(s.b);
    expect(s.fleets[0].description()).toBe('F1[B] = 0 (feuerte als [A] auf F6[B])');
    expect(s.fleets[5].description()).toBe('F6[B] = 6 (feuert auf F1[A])');
  });
});

describe('Classic PBB', () => {
  it('Bau am Rundenende mit 26 Schiffen kostet 25, mit weniger abgelehnt', () => {
    const s = setup();
    s.fleets[0].ships = 26; s.fleets[1].ships = 25;
    const f = run(s, { A: 'F1B F2B' });
    expect(errorsOf(f, 'A')).toEqual([32]);
    endTurn(s);
    expect(s.fleets[0].ships).toBe(1);
    expect(s.fleets[0].pbb).toBe(true);
    expect(s.fleets[0].description()).toContain('PBB');
  });

  it('Abwurf vernichtet Leben und Wirtschaft, die Welt wird herrenlos; nicht in der Bau-Runde', () => {
    const s = setup();
    place(s, s.fleets[0], s.worlds[2], 3);
    expect(errorsOf(run(s, { A: 'F1D' }), 'A')).toEqual([31]);
    s.fleets[0].pbb = true;
    const f = run(s, { A: 'F1D' });
    expect(errorsOf(f, 'A')).toEqual([]);
    endTurn(s);
    const w = s.worlds[2];
    expect([w.population, w.industry, w.mines, w.iShips, w.pShips, w.metal]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(w.player).toBeNull();
    expect(s.fleets[0].pbb).toBe(false);
  });

  it('PBB geht verloren, wenn die Flotte zerstört oder verschenkt wird', () => {
    const s = setup();
    place(s, s.fleets[0], s.worlds[2], 1);
    s.fleets[0].pbb = true;
    run(s, { A: 'F1D', B: 'I3AF1 P3AF1' });
    s.worlds[2].iShips = 4;
    endTurn(s);
    expect(s.worlds[2].population).toBeGreaterThan(0);
    const t = setup();
    t.fleets[0].ships = 2; t.fleets[0].pbb = true;
    run(t, { A: 'F1G=B' });
    endTurn(t);
    expect(t.fleets[0].player).toBe(t.b);
    expect(t.fleets[0].pbb).toBe(false);
  });

  it('PBB wird gespeichert', () => {
    const s = setup();
    s.fleets[0].pbb = true;
    const persist = new PersistenceManager(s.worlds).createWorldsPersist();
    const loaded = new PersistenceManager([]).createWorldsWithWorldsPersist(JSON.parse(JSON.stringify(persist)));
    expect(loaded[0].fleets.find(f => f.number === 1).pbb).toBe(true);
  });
});

describe('Classic Geschenk nach Feuer', () => {
  it('Welt kann nicht verschenkt werden, wenn ihre I-Schiffe gefeuert haben', () => {
    const s = setup();
    const enemy = new Fleet(); enemy.number = 8; enemy.player = s.b;
    place(s, enemy, s.worlds[0], 2);
    const f = run(s, { A: 'I1AF8 W1G=B' });
    expect(errorsOf(f, 'A')).toEqual([34]);
  });
});
