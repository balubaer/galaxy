export class Player {
    playerName: string;
    points: number;
    //role: Role?
    ambushOff: boolean;
   // var teammates: Set <Player> = Set()
  
   constructor(name: string) {
       this.playerName = name;
   }

   stringName(): string {
       return `[${this.playerName}]`;
   }
}