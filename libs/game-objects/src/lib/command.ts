import { Player } from './player'
import { Fleet } from './fleet';
import { World } from './world';
import { FleetMovement } from './fleet-movement';
import { DistanceLevel } from './distance-level';

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

export function compareCommand( a: Command, b: Command ) {
    if ( a.turnPhase < b.turnPhase ){
      return -1;
    }
    if ( a.turnPhase > b.turnPhase ){
      return 1;
    }
    return 0;
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

export class BuildDShips extends Command implements ExecuteCommand  {
    worlds: Array <World>;
    maxBuild = 4;
   
    constructor(aWorldArray: Array <World>, aPlayer: Player) {
        super('', aPlayer, TurnPhase.Building);
        this.worlds = aWorldArray;
    }
    
    testPlayerInNextLevelPlanets(nextLevelWorlds: Array <World>): boolean {
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
            if (this.testPlayerInNextLevelPlanets(disLevel.nextLevelWorlds) === false) {
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
