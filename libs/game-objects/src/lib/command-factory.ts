import { World, worldWithNumber } from './world';
import { Player } from './player';
import { Fleet, fleetAndHomeWorldWithNumber } from './fleet';
import { extractNumberString, isCharacterANumber } from './utils';
import { MoveCommand, Command, ExecuteCommand, compareCommand, BuildDShips, BuildFleetShip, TransferShipsFleetToFleet } from './command';

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
    
    findBuildParameterForFleet(): { fleet: Fleet, homeWorld: World, worldNumber: number,  shipsToBuild: number } {
         let counter = 0;
         let worldNumber = 0;
         let shipsToBuild = 0;
         let fleet: Fleet = null;
         let homeWorld: World = null;
 
         for (const commantElement of this.commandElements) {
             if (counter ===0) {
                 const aWorldNumber = +extractNumberString(commantElement);
                 if (aWorldNumber !== null) {
                     worldNumber = aWorldNumber;
                 }
             } else if (counter === 1) {
                const aShipsToBuild = +extractNumberString(commantElement);
                 if (aShipsToBuild !== null) {
                     shipsToBuild = aShipsToBuild;
                 }
             } else {
                const fleetNumber = +extractNumberString(commantElement);
                 if (fleetNumber !== null) {
                     const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, fleetNumber);
                     if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld !== null) {
                         fleet = aFleetAndHomeWorld.fleet;
                         homeWorld = aFleetAndHomeWorld.homeWorld;
                     }
                 }
             }
             counter++
         }
         return {fleet, homeWorld, worldNumber, shipsToBuild}
     }
     
    createBuildFleetShipCommand(): BuildFleetShip {
         const bulidParameterForFleet = this.findBuildParameterForFleet();
         return new BuildFleetShip(bulidParameterForFleet.fleet, bulidParameterForFleet.homeWorld, bulidParameterForFleet.worldNumber, bulidParameterForFleet.shipsToBuild, this.processCommand, this.commandPlayer)
     }
 

    // FnnnWmmm FnnnWmmmWooo FnnnWmmmWoooWrrr
    findFleetAndWorld(): { fleet: Fleet, homeWorld: World, worldArray: Array<World> } {
        let fleet: Fleet = null;
        let homeWorld: World = null;
        const worldArray: Array<World> = new Array<World>();
        let counter = 0;

        for (const commantElement of this.commandElements) {
            if (counter === 0) {
                const fleetNumber: number = +extractNumberString(commantElement);
                const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, fleetNumber);
                if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld !== null) {
                    fleet = aFleetAndHomeWorld.fleet;
                    homeWorld = aFleetAndHomeWorld.homeWorld;
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
        const fleetAndWorlds: { fleet: Fleet, homeWorld: World, worldArray: Array<World> } = this.findFleetAndWorld();
        return new MoveCommand(fleetAndWorlds.fleet, fleetAndWorlds.homeWorld, fleetAndWorlds.worldArray, this.processCommand, this.commandPlayer)
    }

    findFromFleetToFleetAndWorlds(): {fromFleet: Fleet, toFleet: Fleet, fromHomeWorld: World, toHomeWorld:World, shipsToTransfer: number} {
        let counter = 0;
        let shipsToTransfer = 0;
        let fromFleet: Fleet = null;
        let toFleet: Fleet = null;
        let fromHomeWorld: World = null;
        let toHomeWorld: World = null;
        
        for (const commantElement of this.commandElements) {
            if (counter === 0) {
                const fleetNumber = +extractNumberString(commantElement);
                if (fleetNumber !== null) {
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, fleetNumber);
                    if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld !== null) {
                        fromFleet = aFleetAndHomeWorld.fleet;
                        fromHomeWorld = aFleetAndHomeWorld.homeWorld;
                    }
                }
            } else if (counter === 1) {
                const aShipsToTransfer = +extractNumberString(commantElement);
                if (aShipsToTransfer !== null) {
                    shipsToTransfer = aShipsToTransfer;
                }
            } else {
                const fleetNumber = +extractNumberString(commantElement);
                if (fleetNumber !== null) {
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, fleetNumber);
                    if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld != null) {
                        toFleet = aFleetAndHomeWorld.fleet;
                        toHomeWorld = aFleetAndHomeWorld.homeWorld;
                    }
                }
            }
            counter++
        }
        return {fromFleet, toFleet, fromHomeWorld, toHomeWorld, shipsToTransfer}
    }
    
    createTransferShipsFleetToFleetCommand(): TransferShipsFleetToFleet {
        const fromFleetToFleetAndWorls = this.findFromFleetToFleetAndWorlds();
        return new TransferShipsFleetToFleet(fromFleetToFleetAndWorls.fromFleet, fromFleetToFleetAndWorls.toFleet, fromFleetToFleetAndWorls.fromHomeWorld, fromFleetToFleetAndWorls.toHomeWorld, fromFleetToFleetAndWorls.shipsToTransfer, this.processCommand, this.commandPlayer);
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
                for (const aPlayerName of this.allPlayerDict.keys()) {
                    const player = this.allPlayerDict.get(aPlayerName);
                    const buildDShips = new BuildDShips(this.worlds, player)
                    commandArray.push(buildDShips as Command);
                }

                commandArray.sort(compareCommand);

                for (const command of commandArray) {
                    const executeCommand = command as unknown as ExecuteCommand;
                    executeCommand.executeCommand();
                }
            }
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
