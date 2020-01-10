import { Player } from './player';
import { Fleet, fleetAndHomeWorldWithNumber } from './fleet';
import { World } from './world';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';

const palyerName = 'ZAPHOD';
const player = new Player(palyerName);
const fleet = new Fleet();
fleet.number = 42;
const ambushFleet = new Fleet();
ambushFleet.number = 12;
const ambushFleet2 = new Fleet();
ambushFleet2.number = 10;

describe('Fleet', () => {
    it('should create an instance', () => {
        expect(fleet).toBeTruthy();
        const controllStringWithoutPlayer = `F${fleet.number}[---]`;
        expect(fleet.name()).toBe(controllStringWithoutPlayer);
        fleet.player = player;
        const controllStringWitPlayer = `F${fleet.number}[${palyerName}]`;
        expect(fleet.name()).toBe(controllStringWitPlayer);
    });
    it('test createInfoString and addHitAmbushFleets', () => {
        fleet.moved = true;
        fleet.ambush = true;
        fleet.addHitAmbushFleets(ambushFleet);
        fleet.fired = true;
        fleet.firesTo = 'F11[MARVIN]'
        let controlString = '(bewegt, Ambush: {F12[---]}, feuert auf F11[MARVIN])';
        expect(fleet.createInfoString()).toBe(controlString);
        fleet.addHitAmbushFleets(ambushFleet2);
        controlString = '(bewegt, Ambush: {F12[---], F10[---]}, feuert auf F11[MARVIN])';
        expect(fleet.createInfoString()).toBe(controlString);
    });
    it('test description', () => {
        fleet.ships = 5;
        fleet.moved = true;
        fleet.ambush = false;
        fleet.hitAmbuschFleets.length = 0;
        fleet.fired = true;
        fleet.firesTo = 'F11[MARVIN]'
        const controlString = 'F42[ZAPHOD] = 5 (bewegt, feuert auf F11[MARVIN])';
        expect(fleet.description()).toBe(controlString);
    });
    it('test funktion fleetAndHomeWorldWithNumber', () => {
        const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
        let aFleetHomeWorld = fleetAndHomeWorldWithNumber(worlds, 4);
        expect(aFleetHomeWorld.fleet).toBe(worlds[3].fleets[0]);
        expect(aFleetHomeWorld.homeWorld).toBe(worlds[3]);
        aFleetHomeWorld = fleetAndHomeWorldWithNumber(worlds, 1);
        expect(aFleetHomeWorld.fleet).toBe(null);
        expect(aFleetHomeWorld.homeWorld).toBe(null);
    });  it('test metal', () => {
    fleet.metal = 10;
    console.log('Hallo '+ fleet.metal);
    expect(fleet.metal === 10).toBe(true);
  });
});