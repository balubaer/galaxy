import { Player } from './player'
import { Fleet } from './fleet';
import { World } from './world';
import { FleetMovement } from './fleet-movement';

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

export class Command {
    string: string;
    player: Player;
    //errors: Array<T>;
    turnPhase: number;

    constructor(aString: string, aPlayer: Player, aTurnPhase: number) {
        this.string = aString;
        this.player = aPlayer;
        this.turnPhase = aTurnPhase;
    }
}

//FnnnWmmm FnnnWmmmWooo FnnnWmmmWoooWrrr
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
