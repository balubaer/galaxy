import { World, worldWithNumber } from './world';
import { Player } from './player';
import { Fleet, fleetAndHomeWorldWithNumber } from './fleet';
import { extractNumberString, isCharacterANumber, extractCharsFromString } from './utils';
import { MoveCommand, Command, ExecuteCommand, compareCommand, BuildDShips, BuildFleetShip, TransferShipsFleetToFleet, BuildFleetShipEnum, MoveCommandEnum, TransferShipsFleetToFleetEnum, TransferShipsFleetToDShipsEnum, TransferShipsFleetToDShips, TransferDShipsToFleetEnum, TransferDShipsToFleet, FireFleetToFleet, AmbushOffForPlayer, AddTeammate, RemoveTeammate, FireFleetToFleetEnum, FireDShipsToFleetEnum, FireFleetToDShipsEnum, FireDShipsToFleet, AmbushOffForWorldEnum, AmbushOffForWorld, FireFleetToDShips } from './command';

export class CommandFactory {
    public static readonly FLEET_INDEX = 0;

    worlds: Array<World>;
    commandStringsDict: Map<string, Array<string>>;
    processCommand: string;
    commandChars: string;
    commandPlayer: Player;
    commandElements: Array<string>;
    commandNumberArray: Array<number>;
    allPlayerDict: Map<string, Player>;
    coreGame = false;

    constructor(aWorldArray: Array<World>, aAllPlayerDict: Map<string, Player>) {
        this.worlds = aWorldArray;
        this.allPlayerDict = aAllPlayerDict;
        this.commandStringsDict = new Map<string, Array<string>>();
    }

    initMembers(command: string, playerName: string) {
        this.processCommand = command;
        this.commandElements = this.getCommandElements(command);
        this.commandChars = extractCharsFromString(command);
        this.commandNumberArray = this.getCommandNummerArray(this.commandElements);
        this.commandPlayer = this.allPlayerDict.get(playerName);
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
    findBuildParameterForFleet(): { fleet: Fleet, homeWorld: World, worldNumber: number, shipsToBuild: number } {
        let counter = 0;
        let worldNumber = 0;
        let shipsToBuild = 0;
        let fleet: Fleet = null;
        let homeWorld: World = null;

        for (const commantNumber of this.commandNumberArray) {
            switch (counter) {
                case BuildFleetShipEnum.WORLD:
                    worldNumber = commantNumber;
                    break;
                case BuildFleetShipEnum.SHIPTOBUILD:
                    shipsToBuild = commantNumber;
                    break;
                case BuildFleetShipEnum.FLEED:
                    const fleetNumber = commantNumber;
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, fleetNumber);
                    if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld !== null) {
                        fleet = aFleetAndHomeWorld.fleet;
                        homeWorld = aFleetAndHomeWorld.homeWorld;
                    }
                    break;
            }
            counter++
        }
        return { fleet, homeWorld, worldNumber, shipsToBuild }
    }

    createBuildFleetShipCommand(): BuildFleetShip {
        const bulidParameterForFleet = this.findBuildParameterForFleet();
        return new BuildFleetShip(bulidParameterForFleet.fleet, bulidParameterForFleet.homeWorld, bulidParameterForFleet.worldNumber, bulidParameterForFleet.shipsToBuild, this.processCommand, this.commandPlayer);
    }


    // FnnnWmmm FnnnWmmmWooo FnnnWmmmWoooWrrr
    findFleetAndWorld(): { fleet: Fleet, homeWorld: World, worldArray: Array<World> } {
        let fleet: Fleet = null;
        let homeWorld: World = null;
        const worldArray: Array<World> = new Array<World>();
        let counter = 0;

        for (const commantNumber of this.commandNumberArray) {
            switch (counter) {
                case MoveCommandEnum.FLEED:
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, commantNumber);
                    if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld !== null) {
                        fleet = aFleetAndHomeWorld.fleet;
                        homeWorld = aFleetAndHomeWorld.homeWorld;
                    }
                    break;
                case MoveCommandEnum.WORLD1:
                case MoveCommandEnum.WORLD2:
                case MoveCommandEnum.WORLD3:
                    const world = worldWithNumber(this.worlds, commantNumber);
                    if (world !== null) {
                        worldArray.push(world)
                    }
                    break;
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
        return new MoveCommand(fleetAndWorlds.fleet, fleetAndWorlds.homeWorld, fleetAndWorlds.worldArray, this.processCommand, this.commandPlayer);
    }

    //FnnnTqqqFmmm
    findFromFleetToFleetAndWorlds(): { fromFleet: Fleet, toFleet: Fleet, fromHomeWorld: World, toHomeWorld: World, shipsToTransfer: number } {
        let counter = 0;
        let shipsToTransfer = 0;
        let fromFleet: Fleet = null;
        let toFleet: Fleet = null;
        let fromHomeWorld: World = null;
        let toHomeWorld: World = null;
        // let aFleetAndHomeWorld = null;

        for (const commantNumber of this.commandNumberArray) {
            switch (counter) {
                case TransferShipsFleetToFleetEnum.FLEED1:
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, commantNumber);
                    if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld !== null) {
                        fromFleet = aFleetAndHomeWorld.fleet;
                        fromHomeWorld = aFleetAndHomeWorld.homeWorld;
                    }
                    break;
                case TransferShipsFleetToFleetEnum.SHIPTRANSVER:
                    shipsToTransfer = commantNumber;

                    break;
                case TransferShipsFleetToFleetEnum.FLEED2:
                    const aFleetAndHomeWorld2 = fleetAndHomeWorldWithNumber(this.worlds, commantNumber);
                    if (aFleetAndHomeWorld2.fleet !== null && aFleetAndHomeWorld2.homeWorld != null) {
                        toFleet = aFleetAndHomeWorld2.fleet;
                        toHomeWorld = aFleetAndHomeWorld2.homeWorld;
                    }
                    break;
            }
            counter++;
        }
        return { fromFleet, toFleet, fromHomeWorld, toHomeWorld, shipsToTransfer }
    }

    createTransferShipsFleetToFleetCommand(): TransferShipsFleetToFleet {
        const fromFleetToFleetAndWorls = this.findFromFleetToFleetAndWorlds();
        return new TransferShipsFleetToFleet(fromFleetToFleetAndWorls.fromFleet, fromFleetToFleetAndWorls.toFleet, fromFleetToFleetAndWorls.fromHomeWorld, fromFleetToFleetAndWorls.toHomeWorld, fromFleetToFleetAndWorls.shipsToTransfer, this.processCommand, this.commandPlayer);
    }

    //FaaTxxD
    findFromFleetToDShipsAndWorld(): { fromFleet: Fleet, fromHomeWorld: World, shipsToTransfer: number } {
        let counter = 0;
        let fromFleet: Fleet = null;
        let fromHomeWorld: World = null;
        let shipsToTransfer = 0;

        for (const commantNumber of this.commandNumberArray) {
            switch (counter) {
                case TransferShipsFleetToDShipsEnum.FLEED:
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, commantNumber);
                    if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld !== null) {
                        fromFleet = aFleetAndHomeWorld.fleet;
                        fromHomeWorld = aFleetAndHomeWorld.homeWorld;
                    }
                    break;

                case TransferShipsFleetToDShipsEnum.SHIPTRANSVER:
                    shipsToTransfer = commantNumber;
                    break;
            }
            counter++
        }
        return { fromFleet, fromHomeWorld, shipsToTransfer };
    }

    createTransferShipsFleetToDShipsCommand(): TransferShipsFleetToDShips {
        const fromFleetToDShipsAndWorld = this.findFromFleetToDShipsAndWorld()
        return new TransferShipsFleetToDShips(fromFleetToDShipsAndWorld.fromFleet, fromFleetToDShipsAndWorld.fromHomeWorld, fromFleetToDShipsAndWorld.shipsToTransfer, this.processCommand, this.commandPlayer);
    }

    //DaaTxxFbb
    findTransferDShipsToFleetAndWorlds(): { toFleet: Fleet, fromHomeWorld: World, toHomeWorld: World, shipsToTransfer: number } {
        let counter = 0;
        let shipsToTransfer = 0;
        let toFleet: Fleet = null;
        let fromHomeWorld: World = null;
        let toHomeWorld: World = null;

        for (const commantNumber of this.commandNumberArray) {
            switch (counter) {
                case TransferDShipsToFleetEnum.WORLD:
                    fromHomeWorld = worldWithNumber(this.worlds, commantNumber);
                    break;
                case TransferDShipsToFleetEnum.SHIPTRANSVER:
                    shipsToTransfer = commantNumber;
                    break;
                case TransferDShipsToFleetEnum.FLEED:
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, commantNumber)
                    if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld !== null) {
                        toFleet = aFleetAndHomeWorld.fleet;
                        toHomeWorld = aFleetAndHomeWorld.homeWorld;
                    }
                    break;
            }
            counter++
        }
        return { toFleet, fromHomeWorld, toHomeWorld, shipsToTransfer };
    }

    createTransferDShipsToFleetCommand(): TransferDShipsToFleet {
        const transferDShipsToFleetAndWorlds = this.findTransferDShipsToFleetAndWorlds()
        return new TransferDShipsToFleet(transferDShipsToFleetAndWorlds.toFleet, transferDShipsToFleetAndWorlds.fromHomeWorld, transferDShipsToFleetAndWorlds.toHomeWorld, transferDShipsToFleetAndWorlds.shipsToTransfer, this.processCommand, this.commandPlayer);
    }

    //FaaAFbb
    findFromFleetFireToFleetAndWorlds(): { fromFleet: Fleet, toFleet: Fleet, fromHomeWorld: World, toHomeWorld: World } {
        let counter = 0;
        let fromFleet: Fleet = null;
        let toFleet: Fleet = null;
        let fromHomeWorld: World = null;
        let toHomeWorld: World = null;

        for (const commantNumber of this.commandNumberArray) {
            switch (counter) {
                case FireFleetToFleetEnum.FLEEDFROM:
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, commantNumber);
                    if (aFleetAndHomeWorld.fleet !== null && aFleetAndHomeWorld.homeWorld !== null) {
                        fromFleet = aFleetAndHomeWorld.fleet;
                        fromHomeWorld = aFleetAndHomeWorld.homeWorld;
                    }
                    break;
                case FireFleetToFleetEnum.FLEEDTO:
                    const aFleetAndHomeWorld2 = fleetAndHomeWorldWithNumber(this.worlds, commantNumber);
                    if (aFleetAndHomeWorld2.fleet !== null && aFleetAndHomeWorld2.homeWorld !== null) {
                        toFleet = aFleetAndHomeWorld2.fleet;
                        toHomeWorld = aFleetAndHomeWorld2.homeWorld;
                    }
                    break;
            }
            counter++
        }
        return { fromFleet, toFleet, fromHomeWorld, toHomeWorld };
    }

    createFireFleetToFleetCommand(): FireFleetToFleet {
        const fromFleetFireToFleetAndWorlds = this.findFromFleetFireToFleetAndWorlds()
        return new FireFleetToFleet(fromFleetFireToFleetAndWorlds.fromFleet, fromFleetFireToFleetAndWorlds.toFleet, fromFleetFireToFleetAndWorlds.fromHomeWorld, fromFleetFireToFleetAndWorlds.toHomeWorld, this.processCommand, this.commandPlayer);
    }

    //FaaAD
    findFromFleetFireToDShipsAndWorlds(): { fromFleet: Fleet, fromHomeWorld: World } {
        let counter = 0;
        let fromFleet: Fleet = null;
        let fromHomeWorld: World = null;

        for (const commantNumber of this.commandNumberArray) {
            switch (counter) {
                case FireFleetToDShipsEnum.FLEED:
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, commantNumber);
                    if (aFleetAndHomeWorld.fleet != null && aFleetAndHomeWorld.homeWorld != null) {
                        fromFleet = aFleetAndHomeWorld.fleet;
                        fromHomeWorld = aFleetAndHomeWorld.homeWorld;
                    }
                    break;
            }

            counter++
        }
        return { fromFleet, fromHomeWorld };
    }

    createFireFleetToDShipsCommand(): FireFleetToDShips {
        const fromFleetFireToDShipsAndWorlds = this.findFromFleetFireToDShipsAndWorlds();
        return new FireFleetToDShips(fromFleetFireToDShipsAndWorlds.fromFleet, fromFleetFireToDShipsAndWorlds.fromHomeWorld, this.processCommand, this.commandPlayer);
    }

    //DaaAFbb
    findFromDShipsFireToFleetAndWorlds(): { toFleet: Fleet, fromHomeWorld: World, toHomeWorld: World } {
        let counter = 0;
        let toFleet: Fleet = null;
        let fromHomeWorld: World = null;
        let toHomeWorld: World = null;

        for (const commantNumber of this.commandNumberArray) {
            switch (counter) {
                case FireDShipsToFleetEnum.FLEED:
                    fromHomeWorld = worldWithNumber(this.worlds, commantNumber);
                    break;
                case FireDShipsToFleetEnum.WORLD:
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, commantNumber)
                    if (aFleetAndHomeWorld.fleet != null && aFleetAndHomeWorld.homeWorld != null) {
                        toFleet = aFleetAndHomeWorld.fleet;
                        toHomeWorld = aFleetAndHomeWorld.homeWorld;
                        break;
                    }
                    counter++
            }
            return { toFleet, fromHomeWorld, toHomeWorld };
        }
    }

    createFireDShipsToFleetCommand(): FireDShipsToFleet {
        const fromDShipsFireToFleetAndWorlds = this.findFromDShipsFireToFleetAndWorlds();
        return new FireDShipsToFleet(fromDShipsFireToFleetAndWorlds.toFleet, fromDShipsFireToFleetAndWorlds.fromHomeWorld, fromDShipsFireToFleetAndWorlds.toHomeWorld, this.processCommand, this.commandPlayer)
    }

    findWorld(): World {
        let world: World = null;
        let counter = 0;

        for (const commantNumber of this.commandNumberArray) {
            switch (counter) {
                case AmbushOffForWorldEnum.WORLD:
                    world = worldWithNumber(this.worlds, commantNumber);
                    break;

                default:
                    break;
            }
            counter++
        }
        return world
    }

    // Znn
    createAmbushOffForWorld(): AmbushOffForWorld {
        const world = this.findWorld();
        return new AmbushOffForWorld(world, this.processCommand, this.commandPlayer);
    }

    //Z
    createAmbushOffForPlayer(): AmbushOffForPlayer {
        return new AmbushOffForPlayer(this.worlds, this.processCommand, this.commandPlayer);
    }

    //A=handel
    createTeammateForPlayer(): AddTeammate {
        return new AddTeammate(this.allPlayerDict, this.processCommand, this.commandPlayer);
    }

    //N=handel
    createRemoveTeammateForPlayer(): RemoveTeammate {
        return new RemoveTeammate(this.allPlayerDict, this.processCommand, this.commandPlayer);
    }

    getCommandElements(withProcessCommand: string): Array<string> {
        const result = new Array<string>();
        const charCount = withProcessCommand.length;
        let foundCommandElementEnd = false;
        let commandElement = '';
        let counter = 0;

        for (const aCharacter of withProcessCommand) {
            if (isCharacterANumber(aCharacter) === false) {
                if (counter !== 0) {
                    foundCommandElementEnd = true;
                }
                if (foundCommandElementEnd) {
                    result.push(commandElement);
                    commandElement = '';
                    foundCommandElementEnd = false;
                }
                commandElement += aCharacter;
            } else {
                commandElement += aCharacter;
            }
            counter++
            if (counter === charCount) {
                result.push(commandElement);
            }
        }
        return result;
    }

    getCommandNummerArray(withCommandElements: Array<string>): Array<number> {
        const result = new Array<number>();
        for (const commantElement of withCommandElements) {
            const aNumber = +extractNumberString(commantElement);
            result.push(aNumber);
        } return result;
    }

    executeCommands() {
        const commandArray: Array<Command> = new Array<Command>();

        for (const playerName of this.commandStringsDict.keys()) {
            const commands: Array<string> = this.commandStringsDict.get(playerName);

            for (const command of commands) {
                console.log(`Command: ${command}`);
                this.initMembers(command, playerName);

                const commandInstance = this.getCommandInstance();
                if (commandInstance !== null) {
                    if (commandInstance instanceof Command) {
                        commandArray.push(commandInstance);
                    }
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
                                result = null; //this.createUnloadingMetalCommand()
                                break;
                            case 'T':
                                if (this.commandChars.length === 3) {
                                    switch (this.commandChars.charAt(2)) {
                                        case 'F':
                                            result = this.createTransferShipsFleetToFleetCommand();
                                            break;
                                        case 'D':
                                            result = this.createTransferShipsFleetToDShipsCommand();
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
                                            result = null; //this.createFireFleetToFleetCommand();
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
                                        result = this.createBuildFleetShipCommand();
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
                        result = null //createAmbushOffForWorld()
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
