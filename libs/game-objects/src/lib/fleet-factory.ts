import { Dice } from './dice'
import { World, worldWithNumber } from './world';
import { Fleet } from './fleet';

export class FleetFactory {
    dice: Dice;
    fleetCount: number;
    
    constructor(aFleetCount: number) {
        this.dice = new Dice();
        this.fleetCount = aFleetCount;
    }
    
    createWithWorldArray(worldArray:Array <World>) {
        this.dice.setSites(worldArray.length)

        //Create Fleets
        for (let index = 1; index <= this.fleetCount; index++){
            const world: World = worldWithNumber(worldArray, this.dice.roll())

            if (world !== null) {
                const fleet = new Fleet();
                fleet.number = index;
                world.fleets.push(fleet);
            }
        }
    }

}
