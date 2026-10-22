import { Player } from './player'
import { Fleet } from './fleet';
import { World } from './world';
import { FleetMovement } from './fleet-movement';
import { DistanceLevel } from './distance-level';
import {
    CommandError, FleetNotOnWorld_Error, FleetNotFound_Error, WorldNotFound_Error, FleetNotOwned_Error, WorldNotOwned_Error,
    NotSameWorld_Error, NotEnoughShips_Error, NoConnection_Error, FleetAlreadyActed_Error, FleetHasNoShips_Error,
    FireOnOwnFleet_Error, PlayerNotFound_Error, TooManyWorlds_Error, DShipsAlreadyFired_Error, FireOnOwnDShips_Error
} from './error';

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
    errors: Array<CommandError> = new Array();
    turnPhase: number;

    constructor(aString: string, aPlayer: Player, aTurnPhase: number) {
        this.string = aString;
        this.player = aPlayer;
        this.turnPhase = aTurnPhase;
    }

    /** Merkt den Fehler und liefert false, damit Prüfungen mit `return this.fail(...)` abbrechen können. */
    fail(error: CommandError): false {
        this.errors.push(error);
        return false;
    }

    isOwnedByCommandPlayer(owner: Player): boolean {
        return owner !== null && owner !== undefined && this.player !== null && this.player !== undefined
            && owner.playerName === this.player.playerName;
    }
}

//FnnnWmmm FnnnWmmmWooo FnnnWmmmWoooWrrr
export const enum MoveCommandEnum {
    FLEED,
    WORLD1,
    WORLD2,
    WORLD3
}

/** Höchstens drei Verbindungen pro Flug (FaaWbbWccWdd). */
export const MAX_MOVE_WORLDS = 3;

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

    isValid(): boolean {
        if (this.fleet === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fleet.player) === false) {
            return this.fail(FleetNotOwned_Error);
        }
        if (this.worlds.length === 0 || this.worlds.indexOf(null) !== -1) {
            return this.fail(WorldNotFound_Error);
        }
        if (this.worlds.length > MAX_MOVE_WORLDS) {
            return this.fail(TooManyWorlds_Error);
        }
        // Eine Flotte darf nur einmal fliegen (der erste Flugbefehl gilt) und nicht fliegen und feuern.
        if (this.fleet.fleetMovements.length > 0 || this.fleet.fired) {
            return this.fail(FleetAlreadyActed_Error);
        }
        if (this.fleet.ships === 0) {
            return this.fail(FleetHasNoShips_Error);
        }
        let fromWorld: World = this.homeWorld;
        for (const world of this.worlds) {
            if (fromWorld.hasConnectionToWorld(world) === false) {
                return this.fail(NoConnection_Error);
            }
            fromWorld = world;
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            let fromWorld = this.homeWorld;

            for (const toWorld of this.worlds) {
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

    isValid(): boolean {
        if (this.fleet === null || this.homeWorld === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.homeWorld.player) === false) {
            return this.fail(WorldNotOwned_Error);
        }
        // Welt, auf der die Flotte ist, muss die Welt sein, auf der gebaut wird.
        if (this.homeWorld.number !== this.worldNumber || this.homeWorld.fleets.indexOf(this.fleet) === -1) {
            return this.fail(FleetNotOnWorld_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.fleet.ships += this.shipsToBuild;
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

    // Schiffe an fremde oder leere Flotten zu geben ist erlaubt (Geschenk bzw. neutrale Flotte).
    isValid(): boolean {
        if (this.fromFleet === null || this.toFleet === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fromFleet.player) === false) {
            return this.fail(FleetNotOwned_Error);
        }
        if (this.fromHomeWorld !== this.toHomeWorld) {
            return this.fail(NotSameWorld_Error);
        }
        if (this.fromFleet.ships < this.shipsToTransfer) {
            return this.fail(NotEnoughShips_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.fromFleet.ships -= this.shipsToTransfer;
            this.toFleet.ships += this.shipsToTransfer;
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

    isValid(): boolean {
        if (this.fromFleet === null || this.fromHomeWorld === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fromFleet.player) === false) {
            return this.fail(FleetNotOwned_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fromHomeWorld.player) === false) {
            return this.fail(WorldNotOwned_Error);
        }
        if (this.fromFleet.ships < this.shipsToTransfer) {
            return this.fail(NotEnoughShips_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.fromFleet.ships -= this.shipsToTransfer;
            this.fromHomeWorld.dShips += this.shipsToTransfer;
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

    isValid(): boolean {
        if (this.fromHomeWorld === null) {
            return this.fail(WorldNotFound_Error);
        }
        if (this.toFleet === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fromHomeWorld.player) === false) {
            return this.fail(WorldNotOwned_Error);
        }
        if (this.fromHomeWorld !== this.toHomeWorld) {
            return this.fail(NotSameWorld_Error);
        }
        if (this.fromHomeWorld.dShips < this.shipsToTransfer) {
            return this.fail(NotEnoughShips_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.fromHomeWorld.dShips -= this.shipsToTransfer;
            this.toFleet.ships += this.shipsToTransfer;
        }
    }
}

export class BuildDShips extends Command implements ExecuteCommand {
    worlds: Array<World>;

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

    // Anzahl = Schritte bis zur nächsten Welt, die nicht dem Spieler gehört (ohne Obergrenze).
    calculateNumberOfShipsToBuild(world: World): number {
        let result = 0;
        let foundDistanceLevel = false;
        const disLevel = new DistanceLevel(world, 1);

        while (foundDistanceLevel !== true) {
            if (this.testPlayerInNextLevelWorlds(disLevel.nextLevelWorlds) === false) {
                foundDistanceLevel = true;
            } else {
                disLevel.goNextLevel();
                if (disLevel.stopCreateNewNextLevelWorlds === true) {
                    // Dem Spieler gehört der ganze erreichbare Teil der Galaxie.
                    foundDistanceLevel = true;
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

    isValid(): boolean {
        if (this.fromFleet === null || this.toFleet === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fromFleet.player) === false) {
            return this.fail(FleetNotOwned_Error);
        }
        if (this.fromHomeWorld !== this.toHomeWorld) {
            return this.fail(NotSameWorld_Error);
        }
        if (this.isOwnedByCommandPlayer(this.toFleet.player)) {
            return this.fail(FireOnOwnFleet_Error);
        }
        if (this.fromFleet.fired) {
            return this.fail(FleetAlreadyActed_Error);
        }
        if (this.fromFleet.ships === 0) {
            return this.fail(FleetHasNoShips_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.toFleet.hitedShots += this.fromFleet.ships
            this.fromFleet.fired = true;
            this.fromFleet.firesTo = this.toFleet.name();
            this.fromFleet.firesToCommand = `AF${this.toFleet.number}`
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

    isValid(): boolean {
        if (this.fromHomeWorld === null) {
            return this.fail(WorldNotFound_Error);
        }
        if (this.toFleet === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fromHomeWorld.player) === false) {
            return this.fail(WorldNotOwned_Error);
        }
        if (this.fromHomeWorld !== this.toHomeWorld) {
            return this.fail(NotSameWorld_Error);
        }
        if (this.isOwnedByCommandPlayer(this.toFleet.player)) {
            return this.fail(FireOnOwnFleet_Error);
        }
        if (this.fromHomeWorld.dShipsFired) {
            return this.fail(DShipsAlreadyFired_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.toFleet.hitedShots += this.fromHomeWorld.dShips;
            this.fromHomeWorld.dShipsFired = true;
            this.fromHomeWorld.dShipsFiredFleet = this.toFleet;
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

    isValid(): boolean {
        if (this.fromFleet === null || this.fromHomeWorld === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fromFleet.player) === false) {
            return this.fail(FleetNotOwned_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fromHomeWorld.player)) {
            return this.fail(FireOnOwnDShips_Error);
        }
        if (this.fromFleet.fired) {
            return this.fail(FleetAlreadyActed_Error);
        }
        if (this.fromFleet.ships === 0) {
            return this.fail(FleetHasNoShips_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.fromHomeWorld.hitedShotsDShips += this.fromFleet.ships;
            this.fromFleet.fired = true;
            this.fromFleet.firesTo = 'D-Schiffe';
            this.fromFleet.firesToCommand = 'AD';
        }
    }
}

//FaaS
export class StandByCommand extends Command implements ExecuteCommand {
    fleet: Fleet;

    constructor(aFleet: Fleet, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Combat);
        this.fleet = aFleet;
    }

    // Ohne Wirkung: Flotten ohne Flug- oder Feuerbefehl feuern ohnehin aus dem Hinterhalt.
    executeCommand() {
        if (this.fleet === null) {
            this.fail(FleetNotFound_Error);
        } else if (this.isOwnedByCommandPlayer(this.fleet.player) === false) {
            this.fail(FleetNotOwned_Error);
        } else {
            this.fleet.standBy = true;
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
        if (this.world === null) {
            this.fail(WorldNotFound_Error);
        } else if (this.isOwnedByCommandPlayer(this.world.player) === false) {
            this.fail(WorldNotOwned_Error);
        } else {
            this.world.ambushOff = true;
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
        // Gilt auch für die Flotten des Spielers auf fremden Welten.
        this.player.ambushOff = true;
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

/** Spieler zum Namen hinter "A=" bzw. "N=", ohne Beachtung der Groß-/Kleinschreibung. */
function playerForHandle(allPlayerDict: Map<string, Player>, command: string): Player | null {
    const handle = command.substring(2).toUpperCase();
    for (const playerName of allPlayerDict.keys()) {
        if (playerName.toUpperCase() === handle) {
            return allPlayerDict.get(playerName);
        }
    }
    return null;
}

//A=handel
export class AddTeammate extends Command implements ExecuteCommand {
    allPlayerDict: Map<string, Player>;

    constructor(aAllPlayerDict: Map<string, Player>, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Initial);
        this.allPlayerDict = aAllPlayerDict;
    }

    executeCommand() {
        const aPlayer = playerForHandle(this.allPlayerDict, this.string);
        if (aPlayer === null) {
            this.fail(PlayerNotFound_Error);
        } else if (aPlayer !== this.player) {
            this.player.teammates.add(aPlayer);
        }
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
        const aPlayer = playerForHandle(this.allPlayerDict, this.string);
        if (aPlayer === null) {
            this.fail(PlayerNotFound_Error);
        } else {
            this.player.teammates.delete(aPlayer);
        }
    }
}
