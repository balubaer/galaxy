import { Fleet } from './fleet';
import { World } from './world';
import { FleetMovement } from './fleet-movement';

/** Charaktertypen des Classic Games; bisher ist nur der Emperor umgesetzt. */
export type CharacterType = 'emperor';

export class Player {
    playerName: string;
    points: number;
    //role: Role?
    ambushOff: boolean;
    teammates: Set<Player> = new Set();
    characterType: CharacterType = null;
    /** Classic Game: Spieler, deren Welten und Flotten nicht erobert/beschossen werden. */
    allies: Set<Player> = new Set();
    /** Classic Game: Spieler, die Metall von den Welten dieses Spielers laden dürfen. */
    loaders: Set<Player> = new Set();
    /** Classic Game: Geschenke dieser Runde (höchstens zwei). */
    giftsThisTurn = 0;

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

    //Test world.reportPlayers (beschossen, Welt oder Flotte verloren)
    if (result === false) {
        result = isPlayerInPlayersWithPlayer(player, world.reportPlayers);
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

function isPlayerInPlayersWithPlayer(aPlayer: Player, players: Array<Player>): boolean {
    let result = false;

    for (const player of players) {
        if (player.playerName === aPlayer.playerName) {
            result = true;
            break;
        }
    }
    return result;
}
