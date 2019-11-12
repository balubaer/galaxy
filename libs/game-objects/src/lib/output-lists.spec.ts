import { WorldGenerator } from './world-generator';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { GamePref } from './game-pref';
import { OutPutLists } from './output-lists';
import { WorldsPersist } from './worlds-persist';
import { TESTRESOUCESPATH } from './utils';

const stringData = readFileSync('gamePref.json', 'utf8');
const gamepref: GamePref = JSON.parse(stringData);

describe('OutPutLists', () => {
  it('should create an instance', () => {
    expect(new OutPutLists(gamepref)).toBeTruthy();
  });
  it('test generate', () => {
    const outPutLists = new OutPutLists(gamepref);
    const rawdata = readFileSync('worlds.json', 'utf8');
    const worldsPersist: WorldsPersist = JSON.parse(rawdata);
    const output = outPutLists.generate(worldsPersist);

    for (const playerName of output.keys()) {
      const outPutString = output.get(playerName);
     // writeFileSync(`${TESTRESOUCESPATH}/${playerName}.out`, outPutString);
     const outPutStringFromFile = readFileSync(`${TESTRESOUCESPATH}/${playerName}.out`, 'utf8');
     expect(outPutString).toBe(outPutStringFromFile);
    }
  });
});
