import { readFileSync } from 'fs';
import { PersistenceManager } from './persistence-manager';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { GamePref } from './game-pref';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const stringData = readFileSync('gamePref.json', 'utf8');
const gamepref: GamePref = JSON.parse(stringData);

describe('PersistenceManager', () => {
  it('should create an instance', () => { 
    expect(new PersistenceManager(worlds, gamepref)).toBeTruthy();
  });
  it('test writeWorlds', () => {
    const pm = new PersistenceManager(worlds, gamepref);
    pm.writeWorlds();
    expect(new PersistenceManager(worlds, gamepref)).toBeTruthy();
  });
});
