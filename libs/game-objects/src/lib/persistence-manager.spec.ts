import { PersistenceManager } from './persistence-manager';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;

describe('PersistenceManager', () => {
  it('should create an instance', () => { 
    expect(new PersistenceManager(worlds)).toBeTruthy();
  });
  it('test createWorldsPersist', () => {
    const pm = new PersistenceManager(worlds);
    const worldsPersist = pm.createWorldsPersist();
    expect(worldsPersist.fleets).toBeTruthy();
    expect(worldsPersist.players).toBeTruthy();
    expect(worldsPersist.ports).toBeTruthy();
    expect(worldsPersist.worlds).toBeTruthy();
  });
});
