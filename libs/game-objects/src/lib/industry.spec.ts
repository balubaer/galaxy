import { Industry, WhatsBuildEnum } from './industry';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';
import { Fleet } from './fleet';

const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const fleet: Fleet = worlds[3].fleets[0];
const world: World = worlds[3];

describe('Industry', () => {
  it('should create an instance', () => {
    expect(new Industry(world)).toBeTruthy();
  });
  it('test buildship', () => {
    const industry = world.industry[0];
    industry.whatsBuild = WhatsBuildEnum.SHIP;
    industry.fleet = fleet;
    industry.build();
    expect(world.metal).toBe(5);
    expect(fleet.ships).toBe(5);
    expect(world.industry.length).toBe(1);
  });
});

