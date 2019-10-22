import { World, worldWithNumber } from './world';

describe('World', () => {
  it('should create an instance', () => {
    expect(new World()).toBeTruthy();
  });
  it('test funktion worldWithNumber', () => {
    const worlds: Array<World> = new Array<World>();
    const world1: World = new World();
    const world2: World = new World();
    let foundWorld = null;

    world1.number = 1;
    worlds.push(world1);
    world2.number = 2;
    worlds.push(world2);

    foundWorld = worldWithNumber(worlds, 3);
    expect(foundWorld).toBe(null);

    foundWorld = worldWithNumber(worlds, 1);
    expect(foundWorld).toBe(world1);

    foundWorld = worldWithNumber(worlds, 2);
    expect(foundWorld).toBe(world2);
  });
});
