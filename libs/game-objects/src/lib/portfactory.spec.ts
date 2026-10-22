import { PortFactory } from './portfactory';
import { Port } from './port';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { World } from './world';

const portFactory: PortFactory = new PortFactory();
const worlds: Array<World> = new TestWorldsArrayFactory().worlds;

describe('PortFactory', () => {
  it('should create an instance', () => {
    expect(portFactory).toBeTruthy();
  });
  
  it('test Method hasWorldMaxConnetion', () => {
    //MaxConnetion === 3
    expect(portFactory.hasWorldMaxConnetion(worlds[3])).toBeTruthy();
    expect(portFactory.hasWorldMaxConnetion(worlds[0])).toBeFalsy();
    expect(portFactory.hasWorldMaxConnetion(worlds[4])).toBeFalsy();
  });

  it('test Method hasWorldEnoughConnection', () => {
    //MaxConnetion === 3
    expect(portFactory.hasWorldEnoughConnection(worlds[3])).toBeTruthy();
    expect(portFactory.hasWorldEnoughConnection(worlds[0])).toBeTruthy();
    expect(portFactory.hasWorldEnoughConnection(worlds[1])).toBeFalsy();
    expect(portFactory.hasWorldEnoughConnection(worlds[4])).toBeFalsy();
  });

  it('verbindet alle Welten, auch bei vielen Durchläufen', () => {
    for (let run = 0; run < 50; run++) {
      const testWorlds: Array<World> = [];
      for (let i = 1; i <= 30; i++) {
        const world = new World();
        world.setNumber(i);
        testWorlds.push(world);
      }
      const factory = new PortFactory();
      factory.moreConnectionWorld = 3;
      factory.createWithWorldArray(testWorlds);
      expect(factory.isConnected(testWorlds)).toBe(true);
    }
  });

  it('connectComponents schließt getrennte Teile an', () => {
    const testWorlds: Array<World> = [];
    for (let i = 1; i <= 6; i++) {
      const world = new World();
      world.setNumber(i);
      const port = new Port();
      port.worlds = [];
      port.setWorld(world);
      world.port = port;
      testWorlds.push(world);
    }
    const link = (a: World, b: World) => { a.port.worlds.push(b); b.port.worlds.push(a); };
    link(testWorlds[0], testWorlds[1]);
    link(testWorlds[2], testWorlds[3]);
    const factory = new PortFactory();
    expect(factory.connectedComponents(testWorlds).length).toBe(4);
    factory.connectComponents(testWorlds);
    expect(factory.isConnected(testWorlds)).toBe(true);
  });
});
