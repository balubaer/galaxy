import { World } from './world';
import { Port } from './port';

export class DistanceLevel {
    startWorld: World;
    distanceLevel: number;
    passedWorlds: Array <World> = new Array<World>();
    nextLevelWorlds: Array <World> = new Array<World>();
    stopCreateNewNextLevelWorlds = false;
    
    constructor(aStartWorld: World, aDistanceLevel: number) {
        if (aDistanceLevel < 1) {
            this.distanceLevel = 1;
        } else {
            this.distanceLevel = aDistanceLevel;
        }
        this.startWorld = aStartWorld
        for (let levelCount = 1; levelCount <= this.distanceLevel; levelCount++) {
            if (levelCount === 1) {
                this.passedWorlds.push(this.startWorld);
                const worlds = this.startWorld.port.worlds;
                if (worlds !== null) {
                    for (const world of worlds) {
                        this.nextLevelWorlds.push(world);
                    }
                }
            } else {
                this.createNewNextLevelWorlds()
                if (this.stopCreateNewNextLevelWorlds === true) {
                    this.distanceLevel = levelCount - 1
                    break
                }
            }
        }
    }
    
    createNewNextLevelWorlds() {
        const oldNextLevelWorlds = Object.assign([], this.nextLevelWorlds);
        const newPassedWorlds = this.passedWorlds;
        
        for (const world of this.nextLevelWorlds) {
            if (newPassedWorlds.indexOf(world) === -1) {
                newPassedWorlds.push(world)
            }
        }
        this.nextLevelWorlds =[];
        
        for (const world of oldNextLevelWorlds) {
            const port: Port = world.port;
            
            if (port !== null) {
                const worldsFromPort = port.worlds;
                
                for (const worldFromPort of worldsFromPort) {
                    if (newPassedWorlds.indexOf(worldFromPort) === -1) {
                        if (this.nextLevelWorlds.indexOf(worldFromPort) === -1) {
                            newPassedWorlds.push(worldFromPort);
                        }
                    }
                }
            }
        }
        if (this.nextLevelWorlds.length === 0) {
            this.stopCreateNewNextLevelWorlds = true;
            this.nextLevelWorlds = oldNextLevelWorlds;
        } else {
            this.passedWorlds = newPassedWorlds
        }
    }

    goNextLevel() {
        this.distanceLevel++;
        this.createNewNextLevelWorlds()
    }
}
