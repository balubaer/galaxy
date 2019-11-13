import { GamePref } from './game-pref.interface';
import { World } from './world';
import { Player, isWorldOutPutForPlayer } from './player';
import { PersistenceManager } from './persistence-manager';
import { WorldsPersist } from './worlds-persist.interface';
import { CommandFactory } from './command-factory';
import { FinalPhaseCoreGame } from './final-phase-core-game';
import { OutputPlyerStatisticCoreGame } from './output-plyer-statistic-core-game';

export class ExecuteCommand {
    gamePref: GamePref;
    worlds: Array<World>;
    allPlayerDict: Map<string, Player>;

    constructor(gamePref: GamePref) {
        this.gamePref = gamePref;
    }

    createEnvironment(worldsPersist: WorldsPersist) {
        const pm = new PersistenceManager(new Array<World>());
        this.worlds = pm.createWorldsWithWorldsPersist(worldsPersist);
        this.allPlayerDict = pm.allPlayerDict;
    }

    start(commandsDict: Map<string, string>) {
        const commandFactory = new CommandFactory(this.worlds, this.allPlayerDict);
        commandFactory.coreGame = true;
        for (const playerName of this.allPlayerDict.keys()) {
            const commands = commandsDict.get(playerName);
            commandFactory.setCommandStringsWithLongString(playerName, commands);
        }
        commandFactory.executeCommands();

        const finalPhase = new FinalPhaseCoreGame(this.worlds, this.allPlayerDict);
        finalPhase.doFinal();

    }

    generateOutput(): Map<string, string> {
        const outputDict: Map<string, string> = new Map<string, string>();
        for (const playerName of this.allPlayerDict.keys()) {
            const player = this.allPlayerDict.get(playerName);
            let outPutString = `Infos zu Spieler: ${playerName} Runde: ${this.gamePref.round + 1} \n`;
            const outPutStatistic = new OutputPlyerStatisticCoreGame(this.worlds, player);
            outPutStatistic.calculateStatistic();
            outPutString += `${outPutStatistic.description}\n`;
            for (const world of this.worlds) {
                if (isWorldOutPutForPlayer(player, world)) {
                    outPutString += `${world.description()}\n\n`;
                }
            }
            outputDict.set(playerName, outPutString);
        }
        return outputDict;
    }

    generateResultWorlds(): WorldsPersist {
        const pm = new PersistenceManager(this.worlds);
        return pm.createWorldsPersist();
    }
}
