import { PersistenceManager } from './persistence-manager';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { writeFileSync, readFileSync } from 'fs';
import { WorldsPersist } from './worlds-persist';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;

describe('PersistenceManager', () => {
  it('should create an instance', () => { 
    expect(new PersistenceManager(worlds)).toBeTruthy();
  });
  it('test createWorldsPersist', () => {
    const pm = new PersistenceManager(worlds);
    const worldsPersist = pm.createWorldsPersist();

    const data = JSON.stringify(worldsPersist);
    writeFileSync('worlds.json', data);
    
    expect(worldsPersist.fleets).toBeTruthy();
    expect(worldsPersist.players).toBeTruthy();
    expect(worldsPersist.ports).toBeTruthy();
    expect(worldsPersist.worlds).toBeTruthy();
  });
  it('test createWorldsWithWorldsPersist', () => { 
    const rawdata = readFileSync('worlds.json', 'utf8');
    const worldsPersist: WorldsPersist = JSON.parse(rawdata);
    const pm = new PersistenceManager(new Array<World>());
    const worldsFromPm = pm.createWorldsWithWorldsPersist(worldsPersist);
   // expect(new PersistenceManager(worlds)).toBeTruthy();
  });
  
});
