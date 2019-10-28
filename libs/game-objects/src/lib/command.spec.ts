import { Command, TurnPhase, MoveCommand } from "./command";
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
describe('Command', () => {
  it('should create an instance', () => {
    expect(command).toBeTruthy();
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