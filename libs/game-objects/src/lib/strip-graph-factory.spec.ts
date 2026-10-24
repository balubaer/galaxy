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

  it('liefert Verbindungen über das Distanzlevel hinaus als hiddenLinks', () => {
    const dataGraf = new StripGraphFactory('W7', aWorlds, turnDataGraf, 2).getResult();
    const shown = new Set(dataGraf.nodes.map((node) => node.id));
    const hiddenLinks = dataGraf.hiddenLinks ?? [];
    expect(hiddenLinks.length).toBeGreaterThan(0);
    for (const link of hiddenLinks) {
      expect(shown.has(link.source)).toBe(true);
      expect(shown.has(link.target)).toBe(false);
    }
    const keys = hiddenLinks.map((link) => `${link.source}-${link.target}`);
    expect(new Set(keys).size).toBe(keys.length);
    // Ohne Beschränkung bleibt keine Verbindung verborgen.
    const all = new StripGraphFactory('W7', aWorlds, turnDataGraf, 99).getResult();
    expect(all.hiddenLinks).toEqual([]);
  });

});
