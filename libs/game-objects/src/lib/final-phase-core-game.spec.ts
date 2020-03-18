import { FinalPhaseCoreGame } from './final-phase-core-game';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { Player } from './player';
import { readFileSync } from 'fs';
import { TESTRESOUCESPATH } from './utils';
import { GamePref } from './game-pref.interface';
import { ExecuteCommand } from './execute-command';
import { WorldsPersist } from './worlds-persist.interface';
import { CommandFactory } from './command-factory';
import { fleetAndHomeWorldWithNumber } from './fleet';

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
    expect(fleetAndHomeWorld.homeWorld.number).toBe(1);
  });
});
