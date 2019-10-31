import { CommandFactory } from './command-factory';
import { TestWorldsArrayFactory, World, Player } from '..';
import { TESTRESOUCESPATH } from './utils';
import { MoveCommand } from './command';

const fs = require('fs');

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const allPlayerDict: Map<string, Player> = new Map<string, Player>();

describe('CommandFactory', () => {

  it('should create an instance', () => {
    const commandFactory = new CommandFactory(worlds, allPlayerDict);
    expect(commandFactory).toBeTruthy();
  });

  it ('test setCommandStringsWithLongString', () => {
    const resourceString = fs.readFileSync(`${TESTRESOUCESPATH}/commands.txt`, 'utf8');
    const commandFactory = new CommandFactory(worlds, allPlayerDict);

    commandFactory.setCommandStringsWithLongString('ZAPHOD', resourceString);
    const stringArray = commandFactory.commandStringsDict.get('ZAPHOD');
    expect(stringArray.length).toBe(8);
    expect(stringArray[0]).toBe('F1W2');
    expect(stringArray[1]).toBe('F2W1');
    expect(stringArray[2]).toBe('F3W2W1');
    expect(stringArray[3]).toBe('W1B1F1');
    expect(stringArray[4]).toBe('F3U2');
    expect(stringArray[5]).toBe('F2U');
    expect(stringArray[6]).toBe('F4U10');
    expect(stringArray[7]).toBe('F4T2F5');
  });

  it ('test fillCommandElements', () => {
    const commandFactory = new CommandFactory(worlds, allPlayerDict);

    commandFactory.processCommand = 'F3W2W1';
    commandFactory.fillCommandElements();
    expect(commandFactory.commandElements.length).toBe(3);

    expect(commandFactory.commandElements[0]).toBe('F3');
    expect(commandFactory.commandElements[1]).toBe('W2');
    expect(commandFactory.commandElements[2]).toBe('W1');
  });

  it ('test findFleetAndWorld', () => {
    const commandFactory = new CommandFactory(worlds, allPlayerDict);
    commandFactory.processCommand = 'F4W2';
    commandFactory.fillCommandElements();

    const fleetAndHomeWorldAndWorlds = commandFactory.findFleetAndWorld();
    expect(fleetAndHomeWorldAndWorlds.fleet.number).toBe(4);
    expect(fleetAndHomeWorldAndWorlds.homeWorld.number).toBe(4);
    expect(fleetAndHomeWorldAndWorlds.worldArray.length).toBe(1);
    expect(fleetAndHomeWorldAndWorlds.worldArray[0].number).toBe(2);
    
  });

  it ('test createMoveCommand', () => {
    const commandFactory = new CommandFactory(worlds, allPlayerDict);
    commandFactory.processCommand = 'F4W2';
    commandFactory.fillCommandElements();

    const aMoveCommand = commandFactory.createMoveCommand();

    expect(aMoveCommand instanceof MoveCommand).toBeTruthy();
  });

  it ('test getCommandInstance', () => {
    const commandFactory = new CommandFactory(worlds, allPlayerDict);
    commandFactory.processCommand = 'F4W2';
    commandFactory.fillCommandElements();

    const commandInstance = commandFactory.getCommandInstance();

    expect(commandInstance instanceof MoveCommand).toBeTruthy();
  });

  it ('test executeCommands', () => {
    const allPlayerDictForExecuteCommands : Map<string, Player> = new Map<string, Player>();
    allPlayerDictForExecuteCommands.set('ZAPHOD', new Player('ZAPHOD'));
    const commandFactory = new CommandFactory(worlds, allPlayerDictForExecuteCommands);
    const commandString = 'F4W2';

    commandFactory.setCommandStringsWithLongString('ZAPHOD', commandString);
    commandFactory.executeCommands();

    //expect(aMoveCommand instanceof MoveCommand).toBeTruthy();
  });
});
