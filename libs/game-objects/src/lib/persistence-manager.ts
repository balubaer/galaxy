import { World } from './world';
import { NumberKey } from './number-key.interface';
import { Player, isCharacterType } from './player';
import { Port } from './port';
import { Fleet } from './fleet';
import { WorldsPersist } from './worlds-persist.interface';
import { WorldPersist } from './world-persist.interface';
import { PlayerPersist } from './player-persis.interfacet';
import { PortPersist } from './port-persist.interface';
import { FleetPersist } from './fleet-persist.interface';

export class PersistenceManager {
    worldArray: Array<World>;
    worldDict: Map<number, World>;
    allPlayerDict: Map<string, Player> = new Map<string, Player>();
    fleetDict: Map<number, Fleet>;

    constructor(aWorldArray: Array<World>) {
        this.worldArray = aWorldArray;
    }

    createWorldsPersist(): WorldsPersist {
        const worlds: WorldsPersist = {
            worlds: this.getWorldPersistArray(),
            players: this.getPlayerPersistArray(),
            ports: this.getPortPersitArray(),
            fleets: this.getFleetPersistArray()
        }
        return worlds;
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
            dShips: world.dShips,
            ...this.getClassicWorldPersist(world)
        }
    }

    /** Classic-Felder nur speichern, wenn sie belegt sind, damit Core-Daten unverändert bleiben. */
    getClassicWorldPersist(world: World): Partial<WorldPersist> {
        const result: Partial<WorldPersist> = {};
        const numbers: Array<'population' | 'populationLimit' | 'industry' | 'metal' | 'mines' | 'turnsOwned' | 'iShips' | 'pShips' | 'plunderCount' | 'plunderRecovery'> =
            ['population', 'populationLimit', 'industry', 'metal', 'mines', 'turnsOwned', 'iShips', 'pShips', 'plunderCount', 'plunderRecovery'];
        for (const key of numbers) {
            if (world[key] !== 0) {
                result[key] = world[key];
            }
        }
        if (world.blackHole) {
            result.blackHole = true;
        }
        return result;
    }

    getPlayerPersitWithPlayer(player: Player): PlayerPersist {
        const result: PlayerPersist = {
            name: player.playerName,
            points: player.points,
            teammates: player.teanmatesNames()
        };
        if (player.characterType !== null) {
            result.characterType = player.characterType;
        }
        if (player.allies.size > 0) {
            result.allies = Array.from(player.allies).map(p => p.playerName);
        }
        if (player.loaders.size > 0) {
            result.loaders = Array.from(player.loaders).map(p => p.playerName);
        }
        return result;
    }

    getPlayerPersistArray(): Array<PlayerPersist> {
        const result: Array<PlayerPersist> = new Array<PlayerPersist>();
        const players: Set<Player> = new Set<Player>();
        for (const world of this.worldArray) {
            const player = world.player;
            if (player !== null) {
                players.add(player);
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
        const result: FleetPersist = {
            number: aFleet.number,
            ships: aFleet.ships,
            player: playername,
            moved: aFleet.moved,
        };
        if (aFleet.metal !== 0) {
            result.metal = aFleet.metal;
        }
        if (aFleet.atPeace) {
            result.atPeace = true;
        }
        if (aFleet.pbb) {
            result.pbb = true;
        }
        return result;
    }

    getFleetPersistArray(): Array<FleetPersist> {
        const result: Array<FleetPersist> = new Array<FleetPersist>();
        for (const world of this.worldArray) {
            if (world.fleets !== null) {
                for (const fleet of world.fleets) {
                    result.push(this.getFleetPersistWithFleet(fleet));
                }
            }
        }
        return result;
    }

    createWorldsWithWorldsPersist(worldsPersist: WorldsPersist): Array<World> {
        this.createPlayersWithPlayerPersistArray(worldsPersist.players);
        this.createWorldsWithWorldPersistArray(worldsPersist.worlds);
        this.createPortsWithPortPersistArray(worldsPersist.ports);
        this.createFleetsWithFleetPersistArray(worldsPersist.fleets);
        this.linkFleetAndWorldWithWorldPersistArray(worldsPersist.worlds);
        return this.worldArray;
    }

    createPlayersWithPlayerPersistArray(playersPersist: Array<PlayerPersist>) {
        const playerPersistDict = new Map<string, PlayerPersist>();
        for (const playerPersist of playersPersist) {
            const player = new Player(playerPersist.name);
            player.points = playerPersist.points;
            player.characterType = isCharacterType(playerPersist.characterType) ? playerPersist.characterType : null;
            this.allPlayerDict.set(playerPersist.name, player);
            playerPersistDict.set(playerPersist.name, playerPersist);
        }
        for (const aPlayerName of this.allPlayerDict.keys()) {
            const player = this.allPlayerDict.get(aPlayerName);
            const playerPersist = playerPersistDict.get(aPlayerName);
            const teammates = playerPersist.teammates;
            for (const teammateName of teammates) {
                const teammatePlayer = this.allPlayerDict.get(teammateName);
                player.teammates.add(teammatePlayer);
            }
            for (const allyName of playerPersist.allies ?? []) {
                player.allies.add(this.allPlayerDict.get(allyName));
            }
            for (const loaderName of playerPersist.loaders ?? []) {
                player.loaders.add(this.allPlayerDict.get(loaderName));
            }
        }
    }

    createWorldsWithWorldPersistArray(worldsPersist: Array<WorldPersist>) {
        this.worldArray = new Array<World>();
        this.worldDict = new Map<number, World>();
        for (const worldPersist of worldsPersist) {
            const world = new World();
            world.setNumber(worldPersist.number)
            if (worldPersist.player !== '') {
                world.player = this.allPlayerDict.get(worldPersist.player);
            }
            world.dShips = worldPersist.dShips;
            world.population = worldPersist.population ?? 0;
            world.populationLimit = worldPersist.populationLimit ?? 0;
            world.industry = worldPersist.industry ?? 0;
            world.metal = worldPersist.metal ?? 0;
            world.mines = worldPersist.mines ?? 0;
            world.turnsOwned = worldPersist.turnsOwned ?? 0;
            world.iShips = worldPersist.iShips ?? 0;
            world.pShips = worldPersist.pShips ?? 0;
            world.blackHole = worldPersist.blackHole ?? false;
            world.plunderCount = worldPersist.plunderCount ?? 0;
            world.plunderRecovery = worldPersist.plunderRecovery ?? 0;
            this.worldArray.push(world);
            this.worldDict.set(worldPersist.number, world);
        }
    }

    createPortsWithPortPersistArray(portsPersist: Array<PortPersist>) {
        for (const portPersist of portsPersist) {
            const port = new Port();
            port.setWorld(this.worldDict.get(portPersist.world));
            port.worlds = new Array<World>();
            for (const worldNumber of portPersist.worlds) {
                port.worlds.push(this.worldDict.get(worldNumber));
            }
            port.getWorld().port = port;
        }
    }

    createFleetsWithFleetPersistArray(fleetsPersist: Array<FleetPersist>) {
        this.fleetDict = new Map<number, Fleet>();
        for (const fleetPersist of fleetsPersist) {
            const fleet = new Fleet();
            fleet.number = fleetPersist.number;
            fleet.ships = fleetPersist.ships;
            if (fleetPersist.player !== '') {
                fleet.player = this.allPlayerDict.get(fleetPersist.player);
            }
            fleet.moved = fleetPersist.moved;
            fleet.metal = fleetPersist.metal ?? 0;
            fleet.atPeace = fleetPersist.atPeace ?? false;
            fleet.pbb = fleetPersist.pbb ?? false;
            this.fleetDict.set(fleetPersist.number, fleet);
        }
    }

    linkFleetAndWorldWithWorldPersistArray(worldsPersist: Array<WorldPersist>) {
        for (const worldPersist of worldsPersist) {
            const world = this.worldDict.get(worldPersist.number);
            for (const fleetNumber of worldPersist.fleets) {
                world.fleets.push(this.fleetDict.get(fleetNumber));
            }
        }
    }
}
