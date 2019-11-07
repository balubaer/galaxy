import { Player, isWorldOwnedByPlayer, isFleetOwnedByPlayer } from './player'
import { World } from './world'

export class OutputPlyerStatisticCoreGame {
     player: Player;
     worlds: Array <World>;
     worldsCount: number;
     fleetCount: number;
     shipsOnFleetsCount: number;
     dShipCount: number;
    
     description(): string {
         let desc = `Punkte: ${this.player.points} | `;
        desc += `Worlden: ${this.worldsCount} | `;
        desc += `Flotten: ${this.fleetCount} | `;
        desc += `Schiffe auf Flotten: ${this.shipsOnFleetsCount} | `;
        desc += `D-Schiffe: ${this.dShipCount}\n`;
        desc += this.teammatesDescription();
        return desc;
    }
    
    constructor(aWorlds: Array <World>, aPlayer: Player) {
        this.player = aPlayer
        this.worlds = aWorlds
        this.worldsCount = 0
        this.fleetCount = 0
        this.shipsOnFleetsCount = 0
        this.dShipCount = 0
    }
    
     teammatesDescription(): string {
         let desc = 'Verbündete: ';
         let counter = 0;
        
        desc += '('
         const teammateNames = this.player.teanmatesNames();
        //TODO: teammateNames.sortInPlace { $0 < $1 }
        const namesCount = teammateNames.length;
        for (const name of teammateNames) {
            desc += `${name}`;
            if (counter < (namesCount - 1)) {
                desc += ',';
            }
            counter++;
        }
        desc += ')\n'
        return desc;
    }
    
     calculateStatistic() {
        for (const world of this.worlds) {
            //Test World
            if (isWorldOwnedByPlayer(this.player, world)) {
                this.worldsCount++
                this.dShipCount = this.dShipCount + world.dShips;
            }
            
            for (const fleet of world.fleets) {
                //Test Fleets
                if (isFleetOwnedByPlayer(this.player, fleet)) {
                    this.fleetCount++;
                    this.shipsOnFleetsCount = this.shipsOnFleetsCount + fleet.ships;
                }
            }
        }
    }
}
