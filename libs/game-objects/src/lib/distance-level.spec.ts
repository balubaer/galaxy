import { DistanceLevel } from './distance-level';
import { World } from './world';
import { TestWorldsArrayFactory } from '..';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;

describe('DistanceLevel', () => {
  it('should create an instance', () => {
    expect(new DistanceLevel(worlds[0], 1)).toBeTruthy();
  });
});
