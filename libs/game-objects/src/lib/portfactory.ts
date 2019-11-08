import { World } from './world'
import { Dice } from './dice';
import { Port } from './port';

export class PortFactory {
    worldsWithEnoughConnections: Array<World>;
    workingWorlds: Array<World>;
    worldsCount: number;
    dice: Dice;
    maxCount: number;
    moreConnectionWorld: number;
    lessConectionWorld: number;
    abort: boolean;


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

    removeWorldFromWorkArrayWithMaxConnectionTest(aWorld: World) {
        if (this.hasWorldMaxConnetion(aWorld)) {
            const index = this.workingWorlds.indexOf(aWorld);
            if (index > -1) {
                this.workingWorlds.splice(index, 1);
            }

            let logString = `World [${aWorld.number}] ist fertig.`;
            console.log(logString);
            logString = `WorkingWorlden: Anzahl [${this.workingWorlds.length}]`;
            console.log(logString);
            logString = `Worlden mit ausreichend Verfindungen: Anzahl [${this.worldsWithEnoughConnections.length}]`;
            console.log(logString);
        }

    }

    isAllConnectionCreated(): boolean {
        let result = false;
        if (this.worldsCount === this.worldsWithEnoughConnections.length) {
            result = true;
        }
        return result;
    }

    isWorldForNewConnectionOK(aWorld: World): boolean {
        let result = false;
        if (this.hasWorldMaxConnetion(aWorld) === false) {
            result = true;
        }
        return result;
    }

    getStartWorldWithDiceAndWorldArray(): World {
        let result: World = null;
        this.dice.setSites(this.workingWorlds.length);
        let indexNumber = this.dice.roll();
        let realIndex = indexNumber - 1;
        result = this.workingWorlds[realIndex];

        if (result !== null) {
            let found = this.isWorldForNewConnectionOK(result);

            while (!found) {
                indexNumber = this.dice.roll();
                realIndex = indexNumber - 1;
                result = this.workingWorlds[realIndex];
                found = this.isWorldForNewConnectionOK(result);
            }
        }
        return result;
    }

    isEndWorldForNewConnectionOK(aEndWorld: World, aStartWorld: World): boolean {
        let result = false;
        if (aEndWorld.number !== aStartWorld.number) {
            if (this.hasWorldMaxConnetion(aEndWorld) === false) {
                if (aEndWorld.hasConnectionToWorld(aStartWorld) === false) {
                    result = true;
                }
            }
        }
        return result
    }

    getEndWorldWithDiceAndStartWorld(aStartWorld: World): World {
        let result: World = null;
        this.dice.setSites(this.workingWorlds.length);
        let indexNumber = this.dice.roll();
        let realIndex = indexNumber - 1;
        result = this.workingWorlds[realIndex];

        if (result !== null) {
            let found = this.isEndWorldForNewConnectionOK(result, aStartWorld);

            while (!found) {
                indexNumber = this.dice.roll();
                realIndex = indexNumber - 1;
                result = this.workingWorlds[realIndex];

                found = this.isEndWorldForNewConnectionOK(result, aStartWorld);
            }
        }

        return result
    }

    generateOneConnection() {
        let startWorld: World;
        let endWorld: World;
        startWorld = this.getStartWorldWithDiceAndWorldArray();
        if (startWorld !== null) {
            endWorld = this.getEndWorldWithDiceAndStartWorld(startWorld);
            if (endWorld != null) {
                startWorld.port.worlds.push(endWorld);
                endWorld.port.worlds.push(startWorld);
                this.addWorldWithEnoughConnectionTest(startWorld);
                this.addWorldWithEnoughConnectionTest(endWorld);
                this.removeWorldFromWorkArrayWithMaxConnectionTest(startWorld);
                this.removeWorldFromWorkArrayWithMaxConnectionTest(endWorld);
            }
        }
    }

    generateWorldConnection() {
        while (!this.isAllConnectionCreated() && !this.abort) {
            this.generateOneConnection()
            if (this.workingWorlds.length < 2) {
                this.abort = true;
            }
        }
    }

    isWorldForClearConnectionOK(aWorld: World): boolean {
        let result = false;
        const port = aWorld.port;
        if (port !== null) {
            if (port.worlds.length > 2) {
                let portsOK = true;
                for (const world of port.worlds) {
                    const aPort = world.port;
                    if (aPort !== null) {
                        if (aPort.worlds.length < 3) {
                            portsOK = false
                            break;
                        }
                    } else {
                        portsOK = false
                        break;
                    }
                }
                result = portsOK;
            }
        }
        return result;
    }

    getWorldforClearConnectionWithDiceAndWorldArray(): World {
        let result: World = null;
        this.dice.setSites(this.workingWorlds.length);
        let indexNumber = this.dice.roll();
        let realIndex = indexNumber - 1;
        result = this.workingWorlds[realIndex];

        if (result !== null) {
            let found = this.isWorldForClearConnectionOK(result)

            while (!found) {
                indexNumber = this.dice.roll();
                realIndex = indexNumber - 1;
                result = this.workingWorlds[realIndex];

                found = this.isWorldForClearConnectionOK(result)
            }
        }
        return result
    }

    clearOneConnection() {
        const world = this.getWorldforClearConnectionWithDiceAndWorldArray()
        const port = world.port;
        if (port !== null) {
            this.dice.setSites(port.worlds.length);
            const indexNumber = this.dice.roll();

            const realIndex = indexNumber - 1;
            const worldFromPort = port.worlds[realIndex];

            port.worlds.splice(realIndex, 1);
            const portFPFP = worldFromPort.port;
            if (portFPFP !== null) {
                const index = portFPFP.worlds.indexOf(world);
                if (index !== -1) {
                    portFPFP.worlds.splice(index, 1);
                }
            }
        }
    }

    createWithWorldArray(worldArray: Array<World>) {
        this.worldsCount = worldArray.length;
        //All Worlds get Ports
        for (const world of worldArray) {
            this.workingWorlds.push(world);
            const port = new Port();
            world.port = port;
            port.worlds = new Array <World>();
            port.world = world;
        }
        this.generateWorldConnection()
        this.maxCount = 5
        this.workingWorlds.length = 0;
        for (const world of worldArray) {
            this.workingWorlds.push(world);
        }
        for (let i = 0; i < this.moreConnectionWorld; i++) {
            this.generateOneConnection()
        }
        this.workingWorlds.length = 0;
        for (const world of worldArray) {
            this.workingWorlds.push(world);
        }
        for (let i = 0; i < this.moreConnectionWorld; i++) {
            this.clearOneConnection()
        }
    }
}
