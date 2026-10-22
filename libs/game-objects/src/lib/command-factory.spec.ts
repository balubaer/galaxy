import { CommandFactory } from './command-factory';
import { TestWorldsArrayFactory, World, Player, fleetAndHomeWorldWithNumber } from '..';
import { TESTRESOUCESPATH } from './utils';
import { MoveCommand, TransferShipsFleetToFleet, TransferShipsFleetToDShips, FireFleetToFleet, FireFleetToDShips, FireDShipsToFleet, AmbushOffForWorld, AmbushOffForPlayer, AddTeammate, RemoveTeammate } from './command';
import { readFileSync } from 'fs';
import { Fleet } from './fleet';
import {
  NotInCoreGame_Error, UnknownCommand_Error, WorldNotFound_Error, FleetNotFound_Error, TooManyWorlds_Error, NoConnection_Error,
  FireOnOwnFleet_Error, FleetAlreadyActed_Error, FleetNotOwned_Error, WorldNotOwned_Error, NotEnoughShips_Error, PlayerNotFound_Error
} from './error';
import { async } from 'rxjs/internal/scheduler/async';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const allPlayerDict: Map<string, Player> = new Map<string, Player>();

describe('CommandFactory', () => {
  let comFac: CommandFactory;

  beforeAll(async () => {
    const aWworlds: Array<World> = new TestWorldsArrayFactory().worlds;
    const aAllPlayerDict: Map<string, Player> = new Map<string, Player>();
    comFac = new CommandFactory(aWworlds, aAllPlayerDict);
  });


it('should create an instance', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  expect(commandFactory).toBeTruthy();
});

it('test setCommandStringsWithLongString', () => {
  const resourceString = readFileSync(`${TESTRESOUCESPATH}/commands.txt`, 'utf8');
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

it('test getCommandElements', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  const commandElements = commandFactory.getCommandElements('F3W2W1');
  expect(commandElements.length).toBe(3);

  expect(commandElements[0]).toBe('F3');
  expect(commandElements[1]).toBe('W2');
  expect(commandElements[2]).toBe('W1');
});

it('test getCommandNummerArray', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  const commandElements = commandFactory.getCommandElements('F3W2W1');
  const commandNumbers = commandFactory.getCommandNummerArray(commandElements);
  expect(commandNumbers.length).toBe(3);
  expect(commandNumbers[0]).toBe(3);
  expect(commandNumbers[1]).toBe(2);
  expect(commandNumbers[2]).toBe(1);
});

it('test findFleetAndWorld', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('F4W2', 'ZAPHOD');
  const fleetAndHomeWorldAndWorlds = commandFactory.findFleetAndWorld();
  expect(fleetAndHomeWorldAndWorlds.fleet.number).toBe(4);
  expect(fleetAndHomeWorldAndWorlds.homeWorld.number).toBe(4);
  expect(fleetAndHomeWorldAndWorlds.worldArray.length).toBe(1);
  expect(fleetAndHomeWorldAndWorlds.worldArray[0].number).toBe(2);

});

it('test createMoveCommand', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('F4W2', 'ZAPHOD');

  const aMoveCommand = commandFactory.createMoveCommand();
  expect(aMoveCommand instanceof MoveCommand).toBeTruthy();
});

it('test getCommandInstance', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('F4W2', 'ZAPHOD');

  const commandInstance = commandFactory.getCommandInstance();
  expect(commandInstance instanceof MoveCommand).toBeTruthy();
});

it('test executeCommands', () => {
  const worldsForExecuteCommands: Array<World> = new TestWorldsArrayFactory().worlds;
  const allPlayerDictForExecuteCommands: Map<string, Player> = new Map<string, Player>();
  allPlayerDictForExecuteCommands.set('ZAPHOD', new Player('ZAPHOD'));
  const commandFactory = new CommandFactory(worldsForExecuteCommands, allPlayerDictForExecuteCommands);
  const commandString = 'F4W2';

  commandFactory.setCommandStringsWithLongString('ZAPHOD', commandString);
  commandFactory.coreGame = true;
  commandFactory.executeCommands();

  const fleetAndHomeWorld = fleetAndHomeWorldWithNumber(worldsForExecuteCommands, 4);
  expect(fleetAndHomeWorld.fleet.number).toBe(4);
  expect(fleetAndHomeWorld.fleet.fleetMovements[0].fromWorld.number).toBe(4);
  expect(fleetAndHomeWorld.fleet.fleetMovements[0].toWorld.number).toBe(2);
});

it('test findFromFleetToFleetAndWorlds and createTransferShipsFleetToFleetCommand', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('F4T4F5', 'ZAPHOD');

  const commandInstance = commandFactory.getCommandInstance();
  expect(commandInstance instanceof TransferShipsFleetToFleet).toBeTruthy();
});

it('test findFromFleetToDShipsAndWorld and createTransferShipsFleetToDShipsCommand', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('F4T4D', 'ZAPHOD');

  const commandInstance = commandFactory.getCommandInstance();
  expect(commandInstance instanceof TransferShipsFleetToDShips).toBeTruthy();
});

it('test findFromFleetFireToFleetAndWorlds and createFireFleetToFleetCommand', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('F4AF5', 'ZAPHOD');

  const commandInstance = commandFactory.getCommandInstance();
  expect(commandInstance instanceof FireFleetToFleet).toBeTruthy();
});

it('test findFromFleetFireToDShipsAndWorlds and createFireFleetToDShipsCommand', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('F4AD', 'ZAPHOD');

  const commandInstance = commandFactory.getCommandInstance();
  expect(commandInstance instanceof FireFleetToDShips).toBeTruthy();
});

it('test findFromDShipsFireToFleetAndWorlds and createFireDShipsToFleetCommand', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('D4AF4', 'ZAPHOD');

  const commandInstance = commandFactory.getCommandInstance();
  console.log(commandInstance);
  expect(commandInstance instanceof FireDShipsToFleet).toBeTruthy();
});

it('test findWorld and createAmbushOffForWorld', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('Z4', 'ZAPHOD');

  const commandInstance = commandFactory.getCommandInstance();
  expect(commandInstance instanceof AmbushOffForWorld).toBeTruthy();
});

it('test createAmbushOffForPlayer', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('Z', 'ZAPHOD');

  const commandInstance = commandFactory.getCommandInstance();
  expect(commandInstance instanceof AmbushOffForPlayer).toBeTruthy();
});

it('test createTeammateForPlayer', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('A=ZAPHOD', 'ZAPHOD');

  const commandInstance = commandFactory.getCommandInstance();
  expect(commandInstance instanceof AddTeammate).toBeTruthy();
});

it('test createTeammateForPlayer', () => {
  const commandFactory = new CommandFactory(worlds, allPlayerDict);
  commandFactory.initMembers('N=ZAPHOD', 'ZAPHOD');

  const commandInstance = commandFactory.getCommandInstance();
  expect(commandInstance instanceof RemoveTeammate).toBeTruthy();
});

});

// W4 gehört ZAPHOD (F4=4, F5=5, 4 D-Schiffe), W1 gehört MARVIN; dazu MARVINs F7=6 auf W4.
function executeForZaphod(commands: string) {
  const testWorlds = new TestWorldsArrayFactory().worlds;
  const zaphod = testWorlds[3].player;
  const marvin = testWorlds[0].player;
  const enemyFleet = new Fleet();
  enemyFleet.number = 7;
  enemyFleet.ships = 6;
  enemyFleet.player = marvin;
  testWorlds[3].fleets.push(enemyFleet);
  const dict = new Map<string, Player>([['ZAPHOD', zaphod], ['MARVIN', marvin]]);
  const commandFactory = new CommandFactory(testWorlds, dict);
  commandFactory.coreGame = true;
  commandFactory.setCommandStringsWithLongString('ZAPHOD', commands);
  commandFactory.executeCommands();
  const errorNumbers = (commandFactory.commandErrors.get('ZAPHOD') ?? []).map((e) => e.error.errorNumber);
  return { commandFactory, testWorlds, zaphod, marvin, enemyFleet, errorNumbers };
}

describe('CommandFactory Core Game', () => {
  it('DaaAFbb: Welt und Flotte werden richtig gelesen', () => {
    const testWorlds = new TestWorldsArrayFactory().worlds;
    const commandFactory = new CommandFactory(testWorlds, new Map());
    commandFactory.initMembers('D4AF5', 'ZAPHOD');

    const command = commandFactory.getCommandInstance() as FireDShipsToFleet;

    expect(command.fromHomeWorld.number).toBe(4);
    expect(command.toFleet.number).toBe(5);
    expect(command.toHomeWorld.number).toBe(4);
  });

  it('DaaAFbb: D-Schiffe feuern auf die fremde Flotte', () => {
    const r = executeForZaphod('D4AF7');

    expect(r.errorNumbers).toEqual([]);
    expect(r.testWorlds[3].dShipsFired).toBe(true);
    expect(r.enemyFleet.hitedShots).toBeGreaterThan(0);
  });

  it('Kleinschreibung und doppelte Leerzeichen werden akzeptiert', () => {
    const r = executeForZaphod('  f4w2   \n\n f5t1d ');

    expect(r.errorNumbers).toEqual([]);
    expect(fleetAndHomeWorldWithNumber(r.testWorlds, 4).fleet.fleetMovements.length).toBe(1);
    expect(fleetAndHomeWorldWithNumber(r.testWorlds, 5).fleet.ships).toBe(4);
  });

  it('FaaS wird angenommen und ändert nichts außer der Markierung', () => {
    const r = executeForZaphod('F4S');
    const fleet = fleetAndHomeWorldWithNumber(r.testWorlds, 4).fleet;

    expect(r.errorNumbers).toEqual([]);
    expect(fleet.standBy).toBe(true);
    expect(fleet.ships).toBe(4);
  });

  it('WaaBxxFbb gibt es im Core Game nicht', () => {
    const r = executeForZaphod('W4B3F4');

    expect(r.errorNumbers).toEqual([NotInCoreGame_Error.errorNumber]);
    expect(fleetAndHomeWorldWithNumber(r.testWorlds, 4).fleet.ships).toBe(4);
  });

  it('unbekannte Befehle werden gemeldet', () => {
    expect(executeForZaphod('XYZ').errorNumbers).toEqual([UnknownCommand_Error.errorNumber]);
    expect(executeForZaphod('F4W2X').errorNumbers).toEqual([UnknownCommand_Error.errorNumber]);
  });

  it('unbekannte Welt oder Flotte führt zu einer Meldung statt zum Absturz', () => {
    expect(executeForZaphod('F4W99').errorNumbers).toEqual([WorldNotFound_Error.errorNumber]);
    expect(executeForZaphod('F99W2').errorNumbers).toEqual([FleetNotFound_Error.errorNumber]);
    expect(executeForZaphod('F99AF4').errorNumbers).toEqual([FleetNotFound_Error.errorNumber]);
    expect(executeForZaphod('D99AF7').errorNumbers).toEqual([WorldNotFound_Error.errorNumber]);
    expect(executeForZaphod('Z99').errorNumbers).toEqual([WorldNotFound_Error.errorNumber]);
  });

  it('Flug über mehr als drei Welten und ohne Verbindung', () => {
    expect(executeForZaphod('F4W1W2W1W2').errorNumbers).toEqual([TooManyWorlds_Error.errorNumber]);
    expect(executeForZaphod('F4W2W3').errorNumbers).toEqual([NoConnection_Error.errorNumber]);
  });

  it('nicht auf eigene Flotten feuern', () => {
    expect(executeForZaphod('F4AF5').errorNumbers).toEqual([FireOnOwnFleet_Error.errorNumber]);
    expect(executeForZaphod('D4AF4').errorNumbers).toEqual([FireOnOwnFleet_Error.errorNumber]);
  });

  it('feuern und fliegen schließen sich aus', () => {
    const r = executeForZaphod('F4AF7 F4W2');

    expect(r.errorNumbers).toEqual([FleetAlreadyActed_Error.errorNumber]);
    expect(r.commandFactory.commandErrors.get('ZAPHOD')[0].command).toBe('F4W2');
  });

  it('fremde Flotten und Welten lassen sich nicht befehligen', () => {
    expect(executeForZaphod('F7W2').errorNumbers).toEqual([FleetNotOwned_Error.errorNumber]);
    expect(executeForZaphod('Z1').errorNumbers).toEqual([WorldNotOwned_Error.errorNumber]);
    expect(executeForZaphod('D1T1F4').errorNumbers).toEqual([WorldNotOwned_Error.errorNumber]);
  });

  it('Transfer mit zu vielen Schiffen wird abgelehnt', () => {
    const r = executeForZaphod('F4T9F5');

    expect(r.errorNumbers).toEqual([NotEnoughShips_Error.errorNumber]);
    expect(fleetAndHomeWorldWithNumber(r.testWorlds, 5).fleet.ships).toBe(5);
  });

  it('A=handle ohne Beachtung der Groß-/Kleinschreibung, unbekannter Name wird gemeldet', () => {
    const r = executeForZaphod('a=marvin A=NOBODY');

    expect(r.zaphod.teammates.has(r.marvin)).toBe(true);
    expect(r.zaphod.teammates.has(undefined)).toBe(false);
    expect(r.errorNumbers).toEqual([PlayerNotFound_Error.errorNumber]);
  });

  it('Befehle unbekannter Spieler werden übergangen', () => {
    const testWorlds = new TestWorldsArrayFactory().worlds;
    const commandFactory = new CommandFactory(testWorlds, new Map([['ZAPHOD', testWorlds[3].player]]));
    commandFactory.coreGame = true;
    commandFactory.setCommandStringsWithLongString('NIEMAND', 'F4W2');

    expect(() => commandFactory.executeCommands()).not.toThrow();
    expect(fleetAndHomeWorldWithNumber(testWorlds, 4).fleet.fleetMovements.length).toBe(0);
  });
});
