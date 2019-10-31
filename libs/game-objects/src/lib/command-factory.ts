import { World, worldWithNumber } from './world';
import { Player } from './player';
import { Fleet, fleetAndHomeWorldWithNumber } from './fleet';
import { extractNumberString, isCharacterANumber } from './utils';
import { MoveCommand, Command, ExecuteCommand } from './command';

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
    }

    setCommandStringsWithLongString(playerName: string, commandString: string) {
        const stringArray = commandString.split(/ |\r\n|\n|\r/);
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

    fillCommandElements() {
        this.commandElements = new Array<string>();
        const charCount = this.processCommand.length;
        let foundCommandElementEnd = false;
        let commandElement = '';
        this.commandChars = '';
        let counter = 0;

        for (const aCharacter of this.processCommand) {
            if (isCharacterANumber(aCharacter) === false) {
                this.commandChars += aCharacter;
                if (counter !== 0) {
                    foundCommandElementEnd = true;
                }
                if (foundCommandElementEnd) {
                    this.commandElements.push(commandElement);
                    commandElement = '';
                    foundCommandElementEnd = false;
                }
                commandElement += aCharacter;
            } else {
                commandElement += aCharacter;
            }
            counter++
            if (counter === charCount) {
                this.commandElements.push(commandElement);
            }
        }
    }

    executeCommands() {
        const commandArray: Array<Command> = new Array<Command>();

        for (const playerName of this.commandStringsDict.keys()) {
            const commands: Array<string> = this.commandStringsDict.get(playerName);

            for (const command of commands) {
                console.log(`Command: ${command}`);
                this.processCommand = command;
                this.fillCommandElements();

                this.commandPlayer = this.allPlayerDict.get(playerName);
                const commandInstance = this.getCommandInstance();
                if (commandInstance !== null) {
                    if (commandInstance instanceof Command) {
                        commandArray.push(commandInstance);
                    }
                }
            }

            if (this.coreGame === true) {
                //TODO: BuildDShips impementieren
                //  for (const playerName of this.allPlayerDict.keys()) {
                //let buildDShips = BuildDShips(aPlanetArray: planets, aPlayer: player)
                // commandArray.append(buildDShips as Command)

                //  }
            }

            // commandArray.sortInPlace { $0 < $1 }

            for (const command of commandArray) {
                const executeCommand = command as unknown as ExecuteCommand;
                executeCommand.executeCommand();
            }



            /*
                if (coreGame == true) {
                    Collection<String> playerKeys = allPlayerDict.keySet();
        
                    for (Iterator<String> iterator = playerKeys.iterator(); iterator.hasNext();) {
                        String playerName = iterator.next();
                        Player player = allPlayerDict.get(playerName);
                        BuildDShips buildDShips = new BuildDShips( planets, player);
                        commandArray.add((Command)buildDShips);
                    }
                }
        
                Collections.sort(commandArray);
        
                for (Command aCommand : commandArray) {
                    ExecuteCommand executeCommand = (ExecuteCommand)aCommand;
                    executeCommand.executeCommand();
                }*/
        }
    }

    getCommandInstance(): Object {
        let result: Object = null;
        if (this.commandChars !== null) {
            if (this.commandChars.length >= 2) {
                switch (this.commandChars.charAt(0)) {
                    case 'F':
                        switch (this.commandChars.charAt(1)) {
                            case 'W':
                                result = this.createMoveCommand();
                                break;
                            case 'U':
                                result = null; //createUnloadingMetalCommand()
                                break;
                            case 'T':
                                if (this.commandChars.length === 3) {
                                    switch (this.commandChars.charAt(2)) {
                                        case 'F':
                                            result = null; //createTransferShipsFleetToFleetCommand()
                                            break;
                                        case 'D':
                                            result = null; //createTransferShipsFleetToDShipsCommand()
                                            break;
                                        default:
                                            result = null;
                                            break;
                                    }
                                }
                                break;
                            case 'A':
                                if (this.commandChars.length === 3) {
                                    switch (this.commandChars.charAt(2)) {
                                        case 'F':
                                            result = null; //createFireFleetToFleetCommand()
                                            break;
                                        case 'D':
                                            result = null; //createFireFleetToDShipsCommand()
                                            break;
                                        default:
                                            result = null;
                                            break;
                                    }
                                }
                                break;
                            default:
                                result = null;
                                break;
                        }
                        break;
                    case 'W':
                        switch (this.commandChars.charAt(1)) {
                            case 'B':
                                if (this.commandChars.length === 3) {
                                    if (this.commandChars.charAt(2) === 'F') {
                                        result = null; //createBuildFleetShipCommand()
                                    }
                                }
                                break;
                            default:
                                result = null;
                                break;
                        }
                        break;
                    case 'D':
                        switch (this.commandChars.charAt(1)) {
                            case 'A':
                                if (this.commandChars.length === 3) {
                                    if (this.commandChars.charAt(2) === 'F') {
                                        result = null; //createFireDShipsToFleetCommand()
                                    }
                                }
                                break;
                            case 'T':
                                if (this.commandChars.length === 3) {
                                    if (this.commandChars.charAt(2) === 'F') {
                                        result = null; //createTransferDShipsToFleetCommand()
                                    }
                                }
                                break;
                            default:
                                result = null;
                                break;
                        }
                        break;
                    case 'Z':
                        result = null //createAmbushOffForPlanet()
                        break;
                    case 'A':
                        if (this.commandChars.charAt(1) === '=') {
                            result = null //createTeammateForPlayer();
                        }
                        break;
                    case 'N':
                        if (this.commandChars.charAt(1) === '=') {
                            result = null; //createRemoveTeammateForPlayer();
                        }
                        break;
                    default:
                        result = null;
                        break;
                }
            } else if (this.commandChars.length === 1) {
                switch (this.commandChars.charAt(0)) {
                    case 'Z':
                        result = null; //createAmbushOffForPlayer()
                        break;
                    default:
                        result = null;
                        break;
                }
            }
        }
        return result;
    }


}
