import { World, worldWithNumber } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { TESTRESOUCESPATH } from './utils';
import { readFileSync, writeFileSync } from 'fs';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;

describe('World', () => {
  it('should create an instance', () => {
    expect(new World()).toBeTruthy();
  });
  it('test setNumber', () => {
    //TestWorldsArrayFactory use setNumber
    expect(worlds[0].number).toBe(1);
    expect(worlds[1].name).toBe('W2');
  });
  it('test createResourceString', () => {
    let testString = worlds[0].createResourceString();
    writeFileSync(`${TESTRESOUCESPATH}/createResourceString_World1.txt`, testString);
    let resourceString = readFileSync(`${TESTRESOUCESPATH}/createResourceString_World1.txt`, 'utf8');
    expect(testString).toBe(resourceString);

    testString = worlds[1].createResourceString();
    writeFileSync(`${TESTRESOUCESPATH}/createResourceString_World2.txt`, testString);
    resourceString = readFileSync(`${TESTRESOUCESPATH}/createResourceString_World2.txt`, 'utf8');
    expect(testString).toBe(resourceString);

    testString = worlds[2].createResourceString();
    writeFileSync(`${TESTRESOUCESPATH}/createResourceString_World3.txt`, testString);
    resourceString = readFileSync(`${TESTRESOUCESPATH}/createResourceString_World3.txt`, 'utf8');
    expect(testString).toBe(resourceString);
  });
  it('test description', () => {
    let testString = worlds[0].description();
        writeFileSync(`${TESTRESOUCESPATH}/description_World1.txt`, testString);

    let descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World1.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

    testString = worlds[1].description();
    writeFileSync(`${TESTRESOUCESPATH}/description_World2.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World2.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

    testString = worlds[2].description();
    writeFileSync(`${TESTRESOUCESPATH}/description_World3.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World3.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

    testString = worlds[3].description();
    writeFileSync(`${TESTRESOUCESPATH}/description_World4.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World4.txt`, 'utf8');

    expect(testString).toBe(descriptionString);

    testString = worlds[4].description();
    writeFileSync(`${TESTRESOUCESPATH}/description_World5.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World5.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

  });
  it('test addHitAmbushFleets', () => {
    const testWorld = new World();
    const testFleet = worlds[3].fleets[0];

    testWorld.addHitAmbushFleets(testFleet);
    expect(testWorld.hitAmbuschFleets[0].player).toBe(testFleet.player);
    expect(testWorld.hitAmbuschFleets[0].ships).toBe(testFleet.ships);
    expect(testWorld.hitAmbuschFleets[0].number).toBe(testFleet.number);
  });
  it('test hasConnectionToWorld', () => {
    expect(worlds[0].hasConnectionToWorld(worlds[1])).toBe(true);
    expect(worlds[0].hasConnectionToWorld(worlds[4])).toBe(false);
  });
  it('test funktion worldWithNumber', () => {
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
