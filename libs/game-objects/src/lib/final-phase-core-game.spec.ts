import { FinalPhaseCoreGame } from './final-phase-core-game';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { Player, isWorldOutPutForPlayer } from './player';
import { readFileSync } from 'fs';
import { TESTRESOUCESPATH } from './utils';
import { GamePref } from './game-pref.interface';
import { ExecuteCommand } from './execute-command';
import { WorldsPersist } from './worlds-persist.interface';
import { CommandFactory } from './command-factory';
import { Fleet, fleetAndHomeWorldWithNumber } from './fleet';
import { Port } from './port';
import { FleetMovement } from './fleet-movement';
import { AmbushOffForPlayer, AmbushOffForWorld, BuildDShips, FireDShipsToFleet, FireFleetToDShips, FireFleetToFleet, MoveCommand } from './command';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const playerName = 'ZAPHOD';
const player = new Player(playerName);
const playerDict = new Map();

playerDict.set(playerName, player);
const colorMap = new Map();
const fontColorMap = new Map();

colorMap.set('MARVIN', 'rgb(255, 164, 43)');
colorMap.set('ZAPHOD', 'rgb(45, 134, 202)');

function createWorldsForAmbush(): World[] {
  const stringData = readFileSync(`${TESTRESOUCESPATH}/TestAmbush/gamePref.json`, 'utf8');
  const gamepref: GamePref = JSON.parse(stringData);
  const executeCommand = new ExecuteCommand(gamepref, colorMap, fontColorMap);
  const rawdata = readFileSync(`${TESTRESOUCESPATH}/TestAmbush/worlds.json`, 'utf8');
  const worldsPersist: WorldsPersist = JSON.parse(rawdata);
  const commands = readFileSync(`${TESTRESOUCESPATH}/TestAmbush/MARVIN.txt`, 'utf8');
  executeCommand.createEnvironment(worldsPersist);

  const commandFactory = new CommandFactory(executeCommand.worlds, executeCommand.allPlayerDict);
  commandFactory.coreGame = true;
  commandFactory.setCommandStringsWithLongString('MARVIN', commands);
  commandFactory.executeCommands();
  const fleetAndHomeWorld = fleetAndHomeWorldWithNumber(executeCommand.worlds, 7);

  const finalPhase = new FinalPhaseCoreGame(executeCommand.worlds, executeCommand.allPlayerDict);
  finalPhase.doFinal();
  return executeCommand.worlds;
}

describe('FinalPhaseCoreGame', () => {
  it('should create an instance', () => {
    expect(new FinalPhaseCoreGame(worlds, playerDict)).toBeTruthy();
  });

  it('Test doFinal', () => {
    const worldsForAmbush = createWorldsForAmbush();
    const fleetAndHomeWorld = fleetAndHomeWorldWithNumber(worldsForAmbush, 7);
    const attackFleetsWorld = fleetAndHomeWorldWithNumber(worldsForAmbush, 8);
    const hitFleetsWorld = fleetAndHomeWorldWithNumber(worldsForAmbush, 2);
    const fireFleetToDShip = fleetAndHomeWorldWithNumber(worldsForAmbush, 9); 

    expect(fireFleetToDShip.homeWorld.dShips).toBe(1);
    expect(attackFleetsWorld.fleet.fired).toBeTruthy();
    expect(attackFleetsWorld.fleet.firesTo).toBe('F2[ZAPHOD]');
    expect(hitFleetsWorld.fleet.ships).toBe(0);
    expect(fleetAndHomeWorld.fleet.player).toBeNull();
    expect(fleetAndHomeWorld.fleet.ships).toBe(0);
    // F7 fliegt W9->W8->W1->W7; ZAPHODs F1 auf MARVINs Welt W8 feuert aus dem Hinterhalt.
    expect(fleetAndHomeWorld.homeWorld.number).toBe(8);
  });
});

function link(a: World, b: World) {
  a.port.worlds.push(b);
  b.port.worlds.push(a);
}

function createWorld(number: number, owner: Player | null, dShips = 0): World {
  const world = new World();
  world.setNumber(number);
  world.player = owner;
  world.dShips = dShips;
  world.port = new Port();
  world.port.setWorld(world);
  world.port.worlds = [];
  return world;
}

function createFleet(number: number, owner: Player | null, ships: number, world: World): Fleet {
  const fleet = new Fleet();
  fleet.number = number;
  fleet.player = owner;
  fleet.ships = ships;
  world.fleets.push(fleet);
  return fleet;
}

function playerDictOf(...players: Player[]): Map<string, Player> {
  const dict = new Map<string, Player>();
  for (const aPlayer of players) {
    dict.set(aPlayer.playerName, aPlayer);
  }
  return dict;
}

// W1 - W2 - W3: MARVIN fliegt von W1 über W2 nach W3, auf W2 steht ZAPHOD.
function createPassage() {
  const zaphod = new Player('ZAPHOD');
  const marvin = new Player('MARVIN');
  const w1 = createWorld(1, marvin);
  const w2 = createWorld(2, zaphod);
  const w3 = createWorld(3, null);
  link(w1, w2);
  link(w2, w3);
  const passing = createFleet(1, marvin, 10, w1);
  const finalPhase = new FinalPhaseCoreGame([w1, w2, w3], playerDictOf(zaphod, marvin));
  const move = new MoveCommand(passing, w1, [w2, w3], 'F1W2W3', marvin);
  return { zaphod, marvin, w1, w2, w3, passing, finalPhase, move };
}

describe('FinalPhaseCoreGame isAmbushFromMovementCount', () => {
  const finalPhase = new FinalPhaseCoreGame([], new Map());

  it('kein Hinterhalt bei Einzelsprung', () => {
    expect(finalPhase.isAmbushFromMovementCount(1, 1)).toBe(false);
  });

  it('nur Zwischenstationen, nicht das Ziel', () => {
    expect(finalPhase.isAmbushFromMovementCount(1, 2)).toBe(true);
    expect(finalPhase.isAmbushFromMovementCount(2, 2)).toBe(false);
    expect(finalPhase.isAmbushFromMovementCount(1, 3)).toBe(true);
    expect(finalPhase.isAmbushFromMovementCount(2, 3)).toBe(true);
    expect(finalPhase.isAmbushFromMovementCount(3, 3)).toBe(false);
  });
});

describe('FinalPhaseCoreGame checkFireResults', () => {
  it('zwei Schuss zerstören ein Schiff, halber Schaden bei wegfliegender Flotte', () => {
    const zaphod = new Player('ZAPHOD');
    const world = createWorld(1, zaphod);
    const staying = createFleet(1, zaphod, 10, world);
    const leaving = createFleet(2, zaphod, 10, world);
    leaving.fleetMovements.push(new FleetMovement());
    staying.hitedShots = 8;
    leaving.hitedShots = 8;

    new FinalPhaseCoreGame([world], playerDictOf(zaphod)).checkFireResults(world);

    expect(staying.ships).toBe(6);
    expect(leaving.ships).toBe(8);
  });

  it('D-Schiffe zerstört ohne Überschuss: Welt bleibt im Besitz', () => {
    const zaphod = new Player('ZAPHOD');
    const world = createWorld(1, zaphod, 3);
    world.hitedShotsDShips = 7;

    new FinalPhaseCoreGame([world], playerDictOf(zaphod)).checkFireResults(world);

    expect(world.dShips).toBe(0);
    expect(world.player).toBe(zaphod);
  });

  it('zwei Schuss mehr als nötig: Welt wird neutral', () => {
    const zaphod = new Player('ZAPHOD');
    const world = createWorld(1, zaphod, 3);
    world.hitedShotsDShips = 8;

    new FinalPhaseCoreGame([world], playerDictOf(zaphod)).checkFireResults(world);

    expect(world.dShips).toBe(0);
    expect(world.player).toBeNull();
  });
});

describe('FinalPhaseCoreGame Neutralisieren in doFinal', () => {
  it('neutrale Welt bleibt neutral, solange mehrere Spieler dort sind', () => {
    const zaphod = new Player('ZAPHOD');
    const marvin = new Player('MARVIN');
    const world = createWorld(1, zaphod, 2);
    createFleet(1, zaphod, 3, world);
    const attacker = createFleet(2, marvin, 6, world);
    new FireFleetToDShips(attacker, world, 'F2AD', marvin).executeCommand();

    new FinalPhaseCoreGame([world], playerDictOf(zaphod, marvin)).doFinal();

    expect(world.player).toBeNull();
  });

  it('einziger Spieler mit Schiffen erobert die neutralisierte Welt', () => {
    const zaphod = new Player('ZAPHOD');
    const marvin = new Player('MARVIN');
    const world = createWorld(1, zaphod, 2);
    const attacker = createFleet(2, marvin, 6, world);
    new FireFleetToDShips(attacker, world, 'F2AD', marvin).executeCommand();

    new FinalPhaseCoreGame([world], playerDictOf(zaphod, marvin)).doFinal();

    expect(world.player).toBe(marvin);
  });
});

describe('FinalPhaseCoreGame Hinterhalt', () => {
  it('Flotte auf fremder Welt feuert aus dem Hinterhalt', () => {
    const p = createPassage();
    p.w2.player = p.marvin;
    createFleet(2, p.zaphod, 4, p.w2);
    p.move.executeCommand();

    p.finalPhase.doFinal();

    expect(p.passing.ships).toBe(6);
    expect(p.w3.fleets).toContain(p.passing);
  });

  it('D-Schiffe und Flotte feuern gemeinsam mit doppeltem Schaden', () => {
    const p = createPassage();
    p.w2.dShips = 3;
    const ambusher = createFleet(2, p.zaphod, 4, p.w2);
    p.move.executeCommand();

    p.finalPhase.doFinal();

    expect(p.passing.ships).toBe(3);
    expect(ambusher.ambush).toBe(true);
    expect(p.w2.dShipsAmbush).toBe(true);
  });

  it('Flotte mit Flugbefehl schießt nicht aus dem Hinterhalt', () => {
    const p = createPassage();
    const leaving = createFleet(2, p.zaphod, 4, p.w2);
    new MoveCommand(leaving, p.w2, [p.w3], 'F2W3', p.zaphod).executeCommand();
    p.move.executeCommand();

    p.finalPhase.doFinal();

    expect(p.passing.ships).toBe(10);
    expect(leaving.ambush).toBe(false);
  });

  it('Flotte mit Feuerbefehl schießt nicht aus dem Hinterhalt', () => {
    const p = createPassage();
    const firing = createFleet(2, p.zaphod, 4, p.w2);
    const target = createFleet(3, p.marvin, 10, p.w2);
    new FireFleetToFleet(firing, target, p.w2, p.w2, 'F2AF3', p.zaphod).executeCommand();
    p.move.executeCommand();

    p.finalPhase.doFinal();

    expect(p.passing.ships).toBe(10);
    expect(target.ships).toBe(8);
  });

  it('kein Hinterhalt gegen Teammates', () => {
    const p = createPassage();
    p.zaphod.teammates.add(p.marvin);
    p.w2.dShips = 3;
    createFleet(2, p.zaphod, 4, p.w2);
    p.move.executeCommand();

    p.finalPhase.doFinal();

    expect(p.passing.ships).toBe(10);
  });

  it('Zaa schaltet D-Schiffe und eigene Flotten auf der Welt ab', () => {
    const p = createPassage();
    p.w2.dShips = 3;
    createFleet(2, p.zaphod, 4, p.w2);
    new AmbushOffForWorld(p.w2, 'Z2', p.zaphod).executeCommand();
    p.move.executeCommand();

    p.finalPhase.doFinal();

    expect(p.passing.ships).toBe(10);
  });

  it('Z schaltet auch eigene Flotten auf fremden Welten ab', () => {
    const p = createPassage();
    p.w2.player = p.marvin;
    createFleet(2, p.zaphod, 4, p.w2);
    new AmbushOffForPlayer([p.w1, p.w2, p.w3], 'Z', p.zaphod).executeCommand();
    p.move.executeCommand();

    p.finalPhase.doFinal();

    expect(p.passing.ships).toBe(10);
  });

  it('beschossene D-Schiffe feuern danach nur noch mit dem Rest', () => {
    const p = createPassage();
    p.w2.dShips = 4;
    // MARVINs F3 steht schon auf W2 (hinter W1 in der Welten-Liste) und schießt 4 D-Schiffe ab.
    const shooter = createFleet(3, p.marvin, 4, p.w2);
    new FireFleetToDShips(shooter, p.w2, 'F3AD', p.marvin).executeCommand();
    p.move.executeCommand();

    p.finalPhase.doFinal();

    expect(p.w2.dShips).toBe(2);
    expect(p.passing.ships).toBe(8);
  });
});

describe('BuildDShips', () => {
  // Kette W1 - W2 - ... - W7, ZAPHOD besitzt W1 bis W6.
  it('Produktion entspricht dem Abstand zur nächsten fremden Welt, ohne Obergrenze', () => {
    const zaphod = new Player('ZAPHOD');
    const chain: World[] = [];
    for (let i = 1; i <= 7; i++) {
      chain.push(createWorld(i, i < 7 ? zaphod : null));
      if (i > 1) {
        link(chain[i - 2], chain[i - 1]);
      }
    }

    new BuildDShips(chain, zaphod).executeCommand();

    expect(chain.map((w) => w.dShips)).toEqual([6, 5, 4, 3, 2, 1, 0]);
  });

  it('ganze Galaxie im Besitz: keine Endlosschleife', () => {
    const zaphod = new Player('ZAPHOD');
    const w1 = createWorld(1, zaphod);
    const w2 = createWorld(2, zaphod);
    link(w1, w2);

    new BuildDShips([w1, w2], zaphod).executeCommand();

    expect(w1.dShips).toBeGreaterThan(0);
    expect(w2.dShips).toBeGreaterThan(0);
  });
});

describe('FinalPhaseCoreGame Bericht', () => {
  it('beschossene und übernommene Flotte erscheint im Bericht des Beschossenen', () => {
    const zaphod = new Player('ZAPHOD');
    const marvin = new Player('MARVIN');
    const world = createWorld(1, zaphod, 0);
    const attacker = createFleet(1, zaphod, 6, world);
    const target = createFleet(2, marvin, 2, world);
    new FireFleetToFleet(attacker, target, world, world, 'F1AF2', zaphod).executeCommand();

    new FinalPhaseCoreGame([world], playerDictOf(zaphod, marvin)).doFinal();

    expect(target.player).toBe(zaphod);
    expect(isWorldOutPutForPlayer(marvin, world)).toBe(true);
    const desc = world.description();
    expect(desc).toContain('F1[ZAPHOD] = 6 (feuert auf F2[MARVIN])');
    expect(desc).toContain('>> F2 übernommen von [ZAPHOD], vorher [MARVIN]');
  });

  it('beschossene D-Schiffe: Besitzer sieht die Welt, auch wenn er dort keine Flotte hat', () => {
    const zaphod = new Player('ZAPHOD');
    const marvin = new Player('MARVIN');
    const world = createWorld(1, zaphod, 5);
    const attacker = createFleet(2, marvin, 4, world);
    new FireFleetToDShips(attacker, world, 'F2AD', marvin).executeCommand();
    // Besitz wechselt in dieser Runde nicht (D-Schiffe übrig), Zaphod soll die Welt trotzdem über reportPlayers sehen.
    world.player = marvin;

    expect(isWorldOutPutForPlayer(zaphod, world)).toBe(true);
  });

  it('D-Schiffe-Feuer wird angezeigt, auch wenn die D-Schiffe zerstört wurden', () => {
    const zaphod = new Player('ZAPHOD');
    const marvin = new Player('MARVIN');
    const world = createWorld(1, zaphod, 2);
    const target = createFleet(2, marvin, 10, world);
    new FireDShipsToFleet(target, world, world, 'D1AF2', zaphod).executeCommand();
    new FireFleetToDShips(target, world, 'F2AD', marvin).executeCommand();

    new FinalPhaseCoreGame([world], playerDictOf(zaphod, marvin)).doFinal();

    expect(world.dShips).toBe(0);
    expect(world.description()).toContain('(D-Schiffe=0 (feuert auf F2[MARVIN]))');
  });

  it('Neutralisieren und Eroberung werden gemeldet, der alte Besitzer sieht die Welt', () => {
    const zaphod = new Player('ZAPHOD');
    const marvin = new Player('MARVIN');
    const world = createWorld(1, zaphod, 2);
    const attacker = createFleet(2, marvin, 6, world);
    new FireFleetToDShips(attacker, world, 'F2AD', marvin).executeCommand();

    new FinalPhaseCoreGame([world], playerDictOf(zaphod, marvin)).doFinal();

    expect(world.events).toEqual(['Welt neutralisiert, vorher [ZAPHOD]', 'Welt erobert von [MARVIN]']);
    expect(isWorldOutPutForPlayer(zaphod, world)).toBe(true);
    expect(world.description()).toContain('\n   >> Welt neutralisiert, vorher [ZAPHOD]\n   >> Welt erobert von [MARVIN]');
  });

  it('Eroberung einer fremden Welt ohne D-Schiffe nennt den alten Besitzer', () => {
    const zaphod = new Player('ZAPHOD');
    const marvin = new Player('MARVIN');
    const world = createWorld(1, zaphod, 0);
    createFleet(2, marvin, 3, world);

    new FinalPhaseCoreGame([world], playerDictOf(zaphod, marvin)).doFinal();

    expect(world.player).toBe(marvin);
    expect(world.events).toEqual(['Welt erobert von [MARVIN], vorher [ZAPHOD]']);
    expect(isWorldOutPutForPlayer(zaphod, world)).toBe(true);
  });

  it('zerstörte Flotte wird herrenlos, wenn mehrere Spieler auf der Welt sind', () => {
    const zaphod = new Player('ZAPHOD');
    const marvin = new Player('MARVIN');
    const world = createWorld(1, null, 0);
    const victim = createFleet(1, zaphod, 2, world);
    createFleet(3, zaphod, 5, world);
    const attacker = createFleet(2, marvin, 4, world);
    new FireFleetToFleet(attacker, victim, world, world, 'F2AF1', marvin).executeCommand();

    new FinalPhaseCoreGame([world], playerDictOf(zaphod, marvin)).doFinal();

    expect(victim.player).toBeNull();
    expect(world.events).toEqual(['F1 ist herrenlos, vorher [ZAPHOD]']);
  });

  it('ohne Ereignisse bleibt die Beschreibung unverändert', () => {
    const zaphod = new Player('ZAPHOD');
    const world = createWorld(1, zaphod, 3);
    createFleet(1, zaphod, 4, world);

    new FinalPhaseCoreGame([world], playerDictOf(zaphod)).doFinal();

    expect(world.events).toEqual([]);
    expect(world.description()).not.toContain('>>');
  });
});
