import { World } from '..';
import { Fleet } from './fleet';
import { Player } from './player';
import { Port } from './port';

export class TestWorldsArrayFactory {
    worlds: Array<World> = new Array();

    constructor() {
        let world: World = new World();
        world.setNumber(1);
        world.dShips = 1;
        world.port = new Port([2,3], 1);
        this.worlds.push(world);

        world = new World();
        world.setNumber(2);
        world.dShips = 2;
        world.ambushOff = true;

        this.worlds.push(world);

        world = new World();
        world.setNumber(3);
        world.dShips = 3;
        world.dShipsFired = true;
        world.dShipsFiredFleet = new Fleet();
        world.dShipsFiredFleet.player = new Player('ZAPHOD');
        world.dShipsFiredFleet.number = 3;

        this.worlds.push(world);
    }
}
