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
        // Mindestens zwei Schuss mehr als nötig, um alle D-Schiffe zu zerstören: Welt wird neutral.
        if (world.hitedShotsDShips > 0 && world.hitedShotsDShips >= world.dShips * 2 + 2) {
            if (world.player !== null) {
                world.addReportPlayer(world.player);
                world.addEvent(`Welt neutralisiert, vorher ${world.player.stringName()}`);
            }
            world.player = null;
        }
        world.dShips -= world.hitedShotsDShips / 2;
        world.dShips = Math.floor(world.dShips);
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
            fleet.ships = Math.floor(fleet.ships);
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
                            if (this.isSpared(worldPlayer, fleetPlayer) === false) {
                                result = true;
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    /** Teammates werden nicht aus dem Hinterhalt beschossen. */
    isSpared(ambushPlayer: Player, passingPlayer: Player): boolean {
        return ambushPlayer.teammates.has(passingPlayer);
    }

    isAmbushOffForFleet(world: World, ambushPlayer: Player): boolean {
        if (ambushPlayer.ambushOff === true) {
            return true;
        }
        return world.ambushOff === true && world.player !== null && world.player.playerName === ambushPlayer.playerName;
    }

    // Nur Flotten ohne Flug- oder Feuerbefehl schießen aus dem Hinterhalt; die Welt muss dafür nicht dem Spieler gehören.
    isAmbushFleet(world: World, ambushFleet: Fleet, passingFleet: Fleet, movementCount: number): boolean {
        let result = false;
        if (this.isAmbushFromMovementCount(movementCount, passingFleet.fleetMovements.length)) {
            if ((ambushFleet.number === passingFleet.number) === false) {
                if (ambushFleet.fired === false && ambushFleet.conditionalFire === false
                    && ambushFleet.fleetMovements.length === 0 && ambushFleet.ships > 0) {
                    const ambushPlayer = ambushFleet.player;
                    const passingFleetPlayer = passingFleet.player;

                    if ((ambushPlayer !== null) && (passingFleetPlayer !== null)) {
                        if ((ambushPlayer.playerName === passingFleetPlayer.playerName) === false) {
                            if (this.isSpared(ambushPlayer, passingFleetPlayer) === false) {
                                result = this.isAmbushOffForFleet(world, ambushPlayer) === false;
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    /** Hinterhalt: jeder feuernde Schütze zerstört ein Schiff. */
    applyAmbushDamage(fleet: Fleet, shooters: number) {
        fleet.ships -= shooters;
        if (fleet.ships < 0) {
            fleet.ships = 0;
        }
    }

    /** Nach jedem Flugschritt; true beendet den Flug der Flotte (im Core Game nie). */
    afterFleetArrived(fleet: Fleet, world: World): boolean {
        return false;
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
        const fleetArray = new Array();
        for (const fleet of world.fleets) {
            fleetArray.push(fleet);
        }
        for (const fleet of fleetArray) {
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
                                if (index < 0) {
                                    // Flotte ist nicht (mehr) auf der Startwelt, nichts verschieben.
                                    movementCount++;
                                    continue;
                                }
                                fromworld.fleets.splice(index, 1);
                                fromworld.fleetMovements.push(fleetMovement);
                                toworld.fleets.push(fleet)
                                fleetMovement.isMovementDone = true;

                                if (this.afterFleetArrived(fleet, toworld)) {
                                    break;
                                }

                                if (this.isAmbushworld(toworld, fleet, movementCount)) {
                                    const firePower = this.getFirePowerForAmbushworld(toworld);
                                    this.applyAmbushDamage(fleet, firePower);
                                    toworld.addHitAmbushFleets(fleet);
                                }
                                for (const fleetFromworld of toworld.fleets) {
                                    if (this.isAmbushFleet(toworld, fleetFromworld, fleet, movementCount)) {
                                        this.applyAmbushDamage(fleet, fleetFromworld.ships);
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
                world.addEvent(`Welt erobert von ${world.player.stringName()}`);
            }
        } else {
            if (world.dShips + world.iShips + world.pShips === 0) {
                const player = world.player;
                if (players.length === 1) {
                    if (player.playerName !== players[0].playerName) {
                        world.player = players[0]
                        world.addReportPlayer(player);
                        world.addEvent(`Welt erobert von ${world.player.stringName()}, vorher ${player.stringName()}`);
                    }
                }
            }
        }
        //fleets
        if (players.length === 1) {
            for (const fleet of world.fleets) {
                this.changeFleetOwner(world, fleet, players[0]);
            }
        } else {
            for (const fleet of world.fleets) {
                if (fleet.ships === 0) {
                    this.changeFleetOwner(world, fleet, null);
                }
            }
        }
    }

    changeFleetOwner(world: World, fleet: Fleet, player: Player) {
        const oldPlayer = fleet.player;
        if (oldPlayer === player) {
            return;
        }
        fleet.player = player;
        world.addReportPlayer(oldPlayer);
        if (player === null) {
            world.addEvent(`F${fleet.number} ist herrenlos, vorher ${oldPlayer.stringName()}`);
        } else if (oldPlayer === null) {
            world.addEvent(`F${fleet.number} übernommen von ${player.stringName()}`);
        } else {
            world.addEvent(`F${fleet.number} übernommen von ${player.stringName()}, vorher ${oldPlayer.stringName()}`);
        }
    }

    calculatePoints(world: World) {
        if (world.player !== null) {
            world.player.points += 20
        }
    }

    doFinal() {
        // Erst alle Kampfergebnisse, damit zerstörte Schiffe auf keiner Welt mehr aus dem Hinterhalt feuern.
        for (const world of this.worlds) {
            if (this.isSomeBodyOnworld(world)) {
                this.checkFireResults(world);
            }
        }
        for (const world of this.worlds) {
            if (this.isSomeBodyOnworld(world)) {
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
