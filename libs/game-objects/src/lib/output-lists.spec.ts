import { WorldGenerator } from './world-generator';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { GamePref } from './game-pref.interface';
import { OutPutLists } from './output-lists';
import { WorldsPersist } from './worlds-persist.interface';
import { TESTRESOUCESPATH } from './utils';
import { OutPutStringWithNodesAndLinksInterface } from './out-put-string-with-nodes-and-links.interface';

describe('OutPutLists', () => {
  let  stringData: string;
   let gamepref: GamePref;
   let colorMap: Map<string,string>;
   let fontColorMap = new Map();

  beforeAll(async () => {
    stringData = readFileSync(`${TESTRESOUCESPATH}/gamePref.json`, 'utf8');
    gamepref = JSON.parse(stringData);
    colorMap = new Map();
    colorMap.set('ZAPHOD', 'rgb(45, 134, 202)');
    fontColorMap = new Map();
      });

  it('should create an instance', () => {
    expect(new OutPutLists(gamepref, colorMap, fontColorMap)).toBeTruthy();
  });
  it('test generate', () => {
    const outPutLists = new OutPutLists(gamepref, colorMap, fontColorMap);
    const rawdata = readFileSync(`${TESTRESOUCESPATH}/worlds.json`, 'utf8');
    const worldsPersist: WorldsPersist = JSON.parse(rawdata);
    const output = outPutLists.generate(worldsPersist);

    for (const playerName of output.keys()) {
      const outPutStringWithNodesAndLinks: OutPutStringWithNodesAndLinksInterface = output.get(playerName);

     //writeFileSync(`${TESTRESOUCESPATH}/${playerName}.out`, outPutString);
     const outPutStringFromFile = readFileSync(`${TESTRESOUCESPATH}/${playerName}.out`, 'utf8');
     expect(outPutStringWithNodesAndLinks.outPutString).toBe(outPutStringFromFile);
    }
  });
});
