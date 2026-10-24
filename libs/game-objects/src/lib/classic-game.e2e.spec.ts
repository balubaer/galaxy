import { WorldGenerator } from './world-generator';
import { classicGamePref } from './classic-game-rules';
import { GamePref } from './game-pref.interface';
import { WorldsPersist } from './worlds-persist.interface';
import { PersistenceManager } from './persistence-manager';
import { ExecuteCommand } from './execute-command';
import { OutPutLists } from './output-lists';
import { CommandErrorEntry } from './command-factory';
import { checkGameEnd, startGamePref } from './core-game-rules';
import { World } from './world';
import { Fleet } from './fleet';
import { Player } from './player';
import { turnPoints } from './classic-scoring';

/**
 * Abnahme des Classic Games: ein Spiel mit zwei Spielern über mehrere Runden, so wie es die API ausführt
 * (CreateWorld, dann je Runde ExecuteRound mit Speichern und Laden der Welten), mit festem Zufall.
 */

const A = 'ZAPHOD';
const B = 'MARVIN';
const colors = new Map([[A, 'green'], [B, 'blue']]);
const fontColors = new Map([[A, 'white'], [B, 'white']]);

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

interface Game {
  pref: GamePref;
  persist: WorldsPersist;
  reports: Map<string, string>;
  errors: Map<string, Array<CommandErrorEntry>>;
  homes: Map<string, number>;
}

interface State {
  worlds: Array<World>;
  players: Map<string, Player>;
}

function load(game: Game): State {
  const pm = new PersistenceManager([]);
  const worlds = pm.createWorldsWithWorldsPersist(JSON.parse(JSON.stringify(game.persist)));
  return { worlds, players: pm.allPlayerDict };
}

function world(state: State, n: number): World {
  return state.worlds.find(w => w.number === n);
}

function ownFleets(state: State, name: string, at?: World): Array<{ fleet: Fleet; world: World }> {
  return state.worlds
    .filter(w => at === undefined || w === at)
    .flatMap(w => w.fleets.map(fleet => ({ fleet, world: w })))
    .filter(e => e.fleet.player !== null && e.fleet.player.playerName === name);
}

function createGame(): Game {
  const base: GamePref = {
    distanceLevelHomes: 3, fleetCount: 1, fleetsOnHomeWorld: 1, worldCount: 1,
    playName: 'E2E', player: [A, B], startShipCount: 0, round: 0
  };
  const pref = startGamePref(classicGamePref(base));
  const generator = new WorldGenerator(pref);
  const persist = generator.generate();
  const initial = new OutPutLists(pref, colors, fontColors).generate(persist);
  const homes = new Map<string, number>();
  for (const w of generator.worlds) {
    if (w.player !== null) {
      homes.set(w.player.playerName, w.number);
    }
  }
  return {
    pref, persist: JSON.parse(JSON.stringify(persist)), homes, errors: new Map(),
    reports: new Map(Array.from(initial.entries()).map(([name, out]) => [name, out.outPutString])),
  };
}

/** Eine Runde wie GamePlayController.executeRound. */
function playTurn(game: Game, commands: { [player: string]: string }) {
  const execute = new ExecuteCommand(game.pref, colors, fontColors);
  game.pref.round++;
  execute.createEnvironment(JSON.parse(JSON.stringify(game.persist)));
  execute.start(new Map(Object.entries(commands)));
  checkGameEnd(game.pref, execute.allPlayerDict.values());
  game.reports = execute.generateOutput();
  game.errors = execute.commandErrors;
  execute.generateNodeAndLinks();
  game.persist = JSON.parse(JSON.stringify(execute.generateResultWorlds()));
}

function errorsOf(game: Game, name: string): Array<string> {
  return (game.errors.get(name) ?? []).map(e => `${e.command}: ${e.error.errorString}`);
}

/** Kürzester Weg (Weltnummern ohne Start) über die Verbindungen, ohne Schwarze Löcher. */
function path(state: State, from: World, to: World): Array<World> {
  const previous = new Map<World, World>([[from, null]]);
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === to) {
      break;
    }
    for (const next of current.port.worlds) {
      if (!previous.has(next) && !next.blackHole) {
        previous.set(next, current);
        queue.push(next);
      }
    }
  }
  const result: Array<World> = [];
  for (let w = to; w !== from; w = previous.get(w)) {
    result.unshift(w);
  }
  return result;
}

function points(state: State, name: string): number {
  return state.players.get(name).points ?? 0;
}

describe('Classic Game Abnahme (zwei Spieler, mehrere Runden)', () => {
  let game: Game;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(Math, 'random').mockImplementation(seeded(42));
    game = createGame();
  });

  afterAll(() => jest.restoreAllMocks());

  it('Spielaufbau: Spielerliste bleibt erhalten, Heimatwelten mit Startwerten, Startbericht mit Statistik', () => {
    expect(game.pref.player).toEqual([A, B]);
    expect(game.pref.gameType).toBe('classic');
    expect(game.pref.targetScore).toBeGreaterThanOrEqual(6000);
    const state = load(game);
    for (const name of [A, B]) {
      const home = world(state, game.homes.get(name));
      expect([home.industry, home.metal, home.mines, home.population, home.iShips, home.pShips]).toEqual([30, 30, 2, 50, 1, 1]);
      expect(ownFleets(state, name, home).map(e => e.fleet.ships)).toEqual([0, 0, 0, 0, 0]);
      expect(game.reports.get(name)).toContain('Charakter: Emperor');
      expect(game.reports.get(name)).toContain('Bev=50/100, Ind=30, Metall=30, Minen=2');
    }
  });

  it('Runde 1: 30 Schiffe auf 5 Flotten bauen und die Nachbarwelten erkunden', () => {
    const state = load(game);
    const commands: { [player: string]: string } = {};
    for (const name of [A, B]) {
      const home = world(state, game.homes.get(name));
      const fleets = ownFleets(state, name, home).map(e => e.fleet);
      const neighbors = home.port.worlds;
      commands[name] = fleets.map((f, i) => [
        `W${home.number}B6F${f.number}`,
        i < neighbors.length ? `F${f.number}W${neighbors[i].number}` : '',
      ].join(' ')).join(' ');
    }
    playTurn(game, commands);
    const after = load(game);
    for (const name of [A, B]) {
      expect(errorsOf(game, name)).toEqual([]);
      const home = world(after, game.homes.get(name));
      // Handbuch-Walkthrough: danach 2 Metall (2 Minen), Bevölkerung wächst um 10 %
      expect(home.metal).toBe(2);
      expect(home.population).toBe(55);
      expect(home.iShips).toBe(1);
      const visited = home.port.worlds.slice(0, 5);
      const captured = visited.filter(w => w.player !== null && w.player.playerName === name);
      expect(captured.length).toBeGreaterThan(0);
      for (const w of captured) {
        expect(w.turnsOwned).toBe(1);
        expect(ownFleets(after, name, w).some(e => e.fleet.ships === 6)).toBe(true);
      }
      expect(points(after, name)).toBe(turnPoints(after.players.get(name), after.worlds));
      expect(game.reports.get(name)).toContain(`Runde: ${game.pref.round + 1}`);
    }
  });

  let delivered: Map<string, number>;

  it('Runde 2: Metall laden und heimbringen, die Industrie baut mit dem wenigen Metall I-Schiffe', () => {
    const state = load(game);
    const before = new Map([A, B].map(n => [n, points(state, n)]));
    const commands: { [player: string]: string } = {};
    delivered = new Map();
    for (const name of [A, B]) {
      const home = world(state, game.homes.get(name));
      let metal = 0;
      const orders: Array<string> = [];
      // Die Industrie einer Welt verbaut ihr Metall vor dem Laden (Phase 4 vor Phase 5).
      const left = new Map<World, number>();
      for (const { fleet, world: at } of ownFleets(state, name)) {
        if (at !== home && at.hasConnectionToWorld(home)) {
          if (!left.has(at)) {
            left.set(at, at.metal - Math.min(at.industry, at.metal, at.population));
          }
          const load = Math.min(left.get(at), fleet.ships);
          if (load > 0) {
            left.set(at, left.get(at) - load);
            metal += load;
            orders.push(`F${fleet.number}L`, `F${fleet.number}W${home.number}`);
          }
        }
      }
      if (name === A) {
        // Ein freier Späher fliegt auf eine Nachbarwelt, von der aus er nächste Runde Unbekanntes sondieren kann.
        const unseen = (w: World) => w.player?.playerName !== A && !w.fleets.some(f => f.player?.playerName === A);
        const idle = ownFleets(state, name, home).find(e => e.fleet.ships > 1 && !orders.includes(`F${e.fleet.number}L`));
        const outpost = home.port.worlds.find(w => w.port.worlds.some(x => x !== home && unseen(x)));
        if (idle && outpost) {
          orders.push(`F${idle.fleet.number}W${outpost.number}`);
        }
      }
      delivered.set(name, metal);
      commands[name] = orders.join(' ');
    }
    playTurn(game, commands);
    const after = load(game);
    for (const name of [A, B]) {
      expect(errorsOf(game, name)).toEqual([]);
      const home = world(after, game.homes.get(name));
      const carried = ownFleets(after, name, home).reduce((sum, e) => sum + e.fleet.metal, 0);
      expect(carried).toBe(delivered.get(name));
      // nutzbar war nur das Metall der Heimatwelt (2): baut 2 I-Schiffe, fördert wieder 2
      expect(home.iShips).toBe(3);
      expect(home.metal).toBe(2);
      const player = after.players.get(name);
      expect(points(after, name)).toBe(before.get(name) + turnPoints(player, after.worlds));
    }
  });

  it('Runde 3: entladenes Metall wird erst in der nächsten Runde verbaut; Sonde erkundet eine Nachbarwelt', () => {
    const state = load(game);
    const commands: { [player: string]: string } = {};
    let probed: World = null;
    for (const name of [A, B]) {
      const home = world(state, game.homes.get(name));
      const orders = ownFleets(state, name, home).filter(e => e.fleet.metal > 0).map(e => `F${e.fleet.number}U`);
      if (name === A) {
        // Eine Welt, die A weder gehört noch eine Flotte von A hat, sieht A nur durch die Sonde.
        const unseen = (w: World) => w.player?.playerName !== A && !w.fleets.some(f => f.player?.playerName === A);
        const scout = ownFleets(state, name).find(e => e.fleet.ships > 1 && e.fleet.metal === 0
          && e.world.port.worlds.some(unseen));
        if (scout) {
          probed = scout.world.port.worlds.find(unseen);
          orders.push(`F${scout.fleet.number}P${probed.number}`);
        }
      }
      commands[name] = orders.join(' ');
    }
    playTurn(game, commands);
    const after = load(game);
    for (const name of [A, B]) {
      expect(errorsOf(game, name)).toEqual([]);
      const home = world(after, game.homes.get(name));
      // 2 Altmetall verbaut, entladenes bleibt liegen, plus 2 aus den Minen
      expect(home.metal).toBe(delivered.get(name) + 2);
      expect(home.iShips).toBe(5);
    }
    expect(probed).not.toBeNull();
    expect(game.reports.get(A)).toContain(`\nW${probed.number}(`);
  });

  it('Runde 4: die volle Industrie baut mit dem angelieferten Metall', () => {
    const state = load(game);
    const homeA = world(state, game.homes.get(A));
    const usable = Math.min(homeA.industry, homeA.metal, homeA.population);
    const big = ownFleets(state, A, homeA).sort((x, y) => y.fleet.ships - x.fleet.ships)[0].fleet;
    playTurn(game, { [A]: `W${homeA.number}B${usable}F${big.number}`, [B]: '' });
    const after = load(game);
    expect(errorsOf(game, A)).toEqual([]);
    const fleet = ownFleets(after, A).find(e => e.fleet.number === big.number).fleet;
    expect(fleet.ships).toBe(big.ships + usable);
  });

  it('Runden 5ff.: Flug zur gegnerischen Heimatwelt, Kontakt und Beschuss mit Strafe für getötete Bevölkerung', () => {
    let state = load(game);
    const homeB = world(state, game.homes.get(B));
    const big = ownFleets(state, A).sort((x, y) => y.fleet.ships - x.fleet.ships)[0].fleet;
    const fleetNumber = big.number;
    let arrived = false;
    for (let turn = 0; turn < 5 && !arrived; turn++) {
      const entry = ownFleets(state, A).find(e => e.fleet.number === fleetNumber);
      if (entry.world === homeB || entry.world.number === homeB.number) {
        arrived = true;
        break;
      }
      const route = path(state, entry.world, world(state, homeB.number)).slice(0, 3);
      playTurn(game, { [A]: `F${fleetNumber}${route.map(w => `W${w.number}`).join('')}`, [B]: '' });
      expect(errorsOf(game, A)).toEqual([]);
      state = load(game);
      const now = ownFleets(state, A).find(e => e.fleet.number === fleetNumber);
      arrived = now !== undefined && now.world.number === homeB.number;
    }
    expect(arrived).toBe(true);
    const at = world(state, homeB.number);
    const attacker = ownFleets(state, A, at).find(e => e.fleet.number === fleetNumber).fleet;
    expect(attacker.ships).toBeGreaterThan(0);
    expect(game.reports.get(B)).toContain(`F${fleetNumber}[${A}]`);

    // A beschießt die Bevölkerung, B antwortet mit den I-Schiffen
    const pointsA = points(state, A);
    const shipsBefore = attacker.ships;
    const iShipsB = at.iShips;
    playTurn(game, { [A]: `F${fleetNumber}AP`, [B]: `I${at.number}AF${fleetNumber}` });
    expect(errorsOf(game, A)).toEqual([]);
    expect(errorsOf(game, B)).toEqual([]);
    const after = load(game);
    const report = game.reports.get(A);
    const killed = +(/(\d+) Bevölkerung getötet/.exec(report) ?? ['', '0'])[1];
    expect(killed).toBeGreaterThan(0);
    expect(points(after, A)).toBe(pointsA + turnPoints(after.players.get(A), after.worlds) - killed);
    // Die I-Schiffe feuern mit allem, was in Phase 4 dazugebaut wurde (A schoss nur auf P-Schiffe/Bevölkerung).
    const iShipsAtFire = world(after, at.number).iShips;
    expect(iShipsAtFire).toBeGreaterThanOrEqual(iShipsB);
    const survivor = ownFleets(after, A).find(e => e.fleet.number === fleetNumber);
    expect(survivor.fleet.ships).toBe(shipsBefore - Math.floor(Math.floor(iShipsAtFire / 2) / 2));
    expect(game.reports.get(B)).toContain(`Beschuss durch [${A}]`);
  });

  it('Spielende: wer die Zielpunktzahl erreicht, gewinnt; danach steht der Sieger im Bericht', () => {
    const state = load(game);
    const leader = [A, B].sort((x, y) => points(state, y) - points(state, x))[0];
    game.pref.targetScore = points(state, leader) + 150;
    for (let turn = 0; turn < 20 && !game.pref.finished; turn++) {
      playTurn(game, { [A]: '', [B]: '' });
    }
    expect(game.pref.finished).toBe(true);
    expect(game.pref.winner).toContain(leader);
    expect(game.reports.get(A)).toContain(`Das Spiel ist beendet. Sieger: ${game.pref.winner}`);
  });
});
