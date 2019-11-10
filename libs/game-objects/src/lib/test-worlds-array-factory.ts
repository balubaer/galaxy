import { World } from './world';
import { Fleet } from './fleet';
import { Player } from './player';
import { Port } from './port';
import { FleetMovement } from './fleet-movement';

export class TestWorldsArrayFactory {
    worlds: Array<World> = new Array();

    constructor() {
        const player = new Player('ZAPHOD');
        let world: World = new World();
        world.setNumber(1);
        world.dShips = 1;
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
        world.dShipsFiredFleet.player = player;
        world.dShipsFiredFleet.number = 3;
        this.worlds.push(world);

        world = new World();
        world.setNumber(4);
        world.dShips = 4;
        world.player = player;
        world.fleets.push(new Fleet());
        world.fleets[0].ships = 4;
        world.fleets[0].number = 4;
        world.fleets[0].player = world.player;
        this.worlds.push(world);

        world = new World();
        world.setNumber(5);
        world.dShips = 5;
        world.player = player;
        const fleetMovement = new FleetMovement();
        fleetMovement.fleet = this.worlds[3].fleets[0];
        fleetMovement.toWorld = this.worlds[3];
        world.fleetMovements.push(fleetMovement);
        this.worlds.push(world);

        this.worlds[0].port = new Port();
        this.worlds[0].port.setWorld(this.worlds[0]);
        this.worlds[0].port.worlds = [this.worlds[1],this.worlds[2]];
        
        this.worlds[1].port = new Port();
        this.worlds[1].port.setWorld(this.worlds[1]);
        this.worlds[1].port.worlds = [this.worlds[0]];

        this.worlds[2].port = new Port();
        this.worlds[2].port.setWorld(this.worlds[2]);
        this.worlds[2].port.worlds = [this.worlds[0],this.worlds[1]];


        this.worlds[3].port = new Port();
        this.worlds[3].port.setWorld(this.worlds[3]);
        this.worlds[3].port.worlds = [this.worlds[0],this.worlds[1],this.worlds[2]];

        this.worlds[4].port = new Port();
        this.worlds[4].port.setWorld(this.worlds[4]);
        this.worlds[4].port.worlds = [this.worlds[0],this.worlds[1],this.worlds[2],this.worlds[3]];
    }
}
