import { PortFactory } from './portfactory';
import { World } from './world';
import { Port } from './port';

const portFactory: PortFactory = new PortFactory();
const world: World = new World();

world.setNumber(1);

describe('PortFactory', () => {
  it('should create an instance', () => {
    expect(portFactory).toBeTruthy();
  });
  
  it('test Method hasWorldMaxConnetion', () => {
    //MaxConnetion === 3
    world.port = new Port([2, 3, 4], 1);;
    expect(portFactory.hasWorldMaxConnetion(world)).toBeTruthy();
    world.port = new Port([3, 4], 1);
    expect(portFactory.hasWorldMaxConnetion(world)).toBeFalsy();
    world.port = new Port([3, 4, 5, 6], 1);
    expect(portFactory.hasWorldMaxConnetion(world)).toBeFalsy();
  });

  it('test Method hasWorldEnoughConnection', () => {
    //MaxConnetion === 3
    world.port = new Port([2, 3, 4], 1);;
    expect(portFactory.hasWorldEnoughConnection(world)).toBeTruthy();
    world.port = new Port([3, 4], 1);
    expect(portFactory.hasWorldEnoughConnection(world)).toBeTruthy();
    world.port = new Port([4], 1);
    expect(portFactory.hasWorldEnoughConnection(world)).toBeFalsy();
    world.port = new Port([3, 4, 5, 6], 1);
    expect(portFactory.hasWorldEnoughConnection(world)).toBeFalsy();
  });
});
