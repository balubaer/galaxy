import { PortFactory } from './portfactory';
import { World } from './world';
import { Port } from './port';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';

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
});
