import { CommandFactory } from './command-factory';
import { TestWorldsArrayFactory, World, Player } from '..';
const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const allPlayerDict: Map<string, Player> = new Map<string, Player>();

const commandFactory = new CommandFactory(worlds, allPlayerDict);
describe('CommandFactory', () => {
  it('should create an instance', () => {
    expect(commandFactory).toBeTruthy();
  });
});
