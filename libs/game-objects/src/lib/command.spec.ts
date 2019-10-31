import { Command, TurnPhase, MoveCommand, compareCommand } from "./command";
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