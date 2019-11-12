import { Fleet } from './fleet';
import { World } from './world';
import { FleetMovement } from './fleet-movement';

export class Player {
    playerName: string;
    points: number;
    //role: Role?
    ambushOff: boolean;
    teammates: Set<Player> = new Set();

    constructor(name: string) {
        this.playerName = name;
    }

    teanmatesNames(): Array <string> {
        const result = new Array<string>()
        for (const teammatePlayer of this.teammates) {
            result.push(teammatePlayer.playerName);
        }
        return result;
    }

    stringName(): string {
        return `[${this.playerName}]`;
    }
}

function isPlayerInFleetMovementWithPlayer(player: Player, fleetMovements: Array<FleetMovement>): boolean {
    let result = false
    for (const fleetMovement of fleetMovements) {
        if (fleetMovement.fleet !== null) {
            if (fleetMovement.fleet.player !== null) {
                const movementPlayer = fleetMovement.fleet.player;
                if (movementPlayer.playerName === player.playerName) {
                    result = true;
                    break;
                }
            }
        }
    }
    return result;
}

export function isWorldOwnedByPlayer(player: Player, world: World): boolean {
    let result = false;

    if (world.player !== null) {
        if (world.player.playerName === player.playerName) {
            result = true;
        }
    }
    return result;
}


export function isFleetOwnedByPlayer(player: Player, fleet: Fleet): boolean {
    let result = false;
    if (fleet.player != null) {
        if (fleet.player.playerName === player.playerName) {
            result = true;
        }
    }
    return result;
}

function isPlayerInFleetsWithPlayer(player: Player, fleets: Array<Fleet>): boolean {
    let result = false;
    for (const fleet of fleets) {
        result = isFleetOwnedByPlayer(player, fleet);
        if (result) {
            break;
        }
    }
    return result;
}

export function isWorldOutPutForPlayer(player: Player, world: World): boolean {
    //Test World
    let result = isWorldOwnedByPlayer(player, world);

    //Test Fleets
    if (result === false) {
        result = isPlayerInFleetsWithPlayer(player, world.fleets);
    }

    //Test FleetMovement
    if (result === false) {
        result = isPlayerInFleetMovementWithPlayer(player, world.fleetMovements);
    }

    //Test world.hitAmbuschPlayers
    if (result === false) {
        result = isPlayerInWorldHitAmbushFleetWithPlayer(player, world.hitAmbuschFleets);
    }
    return result;
}

export function isPlayOnWorldWithPlayer(player: Player, world: World): boolean {
    //Test World
    let result = isWorldOwnedByPlayer(player, world)

    //Test Fleets
    if (result === false) {
        result = isPlayerInFleetsWithPlayer(player, world.fleets);
    }

    return result;
}

function isPlayerInWorldHitAmbushFleetWithPlayer(aPlayer: Player, hitAmbuschFleets: Array<Fleet>): boolean {
    let result = false;

    for (const fleet of hitAmbuschFleets) {
        const player = fleet.player;
        if (player !== null) {
            if (player.playerName === aPlayer.playerName) {
                result = true;
                break;
            }
        }
    }
    return result;
}