import { writeFileSync } from 'fs';
import { World, GamePref } from '@galaxy/game-objects';
import { Message } from '@galaxy/api-interfaces';


export class PersistenceManager {
    worldArray: Array<World>;
    gamePref: GamePref;
    message: Message;

    constructor(aWorldArray: Array<World>, aGamePref: GamePref) {
        this.worldArray = aWorldArray;
    }

    writeWorlds() {
        const worlds: WorldsPersist = {
            worlds: this.getWorldPersistArray(),
            players: this.getPlayerPersistArray(),
            ports: this.getPortPersitArray(),
            fleets: this.getFleetPersistArray()
        }
        const data = JSON.stringify(worlds);
//TODO: GamePref für Pfad berücksichtigen
        writeFileSync('worlds.json', data);
    }

    getNumberArrayWithNumberKeysArray(numberKeysArray: Array<NumberKey>): Array<number> {
        const result: Array<number> = new Array<number>();

        for (const key of numberKeysArray) {
            result.push(key.number);
        }
        return result;
    }

    getWorldPersistArray(): Array<WorldPersist> {
        const result: Array<WorldPersist> = new Array<WorldPersist>();
        for (const world of this.worldArray) {
            result.push(this.getWorldPersistWithWorld(world));
        }
        return result;
    }

    getWorldPersistWithWorld(world: World): WorldPersist {
        let playername = '';

        if (world.player !== null) {
            playername = world.player.playerName;
        }
        return {
            number: world.number,
            name: world.name,
            player: playername,
            fleets: this.getNumberArrayWithNumberKeysArray(world.fleets),
            dShips: world.dShips
        }
    }

    getPlayerPersitWithPlayer(player: Player): PlayerPersist {
        return {
            name: player.playerName,
            points: player.points,
            teammates: player.teanmatesNames()
        }
    }

    getPlayerPersistArray(): Array<PlayerPersist> {
        const result: Array<PlayerPersist> = new Array<PlayerPersist>();
        const players: Set<Player> = new Set<Player>();
        for (const world of this.worldArray) {
            if (world.player !== null) {
                players.add(world.player);
            }
        }

        for (const player of players) {
            result.push(this.getPlayerPersitWithPlayer(player));
        }
        return result;
    }

    getPortPersistWithPort(port: Port): PortPersist {
        return {
            world: port.number,
            worlds: this.getNumberArrayWithNumberKeysArray(port.worlds)
        }
    }

    getPortPersitArray(): Array<PortPersist> {
        const result = new Array<PortPersist>();
        for (const world of this.worldArray) {
            result.push(this.getPortPersistWithPort(world.port));
        }
        return result;
    }

    getFleetPersistWithFleet(aFleet: Fleet): FleetPersist {
        let playername = '';

        if (aFleet.player !== null) {
            playername = aFleet.player.playerName;
        }
        return {
            number: aFleet.number,
            ships: aFleet.ships,
            player: playername,
            moved: aFleet.moved,
        }
    }

    getFleetPersistArray(): Array<FleetPersist> {
        const result: Array<FleetPersist> = new Array<FleetPersist>();
        for (const world of this.worldArray) {
        }
        return result;
    }
}
