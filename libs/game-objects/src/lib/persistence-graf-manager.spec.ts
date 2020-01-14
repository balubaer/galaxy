import { PersistenceGrafManager } from './persistence-graf-manager';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { Player } from './player';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const allPlayerDict: Map<string, Player> = new Map<string, Player>();

describe('PersistenceGrafManager', () => {
  it('should create an instance', () => {
    const colorMap = new Map();
    colorMap.set('ZAPHOD', 'rgb(45, 134, 202)');
    expect(new PersistenceGrafManager(worlds, allPlayerDict, colorMap)).toBeTruthy();
  });

  it('test generateNodesAndLinks', () => {
    const allPlayerDictForGenerateNodesAndLinks : Map<string, Player> = new Map<string, Player>();
    allPlayerDictForGenerateNodesAndLinks.set('ZAPHOD', new Player('ZAPHOD'));
    const colorMap = new Map();
    colorMap.set('ZAPHOD', 'rgb(45, 134, 202)');
    const pGM = new PersistenceGrafManager(worlds, allPlayerDictForGenerateNodesAndLinks, colorMap)
    const result = pGM.generateNodesAndLinks('ZAPHOD');
  
    expect(result).toBeTruthy();
  });


});
