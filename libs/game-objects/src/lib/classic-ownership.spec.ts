import { World } from './world';
import { Player } from './player';
import { Fleet } from './fleet';
import { Port } from './port';
import { CommandFactory } from './command-factory';
import { FinalPhaseClassicGame } from './final-phase-classic-game';

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

describe('Classic Transfers', () => {
  it('Flotte -> I-/P-Schiffe, I -> Flotte, P -> I, I -> P', () => {
    const s = setup();
    s.fleets[0].ships = 10;
    const f = run(s, { A: 'F1T4I F1T3P I1T2F2 P1T1I I1T1P' });
    expect(errorsOf(f, 'A')).toEqual([]);
    expect(s.fleets[0].ships).toBe(3);
    expect(s.fleets[1].ships).toBe(2);
    // I: 1 + 4 - 2 + 1(P->I) - 1(I->P) ; P: 1 + 3 - 1 + 1
    // Zusätzlich 30 vom Standardbau der Industrie
    expect(s.worlds[0].iShips).toBe(1 + 4 - 2 + 1 - 1 + 30);
    expect(s.worlds[0].pShips).toBe(1 + 3 - 1 + 1);
  });

  it('zu wenige Schiffe, fremde Welt und Flotte auf anderer Welt werden abgelehnt', () => {
    const s = setup();
    s.fleets[0].ships = 2;
    expect(errorsOf(run(s, { A: 'F1T3I' }), 'A')).toEqual([8]);
    expect(errorsOf(run(s, { A: 'I3T1F6' }), 'A')).toEqual([6]);
    expect(errorsOf(run(s, { A: 'I1T1F6' }), 'A')).toEqual([1]);
    expect(errorsOf(run(s, { A: 'P1T5I' }), 'A')).toEqual([8]);
  });

  it('Metall, das nicht entladen wird, geht beim Wegtransfer der Schiffe verloren', () => {
    const s = setup();
    s.fleets[0].ships = 6; s.fleets[0].metal = 6;
    run(s, { A: 'F1T4I' });
    expect(s.fleets[0].ships).toBe(2);
    expect(s.fleets[0].metal).toBe(2);
  });

  it('Schiffe an eine fremde Flotte zu geben ist erlaubt (Geschenk)', () => {
    const s = setup();
    moveFleet(s, s.fleets[5], s.worlds[0]);
    s.fleets[0].ships = 4;
    const f = run(s, { A: 'F1T2F6' });
    expect(errorsOf(f, 'A')).toEqual([]);
    expect(s.fleets[5].ships).toBe(2);
  });
});

describe('Classic At Peace, Verbündete, Loader', () => {
  it('FaaQ und FaaX setzen At Peace', () => {
    const s = setup();
    run(s, { A: 'F1Q F2Q' });
    expect(s.fleets[0].atPeace).toBe(true);
    run(s, { A: 'F1X' });
    expect(s.fleets[0].atPeace).toBe(false);
    expect(errorsOf(run(s, { A: 'F6Q' }), 'A')).toEqual([5]);
  });

  it('A=, N=, L=, X= setzen Verbündete und Loader (Verbündete auch als Teammates)', () => {
    const s = setup();
    run(s, { A: 'A=B L=B' });
    expect(s.a.allies.has(s.b)).toBe(true);
    expect(s.a.teammates.has(s.b)).toBe(true);
    expect(s.a.loaders.has(s.b)).toBe(true);
    run(s, { A: 'N=B X=B' });
    expect(s.a.allies.size).toBe(0);
    expect(s.a.teammates.size).toBe(0);
    expect(s.a.loaders.size).toBe(0);
    expect(errorsOf(run(s, { A: 'A=NIEMAND' }), 'A')).toEqual([13]);
  });
});

describe('Classic Besitzregeln', () => {
  it('Einziger Spieler mit Schiffen erobert eine unbesetzte Welt samt leerer Flotten', () => {
    const s = setup();
    const empty = new Fleet(); empty.number = 30; s.worlds[1].fleets.push(empty);
    s.fleets[0].ships = 2; moveFleet(s, s.fleets[0], s.worlds[1]);
    endTurn(s);
    expect(s.worlds[1].player).toBe(s.a);
    expect(empty.player).toBe(s.a);
  });

  it('Zwei Spieler: unbesetzte Welt bleibt herrenlos, leere Flotten werden herrenlos', () => {
    const s = setup();
    const empty = new Fleet(); empty.number = 30; empty.player = s.a; s.worlds[1].fleets.push(empty);
    s.fleets[0].ships = 2; s.fleets[5].ships = 2;
    moveFleet(s, s.fleets[0], s.worlds[1]); moveFleet(s, s.fleets[5], s.worlds[1]);
    endTurn(s);
    expect(s.worlds[1].player).toBeNull();
    expect(empty.player).toBeNull();
  });

  it('Fremde Welt mit I-/P-Schiffen wird nicht erobert, ohne diese Schiffe schon', () => {
    const s = setup();
    s.fleets[5].ships = 3; moveFleet(s, s.fleets[5], s.worlds[0]);
    endTurn(s);
    expect(s.worlds[0].player).toBe(s.a);
    const t = setup();
    t.worlds[0].iShips = 0; t.worlds[0].pShips = 0;
    t.fleets[5].ships = 3; moveFleet(t, t.fleets[5], t.worlds[0]);
    endTurn(t);
    expect(t.worlds[0].player).toBe(t.b);
    expect(t.worlds[0].turnsOwned).toBe(1);
  });

  it('At-Peace-Flotten erobern nichts und verhindern keine Eroberung', () => {
    const s = setup();
    s.fleets[0].ships = 2; s.fleets[0].atPeace = true; moveFleet(s, s.fleets[0], s.worlds[1]);
    endTurn(s);
    expect(s.worlds[1].player).toBeNull();
    const t = setup();
    t.worlds[0].iShips = 0; t.worlds[0].pShips = 0;
    t.fleets[0].ships = 2; t.fleets[0].atPeace = true;
    t.fleets[5].ships = 2; moveFleet(t, t.fleets[5], t.worlds[0]);
    endTurn(t);
    expect(t.worlds[0].player).toBe(t.b);
  });

  it('Verbündete Welten werden nicht erobert, andere Spieler aber verdrängt', () => {
    const s = setup();
    s.b.allies.add(s.a);
    s.worlds[0].iShips = 0; s.worlds[0].pShips = 0;
    s.fleets[5].ships = 3; moveFleet(s, s.fleets[5], s.worlds[0]);
    endTurn(s);
    expect(s.worlds[0].player).toBe(s.a);
  });

  it('Leere Flotte eines Verbündeten wird herrenlos statt erobert', () => {
    const s = setup();
    s.b.allies.add(s.a);
    s.fleets[0].ships = 0; // leere Flotte von A
    s.fleets[5].ships = 2; moveFleet(s, s.fleets[5], s.worlds[0]);
    endTurn(s);
    expect(s.fleets[0].player).toBeNull();
  });

  it('Welt ohne Bevölkerung kann niemand besitzen und wird nicht erobert', () => {
    const s = setup();
    s.worlds[1].population = 0;
    s.fleets[0].ships = 2; moveFleet(s, s.fleets[0], s.worlds[1]);
    endTurn(s);
    expect(s.worlds[1].player).toBeNull();
    const t = setup();
    t.worlds[0].population = 0;
    endTurn(t);
    expect(t.worlds[0].player).toBeNull();
  });
});

describe('Classic Geschenke', () => {
  it('Flotte und Welt werden am Rundenende verschenkt', () => {
    const s = setup();
    s.fleets[0].ships = 2;
    const f = run(s, { A: 'F1G=B W1G=B' });
    expect(errorsOf(f, 'A')).toEqual([]);
    expect(s.fleets[0].player).toBe(s.a);
    endTurn(s);
    expect(s.fleets[0].player).toBe(s.b);
    expect(s.worlds[0].player).toBe(s.b);
    expect(s.worlds[0].turnsOwned).toBe(1);
  });

  it('höchstens zwei Geschenke pro Runde, Zähler wird zurückgesetzt', () => {
    const s = setup();
    const f = run(s, { A: 'F1G=B F2G=B F3G=B' });
    expect(errorsOf(f, 'A')).toEqual([26]);
    endTurn(s);
    expect(s.a.giftsThisTurn).toBe(0);
  });

  it('Eine Flotte, die fliegt, kann nicht verschenkt werden; unbekannter Empfänger und Selbstgeschenk', () => {
    const s = setup();
    s.fleets[0].ships = 2;
    const f = run(s, { A: 'F1W2 F1G=B F2G=NIEMAND F3G=A F6G=B' });
    expect(errorsOf(f, 'A')).toEqual([27, 13, 28, 5]);
  });

  it('Gescheitert, wenn die Welt in derselben Runde erobert wird', () => {
    const s = setup();
    s.worlds[0].iShips = 0; s.worlds[0].pShips = 0;
    s.fleets[5].ships = 3; moveFleet(s, s.fleets[5], s.worlds[0]);
    run(s, { A: 'W1G=B' });
    endTurn(s);
    // B hat die Welt erobert; das Geschenk von A gilt nicht mehr, Besitzer bleibt B
    expect(s.worlds[0].player).toBe(s.b);
  });

  it('Nur der Besitzer kann eine Welt verschenken', () => {
    const s = setup();
    expect(errorsOf(run(s, { A: 'W3G=B' }), 'A')).toEqual([6]);
  });
});
