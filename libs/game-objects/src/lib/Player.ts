export class Player {
    playerName: string;
    points: number;
    //role: Role?
    ambushOff: boolean;
    teammates: Set<Player> = new Set();

    constructor(name: string) {
        this.playerName = name;
    }

    stringName(): string {
        return `[${this.playerName}]`;
    }
}