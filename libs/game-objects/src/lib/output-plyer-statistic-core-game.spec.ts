import { OutputPlyerStatisticCoreGame } from './output-plyer-statistic-core-game';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { Player } from './player';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const playerName = 'ZAPHOD';
const player = new Player(playerName); 

describe('OutputPlyerStatisticCoreGame', () => {
  it('should create an instance', () => {
    expect(new OutputPlyerStatisticCoreGame(worlds, player)).toBeTruthy();
  });
});
