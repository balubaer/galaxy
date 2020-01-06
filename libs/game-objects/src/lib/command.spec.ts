import { Command, TurnPhase, MoveCommand, compareCommand, TransferShipsFleetToFleet, TransferShipsFleetToDShips, TransferDShipsToFleet } from './command';
import { Player } from './player';
import { World, TestWorldsArrayFactory } from '..';
import { Fleet } from './fleet';

const command = new Command('F1W2', new Player('ZAPHOD'), TurnPhase.Movement);
const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const world4 = worlds[3];
const world2 = worlds[1];
const fleet4: Fleet = world4.fleets[0];
const player = world4.player;
const moveWorldArray = new Array();
moveWorldArray.push(world2);
const moveCommand: MoveCommand = new MoveCommand(fleet4, world4, moveWorldArray, 'F4W2', player);
const command_a = new Command('', player, TurnPhase.Movement);
const command_b = new Command('', player, TurnPhase.Movement);
const command_c = new Command('', player, TurnPhase.Initial);
const command_d = new Command('', player, TurnPhase.Final);
const command_e = new Command('', player, TurnPhase.Combat);
const command_f = new Command('', player, TurnPhase.Transfer);

describe('Command', () => {
  it('should create an instance', () => {
    expect(command).toBeTruthy();
  });

  it('test function compareCommand', () => {
    expect(compareCommand(command_a, command_b)).toBe(0);
    expect(compareCommand(command_a, command_c)).toBe(1);
    expect(compareCommand(command_c, command_b)).toBe(-1);
  });

  it('test CommandArray Sort', () => {
    const commandArray: Array <Command> = new Array <Command>();

    commandArray.push(command_a, command_b, command_c, command_d, command_e, command_f);
    commandArray.sort( compareCommand );
    expect(commandArray[0]).toBe(command_c);
    expect(commandArray[1]).toBe(command_f);
    expect(commandArray[2]).toBe(command_e);
    expect(commandArray[3].turnPhase).toBe(TurnPhase.Movement);
    expect(commandArray[4].turnPhase).toBe(TurnPhase.Movement);
    expect(commandArray[5]).toBe(command_d);
  });
});

describe('MoveCommand', () => {
  it('should create an instance', () => {
    expect(moveCommand).toBeTruthy();
  });
  it('test executeCommand', () => {
    moveCommand.executeCommand();
    const fleetMovement = fleet4.fleetMovements[0];
    expect(fleetMovement.fromWorld).toBe(world4);
    expect(fleetMovement.toWorld).toBe(world2);
  });
});

function createATransferShipsFleetToFleet(): TransferShipsFleetToFleet {
  const fleet42 = new Fleet();
  const fleet43 = new Fleet();
  const world42 = new World();

  fleet42.number = 42;
  fleet42.ships = 5;
  fleet42.player = player;

  fleet43.number = 43;
  fleet43.ships = 0;
  fleet43.player = player;

  world42.fleets.push(fleet42, fleet43);

  const transferShipsFleetToFleet: TransferShipsFleetToFleet = new TransferShipsFleetToFleet(fleet42, fleet43, world42, world42, 3, 'F42T3F43', player);
  return transferShipsFleetToFleet;
}

describe('TransferShipsFleetToFleet', () => {
  it('should create an instance', () => {

    const transferShipsFleetToFleet: TransferShipsFleetToFleet = createATransferShipsFleetToFleet();
    expect(transferShipsFleetToFleet).toBeTruthy();
  });
  it('test executeCommand', () => {
    const transferShipsFleetToFleet: TransferShipsFleetToFleet = createATransferShipsFleetToFleet();

    transferShipsFleetToFleet.executeCommand();
    expect(transferShipsFleetToFleet.fromFleet.ships).toBe(2);
    expect(transferShipsFleetToFleet.toFleet.ships).toBe(3);
  });
});

function createATransferShipsFleetToDShips(): TransferShipsFleetToDShips {
  const fleet42 = new Fleet();
  const world42 = new World();

  fleet42.number = 42;
  fleet42.ships = 5;
  fleet42.player = player;

  world42.fleets.push(fleet42);

  const transferShipsFleetToDShips: TransferShipsFleetToDShips = new TransferShipsFleetToDShips(fleet42, world42, 3, 'F42T3D', player);
  return transferShipsFleetToDShips;
}

describe('TransferShipsFleetToDShips', () => {
  it('should create an instance', () => {
    const transferShipsFleetToDShips: TransferShipsFleetToDShips = createATransferShipsFleetToDShips();
    expect(transferShipsFleetToDShips).toBeTruthy();
  });
  it('test executeCommand', () => {
    const transferShipsFleetToDShips: TransferShipsFleetToDShips = createATransferShipsFleetToDShips();

    transferShipsFleetToDShips.executeCommand();
    expect(transferShipsFleetToDShips.fromFleet.ships).toBe(2);
    expect(transferShipsFleetToDShips.fromHomeWorld.dShips).toBe(3);
  });
});

function createATransferDShipsToFleet(): TransferDShipsToFleet {
  const fleet42 = new Fleet();
  const world42 = new World();

  fleet42.number = 42;
  fleet42.ships = 1;
  fleet42.player = player;

  world42.fleets.push(fleet42);
  world42.dShips=4;
  world42.player = player;

  const transferDShipsToFleet: TransferDShipsToFleet = new TransferDShipsToFleet(fleet42, world42, world42, 2, 'D42T2F42', player);
  return transferDShipsToFleet;
}

describe('TransferDShipsToFleet', () => {
  it('should create an instance', () => {
    const transferDShipsToFleet: TransferDShipsToFleet = createATransferDShipsToFleet();
    expect(transferDShipsToFleet).toBeTruthy();
  });
  it('test executeCommand', () => {
    const transferDShipsToFleet: TransferDShipsToFleet = createATransferDShipsToFleet();

    transferDShipsToFleet.executeCommand();
    expect(transferDShipsToFleet.toFleet.ships).toBe(3);
    expect(transferDShipsToFleet.fromHomeWorld.dShips).toBe(2);
  });
});

