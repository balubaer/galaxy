import { Dice } from './dice'
import { World, worldWithNumber } from './world'
import { DistanceLevel } from './distance-level';
import { Fleet, fleetAndHomeWorldWithNumber } from './fleet';
import { Player } from './player';

export class PlayerFactory {
    worldDice: Dice;
    fleetDice: Dice;
    playerDice: Dice;
    distanceLevelHomes: number;
    playerNameArray: Array<string>;
    passedWorlds: Array<World> = new Array();
    nextLevelWorlds: Array<World> = new Array();
    homeWorldsDict: Map<string, World>;

    init(aPlayerNameArray: Array<string>) {
        this.worldDice = new Dice();
        this.fleetDice = new Dice();
        this.playerDice = new Dice();
        this.playerNameArray = aPlayerNameArray;
        this.distanceLevelHomes = 0;
        this.homeWorldsDict = new Map();
    }

    findWorldWithDice(dice: Dice, worldArray: Array<World>): World {
        let result: World = null;
        let found = false;

        while (!found) {
            result = worldWithNumber(worldArray, dice.roll())
            if (result !== null) {
                if (result.player === null) {
                    found = true;
                }
            }
        }
        return result;
    }

    findWorldWithMinWorldArea(worldArray: Array<World>): World {
        let result: World = null;
        const worldAndAreaCount: Map<number, number> = new Map();
        let foundWorldNumber = 1;
        let foundAreaCount = worldArray.length;

        for (const world of worldArray) {
            const distLevel = new DistanceLevel(world, this.distanceLevelHomes);
            const count = distLevel.passedWorlds.length;
            worldAndAreaCount.set(world.number, count);
        }

        for (const worldNumber of worldAndAreaCount.keys()) {
            const areaCount = worldAndAreaCount.get(worldNumber);
            const world = worldWithNumber(worldArray, worldNumber);
            if (world !== null) {
                if (foundAreaCount > areaCount && world.player === null) {
                    foundAreaCount = areaCount;
                    foundWorldNumber = worldNumber;
                }
            }
        }
        result = worldWithNumber(worldArray, foundWorldNumber);
        console.log(`#### Gefundenen Worlden: ${foundWorldNumber}`);

        if (result === null) {
            result = this.findWorldWithDice(this.worldDice, worldArray);
        }

        return result;
    }

    findFleetAndWorldWithDice(dice: Dice, worldArray: Array<World>): { fleet: Fleet, world: World } {
        let fleet: Fleet = null;
        let world: World = null;
        let found = false;

        while (!found) {
            const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(worldArray, dice.roll());
            if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld !== null) {
                if (aFleetAndHomeWorld.fleet.player === null) {
                    found = true;
                    fleet = aFleetAndHomeWorld.fleet;
                    world = aFleetAndHomeWorld.homeWorld;
                }
            }
        }
        return { fleet, world };
    }

    findePlayerWithDice(): Player {
        this.playerDice.setSites(this.playerNameArray.length);
        const index = this.playerDice.roll() - 1;
        const playerName = this.playerNameArray[index];
        this.playerNameArray.splice(index,1);
        const result = new Player(playerName);

        return result;
    }


    createWithWorldArray(worldArray: Array<World>, fleetCount: number, aFleetsOnHomeWorld: number, startShipsCount: number, distanceLevelHomes: number) {
        this.worldDice.setSites(worldArray.length);
        this.fleetDice.setSites(fleetCount);
        const playerNameCount = this.playerNameArray.length;
        this.distanceLevelHomes = distanceLevelHomes;

        for (let counter = 1; counter <= playerNameCount; counter++) {
            const player = this.findePlayerWithDice();
            console.log(`#### ${counter} Player: ${player.playerName}`);

            let world: World = null;
            if (counter === 1) {
                world = this.findWorldWithDice(this.worldDice, worldArray);
            } else {
                this.nextLevelWorlds = new Array();
                const nextLevelWorldsSet = this.makeNextLevelWorlds();
                for (const aWorld of nextLevelWorldsSet) {
                    this.nextLevelWorlds.push(aWorld);
                }
                world = this.findWorldWithMinWorldArea(this.nextLevelWorlds);
            }

            console.log(`#### ${counter} vor setPlayer World: ${world.number} Player: ${world.player}`);

            world.player = player;
            this.homeWorldsDict.set(player.playerName, world);
        }

        for (const key of this.homeWorldsDict.keys()) {
            const world = this.homeWorldsDict.get(key);
            let fleetsOnHomeWorld = aFleetsOnHomeWorld;

            fleetsOnHomeWorld -= world.fleets.length;
            for (const fleet of world.fleets) {
                fleet.player = world.player;
                fleet.ships = startShipsCount;
            }

            for (let i = 1; i <= fleetsOnHomeWorld; i++) {
                const fleetAndWorld = this.findFleetAndWorldWithDice(this.fleetDice, worldArray)
                fleetAndWorld.fleet.player = world.player;
                fleetAndWorld.fleet.ships = startShipsCount;
                const index = fleetAndWorld.world.fleets.indexOf(fleetAndWorld.fleet);
                fleetAndWorld.world.fleets.splice(index, 1);
                world.fleets.push(fleetAndWorld.fleet);
            }
        }
    }

    makeNextLevelWorlds(): Set<World> {
        const result = new Set<World>();
        const allPassedWorlds = new Set<World>();
        const allNextLevelWorlds = new Set<World>();
        let finishCreate = false;
        let startDistanceLevelHomes = this.distanceLevelHomes;

        while (finishCreate === false) {
            for (const key of this.homeWorldsDict.keys()) {
                const world = this.homeWorldsDict.get(key);
                const distLevel = new DistanceLevel(world, startDistanceLevelHomes);
                for (const worldFromPassedWorlds of distLevel.passedWorlds) {
                    allPassedWorlds.add(worldFromPassedWorlds);
                }
                for (const worldFromNextLevel of distLevel.nextLevelWorlds) {
                    allNextLevelWorlds.add(worldFromNextLevel);
                }
                for (const worldFromNextLevel of allNextLevelWorlds) {
                    if (allPassedWorlds.has(worldFromNextLevel) === false) {
                        result.add(worldFromNextLevel);
                    }
                }
            }
            if (result.size > 0) {
                finishCreate = true;
            } else {
                startDistanceLevelHomes--;
                allPassedWorlds.clear();
                allNextLevelWorlds.clear();
            }
        }
        this.distanceLevelHomes = startDistanceLevelHomes;
        return result;
    }

}
