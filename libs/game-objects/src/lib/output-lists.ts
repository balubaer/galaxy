import { GamePref } from './game-pref.interface';
import { World } from './world';
import { PersistenceManager } from './persistence-manager';
import { WorldsPersist } from './worlds-persist.interface';
import { Player, isWorldOutPutForPlayer } from './player';
import { OutPutStringWithNodesAndLinksInterface } from './out-put-string-with-nodes-and-links.interface';
import { PersistenceGrafManager } from './persistence-graf-manager';

export class OutPutLists {
    gamePref: GamePref;
    worlds: Array<World>;
    allPlayerDict: Map<string, Player>;
    colorMap: Map<string, string>;
    fontColorMap: Map<string, string>;

    constructor(gamePref: GamePref) {
        this.gamePref = gamePref;
    }

    generate(worldsPersist: WorldsPersist): Map<string, OutPutStringWithNodesAndLinksInterface> {
        const result: Map<string, OutPutStringWithNodesAndLinksInterface> = new Map<string, OutPutStringWithNodesAndLinksInterface>();
        const pm = new PersistenceManager(new Array<World>());
        this.worlds = pm.createWorldsWithWorldsPersist(worldsPersist);
        this.allPlayerDict = pm.allPlayerDict;

        for (const playerName of this.allPlayerDict.keys()) {
            const persistGrafManager = new PersistenceGrafManager(this.worlds, this.allPlayerDict, this.colorMap, this.fontColorMap);
            const nodesAndLinks = persistGrafManager.generateNodesAndLinks(playerName);

            let outPutString = `Infos zu Spieler: ${playerName} Runde: ${this.gamePref.round + 1}\n\n`;
            const player = this.allPlayerDict.get(playerName);

            for (const world of this.worlds) {
                if (isWorldOutPutForPlayer(player, world)) {
                    outPutString += `${world.description()}\n\n`;
                }
                
            }
            result.set(playerName, {
                outPutString: outPutString,
                nodesAndLinks: nodesAndLinks
            });
        }
        return result;
    }
}
