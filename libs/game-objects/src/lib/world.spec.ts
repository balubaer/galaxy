import { World, worldWithNumber } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { TESTRESOUCESPATH } from './utils';

const fs = require('fs');

describe('World', () => {
  it('should create an instance', () => {
    expect(new World()).toBeTruthy();
  });
  it('test setNumber', () => {
    //TestWorldsArrayFactory use setNumber
    const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
    expect(worlds[0].number).toBe(1);
    expect(worlds[1].name).toBe('W2');
  });
  it('test createResourceString', () => {
    const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
    let testString = worlds[0].createResourceString();
    let resourceString = fs.readFileSync(`${TESTRESOUCESPATH}/createResourceString_World1.txt`, 'utf8');
    expect(testString).toBe(resourceString);

    testString = worlds[1].createResourceString();
    //fs.writeFileSync(`${TESTRESOUCESPATH}/createResourceString_World2.txt`, testString);
    resourceString = fs.readFileSync(`${TESTRESOUCESPATH}/createResourceString_World2.txt`, 'utf8');
    expect(testString).toBe(resourceString);

    testString = worlds[2].createResourceString();
    resourceString = fs.readFileSync(`${TESTRESOUCESPATH}/createResourceString_World3.txt`, 'utf8');
    expect(testString).toBe(resourceString);
  });
  it('test description', () => {
    const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
    let testString = worlds[0].description();
    fs.writeFileSync(`${TESTRESOUCESPATH}/description_World1.txt`, testString);

        //TODO: Test
  });
  it('test addHitAmbushFleets', () => {
        //TODO: Test

  });
  it('test hasConnectionToWorld', () => {
        //TODO: Test
  });
  it('test funktion worldWithNumber', () => {
    const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
    let foundWorld = null;

    foundWorld = worldWithNumber(worlds, worlds.length + 1);
    expect(foundWorld).toBe(null);

    foundWorld = worldWithNumber(worlds, 1);
    expect(foundWorld).toBe(worlds[0]);

    foundWorld = worldWithNumber(worlds, 2);
    expect(foundWorld).toBe(worlds[1]);

    foundWorld = worldWithNumber(worlds, 3);
    expect(foundWorld).toBe(worlds[2]);
  });
});
