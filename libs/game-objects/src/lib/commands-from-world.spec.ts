import { CommandsFromWorld } from './commands-from-world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { World } from './world';
import { Player } from './player';
import { TurnPhase } from './command';


describe('CommandsFromWorld', () => {
  let worlds:  Array<World>;
  let player: Player;

  beforeAll(async () => {
    worlds = new TestWorldsArrayFactory().worlds;
    player = worlds[3].player;

    /*command = new Command('F1W2', new Player('ZAPHOD'), TurnPhase.Movement);

    command_a = new Command('', player, TurnPhase.Movement);
    command_b = new Command('', player, TurnPhase.Movement);
    command_c = new Command('', player, TurnPhase.Initial);
    command_d = new Command('', player, TurnPhase.Final);
    command_e = new Command('', player, TurnPhase.Combat);
    command_f = new Command('', player, TurnPhase.Transfer);*/
  });

  it('should create an instance', () => {
    expect(new CommandsFromWorld(worlds, player, 3)).toBeTruthy();
  });
});
