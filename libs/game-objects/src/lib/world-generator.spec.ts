import { WorldGenerator } from './world-generator';
import { readFileSync } from 'fs';
import { GamePref } from './game-pref';

const stringData = readFileSync('gamePref.json', 'utf8');
const gamepref: GamePref = JSON.parse(stringData);

describe('WorldGenerator', () => {
  it('should create an instance', () => {
    expect(new WorldGenerator(gamepref)).toBeTruthy();
  });
  it('test generate', () => {
    const worldGen = new WorldGenerator(gamepref);
    worldGen.generate();
    for (const world of worldGen.worlds) {
      console.log(world.description());
      expect(world).toBeTruthy();
      expect(world.port).toBeTruthy();
      //TODO: distanceLevelHomes testen
      //TODO: HomeFleeds testen
    }
  });
});
