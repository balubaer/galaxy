import { WorldGenerator } from './world-generator';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { GamePref } from './game-pref.interface';
import { TESTRESOUCESPATH } from './utils';
import { WorldsPersist } from './worlds-persist.interface';
import { OutPutLists } from './output-lists';
import { OutPutStringWithNodesAndLinksInterface } from './out-put-string-with-nodes-and-links.interface';

const stringData = readFileSync(`${TESTRESOUCESPATH}/gamePref.json`, 'utf8');
const gamepref: GamePref = JSON.parse(stringData);

describe('WorldGenerator', () => {
  it('should create an instance', () => {
    expect(new WorldGenerator(gamepref)).toBeTruthy();
  });
  it('test generate', () => {
    const worldGen = new WorldGenerator(gamepref);
    const worldsPersist: WorldsPersist = worldGen.generate();
    let outString = '';

    for (const world of worldGen.worlds) {
      outString += `${world.description()}\n\n`;
    }

    const outPutLists = new OutPutLists(gamepref);
    const output = outPutLists.generate(worldsPersist);
   
    if (existsSync(gamepref.playName)) {
      console.log('gamepref.playName: ' + gamepref.playName + 'vorhanden');
    } else {
      console.log('gamepref.playName: ' + gamepref.playName + ' nicht vorhanden ---');
      mkdirSync(gamepref.playName);
    }
    const outPath = `${gamepref.playName}/Turn${gamepref.round}/`
    if (existsSync(outPath)) {
      console.log('outPath: ' + outPath + 'vorhanden');
    } else {
      console.log('outPath ' + outPath + ' nicht vorhanden ---');
      mkdirSync(outPath);

    }

    for (const playerName of output.keys()) {
      const outPutStringWithNodesAndLinks: OutPutStringWithNodesAndLinksInterface = output.get(playerName);
      writeFileSync(`${outPath}${playerName}.out`, outPutStringWithNodesAndLinks.outPutString);
      const grafData = JSON.stringify(outPutStringWithNodesAndLinks.nodesAndLinks);
      writeFileSync(`${outPath}${playerName}_graf.json`, grafData);
    }

    const data = JSON.stringify(worldsPersist);
    writeFileSync(outPath + 'worlds.json', data);
    writeFileSync(outPath + 'worlds.txt', outString);

    for (const world of worldGen.worlds) {
      expect(world).toBeTruthy();
      expect(world.port).toBeTruthy();
      //TODO: distanceLevelHomes testen
      //TODO: HomeFleeds testen
    }
  });
});
