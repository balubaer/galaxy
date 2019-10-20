import { Player } from './player';
import { Fleet } from './fleet';

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
});