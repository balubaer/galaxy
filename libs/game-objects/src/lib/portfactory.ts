import { World } from './world'
import { Dice } from './dice';
import { Port } from './port';
import { createGameLogger } from './game-log';

const logger = createGameLogger('PortFactory');

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
            logger.debug(logString);
            logString = `Bearbeitete Welten: Anzahl [${this.workingWorlds.length}]`;
            logger.debug(logString);
            logString = `Weld mit ausreichend Verfindungen: Anzahl [${this.worldsWithEnoughConnections.length}]`;
            logger.debug(logString);
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
        const candidates = this.workingWorlds.filter(w => this.isWorldForNewConnectionOK(w));
        return candidates.length > 0 ? this.pickWorld(candidates) : null;
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
        const candidates = this.workingWorlds.filter(w => this.isEndWorldForNewConnectionOK(w, aStartWorld));
        return candidates.length > 0 ? this.pickWorld(candidates) : null;
    }

    generateOneConnection(): boolean {
        let created = false;
        let startWorld: World;
        let endWorld: World;
        startWorld = this.getStartWorldWithDiceAndWorldArray();
        if (startWorld !== null) {
            endWorld = this.getEndWorldWithDiceAndStartWorld(startWorld);
            if (endWorld !== null) {
                startWorld.port.worlds.push(endWorld);
                endWorld.port.worlds.push(startWorld);
                this.addWorldWithEnoughConnectionTest(startWorld);
                this.addWorldWithEnoughConnectionTest(endWorld);
                this.removeWorldFromWorkArrayWithMaxConnectionTest(startWorld);
                this.removeWorldFromWorkArrayWithMaxConnectionTest(endWorld);
                created = true;
            }
        }
        return created;
    }

    generateWorldConnection() {
        while (!this.isAllConnectionCreated() && !this.abort) {
            const created = this.generateOneConnection()
            if (this.workingWorlds.length < 2 || !created) {
                this.abort = true;
            }
        }
    }

    /**
     * Breitensuche über die Ports: Alle Welten, die von aStart erreichbar sind.
     */
    reachableWorlds(aStart: World): Set<World> {
        const result = new Set<World>();
        const queue: Array<World> = [aStart];
        result.add(aStart);
        while (queue.length > 0) {
            const world = queue.shift();
            if (world.port !== null) {
                for (const neighbour of world.port.worlds) {
                    if (!result.has(neighbour)) {
                        result.add(neighbour);
                        queue.push(neighbour);
                    }
                }
            }
        }
        return result;
    }

    isConnected(worldArray: Array<World>): boolean {
        if (worldArray.length === 0) {
            return true;
        }
        return this.reachableWorlds(worldArray[0]).size === worldArray.length;
    }

    /**
     * Teilt die Welten in zusammenhängende Teile.
     */
    connectedComponents(worldArray: Array<World>): Array<Array<World>> {
        const result: Array<Array<World>> = [];
        const seen = new Set<World>();
        for (const world of worldArray) {
            if (!seen.has(world)) {
                const component = Array.from(this.reachableWorlds(world));
                component.forEach(w => seen.add(w));
                result.push(component);
            }
        }
        return result;
    }

    private pickWorld(candidates: Array<World>): World {
        this.dice.setSites(candidates.length);
        return candidates[this.dice.roll() - 1];
    }

    /**
     * Verbindet getrennte Teile der Galaxie mit je einer Verbindung,
     * bis alle Welten erreichbar sind. Welten mit weniger Verbindungen werden bevorzugt.
     */
    connectComponents(worldArray: Array<World>) {
        let components = this.connectedComponents(worldArray);
        while (components.length > 1) {
            const first = components[0];
            const second = components[1];
            const preferred = (component: Array<World>) => {
                const free = component.filter(w => w.port.worlds.length < this.maxCount);
                return free.length > 0 ? free : component;
            };
            const startWorld = this.pickWorld(preferred(first));
            const endWorld = this.pickWorld(preferred(second));
            startWorld.port.worlds.push(endWorld);
            endWorld.port.worlds.push(startWorld);
            components = this.connectedComponents(worldArray);
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
        const candidates = this.workingWorlds.filter(w => this.isWorldForClearConnectionOK(w));
        return candidates.length > 0 ? this.pickWorld(candidates) : null;
    }

    /**
     * Entfernt eine zufällige Verbindung, aber nie eine, ohne die die Galaxie zerfiele.
     */
    clearOneConnection() {
        const world = this.getWorldforClearConnectionWithDiceAndWorldArray();
        if (world === null) {
            return;
        }
        const port = world.port;
        this.dice.setSites(port.worlds.length);
        const realIndex = this.dice.roll() - 1;
        const worldFromPort = port.worlds[realIndex];

        port.worlds.splice(realIndex, 1);
        const portFPFP = worldFromPort.port;
        const index = portFPFP.worlds.indexOf(world);
        if (index !== -1) {
            portFPFP.worlds.splice(index, 1);
        }

        if (this.reachableWorlds(world).size !== this.worldsCount) {
            port.worlds.splice(realIndex, 0, worldFromPort);
            portFPFP.worlds.push(world);
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
            port.setWorld(world);
        }
        this.generateWorldConnection()
        this.connectComponents(worldArray);
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
