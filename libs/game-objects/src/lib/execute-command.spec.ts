import { ExecuteCommand } from './execute-command';
import { readFileSync, writeFileSync } from 'fs';
import { GamePref } from './game-pref.interface';
import { TESTRESOUCESPATH } from './utils';
import { WorldsPersist } from './worlds-persist.interface';

const stringData = readFileSync(`${TESTRESOUCESPATH}/gamePref.json`, 'utf8');
const gamepref: GamePref = JSON.parse(stringData);

describe('ExecuteCommand', () => {
  it('should create an instance', () => {
    expect(new ExecuteCommand(gamepref)).toBeTruthy();
  });
  it('test createEnvironment', () => {
    const executeCommand = new ExecuteCommand(gamepref);
    const rawdata = readFileSync(`${TESTRESOUCESPATH}/worlds.json`, 'utf8');
    const worldsPersist: WorldsPersist = JSON.parse(rawdata);
    executeCommand.createEnvironment(worldsPersist);

    for (const playerName of executeCommand.allPlayerDict.keys()) {
      const player = executeCommand.allPlayerDict.get(playerName);
     expect(player.playerName).toBe(playerName);
    }
    let testString = executeCommand.worlds[0].description();
    writeFileSync(`${TESTRESOUCESPATH}/description_World1.txt`, testString);
    let descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World1.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

    testString = executeCommand.worlds[1].description();
    writeFileSync(`${TESTRESOUCESPATH}/description_World2_Persist.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World2_Persist.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

    testString = executeCommand.worlds[2].description();
    writeFileSync(`${TESTRESOUCESPATH}/description_World3_Persist.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World3_Persist.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

    testString = executeCommand.worlds[3].description();
    writeFileSync(`${TESTRESOUCESPATH}/description_World4.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World4.txt`, 'utf8');

    expect(testString).toBe(descriptionString);

    testString = executeCommand.worlds[4].description();
    writeFileSync(`${TESTRESOUCESPATH}/description_World5_Persist.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World5_Persist.txt`, 'utf8');
    expect(testString).toBe(descriptionString);
  });

  it('test start', () => {
    const commandsDict = new Map();
    commandsDict.set('ZAPHOD', 'F4W2');
    commandsDict.set('MARVIN', '');
    const executeCommand = new ExecuteCommand(gamepref);
    const rawdata = readFileSync(`${TESTRESOUCESPATH}/worlds.json`, 'utf8');
    const worldsPersist: WorldsPersist = JSON.parse(rawdata);
    executeCommand.createEnvironment(worldsPersist);
    executeCommand.start(commandsDict);
    const world = executeCommand.worlds[1];
    for (const fleet of world.fleets) {
      expect(fleet.number).toBe(4);
    }
  });

  it('test generateOutput', () => {
    const commandsDict = new Map();
    commandsDict.set('ZAPHOD', 'F4W2 D4T2F2 F5W3');
    commandsDict.set('MARVIN', '');
    const executeCommand = new ExecuteCommand(gamepref);
    const rawdata = readFileSync(`${TESTRESOUCESPATH}/worlds.json`, 'utf8');
    const worldsPersist: WorldsPersist = JSON.parse(rawdata);
    executeCommand.createEnvironment(worldsPersist);
    executeCommand.start(commandsDict);
    const outputDict = executeCommand.generateOutput();

    for (const playerName of outputDict.keys()) {
          writeFileSync(`${TESTRESOUCESPATH}/${playerName}_test.out`, outputDict.get(playerName));
          const descriptionString = readFileSync(`${TESTRESOUCESPATH}/${playerName}_test.out`, 'utf8');
          expect(outputDict.get(playerName)).toBe(descriptionString);
    }
  });

  it('test generateResultWorlds', () => {
    const commandsDict = new Map();
    commandsDict.set('ZAPHOD', 'F4W2 D4T2F2 F5W3');
    commandsDict.set('MARVIN', '');
    const executeCommand = new ExecuteCommand(gamepref);
    const rawdata = readFileSync(`${TESTRESOUCESPATH}/worlds.json`, 'utf8');
    const worldsPersist: WorldsPersist = JSON.parse(rawdata);
    executeCommand.createEnvironment(worldsPersist);
    executeCommand.start(commandsDict);
    const outputDict = executeCommand.generateOutput();
    const resultWorldsPersist = executeCommand.generateResultWorlds();

    expect(resultWorldsPersist.fleets).toBeTruthy();
    expect(resultWorldsPersist.fleets[0].number).toBe(4);
    expect(resultWorldsPersist.players).toBeTruthy();
    expect(resultWorldsPersist.ports).toBeTruthy();
    expect(resultWorldsPersist.worlds).toBeTruthy();
    expect(resultWorldsPersist.worlds[1].fleets[0]).toBe(4);
  });

});
