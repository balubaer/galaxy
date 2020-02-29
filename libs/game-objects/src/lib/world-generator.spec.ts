import { WorldGenerator } from './world-generator';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { GamePref } from './game-pref.interface';
import { TESTRESOUCESPATH, objToMap } from './utils';
import { WorldsPersist } from './worlds-persist.interface';
import { OutPutLists } from './output-lists';
import { OutPutStringWithNodesAndLinksInterface } from './out-put-string-with-nodes-and-links.interface';


describe('WorldGenerator', () => {
  let stringData: string;
  let gamepref: GamePref;
  let colorMap: Map<any, any>;
  let fontColorMap: Map<any, any>;


  // declare var beforeAll: jest.Lifecycle;
  //declare var beforeEach: jest.Lifecycle;

  beforeAll(async () => {
    stringData = readFileSync(`${TESTRESOUCESPATH}/gamePref.json`, 'utf8');
    gamepref = JSON.parse(stringData);

    let colorData = readFileSync(`${TESTRESOUCESPATH}/color.json`, 'utf8');
    let colors = JSON.parse(colorData);
    colorMap = objToMap(colors);

    colorData = readFileSync(`${TESTRESOUCESPATH}/fontColor.json`, 'utf8');
    colors = JSON.parse(colorData);
    fontColorMap = objToMap(colors);
  });

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

    const outPutLists = new OutPutLists(gamepref, colorMap, fontColorMap);
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
