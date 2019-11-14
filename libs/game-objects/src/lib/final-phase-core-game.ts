import { Player, isPlayOnWorldWithPlayer } from './player'
import { World, worldWithNumber } from './world';
import { Fleet } from './fleet';

export class FinalPhaseCoreGame {
    worlds: Array<World>;
    allPlayerDict: Map<string, Player>;

    constructor(aworldArray: Array<World>, aAllPlayerDict: Map<string, Player>) {
        this.worlds = aworldArray;
        this.allPlayerDict = aAllPlayerDict;
    }

    isSomeBodyOnworld(world: World): boolean {
        let result = false;

        for (const playerName of this.allPlayerDict.keys()) {
            const player: Player = this.allPlayerDict.get(playerName);
            if (isPlayOnWorldWithPlayer(player, world)) {

                result = true;
                break;
            }
        }
        return result;
    }

    checkFireResults(world: World) {
        //DShips
        world.dShips -= world.hitedShotsDShips / 2
        if (world.dShips < 0) {
            world.dShips = 0;
        }
        world.hitedShotsDShips = 0;
        //Fleets
        for (const fleet of world.fleets) {
            if (fleet.fleetMovements.length > 0) {
                fleet.ships -= fleet.hitedShots / 4;
            } else {
                fleet.ships -= fleet.hitedShots / 2;
            }
            fleet.hitedShots = 0;
            if (fleet.ships < 0) {
                fleet.ships = 0;
            }
        }
    }

    isAmbushFromMovementCount(movementCount: number, movementHoleCount: number): boolean {
        let result = false;

        switch (movementHoleCount) {
            case 2:
                switch (movementCount) {
                    case 1:
                        result = true;
                        break;
                    default:
                        result = false;
                        break;
                }
                break;
            case 3:
                switch (movementCount) {
                    case 1:
                    case 2:
                        result = true;
                        break;
                    default:
                        result = false
                        break;
                }
                break;
            default:
                result = false;
        }

        return result;
    }

    isAmbushworld(world: World, passingFleet: Fleet, movementCount: number): boolean {
        let result = false
        if (world.ambushOff === false) {
            if (this.isAmbushFromMovementCount(movementCount, passingFleet.fleetMovements.length)) {
                if (world !== null) {
                    const worldPlayer = world.player;
                    const fleetPlayer = passingFleet.player;

                    if ((worldPlayer != null) && (fleetPlayer != null)) {
                        if ((worldPlayer.playerName === fleetPlayer.playerName) === false) {
                            if (worldPlayer.teammates.has(fleetPlayer) === false) {
                                result = true;
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    isAmbushFleet(ambushFleet: Fleet, passingFleet: Fleet, movementCount: number): boolean {
        let result = false;
        if (this.isAmbushFromMovementCount(movementCount, passingFleet.fleetMovements.length)) {
            if ((ambushFleet.number === passingFleet.number) === false) {
                if (ambushFleet.fired === false) {
                    if (ambushFleet.moved === false) {
                        const ambushPlayer = ambushFleet.player;
                        const passingFleetPlayer = passingFleet.player;
                        if ((ambushPlayer !== null) && (passingFleetPlayer !== null)) {
                            if ((ambushPlayer.playerName === passingFleetPlayer.playerName) === false) {
                                if (ambushPlayer.teammates.has(passingFleetPlayer) === false) {
                                    result = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    getFirePowerForAmbushworld(world: World): number {
        let firePower = 0;

        if (world !== null) {
            if (world.dShipsFired === false) {
                firePower += world.dShips;
                world.dShipsAmbush = true;
            }
        }
        return firePower;
    }

    //TODO: niklas  getFirePowerFor
    checkFleetMovement(world: World) {
        for (const fleet of world.fleets) {
            const fleetMovementCount = fleet.fleetMovements.length;

            if (fleetMovementCount > 0) {
                if (fleet.ships > 0) {
                    let movementCount = 1;
                    for (const fleetMovement of fleet.fleetMovements) {
                        if (fleetMovement.isMovementDone === false) {
                            const fromworld = fleetMovement.fromWorld;
                            const toworld = fleetMovement.toWorld;
                            if ((fromworld !== null) && (toworld !== null)) {
                                const index = fromworld.fleets.indexOf(fleet);
                                fromworld.fleets.splice(index, 1);
                                fromworld.fleetMovements.push(fleetMovement);
                                toworld.fleets.push(fleet)
                                fleetMovement.isMovementDone = true;

                                if (this.isAmbushworld(toworld, fleet, movementCount)) {
                                    const firePower = this.getFirePowerForAmbushworld(toworld);
                                    fleet.ships -= firePower
                                    if (fleet.ships < 0) {
                                        fleet.ships = 0;
                                    }
                                    toworld.addHitAmbushFleets(fleet);
                                }
                                for (const fleetFromworld of toworld.fleets) {
                                    if (this.isAmbushFleet(fleetFromworld, fleet, movementCount)) {
                                        fleet.ships -= fleetFromworld.ships;
                                        if (fleet.ships < 0) {
                                            fleet.ships = 0;
                                        }
                                        fleetFromworld.addHitAmbushFleets(fleet);
                                        fleetFromworld.ambush = true;
                                    }
                                }

                                if (fleet.ships === 0) {
                                    break;
                                }
                            }
                        }
                        movementCount++;
                    }
                }
            }
        }
    }

    getPlayersFromFleets(fleets: Array<Fleet>): Array<Player> {
        const players: Array<Player> = new Array();

        for (const fleet of fleets) {
            if (fleet.ships > 0) {
                const player = fleet.player;

                if (player !== null) {
                    if (players.indexOf(player) === -1) {
                        players.push(player)
                    }
                }
            }
        }
        return players
    }

    checkOwnership(world: World) {
        const players = this.getPlayersFromFleets(world.fleets)

        //world
        if (world.player === null) {
            if (players.length === 1) {
                world.player = players[0];
            }
        } else {
            if (world.dShips === 0) {
                const player = world.player;
                if (players.length === 1) {
                    if (player.playerName !== players[0].playerName) {
                        world.player = players[0]
                    }
                }
            }
        }
        //fleets
        if (players.length === 1) {
            for (const fleet of world.fleets) {
                fleet.player = players[0];
            }
        } else {
            for (const fleet of world.fleets) {
                if (fleet.ships === 0) {
                    fleet.player = null;
                }
            }
        }
    }

    calculatePoints(world: World) {
        if (world.player !== null) {
            world.player.points += 20
        }
    }

    doFinal() {
        for (const world of this.worlds) {
            if (this.isSomeBodyOnworld(world)) {
                this.checkFireResults(world);
                this.checkFleetMovement(world);
            }
        }
        for (const world of this.worlds) {
            if (this.isSomeBodyOnworld(world)) {
                this.checkOwnership(world)
                this.calculatePoints(world)
            }
        }
    }

}
