import { Player } from './player'
import { Fleet } from './fleet';
import { World } from './world';
import { FleetMovement } from './fleet-movement';
import { DistanceLevel } from './distance-level';
import { FleetNotOnWorld_Error } from './error';
import { isError } from 'util';

export interface ExecuteCommand {
    executeCommand(): void;
}

export const TurnPhase = {
    Initial: 1,
    Unloading: 2,
    Transfer: 3,
    Building: 4,
    Loading: 5,
    Combat: 6,
    Movement: 7,
    Final: 8
}

Object.freeze(TurnPhase);

export function compareCommand(a: Command, b: Command) {
    if (a.turnPhase < b.turnPhase) {
        return -1;
    }
    if (a.turnPhase > b.turnPhase) {
        return 1;
    }
    return 0;
}

export class Command {
    string: string;
    player: Player;
    errors: Array<any> = new Array();
    turnPhase: number;

    constructor(aString: string, aPlayer: Player, aTurnPhase: number) {
        this.string = aString;
        this.player = aPlayer;
        this.turnPhase = aTurnPhase;
    }
}

//FnnnWmmm FnnnWmmmWooo FnnnWmmmWoooWrrr
export const enum MoveCommandEnum {
    FLEED,
    WORLD1,
    WORLD2,
    WORLD3
}

export class MoveCommand extends Command implements ExecuteCommand {
    fleet: Fleet
    worlds: Array<World>;
    homeWorld: World;
    count = 0;

    constructor(aFleet: Fleet, aHomeWorld: World, aWorldArray: Array<World>, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Movement);
        this.fleet = aFleet;
        this.homeWorld = aHomeWorld;
        this.worlds = aWorldArray;
    }

    executeCommand() {
        if (this.player !== null && this.fleet.player !== null) {
            if (this.player.stringName() === this.fleet.player.stringName()) {
                let fromWorld: World = this.homeWorld;
                let toWorld: World;
                let isError = false
                for (const world of this.worlds) {
                    toWorld = world;
                    if (fromWorld.hasConnectionToWorld(toWorld)) {
                        fromWorld = world;;
                    } else {
                        //TODO: Fehler
                        isError = true;
                        break;
                    }

                    if (this.fleet.ships === 0) {
                        isError = true;
                    }

                    if (isError === false) {
                        if (this.fleet.fired) {
                            isError = true;
                        }
                    }
                }

                if (isError === false) {
                    fromWorld = this.homeWorld;

                    for (const toWorldFromWorlds of this.worlds) {
                        toWorld = toWorldFromWorlds;
                        const fleetMovement = new FleetMovement();
                        const fleetCopy = new Fleet();
                        fleetCopy.player = this.fleet.player;
                        fleetCopy.number = this.fleet.number;
                        fleetMovement.fleet = fleetCopy;
                        fleetMovement.toWorld = toWorld;
                        fleetMovement.fromWorld = fromWorld;

                        this.fleet.fleetMovements.push(fleetMovement);

                        fromWorld = toWorld;
                    }
                }
            } else {
                //TODO: Fehler Flotte ist nicht vom Spieler
            }
        }
    }
}

//WnnnBqqqFmmm
export const enum BuildFleetShipEnum {
    WORLD,
    SHIPTOBUILD,
    FLEED
}

export class BuildFleetShip extends Command implements ExecuteCommand {
    fleet: Fleet;
    homeWorld: World;
    worldNumber: number;
    shipsToBuild: number;

    constructor(aFleet: Fleet, aHomeWorld: World, aWorldNumber: number, aShipsToBuild: number, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Building);
        this.fleet = aFleet;
        this.homeWorld = aHomeWorld;
        this.worldNumber = aWorldNumber;
        this.shipsToBuild = aShipsToBuild;
    }

    executeCommand() {
        if (this.homeWorld.player.playerName === this.player.playerName) {
            let aIsError = false;

            if (this.homeWorld.number !== this.worldNumber) {
                //Fehler World wo die Flotte ist, ist nicht der gleiche auf dem gebaut werden muss
                aIsError = true
            }

            if (aIsError === false) {
                if (this.homeWorld.fleets.indexOf(this.fleet) === -1) {
                    this.errors.push(FleetNotOnWorld_Error);
                    aIsError = true
                }
            }

            /* if (isError === false) {
                 if (this.homeWorld.metal < this.shipsToBuild) {
                     //TODO: Fehler zuwenig Metalle
                 }
             }*/

            //TODO: Weiter Tests implementieren

            if (aIsError === false) {
                this.fleet.ships += this.shipsToBuild;
                // this.homeWorld.metal -= this.shipsToBuild
            }
        } else {
            //TODO: Fehler Welt ist nicht vom Spieler
        }
    }
}

//FnnnTqqqFmmm
export const enum TransferShipsFleetToFleetEnum {
    FLEED1,
    SHIPTRANSVER,
    FLEED2
}

export class TransferShipsFleetToFleet extends Command implements ExecuteCommand {
    fromFleet: Fleet;
    toFleet: Fleet;
    fromHomeWorld: World;
    toHomeWorld: World;
    shipsToTransfer: number;

    constructor(aFromFleet: Fleet, aToFleet: Fleet, aFromHomeWorld: World, aToHomeWorld: World, aShipsToTransfer: number, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Transfer);
        this.fromFleet = aFromFleet;
        this.toFleet = aToFleet;
        this.fromHomeWorld = aFromHomeWorld;
        this.toHomeWorld = aToHomeWorld;
        this.shipsToTransfer = aShipsToTransfer;

    }

    executeCommand() {
        if (this.player.playerName === this.fromFleet.player.playerName) {
            let isError = false;

            if (isError === false) {
                if (this.fromHomeWorld !== this.toHomeWorld) {
                    //TODO: Fehler art zufügen
                    isError = true;
                }
                if (isError === false) {
                    if (this.fromFleet.ships < this.shipsToTransfer) {
                        //TODO: Fehler art zufügen
                        isError = true
                    }
                }
                //TODO: Check Owner Man kann einer Neutralen Flotte keine Schiffe Transverieren
            }

            //TODO: Weiter Tests implementieren

            if (isError === false) {
                this.fromFleet.ships -= this.shipsToTransfer;
                this.toFleet.ships += this.shipsToTransfer;
            }
        } else {
            //TODO: Fehler Flotte ist nicht vom Spieler

        }
    }
}
//FaaU
export class UnloadAllMetal extends Command implements ExecuteCommand {
    fromFleet: Fleet;
    toHomeWorld: World;

    constructor(aFromFleet: Fleet, aToHomeWorld: World, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Transfer);
        this.fromFleet = aFromFleet;
        this.toHomeWorld = aToHomeWorld;
    }

    executeCommand() {
        let isError = false;

        if (this.player.playerName === this.fromFleet.player.playerName) {
            if (this.toHomeWorld.fleets.indexOf(this.fromFleet) === -1) {
                isError = true;
            }
            if (isError === false) {
            this.toHomeWorld.metal += this.fromFleet.metal;
            this.fromFleet.metal = 0;
            }
        } else {
            isError = true;
            //TODO: Fehler Flotte ist nicht vom Spieler
        }
    }
}
//FaaJ
export class JettisonAllMetal extends Command implements ExecuteCommand {
    fromFleet: Fleet;

    constructor(aFromFleet: Fleet, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Transfer);
        this.fromFleet = aFromFleet;
    }

    executeCommand() {
        if (this.player.playerName === this.fromFleet.player.playerName) {
            this.fromFleet.metal = 0;
    
        } else {
            //TODO: Fehler Flotte ist nicht vom Spieler

        }
    }
}
//FaaL
export class LoadAllMetal extends Command implements ExecuteCommand {
    toFleet: Fleet;
    fromHomeWorld: World;
    freeStorage : number;

    constructor(aToFleet: Fleet, aFromHomeWorld: World, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Transfer);
        this.toFleet = aToFleet;
        this.fromHomeWorld = aFromHomeWorld;
        this.freeStorage = this.toFleet.ships - this.toFleet.metal;
    }

    executeCommand() {
        let isError = false
        if (this.player.playerName === this.toFleet.player.playerName) {
            if (this.fromHomeWorld.fleets.indexOf(this.toFleet) === -1) {
                isError = true;
            }
            if (this.freeStorage > this.fromHomeWorld.metal) {
                this.freeStorage = this.fromHomeWorld.metal;
            }
            if (isError === false) {
                this.toFleet.metal += this.freeStorage;
                this.fromHomeWorld.metal -= this.freeStorage;
            }
        
        } else {
            //TODO: Fehler Flotte ist nicht vom Spieler
        }
    }
}
//FaaUxx
export const enum UnloadMetalEnum {
    FlEED,
    UNLOADMETAL,
}

export class UnloadMetal extends Command implements ExecuteCommand {
    fromFleet: Fleet;
    toHomeWorld: World;
    metalToUnload: number;

    constructor(aFromFleet: Fleet, aToHomeWorld: World, aMetalToUnload: number, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Transfer);
        this.fromFleet = aFromFleet;
        this.toHomeWorld = aToHomeWorld;
        this.metalToUnload = aMetalToUnload;
    }

    executeCommand() {
        if (this.player.playerName === this.fromFleet.player.playerName) {
            let isError = false;
            if (this.toHomeWorld.fleets.indexOf(this.fromFleet) === -1) {
                isError = true;
            }
            if (this.fromFleet.metal < this.metalToUnload) {
                this.metalToUnload = this.fromFleet.metal;
            }
            if (isError === false) {
                this.fromFleet.metal -= this.metalToUnload;
                this.toHomeWorld.metal += this.metalToUnload;
            }

        }
    }

}
//FaaJxx
export const enum JettisonMetalEnum {
    FlEED,
    JETTISONMETAL,
}

export class JettisonMetal extends Command implements ExecuteCommand {
    fromFleet: Fleet;
    metalToJettison: number;

    constructor(aFromFleet: Fleet, aMetalToJettison: number, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Transfer);
        this.fromFleet = aFromFleet;
        this.metalToJettison = aMetalToJettison;
    }

    executeCommand() {
        if (this.player.playerName === this.fromFleet.player.playerName) {
            const isError = false;
            if (this.fromFleet.metal < this.metalToJettison) {
                this.metalToJettison = this.fromFleet.metal;
            }
            if (isError === false) {
                this.fromFleet.metal -= this.metalToJettison;
            }

        }
    }

}
//FaaLxx
export const enum LoadMetalEnum {
    FlEED,
    LOADMETAL,
}

export class LoadMetal extends Command implements ExecuteCommand {
    toFleet: Fleet;
    fromHomeWorld: World;
    metalToLoad: number;
    freeStorage: number;

    constructor(aToFleet: Fleet, aFromHomeWorld: World, aMetalToLoad: number, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Transfer);
        this.toFleet = aToFleet;
        this.fromHomeWorld = aFromHomeWorld;
        this.metalToLoad = aMetalToLoad;
        this.freeStorage = this.toFleet.ships - this.toFleet.metal;
    }

    executeCommand() {
        if (this.player.playerName === this.toFleet.player.playerName) {
            let isError = false;
            if (this.fromHomeWorld.fleets.indexOf(this.toFleet) === -1) {
                isError = true;
            }
            if (this.fromHomeWorld.metal < this.metalToLoad) {
                this.metalToLoad = this.fromHomeWorld.metal;
            }
            if (this.freeStorage < this.metalToLoad) {
                this.metalToLoad = this.freeStorage;
            }
            if (isError === false) {
                this.fromHomeWorld.metal -= this.metalToLoad;
                this.toFleet.metal += this.metalToLoad;
            }

        }
    }

}
//FaaTxxD
export const enum TransferShipsFleetToDShipsEnum {
    FLEED,
    SHIPTRANSVER
}

export class TransferShipsFleetToDShips extends Command implements ExecuteCommand {
    fromFleet: Fleet;
    fromHomeWorld: World;
    shipsToTransfer: number;

    constructor(aFromFleet: Fleet, aFromHomeWorld: World, aShipsToTransfer: number, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Transfer);
        this.fromFleet = aFromFleet;
        this.fromHomeWorld = aFromHomeWorld;
        this.shipsToTransfer = aShipsToTransfer;
    }

    executeCommand() {
        if (this.player.playerName === this.fromFleet.player.playerName) {
            let isError = false;

            if (isError === false) {
                if (this.fromFleet.ships < this.shipsToTransfer) {
                    //TODO: Fehler art zufügen
                    isError = true;
                }
            }

            //TODO: Weiter Tests implementieren

            if (isError === false) {
                this.fromFleet.ships -= this.shipsToTransfer;
                this.fromHomeWorld.dShips += this.shipsToTransfer;
            }
        } else {
            //TODO: Fehler Flotte ist nicht vom Spieler
        }
    }
}

//DaaTxxFbb
export const enum TransferDShipsToFleetEnum {
    WORLD,
    SHIPTRANSVER,
    FLEED
}

export class TransferDShipsToFleet extends Command implements ExecuteCommand {
    toFleet: Fleet;
    fromHomeWorld: World;
    toHomeWorld: World;
    shipsToTransfer: number;

    constructor(aToFleet: Fleet, aFromHomeWorld: World, aToHomeWorld: World, aShipsToTransfer: number, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Transfer);
        this.toFleet = aToFleet;
        this.fromHomeWorld = aFromHomeWorld;
        this.toHomeWorld = aToHomeWorld;
        this.shipsToTransfer = aShipsToTransfer;
    }

    executeCommand() {
        if (this.fromHomeWorld.player.playerName === this.player.playerName) {
            let isError = false;

            if (isError === false) {
                if (this.fromHomeWorld !== this.toHomeWorld) {
                    //TODO: Fehler art zufügen
                    isError = true;
                }
                if (isError === false) {
                    if (this.fromHomeWorld.dShips < this.shipsToTransfer) {
                        //TODO: Fehler art zufügen
                        isError = true;
                    }
                }
                //TODO: Check Owner Man kann einer Neutralen Flotte keine Schiffe Transverieren
            }

            //TODO: Weiter Tests implementieren

            if (isError === false) {
                this.fromHomeWorld.dShips -= this.shipsToTransfer;
                this.toFleet.ships += this.shipsToTransfer;
            }
        } else {
            //TODO: Fehler Welt ist nicht vom Spieler
        }
    }
}

export class BuildDShips extends Command implements ExecuteCommand {
    worlds: Array<World>;
    maxBuild = 4;

    constructor(aWorldArray: Array<World>, aPlayer: Player) {
        super('', aPlayer, TurnPhase.Building);
        this.worlds = aWorldArray;
    }

    testPlayerInNextLevelWorlds(nextLevelWorlds: Array<World>): boolean {
        let result = true;

        if (nextLevelWorlds.length > 0) {
            for (const world of nextLevelWorlds) {
                if (world.player !== null) {
                    if (this.player !== world.player) {
                        result = false;
                        break;
                    }
                } else {
                    result = false;
                    break;
                }
            }
        } else {
            result = false;
        }
        return result;
    }

    calculateNumberOfShipsToBuild(world: World): number {
        let result = 0;
        let foundDistanceLevel = false;
        const disLevel = new DistanceLevel(world, 1);

        while (foundDistanceLevel !== true) {
            if (this.testPlayerInNextLevelWorlds(disLevel.nextLevelWorlds) === false) {
                foundDistanceLevel = true;
            } else {
                if (this.maxBuild <= disLevel.distanceLevel) {
                    foundDistanceLevel = true;
                } else {
                    disLevel.goNextLevel();
                }
            }
        }

        result = disLevel.distanceLevel;

        if (result < 1) {
            result = 1;
        }
        return result
    }

    executeCommand() {
        for (const world of this.worlds) {
            if (world.player === this.player) {
                const shipsToBuild = this.calculateNumberOfShipsToBuild(world);
                world.dShips += shipsToBuild;
            }
        }
    }
}

//FaaAFbb
export const enum FireFleetToFleetEnum {
    FLEEDFROM,
    FLEEDTO
}

export class FireFleetToFleet extends Command implements ExecuteCommand {
    fromFleet: Fleet;
    toFleet: Fleet;
    fromHomeWorld: World;
    toHomeWorld: World;

    constructor(aFromFleet: Fleet, aToFleet: Fleet, aFromHomeWorld: World, aToHomeWorld: World, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Combat);
        this.fromFleet = aFromFleet;
        this.toFleet = aToFleet;
        this.fromHomeWorld = aFromHomeWorld;
        this.toHomeWorld = aToHomeWorld;

    }

    executeCommand() {
        if (this.player.playerName === this.fromFleet.player.playerName) {
            let isError = false;

            if (isError === false) {
                if (this.fromHomeWorld !== this.toHomeWorld) {
                    //TODO: Fehler art zufügen
                    isError = true;
                }
            }

            //TODO: Weiter Tests implementieren

            if (isError === false) {
                this.toFleet.hitedShots += this.fromFleet.ships
                this.fromFleet.fired = true;
                this.fromFleet.firesTo = this.toFleet.name();
                this.fromFleet.firesToCommand = `AF${this.toFleet.number}`
            }
        } else {
            //TODO: Fehler Flotte ist nicht vom Spieler
        }
    }
}

//DaaAFbb
export const enum FireDShipsToFleetEnum {
    WORLD,
    FLEED
}

export class FireDShipsToFleet extends Command implements ExecuteCommand {
    toFleet: Fleet;
    fromHomeWorld: World;
    toHomeWorld: World;

    constructor(aToFleet: Fleet, aFromHomeWorld: World, aToHomeWorld: World, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Combat);
        this.toFleet = aToFleet
        this.fromHomeWorld = aFromHomeWorld
        this.toHomeWorld = aToHomeWorld
    }

    executeCommand() {
        if (this.fromHomeWorld.player.playerName === this.player.playerName) {
            let isError = false;

            if (isError === false) {
                if (this.fromHomeWorld !== this.toHomeWorld) {
                    //TODO: Fehler art zufügen
                    isError = true;
                }
            }

            //TODO: Weiter Tests implementieren

            if (isError === false) {
                this.toFleet.hitedShots += this.fromHomeWorld.dShips;
                this.fromHomeWorld.dShipsFired = true;
                this.fromHomeWorld.dShipsFiredFleet = this.toFleet;
            }
        } else {
            //TODO: Fehler Welt ist nicht vom Spieler
        }
    }
}

//FaaAD
export const enum FireFleetToDShipsEnum {
    FLEED
}

export class FireFleetToDShips extends Command implements ExecuteCommand {
    fromFleet: Fleet;
    fromHomeWorld: World;

    constructor(aFromFleet: Fleet, aFromHomeWorld: World, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Combat);
        this.fromFleet = aFromFleet;
        this.fromHomeWorld = aFromHomeWorld;
    }

    executeCommand() {
        if (this.player.playerName === this.fromFleet.player.playerName) {
            const isError = false;

            //TODO: Weiter Tests implementieren

            if (isError === false) {
                this.fromHomeWorld.hitedShotsDShips += this.fromFleet.ships;
                this.fromFleet.fired = true;
                this.fromFleet.firesTo = 'D-Schiffe';
                this.fromFleet.firesToCommand = 'AD';

            }
        } else {
            //TODO: Fehler Flotte ist nicht vom Spieler
        }
    }
}

//Znn
export const enum AmbushOffForWorldEnum {
    WORLD
}

export class AmbushOffForWorld extends Command implements ExecuteCommand {
    world: World;

    constructor(aWorld: World, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Initial);
        this.world = aWorld;
    }

    executeCommand() {
        if (this.world.player.playerName === this.player.playerName) {
            const worldPlayer = this.world.player;

            if (worldPlayer !== null) {
                if (worldPlayer === this.player) {
                    this.world.ambushOff = true;
                } else {
                    //TODO: Fehler
                }
            }
        } else {
            //TODO: Fehler Welt ist nicht vom Spieler
        }
    }
}

//Z
export class AmbushOffForPlayer extends Command implements ExecuteCommand {
    worlds: Array<World>;

    constructor(aWorldsArray: Array<World>, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Initial);
        this.worlds = aWorldsArray;
    }

    executeCommand() {
        for (const world of this.worlds) {
            const worldPlayer = world.player;
            if (worldPlayer !== null) {
                if (worldPlayer === this.player) {
                    world.ambushOff = true;
                }
            }
        }
    }
}

//A=handel
export class AddTeammate extends Command implements ExecuteCommand {
    allPlayerDict: Map<string, Player>;

    constructor(aAllPlayerDict: Map<string, Player>, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Initial);
        this.allPlayerDict = aAllPlayerDict;
    }

    executeCommand() {
        const keyString = this.string.substring(2);
        const aPlayer = this.allPlayerDict.get(keyString);
        this.player.teammates.add(aPlayer);
    }
}

//N=handel
export class RemoveTeammate extends Command implements ExecuteCommand {
    allPlayerDict: Map<string, Player>;

    constructor(aAllPlayerDict: Map<string, Player>, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Initial);
        this.allPlayerDict = aAllPlayerDict
    }

    executeCommand() {
        const keyString = this.string.substring(2);
        const aPlayer = this.allPlayerDict.get(keyString);
        this.player.teammates.delete(aPlayer);
    }
}
