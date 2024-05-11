import { World } from './world';
import { Player } from './player';

export class CommandsFromWorld {

    worlds: Array<World>;
    player: Player;
    round: number;

    constructor(aWorldArray: Array<World>, aPlayer: Player, aRound: number) {
        this.worlds = aWorldArray;
        this.player = aPlayer;
        this.round = aRound;
    }
}
