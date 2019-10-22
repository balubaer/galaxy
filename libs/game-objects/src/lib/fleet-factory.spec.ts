import { FleetFactory } from './fleet-factory';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';

const fleetCount = 3;
const worldsArray: Array <World> = new TestWorldsArrayFactory().worlds;
const fleetFactory: FleetFactory = new FleetFactory(fleetCount);

fleetFactory.createWithWorldArray(worldsArray);

describe('FleetFactory', () => {
  it('should create an instance', () => {
    expect(new FleetFactory(42)).toBeTruthy();
  });

  it('test method createWithWorldArray', () => {
    const fleetNumberSet = new Set();

    for (const aWorld of worldsArray){
      const fleetsFromWorld = aWorld.fleets;
      for (const aFleet of fleetsFromWorld){
        fleetNumberSet.add(aFleet);
      }
    }
    expect(fleetNumberSet.size === fleetCount).toBe(true);
  });
});
