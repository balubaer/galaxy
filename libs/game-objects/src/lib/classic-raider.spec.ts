import { World } from './world';
import { Player } from './player';
import { Fleet } from './fleet';
import { Port } from './port';
import { CommandFactory } from './command-factory';
import { FinalPhaseClassicGame } from './final-phase-classic-game';
import { FinalPhaseCoreGame } from './final-phase-core-game';
import { ClassicWorldFactory } from './classic-world-factory';
import { PersistenceManager } from './persistence-manager';
import { addPenalty, raiderPlunderPoints, turnPoints } from './classic-scoring';

interface Setup {
  worlds: Array<World>;
  a: Player;
  b: Player;
  fleets: Array<Fleet>;
  players: Map<string, Player>;
}

/** W1 (Heimat von A, Raider) - W2 - W3 (Heimat von B, Emperor), W1 - W3. A: F1..F5 auf W1, B: F6 auf W3. */
function setup(): Setup {
  const a = new Player('A'); a.points = 0; a.characterType = 'raider';
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

/** A kommt mit F1 (raiderShips) nach W2, B steht dort mit F6 (otherShips). */
function meetAtW2(raiderShips: number, otherShips: number): Setup {
  const s = setup();
  s.fleets[0].ships = raiderShips;
  s.fleets[5].ships = otherShips;
  s.fleets[5].metal = 2;
  moveFleet(s, s.fleets[0], s.worlds[1]);
  moveFleet(s, s.fleets[5], s.worlds[1]);
  return s;
}

describe('Classic Charaktertypen', () => {
  it('Charakter wird gewählt, zufällig zugelost oder ist ohne Angabe Emperor', () => {
    expect(new ClassicWorldFactory(() => 0, { A: 'raider' }).characterTypeFor('A')).toBe('raider');
    expect(new ClassicWorldFactory(() => 0, {}).characterTypeFor('A')).toBe('emperor');
    expect(new ClassicWorldFactory(() => 0, { A: 'random' }).characterTypeFor('A')).toBe('emperor');
    expect(new ClassicWorldFactory(() => 0.5, { A: 'random' }).characterTypeFor('A')).toBe('raider');
  });

  it('Heimatwelt bekommt den gewählten Charakter', () => {
    const s = setup();
    new ClassicWorldFactory(() => 0, { A: 'raider', B: 'emperor' }).initHomeWorld(s.worlds[0]);
    expect(s.a.characterType).toBe('raider');
  });

  it('Raider wird gespeichert und geladen, unbekannte Typen laden ohne Charakter', () => {
    const s = setup();
    const persist = new PersistenceManager(s.worlds).createWorldsPersist();
    const loaded = new PersistenceManager([]).createWorldsWithWorldsPersist(JSON.parse(JSON.stringify(persist)));
    expect(loaded[0].player.characterType).toBe('raider');
    expect(loaded[2].player.characterType).toBe('emperor');
    persist.players[0].characterType = 'unbekannt';
    const broken = new PersistenceManager([]).createWorldsWithWorldsPersist(persist);
    expect(broken.find(w => w.player !== null).player.characterType).toBeNull();
  });

  it('Positronix ist von Strafen für Töten und PBB ausgenommen, nicht aber vom Plündern', () => {
    const p = new Player('P'); p.points = 0; p.characterType = 'positronix';
    expect(addPenalty(p, 10, 'kill')).toBe(0);
    expect(addPenalty(p, 60, 'pbb')).toBe(0);
    expect(addPenalty(p, 5, 'plunder')).toBe(5);
    expect(p.points).toBe(-5);
  });

  it('im Classic Game feuert der Hinterhalt nicht auf Verbündete, im Core Game nur Teammates nicht', () => {
    const s = setup();
    s.a.allies.add(s.b);
    expect(new FinalPhaseClassicGame(s.worlds, s.players).isSpared(s.a, s.b)).toBe(true);
    expect(new FinalPhaseClassicGame(s.worlds, s.players).isSpared(s.b, s.a)).toBe(false);
    expect(new FinalPhaseCoreGame(s.worlds, s.players).isSpared(s.a, s.b)).toBe(false);
  });
});

describe('Classic Raider', () => {
  it('Plünderpunkte 50, 40, 30, 20, danach 10', () => {
    expect([1, 2, 3, 4, 5, 9].map(raiderPlunderPoints)).toEqual([50, 40, 30, 20, 10, 10]);
  });

  it('3 Punkte je Runde für jede eigene Flotte, auch leere', () => {
    const s = setup();
    expect(turnPoints(s.a, s.worlds)).toBe(15);
    expect(turnPoints(s.b, s.worlds)).toBeGreaterThan(0);
  });

  it('Plündern bringt dem Raider Punkte statt Strafe', () => {
    const s = setup();
    run(s, { A: 'W1X' });
    endTurn(s);
    expect(s.worlds[0].plunderCount).toBe(1);
    expect(s.a.points).toBe(50 + turnPoints(s.a, s.worlds));
  });

  it('zweite Plünderung derselben Welt bringt 40 Punkte', () => {
    const s = setup();
    s.worlds[0].plunderCount = 1;
    run(s, { A: 'W1X' });
    endTurn(s);
    expect(s.a.points).toBe(40 + turnPoints(s.a, s.worlds));
  });

  it('Emperor zahlt weiter 5 Punkte Strafe fürs Plündern', () => {
    const s = setup();
    run(s, { B: 'W3X' });
    endTurn(s);
    expect(s.b.points).toBe(-5 + turnPoints(s.b, s.worlds));
  });

  it('Commandeer bei mehr als 3:1 übernimmt die Flotte samt Metall', () => {
    const s = meetAtW2(10, 3);
    endTurn(s);
    expect(s.fleets[5].player).toBe(s.a);
    expect(s.fleets[5].ships).toBe(3);
    expect(s.fleets[5].metal).toBe(2);
    expect(s.worlds[1].events.some(e => e.includes('gekapert'))).toBe(true);
  });

  it('genau 3:1 reicht nicht', () => {
    const s = meetAtW2(9, 3);
    endTurn(s);
    expect(s.fleets[5].player).toBe(s.b);
  });

  it('Flotten At Peace des Raiders zählen nicht mit', () => {
    const s = meetAtW2(10, 3);
    s.fleets[0].atPeace = true;
    endTurn(s);
    expect(s.fleets[5].player).toBe(s.b);
  });

  it('Verbündete werden nicht gekapert, zählen aber beim Verhältnis mit', () => {
    const s = meetAtW2(10, 3);
    s.a.allies.add(s.b);
    endTurn(s);
    expect(s.fleets[5].player).toBe(s.b);

    const t = meetAtW2(13, 3);
    const c = new Player('C'); c.points = 0; c.characterType = 'emperor';
    t.players.set('C', c);
    t.a.allies.add(t.b);
    const fc = new Fleet(); fc.number = 7; fc.player = c; fc.ships = 1; t.worlds[1].fleets.push(fc);
    endTurn(t);
    expect(fc.player).toBe(t.a);
    expect(t.fleets[5].player).toBe(t.b);
  });

  it('ein Emperor kapert nicht', () => {
    const s = meetAtW2(10, 3);
    s.a.characterType = 'emperor';
    endTurn(s);
    expect(s.fleets[5].player).toBe(s.b);
  });

  it('gekaperte PBB verschwindet', () => {
    const s = meetAtW2(100, 26);
    s.fleets[5].pbb = true;
    endTurn(s);
    expect(s.fleets[5].player).toBe(s.a);
    expect(s.fleets[5].pbb).toBe(false);
  });
});
