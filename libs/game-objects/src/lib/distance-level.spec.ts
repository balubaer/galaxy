import { DistanceLevel } from './distance-level';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { TestDistanceLevelWoldsFactory } from './test-distance-level-wolds-factory';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const worldsDist = new TestDistanceLevelWoldsFactory(). worlds;

describe('DistanceLevel', () => {
  it('should create an instance', () => {
    expect(new DistanceLevel(worlds[0], 1)).toBeTruthy();
  });
  it('test passedWorlds', () => {
    const distanceLevel: DistanceLevel = new DistanceLevel(worlds[0], 1);
    expect(distanceLevel.passedWorlds.length).toBe(1);
  });
  it('test nextLevelWorlds', () => {
    const distanceLevel: DistanceLevel = new DistanceLevel(worlds[0], 1);
    expect(distanceLevel.nextLevelWorlds.length).toBe(2);
  });
  it('test create DistanceLevel "0"', () => {
    const distanceLevel: DistanceLevel = new DistanceLevel(worldsDist[0], 0);
    expect(distanceLevel.nextLevelWorlds.length).toBe(1);
    expect(distanceLevel.distanceLevel).toBe(1);
  });
  it('test create DistanceLevel "3"', () => {
    const distanceLevel: DistanceLevel = new DistanceLevel(worldsDist[0], 3);
    expect(distanceLevel.nextLevelWorlds.length).toBe(1);
  });
  it('test create DistanceLevel "6"', () => {
    const distanceLevel: DistanceLevel = new DistanceLevel(worldsDist[0], 6);
    expect(distanceLevel.nextLevelWorlds.length).toBe(1);
    //Mehr als 4 geht nicht in diesem System von Welten
    expect(distanceLevel.distanceLevel).toBe(4);
  });

  it('test goNextLevel', () => {
    const distanceLevel: DistanceLevel = new DistanceLevel(worldsDist[0], 3);
    distanceLevel.goNextLevel();
    expect(distanceLevel.nextLevelWorlds.length).toBe(1);
    distanceLevel.goNextLevel();
    expect(distanceLevel.nextLevelWorlds.length).toBe(1);
  });

});
