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
        world.port = new Port([1,3], 2);
        this.worlds.push(world);

        world = new World();
        world.setNumber(3);
        world.dShips = 3;
        world.dShipsFired = true;
        world.dShipsFiredFleet = new Fleet();
        world.dShipsFiredFleet.player = new Player('ZAPHOD');
        world.dShipsFiredFleet.number = 3;
        world.port = new Port([1,2], 3);
        this.worlds.push(world);

        world = new World();
        world.setNumber(4);
        world.dShips = 4;
        world.player = new Player('ZAPHOD');
        world.fleets.push(new Fleet());
        world.fleets[0].ships = 4;
        world.fleets[0].number = 4;
        world.fleets[0].player = world.player;
        world.port = new Port([1,2], 4);
        this.worlds.push(world);

    }
}
