import { World } from './world';
import { Port } from './port';
import { Fleet } from './fleet';

export class TestDistanceLevelWoldsFactory {
    worlds: Array<World> = new Array();

    constructor() {
        let world: World = new World();
        world.setNumber(11);
        world.dShips = 1;
        this.worlds.push(world);

        let fleet = new Fleet();
        fleet.number = 1;
        world.fleets.push(fleet);

        fleet = new Fleet();
        fleet.number = 2;
        world.fleets.push(fleet);

        fleet = new Fleet();
        fleet.number = 3;
        world.fleets.push(fleet);

        fleet = new Fleet();
        fleet.number = 4;
        world.fleets.push(fleet);

        world = new World();
        world.setNumber(12);
        world.dShips = 2;
        world.ambushOff = true;
        this.worlds.push(world);

        world = new World();
        world.setNumber(13);
        world.dShips = 3;
        world.dShipsFired = true;
        this.worlds.push(world);

        world = new World();
        world.setNumber(14);
        world.dShips = 4;
        this.worlds.push(world);

        world = new World();
        world.setNumber(15);
        world.dShips = 5;
        this.worlds.push(world);

        this.worlds[0].port = new Port();
        this.worlds[0].port.setWorld(this.worlds[0]);
        this.worlds[0].port.worlds = [this.worlds[1]];

        this.worlds[1].port = new Port();
        this.worlds[1].port.setWorld(this.worlds[1]);
        this.worlds[1].port.worlds = [this.worlds[0], this.worlds[2]];

        this.worlds[2].port = new Port();
        this.worlds[2].port.setWorld(this.worlds[2]);
        this.worlds[2].port.worlds = [this.worlds[1], this.worlds[3]];


        this.worlds[3].port = new Port();
        this.worlds[3].port.setWorld(this.worlds[3]);
        this.worlds[3].port.worlds = [this.worlds[2], this.worlds[4]];

        this.worlds[4].port = new Port();
        this.worlds[4].port.setWorld(this.worlds[4]);
        this.worlds[4].port.worlds = [this.worlds[3]];
    }
}
