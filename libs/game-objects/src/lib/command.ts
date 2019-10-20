import { Player } from '..'

export interface ExecuteCommand {
    executeCommand(): void;
}

export const TurnPhase = {
    Initial: 1,
    Unloading: 2,
    Transfer: 3,
    Building: 4,
    Loading: 5,
    Combat: 6,
    Movement: 7,
    Final: 8
}

Object.freeze(TurnPhase);

export class Command {
    string: string;
    player: Player;
    //errors: Array<T>;
    turnPhase: number;
    
    constructor(aString: string, aPlayer: Player, aTurnPhase: number) {
        this.string = aString;
        this.player = aPlayer;
        this.turnPhase = aTurnPhase;
    }
}