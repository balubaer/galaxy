import { FleetMovement } from './fleet-movement';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const fleetMovement = new FleetMovement();


describe('FleetMovement', () => {
  it('should create an instance', () => {
    expect(new FleetMovement()).toBeTruthy();
  });
  it('test description', () => {
    expect(fleetMovement.description()).toBe('(---)');

    fleetMovement.fleet = worlds[3].fleets[0];
    fleetMovement.toWorld = worlds[2];
    expect(fleetMovement.description()).toBe('F4[ZAPHOD]-->W3');
  });
});
