import { PersistenceManager } from './persistence-manager';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { writeFileSync, readFileSync } from 'fs';
import { WorldsPersist } from './worlds-persist.interface';
import { TESTRESOUCESPATH } from './utils';

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
    let testString = worldsFromPm[0].description();
    //writeFileSync(`${TESTRESOUCESPATH}/description_World1.txt`, testString);
    let descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World1.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

    testString = worldsFromPm[1].description();
    //writeFileSync(`${TESTRESOUCESPATH}/description_World2_Persist.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World2_Persist.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

    testString = worldsFromPm[2].description();
    //writeFileSync(`${TESTRESOUCESPATH}/description_World3_Persist.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World3_Persist.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

    testString = worldsFromPm[3].description();
    //fs.writeFileSync(`${TESTRESOUCESPATH}/description_World4.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World4.txt`, 'utf8');

    expect(testString).toBe(descriptionString);

    testString = worldsFromPm[4].description();
    //writeFileSync(`${TESTRESOUCESPATH}/description_World5_Persist.txt`, testString);
    descriptionString = readFileSync(`${TESTRESOUCESPATH}/description_World5_Persist.txt`, 'utf8');
    expect(testString).toBe(descriptionString);

    const playerDict = pm.allPlayerDict;
    let playerfromDict = playerDict.get('ZAPHOD');
    expect(playerfromDict.playerName).toBe('ZAPHOD');
    expect(playerfromDict.points).toBe(42);
    const player2 = Array.from(playerfromDict.teammates)[0];
    expect(player2).toBe(playerDict.get('MARVIN'));

    playerfromDict = playerDict.get('MARVIN');
    expect(playerfromDict.playerName).toBe('MARVIN');
    expect(playerfromDict.points).toBe(7);
    expect(playerfromDict.teammates.size).toBe(0);



  });
  
});
