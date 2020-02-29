import { StripGraphFactory } from './strip-graph-factory';
import { World, Player, WorldsPersist, PersistenceManager, NodesAndLinks } from '..';
import { readFileSync } from 'fs';

describe('StripGraphFactory', () => {
  let aWorlds: Array<World>;
  let turnDataGraf: NodesAndLinks;

  beforeAll(async () => {
    let rawdata = readFileSync('TestGame/Turn3/worlds.json', 'utf8');
    const worldsPersist: WorldsPersist = JSON.parse(rawdata);
    const pm = new PersistenceManager(new Array<World>());
    aWorlds = pm.createWorldsWithWorldsPersist(worldsPersist);

    rawdata = readFileSync('TestGame/Turn3/ZAPHOD_graf.json', 'utf8');
    turnDataGraf = JSON.parse(rawdata);
  });

  it('should create an instance', () => {
    expect(new StripGraphFactory('W7', aWorlds, turnDataGraf, 3)).toBeTruthy();
  });

  it('test getResult', () => {
    const stripGraphFactory: StripGraphFactory = new StripGraphFactory('W7', aWorlds, turnDataGraf, 2);
    const dataGraf: NodesAndLinks = stripGraphFactory.getResult();
    expect(dataGraf.nodes.length).toBe(9);
  });

});
