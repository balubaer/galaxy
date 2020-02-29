import { PersistenceGrafManager } from './persistence-graf-manager';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { Player } from './player';

describe('PersistenceGrafManager', () => {
  let worlds: Array<World>;
  let allPlayerDict: Map<string, Player>;

  beforeAll(async () => {
    worlds = new TestWorldsArrayFactory().worlds;
    allPlayerDict = new Map<string, Player>();
  });

  it('should create an instance', () => {
    const colorMap = new Map();
    colorMap.set('ZAPHOD', 'rgb(45, 134, 202)');
    const fontColorMap = new Map();
    expect(new PersistenceGrafManager(worlds, allPlayerDict, colorMap, fontColorMap)).toBeTruthy();
  });

  it('test generateNodesAndLinks', () => {
    const allPlayerDictForGenerateNodesAndLinks : Map<string, Player> = new Map<string, Player>();
    allPlayerDictForGenerateNodesAndLinks.set('ZAPHOD', new Player('ZAPHOD'));
    const colorMap = new Map();
    colorMap.set('ZAPHOD', 'rgb(45, 134, 202)');
    const fontColorMap = new Map();

    const pGM = new PersistenceGrafManager(worlds, allPlayerDictForGenerateNodesAndLinks, colorMap, fontColorMap)
    const result = pGM.generateNodesAndLinks('ZAPHOD');
  
    expect(result).toBeTruthy();
  });
});
