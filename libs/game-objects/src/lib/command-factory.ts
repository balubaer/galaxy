import { World, worldWithNumber } from './world';
import { Player } from './player';
import { Fleet, fleetAndHomeWorldWithNumber } from './fleet';
import { extractNumberString, isCharacterANumber, extractCharsFromString } from './utils';
import { playerForHandle, MoveCommand, Command, ExecuteCommand, compareCommand, BuildDShips, BuildFleetShip, TransferShipsFleetToFleet, BuildFleetShipEnum, MoveCommandEnum, TransferShipsFleetToFleetEnum, TransferShipsFleetToDShipsEnum, TransferShipsFleetToDShips, TransferDShipsToFleetEnum, TransferDShipsToFleet, FireFleetToFleet, AmbushOffForPlayer, AddTeammate, RemoveTeammate, FireFleetToFleetEnum, FireDShipsToFleetEnum, FireFleetToDShipsEnum, FireDShipsToFleet, AmbushOffForWorldEnum, AmbushOffForWorld, FireFleetToDShips, StandByCommand } from './command';
import { GameType } from './game-pref.interface';
import {
    UnloadMetal, JettisonMetal, LoadMetal, BuildShips, BuildIndustry, RaisePopulationLimit, ScrapIShips, MigratePopulation,
    BuildDefaultIShips, TransferShipsClassic, SetAtPeace, SetRelation, RelationKind, GiveFleet, GiveWorld
} from './classic-commands';
import { CommandError, NotInCoreGame_Error, NotInClassicGame_Error, UnknownCommand_Error } from './error';

export interface CommandErrorEntry {
    command: string;
    error: CommandError;
}

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
    /** Spieltyp, nach dessen Regeln Befehle ausgeführt werden; null führt nichts aus (nur Parser). */
    gameType: GameType | null = null;
    /** Abgelehnte Befehle pro Spieler, für den Bericht. */
    commandErrors: Map<string, Array<CommandErrorEntry>> = new Map();

    get coreGame(): boolean {
        return this.gameType === 'core';
    }

    set coreGame(value: boolean) {
        this.gameType = value ? 'core' : null;
    }

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
        if (commandString !== undefined && commandString !== null) {
            // Groß-/Kleinschreibung spielt bei Befehlen keine Rolle.
            const stringArray = commandString.toUpperCase().split(/\s+/);
            const aSet = new Set();
            const array = new Array();

            for (const aString of stringArray) {
                if (aString.length > 0) {
                    aSet.add(aString);
                }
            }

            for (const aString of aSet) {
                array.push(aString);
            }

            this.commandStringsDict.set(playerName, array);
        }
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
                default:
                    // Unbekannte Welten bleiben als null stehen, MoveCommand meldet sie; mehr als drei Welten ebenso.
                    worldArray.push(worldWithNumber(this.worlds, commantNumber));
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
                case FireDShipsToFleetEnum.WORLD:
                    fromHomeWorld = worldWithNumber(this.worlds, commantNumber);
                    break;
                case FireDShipsToFleetEnum.FLEED:
                    const aFleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, commantNumber)
                    if (aFleetAndHomeWorld.fleet != null && aFleetAndHomeWorld.homeWorld != null) {
                        toFleet = aFleetAndHomeWorld.fleet;
                        toHomeWorld = aFleetAndHomeWorld.homeWorld;
                    }
                    break;
            }
            counter++
        }
        return { toFleet, fromHomeWorld, toHomeWorld };
    }

    createFireDShipsToFleetCommand(): FireDShipsToFleet {
        const fromDShipsFireToFleetAndWorlds = this.findFromDShipsFireToFleetAndWorlds();
        return new FireDShipsToFleet(fromDShipsFireToFleetAndWorlds.toFleet, fromDShipsFireToFleetAndWorlds.fromHomeWorld, fromDShipsFireToFleetAndWorlds.toHomeWorld, this.processCommand, this.commandPlayer)
    }

    //FaaS
    createStandByCommand(): StandByCommand {
        const fleetAndHomeWorld = fleetAndHomeWorldWithNumber(this.worlds, this.commandNumberArray[CommandFactory.FLEET_INDEX]);
        return new StandByCommand(fleetAndHomeWorld.fleet, this.processCommand, this.commandPlayer);
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
            const numberString = extractNumberString(commantElement);
            if (numberString.length > 0) {
                const aNumber = +numberString;
                result.push(aNumber);
            }
        } return result;
    }

    executeCommands() {
        const commandArray: Array<Command> = new Array<Command>();

        for (const playerName of this.commandStringsDict.keys()) {
            const commands: Array<string> = this.commandStringsDict.get(playerName);

            if (this.allPlayerDict.has(playerName) === false) {
                continue;
            }

            for (const command of commands) {
                this.initMembers(command, playerName);

                if (this.coreGame && this.isBuildFleetShipCommand()) {
                    // Im Core Game entstehen Schiffe nur als D-Schiffe auf den Welten.
                    this.addError(playerName, command, NotInCoreGame_Error);
                    continue;
                }

                if (this.gameType === 'classic' && this.isDShipCommand()) {
                    // Im Classic Game gibt es keine D-Schiffe, nur I- und P-Schiffe.
                    this.addError(playerName, command, NotInClassicGame_Error);
                    continue;
                }

                const commandInstance = this.getCommandInstance();
                if (commandInstance instanceof Command) {
                    commandArray.push(commandInstance);
                } else {
                    this.addError(playerName, command, UnknownCommand_Error);
                }
            }
        }

        if (this.gameType !== null) {
            if (this.gameType === 'classic') {
                for (const aPlayerName of this.allPlayerDict.keys()) {
                    const player = this.allPlayerDict.get(aPlayerName);
                    commandArray.push(new BuildDefaultIShips(this.worlds, player) as Command);
                }
            }
            if (this.coreGame) {
                for (const aPlayerName of this.allPlayerDict.keys()) {
                    const player = this.allPlayerDict.get(aPlayerName);
                    const buildDShips = new BuildDShips(this.worlds, player)
                    commandArray.push(buildDShips as Command);
                }
            }

            commandArray.sort(compareCommand);

            for (const command of commandArray) {
                const executeCommand = command as unknown as ExecuteCommand;
                executeCommand.executeCommand();
                for (const error of command.errors) {
                    this.addError(command.player.playerName, command.string, error);
                }
            }
        }
    }

    addError(playerName: string, command: string, error: CommandError) {
        if (this.commandErrors.has(playerName) === false) {
            this.commandErrors.set(playerName, new Array<CommandErrorEntry>());
        }
        this.commandErrors.get(playerName).push({ command, error });
    }

    isDShipCommand(): boolean {
        return ['FTD', 'FAD', 'DAF', 'DTF'].indexOf(this.commandChars) !== -1;
    }

    /** Zahl hinter dem Befehlsbuchstaben, null wenn sie fehlt. */
    private optionalAmount(index: number): number | null {
        return this.commandNumberArray.length > index ? this.commandNumberArray[index] : null;
    }

    private fleetAndWorld(number: number): { fleet: Fleet, homeWorld: World } {
        return fleetAndHomeWorldWithNumber(this.worlds, number);
    }

    /**
     * Befehle des Classic Games (Wirtschaft). undefined, wenn der Befehl kein Classic-Befehl ist
     * und wie im Core Game behandelt wird; null, wenn er ein Classic-Befehl mit falscher Form ist.
     */
    getClassicCommandInstance(): Command | null | undefined {
        const numbers = this.commandNumberArray;
        const player = this.commandPlayer;
        const text = this.processCommand;

        // Befehle mit Spielername (Name kann Ziffern enthalten), daher nicht über die Befehlsbuchstaben.
        const relation = /^([ANLX])=(.+)$/.exec(text);
        if (relation) {
            const kinds: { [letter: string]: RelationKind } = { A: 'ally', N: 'noAlly', L: 'loader', X: 'noLoader' };
            return new SetRelation(playerForHandle(this.allPlayerDict, text), kinds[relation[1]], text, player);
        }
        const fleetGift = /^F(\d+)G=(.+)$/.exec(text);
        if (fleetGift) {
            return new GiveFleet(this.fleetAndWorld(+fleetGift[1]).fleet,
                playerForHandle(this.allPlayerDict, text.replace(/^F\d+G=/, '--')), text, player);
        }
        const worldGift = /^W(\d+)G=(.+)$/.exec(text);
        if (worldGift) {
            return new GiveWorld(worldWithNumber(this.worlds, +worldGift[1]),
                playerForHandle(this.allPlayerDict, text.replace(/^W\d+G=/, '--')), text, player);
        }

        switch (this.commandChars) {
            case 'FQ':
            case 'FX':
                return numbers.length === 1
                    ? new SetAtPeace(this.fleetAndWorld(numbers[0]).fleet, this.commandChars === 'FQ', text, player)
                    : null;
            case 'FTI':
            case 'FTP': {
                if (numbers.length !== 2) {
                    return null;
                }
                const found = this.fleetAndWorld(numbers[0]);
                return new TransferShipsClassic(found.homeWorld, found.fleet,
                    this.commandChars === 'FTI' ? 'I' : 'P', numbers[1], text, player);
            }
            case 'ITF':
            case 'PTF': {
                if (numbers.length !== 3) {
                    return null;
                }
                return new TransferShipsClassic(worldWithNumber(this.worlds, numbers[0]),
                    this.commandChars === 'ITF' ? 'I' : 'P', this.fleetAndWorld(numbers[2]).fleet, numbers[1], text, player);
            }
            case 'ITP':
            case 'PTI':
                return numbers.length === 2
                    ? new TransferShipsClassic(worldWithNumber(this.worlds, numbers[0]),
                        this.commandChars === 'ITP' ? 'I' : 'P', this.commandChars === 'ITP' ? 'P' : 'I', numbers[1], text, player)
                    : null;
            case 'FU':
            case 'FN':
            case 'FJ':
            case 'FL': {
                if (numbers.length < 1 || numbers.length > 2) {
                    return null;
                }
                const found = this.fleetAndWorld(numbers[0]);
                const amount = this.optionalAmount(1);
                switch (this.commandChars) {
                    case 'FU': return new UnloadMetal(found.fleet, found.homeWorld, amount, false, text, player);
                    case 'FN': return new UnloadMetal(found.fleet, found.homeWorld, amount, true, text, player);
                    case 'FJ': return new JettisonMetal(found.fleet, found.homeWorld, amount, text, player);
                    default: return new LoadMetal(found.fleet, found.homeWorld, amount, text, player);
                }
            }
            case 'WBI':
            case 'WBP':
                if (numbers.length !== 2) {
                    return null;
                }
                return new BuildShips(worldWithNumber(this.worlds, numbers[0]), numbers[1],
                    this.commandChars === 'WBI' ? 'I' : 'P', text, player);
            case 'WBF': {
                if (numbers.length !== 3) {
                    return null;
                }
                return new BuildShips(worldWithNumber(this.worlds, numbers[0]), numbers[1],
                    this.fleetAndWorld(numbers[2]).fleet, text, player);
            }
            case 'WII':
                return numbers.length === 2 ? new BuildIndustry(worldWithNumber(this.worlds, numbers[0]), numbers[1], text, player) : null;
            case 'WIL':
                return numbers.length === 2 ? new RaisePopulationLimit(worldWithNumber(this.worlds, numbers[0]), numbers[1], text, player) : null;
            case 'WS':
                return numbers.length === 2 ? new ScrapIShips(worldWithNumber(this.worlds, numbers[0]), numbers[1], text, player) : null;
            case 'PMW':
                return numbers.length === 3
                    ? new MigratePopulation(worldWithNumber(this.worlds, numbers[0]), numbers[1], worldWithNumber(this.worlds, numbers[2]), text, player)
                    : null;
            default:
                return undefined;
        }
    }

    isBuildFleetShipCommand(): boolean {
        return this.commandChars === 'WBF';
    }

    getCommandInstance(): Object {
        let result: Object = null;
        if (this.gameType === 'classic') {
            const classicCommand = this.getClassicCommandInstance();
            if (classicCommand !== undefined) {
                return classicCommand;
            }
        }
        if (this.commandChars !== null) {
            if (this.commandChars.length >= 2) {
                switch (this.commandChars.charAt(0)) {
                    case 'F':
                        switch (this.commandChars.charAt(1)) {
                            case 'W':
                                if (/^FW+$/.test(this.commandChars)) {
                                    result = this.createMoveCommand();
                                }
                                break;
                            case 'S':
                                if (this.commandChars.length === 2) {
                                    result = this.createStandByCommand();
                                }
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
                                            result = this.createFireFleetToFleetCommand();
                                            break;
                                        case 'D':
                                            result = this.createFireFleetToDShipsCommand();
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
                                        result = this.createFireDShipsToFleetCommand();
                                    }
                                }
                                break;
                            case 'T':
                                if (this.commandChars.length === 3) {
                                    if (this.commandChars.charAt(2) === 'F') {
                                        result = this.createTransferDShipsToFleetCommand();
                                    }
                                }
                                break;
                            default:
                                result = null;
                                break;
                        }
                        break;
                    case 'Z':
                        result = this.createAmbushOffForWorld();
                        break;
                    case 'A':
                        if (this.commandChars.charAt(1) === '=') {
                            result = this.createTeammateForPlayer();
                        }
                        break;
                    case 'N':
                        if (this.commandChars.charAt(1) === '=') {
                            result = this.createRemoveTeammateForPlayer();
                        }
                        break;
                    default:
                        result = null;
                        break;
                }
            } else if (this.commandChars.length === 1) {
                switch (this.commandChars.charAt(0)) {
                    case 'Z':
                        if (this.processCommand.length === 1) {
                            result = this.createAmbushOffForPlayer();
                        } else {
                            result = this.createAmbushOffForWorld();
                        }
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