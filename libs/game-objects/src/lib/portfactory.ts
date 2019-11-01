import { World } from './world'
import { Dice } from './dice';

export class PortFactory {
    worldsWithEnoughConnections: Array <World>;
    workingWorlds: Array <World>;
    worldsCount: number;
    dice: Dice;
    maxCount: number;
    moreConnectionWorld : number;
    lessConectionWorld : number;
    abort : boolean;


    constructor() {
        this.worldsWithEnoughConnections = new Array();
        this.worldsCount = 0;
        this.dice = new Dice();
        this.workingWorlds = new Array();
        this.maxCount = 3;
        this.moreConnectionWorld = 0;
        this.lessConectionWorld = 0;
        this.abort = false;
    }

    hasWorldMaxConnetion(world: World): boolean {
        let result = false;
        if (world.port !== null) {
            const connectionCount = world.port.worlds.length;
            if (connectionCount === this.maxCount) {
                result = true;
            }
        }
        return result
    }

    hasWorldEnoughConnection(world: World): boolean {
        let result = false;
        if (world.port !== null) {
            const connectionCount = world.port.worlds.length;
            if (connectionCount >= 2 && connectionCount <= this.maxCount) {
                result = true;
            }
        }
        return result
    }

    addWorldWithEnoughConnectionTest(world: World) {
        if (this.hasWorldEnoughConnection(world)) {
            if (this.worldsWithEnoughConnections.indexOf(world) === -1) {
                this.worldsWithEnoughConnections.push(world);
            }
        }
    }

}
