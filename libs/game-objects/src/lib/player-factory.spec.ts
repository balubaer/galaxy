import { PlayerFactory } from './player-factory';
import { TestDistanceLevelWoldsFactory } from './test-distance-level-wolds-factory';

const worlds = new TestDistanceLevelWoldsFactory().worlds;

describe('PlayerFactory', () => {
  it('should create an instance', () => {
    expect(new PlayerFactory(['ZAPHOD'])).toBeTruthy();
  });

  it('test createWithWorldArray', () => {
    const playerFactory: PlayerFactory = new PlayerFactory(['ZAPHOD']);
    playerFactory.inTest = true;
    playerFactory.createWithWorldArray(worlds, 4, 2, 5, 1);
    expect(worlds[0].fleets.length).toBe(2);
    expect(worlds[0].fleets[0].ships).toBe(5);
  });
});
