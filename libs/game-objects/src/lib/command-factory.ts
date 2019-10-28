import { World, worldWithNumber } from './world';
import { Player } from './player';
import { Fleet, fleetAndHomeWorldWithNumber } from './fleet';
import { extractNumberString } from './utils';
import { MoveCommand } from './command';

export class CommandFactory {
    public static readonly FLEET_INDEX = 0;

    worlds: Array<World>;
    commandStringsDict: Map<string, Array<string>>;
    processCommand: string;
    commandChars: string;
    commandPlayer: Player;
    commandElements: Array<string>;
    allPlayerDict: Map<string, Player>;
    coreGame = false;

    constructor(aWorldArray: Array<World>, aAllPlayerDict: Map<string, Player>) {
        this.worlds = aWorldArray;
        this.allPlayerDict = aAllPlayerDict;
        this.commandStringsDict = new Map<string, Array<string>>();
        this.commandElements = new Array<string>();
    }

    setCommandStringsWithLongString(playerName: string, commandString: string) {
        const stringArray = commandString.split(' \n\r');
        const aSet = new Set();
        const array = new Array();

        for (const aString of stringArray) {
            aSet.add(aString);
        }

        for (const aString of aSet) {
            array.push(aString);
        }

        this.commandStringsDict.set(playerName, array);
    }

    //WnnnBqqqFmmm

    /* findBuildParameterForFleet(): [Fleet, World, number, number] { // (fleet: Fleet, homePlanet:Planet, planetNumber: Int, shipsToBuild: Int)
         let counter = 0;
         let planetNumber = 0;
         let shipsToBuild = 0;
         const fleet: Fleet = new Fleet();
         const homePlanet: World = new World();
 
         for (const commantElement of this.commandElements) {
             if (counter ===0) {
                 var aPlanetNumber = Int(extractNumberString(commantElement))
                 if aPlanetNumber != nil {
                     planetNumber = aPlanetNumber!
                 }
             } else if counter == 1 {
                 var aShipsToBuild = Int(extractNumberString(commantElement))
                 if aShipsToBuild != nil {
                     shipsToBuild = aShipsToBuild!
                 }
             } else {
                 var fleetNumber: Int? = Int(extractNumberString(commantElement))
                 if fleetNumber != nil {
                     var aFleetAndHomePlanet = fleetAndHomePlanetWithNumber(planets, number: fleetNumber!)
                     if aFleetAndHomePlanet.fleet != nil && aFleetAndHomePlanet.homePlanet != nil {
                         fleet = aFleetAndHomePlanet.fleet!
                         homePlanet = aFleetAndHomePlanet.homePlanet!
                     }
                 }
             }
             counter++
         }
         return (fleet, homePlanet, planetNumber, shipsToBuild)
     }
     
     func createBuildFleetShipCommand() -> BuildFleetShip {
         let bulidParameterForFleet = findBuildParameterForFleet()
         return BuildFleetShip(aFleet: bulidParameterForFleet.fleet, aHomePlanet: bulidParameterForFleet.homePlanet, aPlanetNumber: bulidParameterForFleet.planetNumber,  aShipsToBuild: bulidParameterForFleet.shipsToBuild, aString: processCommand!, aPlayer: commandPlayer!)
     }
 */

    // FnnnWmmm FnnnWmmmWooo FnnnWmmmWoooWrrr
    findFleetAndWorld(): { fleet: Fleet, homeWorld: World, worldArray: Array<World> } { //(fleet: Fleet, homePlanet:Planet, planetArray: Array <Planet>)
        let fleet: Fleet = null;
        let homeWorld: World = null;
        const worldArray: Array<World> = new Array<World>();
        let counter = 0;

        for (const commantElement of this.commandElements) {
            if (counter === 0) {
                const fleetNumber: number = +extractNumberString(commantElement);
                const aFleetAndHomePlanet = fleetAndHomeWorldWithNumber(this.worlds, fleetNumber);
                if (aFleetAndHomePlanet[0] !== null && aFleetAndHomePlanet[1] !== null) {
                    fleet = aFleetAndHomePlanet[0];
                    homeWorld = aFleetAndHomePlanet[1];
                }
            } else {
                const worldNumber: number = +extractNumberString(commantElement);
                const world = worldWithNumber(this.worlds, worldNumber);

                if (world !== null) {
                    worldArray.push(world)
                }
            }
            counter++
        }
        return {
            fleet: fleet,
            homeWorld: homeWorld,
            worldArray: worldArray
        }
    }

    createMoveCommand(): MoveCommand {
        const fleetAndPlanets: { fleet: Fleet, homeWorld: World, worldArray: Array<World> } = this.findFleetAndWorld();
        return new MoveCommand(fleetAndPlanets.fleet, fleetAndPlanets.homeWorld, fleetAndPlanets.worldArray, this.processCommand, this.commandPlayer)
    }
}
