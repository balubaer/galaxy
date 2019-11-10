import { PersistenceManager } from './persistence-manager';
//import { TestWorldsArrayFactory, World, GamePref } from '../../src/lib/';
import { readFileSync } from 'fs';
// tslint:disable-next-line: nx-enforce-module-boundaries
import { World } from 'libs/game-objects/src/lib/world';
// tslint:disable-next-line: nx-enforce-module-boundaries
import { TestWorldsArrayFactory } from 'libs/game-objects/src/lib/test-worlds-array-factory';
// tslint:disable-next-line: nx-enforce-module-boundaries
import {  GamePref } from 'libs/game-objects/src/lib/game-pref';
//import { TestWorldsArrayFactory, GamePref } from '@galaxy/game-objects';

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
