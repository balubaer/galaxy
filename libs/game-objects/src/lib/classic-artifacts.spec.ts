import { World } from './world';
import { Player } from './player';
import { Fleet } from './fleet';
import { Port } from './port';
import { CommandFactory } from './command-factory';
import { FinalPhaseClassicGame } from './final-phase-classic-game';
import { PersistenceManager } from './persistence-manager';
import { checkGameEnd } from './core-game-rules';
import { GamePref } from './game-pref.interface';
import {
  ARTIFACT_TYPE_COUNT, Artifact, artifactEndBonus, artifactTurnPoints, artifactKind, artifactPoints, classicEndBonus, isPandora,
  placeArtifacts, ARTIFACT_ADJECTIVES, ARTIFACT_NOUNS, artifactEffect, artifactTypePoints, ownedArtifactInfos, artifactTypeByName,
} from './classic-artifacts';
import { characterTurnPoints, turnPoints } from './classic-scoring';
import { PersistenceGrafManager } from './persistence-graf-manager';

interface Setup {
  worlds: Array<World>;
  a: Player;
  b: Player;
  fleets: Array<Fleet>;
  players: Map<string, Player>;
}

/** W1 (Heimat von A) - W2 - W3 (Heimat von B), W1 - W3. A: F1..F5 auf W1, B: F6 auf W3. */
function setup(): Setup {
  const a = new Player('A'); a.points = 0; a.characterType = 'emperor';
  const b = new Player('B'); b.points = 0; b.characterType = 'collector';
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
    const f = new Fleet(); f.number = i; f.player = a; f.ships = 2; w1.fleets.push(f); fleets.push(f);
  }
  const fb = new Fleet(); fb.number = 6; fb.player = b; fb.ships = 2; w3.fleets.push(fb); fleets.push(fb);
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

function moveFleet(s: Setup, fleet: Fleet, to: World) {
  for (const w of s.worlds) {
    const i = w.fleets.indexOf(fleet);
    if (i !== -1) { w.fleets.splice(i, 1); }
  }
  to.fleets.push(fleet);
}

/** Art-Nummer eines Artefakts nach Namen. */
function typeOf(name: string): number {
  for (let type = 1; type <= ARTIFACT_TYPE_COUNT; type++) {
    if (artifactKind(type).name === name) {
      return type;
    }
  }
  throw new Error(name);
}

function artifact(number: number, name: string): Artifact {
  return { number, type: typeOf(name) };
}

function player(type: 'emperor' | 'collector' | 'raider' | 'trader' | 'positronix' | 'missionary'): Player {
  const p = new Player(type); p.points = 0; p.characterType = type; return p;
}

describe('Classic Artefakte: Arten und Verteilung', () => {
  it('100 Arten: 90 Kombinationen, Key to Time 1–5 und fünf Sonderstücke', () => {
    expect(ARTIFACT_TYPE_COUNT).toBe(100);
    expect(artifactKind(1).name).toBe('Imperial Sceptor');
    expect(artifactKind(90).name).toBe('Cursed Carapace');
    expect(artifactKind(91).name).toBe('The Key to Time (segment 1)');
    expect(artifactKind(100).name).toBe("The Pandora's Box");
    const names = new Set(Array.from({ length: 100 }, (_, i) => artifactKind(i + 1).name));
    expect(names.size).toBe(100);
  });

  it('Verteilung: etwa 100 je 15 Spieler, genau eine Pandora, nie auf Heimatwelten oder Schwarzen Löchern', () => {
    const worlds = Array.from({ length: 40 }, (_, i) => { const w = new World(); w.setNumber(i + 1); return w; });
    worlds[0].player = new Player('A');
    worlds[1].blackHole = true;
    const placed = placeArtifacts(worlds, 6, () => 0.5);
    expect(placed.length).toBe(40);
    expect(placed.filter(isPandora).length).toBe(1);
    expect(placed.find(isPandora).pandora).toBeDefined();
    expect(worlds[0].artifacts).toEqual([]);
    expect(worlds[1].artifacts).toEqual([]);
    expect(new Set(placed.map(p => p.number)).size).toBe(40);
    expect(new Set(placed.map(p => p.type)).size).toBe(40);
  });

  it('mehr als 100 Artefakte bringen Duplikate, aber nur eine Pandora', () => {
    const worlds = Array.from({ length: 40 }, (_, i) => { const w = new World(); w.setNumber(i + 1); return w; });
    let i = 0;
    const placed = placeArtifacts(worlds, 30, () => (i++ * 0.37) % 1);
    expect(placed.length).toBeGreaterThan(100);
    expect(placed.filter(isPandora).length).toBe(1);
  });

  it('Artefakte werden auf Welt und Flotte gespeichert und geladen', () => {
    const s = setup();
    s.worlds[1].artifacts = [artifact(3, 'Holy Grail')];
    s.fleets[0].artifacts = [{ number: 7, type: 100, pandora: 'mines' }];
    const persist = new PersistenceManager(s.worlds).createWorldsPersist();
    const loaded = new PersistenceManager([]).createWorldsWithWorldsPersist(JSON.parse(JSON.stringify(persist)));
    expect(loaded[1].artifacts).toEqual([artifact(3, 'Holy Grail')]);
    expect(loaded[0].fleets[0].artifacts).toEqual([{ number: 7, type: 100, pandora: 'mines' }]);
    expect(loaded[2].artifacts).toEqual([]);
  });

  it('Bericht und Karte nennen die Artefakte', () => {
    const s = setup();
    s.worlds[1].artifacts = [artifact(3, 'Holy Grail')];
    s.fleets[0].artifacts = [artifact(4, 'The Rhinovirus')];
    expect(s.worlds[1].description()).toContain('Artefakte: V3 Holy Grail');
    expect(s.fleets[0].description()).toContain('Artefakte: V4 The Rhinovirus');
    expect(s.worlds[1].classicInfo().artifacts).toEqual([{ number: 3, name: 'Holy Grail', type: 51 }]);
    const graf = new PersistenceGrafManager(s.worlds, s.players, new Map(), new Map()).generateNodesAndLinks('A');
    const w1 = graf.nodes.find(n => n.id === 'W1');
    expect(w1.data.fleets[0].artifacts).toEqual([{ number: 4, name: 'The Rhinovirus', type: 97 }]);
  });
});

describe('Classic Artefakte: Befehle', () => {
  it('VaaFbb hängt ein Artefakt der eigenen Welt an eine eigene Flotte', () => {
    const s = setup();
    s.worlds[0].artifacts = [artifact(3, 'Holy Grail')];
    const f = run(s, { A: 'V3F1' });
    expect(errorsOf(f, 'A')).toEqual([]);
    expect(s.fleets[0].artifacts.map(a => a.number)).toEqual([3]);
    expect(s.worlds[0].artifacts).toEqual([]);
  });

  it('VaaW wirft es von der eigenen Flotte vor dem Flug auf die Startwelt ab', () => {
    const s = setup();
    s.fleets[0].artifacts = [artifact(3, 'Holy Grail')];
    const f = run(s, { A: 'V3W F1W2' });
    expect(errorsOf(f, 'A')).toEqual([]);
    expect(s.worlds[0].artifacts.map(a => a.number)).toEqual([3]);
  });

  it('angehängte Artefakte fliegen mit der Flotte', () => {
    const s = setup();
    s.worlds[0].artifacts = [artifact(3, 'Holy Grail')];
    run(s, { A: 'V3F1 F1W2' });
    new FinalPhaseClassicGame(s.worlds, s.players).doFinal();
    expect(s.worlds[1].fleets[0].artifacts.map(a => a.number)).toEqual([3]);
  });

  it('nicht von fremder Welt, nicht an fremde Flotte eines Nicht-Collectors', () => {
    const s = setup();
    s.worlds[2].artifacts = [artifact(3, 'Holy Grail')];
    moveFleet(s, s.fleets[0], s.worlds[2]);
    expect(errorsOf(run(s, { A: 'V3F1' }), 'A')).toEqual([37]);
    const t = setup();
    t.worlds[0].artifacts = [artifact(3, 'Holy Grail')];
    t.b.characterType = 'emperor';
    moveFleet(t, t.fleets[5], t.worlds[0]);
    expect(errorsOf(run(t, { A: 'V3F6' }), 'A')).toEqual([39]);
  });

  it('an die Flotte eines Collectors darf man von Welt und Flotte hängen', () => {
    const s = setup();
    s.worlds[0].artifacts = [artifact(3, 'Holy Grail')];
    s.fleets[0].artifacts = [artifact(4, 'Cursed Grail')];
    moveFleet(s, s.fleets[5], s.worlds[0]);
    const f = run(s, { A: 'V3F6 V4F6' });
    expect(errorsOf(f, 'A')).toEqual([]);
    expect(s.fleets[5].artifacts.map(a => a.number)).toEqual([3, 4]);
  });

  it('von Flotte zu Flotte nur zu einem Collector', () => {
    const s = setup();
    s.fleets[0].artifacts = [artifact(3, 'Holy Grail')];
    expect(errorsOf(run(s, { A: 'V3F2' }), 'A')).toEqual([39]);
    s.a.characterType = 'collector';
    expect(errorsOf(run(s, { A: 'V3F2' }), 'A')).toEqual([]);
    expect(s.fleets[1].artifacts.map(a => a.number)).toEqual([3]);
  });

  it('Artefakt und Flotte müssen auf derselben Welt sein, unbekannte Nummern scheitern', () => {
    const s = setup();
    s.worlds[0].artifacts = [artifact(3, 'Holy Grail')];
    expect(errorsOf(run(s, { A: 'V3F6' }), 'A')).toEqual([38]);
    expect(errorsOf(run(s, { A: 'V99F1 V99W' }), 'A')).toEqual([36, 36]);
    expect(errorsOf(run(s, { A: 'V3W' }), 'A')).toEqual([40]);
  });
});

describe('Classic Artefakte: Punkte', () => {
  it('Nicht-Collector: größter Schatz 15, halber 5, Cursed −10, Sonderstücke laut Tabelle', () => {
    const p = player('positronix');
    const points = (name: string) => artifactPoints(p, artifact(1, name));
    expect(points('Metallic Conduit')).toBe(15);
    expect(points('Metallic Grail')).toBe(5);
    expect(points('Mythical Conduit')).toBe(5);
    expect(points('Cursed Conduit')).toBe(-10);
    expect(points('Holy Grail')).toBe(0);
    expect(points('The Key to Time (segment 2)')).toBe(0);
    expect(points('The Rock of Diamante')).toBe(10);
    expect(points('The Rhinovirus')).toBe(-15);
    expect(points("The Philosopher's Stone")).toBe(20);
    expect(points('The Deadly Nightshade')).toBe(-30);
    expect(points("The Pandora's Box")).toBe(0);
  });

  it('Collector: 90, 30, Cursed 0, Sonderstücke 30, sonst 15', () => {
    const p = player('collector');
    const points = (name: string) => artifactPoints(p, artifact(1, name));
    expect(points('Antique Sculpture')).toBe(90);
    expect(points('Antique Grail')).toBe(30);
    expect(points('Holy Sculpture')).toBe(30);
    expect(points('Cursed Sculpture')).toBe(0);
    expect(points('The Deadly Nightshade')).toBe(30);
    expect(points('The Key to Time (segment 1)')).toBe(0);
    expect(points('Holy Grail')).toBe(15);
  });

  it('Artefakte auf eigenen Welten und Flotten zählen jede Runde mit', () => {
    const s = setup();
    s.worlds[0].artifacts = [artifact(3, 'Imperial Sceptor')];
    s.fleets[0].artifacts = [artifact(4, 'The Rhinovirus')];
    s.worlds[1].artifacts = [artifact(5, "The Philosopher's Stone")];
    // Sceptor 15 + Rhinovirus −15; der Stein liegt auf einer herrenlosen Welt.
    expect(artifactTurnPoints(s.a, s.worlds)).toBe(0);
    s.worlds[1].player = s.a;
    expect(artifactTurnPoints(s.a, s.worlds)).toBe(20);
    expect(turnPoints(s.a, s.worlds)).toBe(characterTurnPoints(s.a, s.worlds) + 20);
  });

  it('Schwarzes Loch verstreut die Artefakte der Flotte', () => {
    const s = setup();
    s.worlds[1].blackHole = true;
    s.worlds[1].population = 0;
    s.fleets[0].artifacts = [artifact(3, 'Holy Grail'), artifact(4, 'Cursed Grail')];
    run(s, { A: 'F1W2' });
    new FinalPhaseClassicGame(s.worlds, s.players, () => 0).doFinal();
    expect(s.fleets[0].artifacts).toEqual([]);
    expect(s.worlds[0].artifacts.map(a => a.number)).toEqual([3, 4]);
  });
});

describe('Classic Artefakte: Boni am Spielende', () => {
  const allOf = (names: Array<string>) => names.map((name, i) => artifact(i + 1, name));

  it('Nicht-Collector: Key to Time 1000, Adjektiv-Satz 500, Nomen-Satz ohne Cursed 500', () => {
    const s = setup();
    s.a.characterType = 'positronix';
    s.worlds[0].artifacts = allOf([
      ...[1, 2, 3, 4, 5].map(n => `The Key to Time (segment ${n})`),
      ...ARTIFACT_NOUNS.map(noun => `Metallic ${noun}`),
      ...ARTIFACT_ADJECTIVES.filter(a => a !== 'Cursed' && a !== 'Metallic').map(adj => `${adj} Conduit`),
    ]);
    expect(artifactEndBonus(s.a, s.worlds).points).toBe(2000);
  });

  it('Duplikate ersetzen kein fehlendes Segment', () => {
    const s = setup();
    s.worlds[0].artifacts = allOf([1, 2, 2, 3, 4].map(n => `The Key to Time (segment ${n})`));
    expect(artifactEndBonus(s.a, s.worlds).points).toBe(0);
  });

  it('Collector: 1500 für Key to Time und 500 je Museum (eigene Welt mit 10 Artefakten)', () => {
    const s = setup();
    s.worlds[2].artifacts = allOf([
      ...[1, 2, 3, 4, 5].map(n => `The Key to Time (segment ${n})`),
      'Holy Grail', 'Cursed Grail', 'Legal Grail', 'Savage Grail', 'Bamboo Grail',
    ]);
    expect(artifactEndBonus(s.b, s.worlds).points).toBe(1500 + 500);
  });

  it('checkGameEnd vergibt die Boni erst, wenn die Zielpunktzahl erreicht ist, und wählt dann den Sieger', () => {
    const s = setup();
    s.worlds[2].artifacts = allOf([1, 2, 3, 4, 5].map(n => `The Key to Time (segment ${n})`));
    const pref = { targetScore: 100, finished: false } as GamePref;
    s.a.points = 90;
    s.b.points = 10;
    checkGameEnd(pref, s.players.values(), classicEndBonus(s.worlds));
    expect(pref.finished).toBe(false);
    expect(s.b.points).toBe(10);
    s.a.points = 100;
    checkGameEnd(pref, s.players.values(), classicEndBonus(s.worlds));
    expect(pref.finished).toBe(true);
    expect(s.b.points).toBe(1510);
    expect(pref.winner).toBe('B');
  });
});

describe("Classic Artefakte: Pandora's Box", () => {
  it('Industrie: +1 Industrie auf der eigenen Welt, auf der sie liegt', () => {
    const s = setup();
    s.worlds[0].artifacts = [{ number: 1, type: 100, pandora: 'industry' }];
    new FinalPhaseClassicGame(s.worlds, s.players).doFinal();
    expect(s.worlds[0].industry).toBe(31);
  });

  it('Mine: +1 Mine auch, wenn sie an einer Flotte über der eigenen Welt hängt', () => {
    const s = setup();
    s.fleets[0].artifacts = [{ number: 1, type: 100, pandora: 'mines' }];
    new FinalPhaseClassicGame(s.worlds, s.players).doFinal();
    expect(s.worlds[0].mines).toBe(3);
  });

  it('herrenlos wirkt sie nicht', () => {
    const s = setup();
    s.worlds[1].artifacts = [{ number: 1, type: 100, pandora: 'industry' }];
    new FinalPhaseClassicGame(s.worlds, s.players).doFinal();
    expect(s.worlds[1].industry).toBe(0);
  });

  it('Selbstzerstörung: an einer Flotte zerstört sie alle Schiffe und taucht woanders auf', () => {
    const s = setup();
    s.fleets[0].ships = 10;
    s.fleets[0].artifacts = [{ number: 1, type: 100, pandora: 'selfDestruct' }, artifact(2, 'Holy Grail')];
    new FinalPhaseClassicGame(s.worlds, s.players, () => 0.99).doFinal();
    expect(s.fleets[0].ships).toBe(0);
    expect(s.fleets[0].artifacts.map(a => a.number)).toEqual([2]);
    expect(s.worlds[2].artifacts.map(a => a.number)).toEqual([1]);
  });
});

describe('Classic Game: Wert eines Artefakts für den Charakter', () => {
    const typeOf = (name: string) => Array.from({ length: ARTIFACT_TYPE_COUNT }, (_, i) => i + 1).find(type => artifactKind(type).name === name);

    it('names the treasure, the matching set and the end bonus', () => {
        const effect = artifactEffect('emperor', typeOf('Imperial Sceptor'));
        expect(effect.points).toBe(15);
        expect(effect.notes).toContain('dein größter Schatz');
        expect(effect.notes).toContain('zählt zum Satz aller Imperial-Artefakte (+500 am Spielende)');
        expect(effect.notes).toContain('zählt zum Satz aller Sceptor-Artefakte ohne Cursed (+500 am Spielende)');
    });

    it('marks cursed artifacts as negative for other characters, not for the collector', () => {
        expect(artifactEffect('raider', typeOf('Cursed Cutlass'))).toEqual({ points: -10, notes: ['verflucht'] });
        const collector = artifactEffect('collector', typeOf('Cursed Cutlass'));
        expect(collector.points).toBe(0);
        expect(collector.notes).toEqual(['zählt für ein Museum (10 Artefakte auf einer eigenen Welt: +500)']);
    });

    it('describes Key to Time segments and the Pandora\'s Box', () => {
        expect(artifactEffect('trader', typeOf('The Key to Time (segment 2)')).notes).toEqual(['Segment 2 von 5: alle Segmente +1000 am Spielende']);
        const pandora = artifactEffect(null, typeOf("The Pandora's Box"));
        expect(pandora.points).toBe(0);
        expect(pandora.notes[0]).toMatch(/^wirkt jede Runde/);
    });

    it('gives the same points per turn as artifactTypePoints', () => {
        for (let type = 1; type <= ARTIFACT_TYPE_COUNT; type++) {
            expect(artifactEffect('collector', type).points).toBe(artifactTypePoints('collector', type));
        }
    });
});

describe('Classic Game: eigene Artefakte in den Rundendaten', () => {
    it('lists own artifacts on worlds and fleets with location and points', () => {
        const player = new Player('A'); player.characterType = 'missionary';
        const other = new Player('B');
        const world = new World(); world.setNumber(4); world.player = player;
        world.artifacts = [{ number: 9, type: 87 }];
        const fleet = new Fleet(); fleet.number = 2; fleet.player = player;
        fleet.artifacts = [{ number: 3, type: 51 }];
        const foreign = new Fleet(); foreign.number = 5; foreign.player = other;
        foreign.artifacts = [{ number: 1, type: 1 }];
        world.fleets = [fleet, foreign];
        expect(ownedArtifactInfos(player, [world])).toEqual([
            { number: 3, name: 'Holy Grail', type: 51, points: 15, location: 'F2 auf W4' },
            { number: 9, name: 'Cursed Grail', type: 87, points: -10, location: 'W4' },
        ]);
    });
});

describe('Classic Game: Art aus dem Artefaktnamen', () => {
    it('finds the type for every name and nothing for unknown names', () => {
        for (let type = 1; type <= ARTIFACT_TYPE_COUNT; type++) {
            expect(artifactTypeByName(artifactKind(type).name)).toBe(type);
        }
        expect(artifactTypeByName('Golden Banana')).toBeUndefined();
    });
});
