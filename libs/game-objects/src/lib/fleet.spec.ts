import { Player } from './player';
import { Fleet, fleetAndHomeWorldWithNumber } from './fleet';
import { World } from '..';
import { TestWorldsArrayFactory } from './test-worlds-array-factory';

const palyerName = 'ZAPHOD';
const player = new Player(palyerName);
const fleet = new Fleet();
fleet.number = 42;

describe('Fleet', () => {
    it('should create an instance', () => {
        expect(fleet).toBeTruthy();

        const controllStringWithoutPlayer = `F${fleet.number}[---]`;

        expect(fleet.name()).toBe(controllStringWithoutPlayer);
        
        fleet.player = player;
        const controllStringWitPlayer = `F${fleet.number}[${palyerName}]`;

        expect(fleet.name()).toBe(controllStringWitPlayer);
    });
    it('test funktion fleetAndHomeWorldWithNumber', () => {
        const worlds: Array<World> = new TestWorldsArrayFactory().worlds;

        // tslint:disable-next-line: no-shadowed-variable
        let [fleet, homeWorld] = fleetAndHomeWorldWithNumber(worlds, 4);
    
        expect(fleet).toBe(worlds[3].fleets[0]);
        expect(homeWorld).toBe(worlds[3]);
    
        [fleet, homeWorld] = fleetAndHomeWorldWithNumber(worlds, 1);
        expect(fleet).toBe(null);
        expect(homeWorld).toBe(null);
      });
});