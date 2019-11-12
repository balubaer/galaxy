import { GamePref } from './game-pref';
import { World } from './world';
import { PortFactory } from './portfactory';
import { FleetFactory } from './fleet-factory';
import { PlayerFactory } from './player-factory';
import { PersistenceManager } from './persistence-manager';
import { WorldsPersist } from './worlds-persist';
import { Player, isWorldOutPutForPlayer } from './player';

export class OutPutLists {
    gamePref: GamePref;
    worlds: Array<World>;
    allPlayerDict: Map<string, Player>;

    constructor(gamePref: GamePref) {
        this.gamePref = gamePref;
    }

    generate(worldsPersist: WorldsPersist): Map<string, string> {
        const result: Map<string, string> = new Map<string, string>();
        const pm = new PersistenceManager(new Array<World>());
        this.worlds = pm.createWorldsWithWorldsPersist(worldsPersist);
        this.allPlayerDict = pm.allPlayerDict;

        for (const key of this.allPlayerDict.keys()) {
            let outPutString = `Infos zu Spieler: ${key} Runde: ${this.gamePref.round + 1}\n\n`;
            const player = this.allPlayerDict.get(key);

            for (const world of this.worlds) {
                if (isWorldOutPutForPlayer(player, world)) {
                    outPutString += `${world.description()}\n\n`;
                }
                
            }
            result.set(key, outPutString);
        }
        return result;
    }
}
