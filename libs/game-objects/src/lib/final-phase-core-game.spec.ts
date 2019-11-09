import { FinalPhaseCoreGame } from './final-phase-core-game';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { Player } from './player';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const playerName = 'ZAPHOD';
const player = new Player(playerName);
const playerDict = new Map();

playerDict.set(playerName, player);

describe('FinalPhaseCoreGame', () => {
  it('should create an instance', () => {
    expect(new FinalPhaseCoreGame(worlds, playerDict)).toBeTruthy();
  });
});
