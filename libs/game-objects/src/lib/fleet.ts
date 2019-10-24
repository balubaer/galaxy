import { Player } from "..";
import { createBracketAndCommarStringWithStringArray } from './utils';
//TODO:
/*
func fleetAndHomePlanetWithNumber(planets:Array<Planet>, number:Int) -> (fleet:Fleet?, homePlanet:Planet?) {
    var fleet:Fleet? = nil
    var homePlanet:Planet? = nil
    for planet in planets {
        for aFleet in planet.fleets {
            if aFleet.number == number {
                fleet = aFleet
                homePlanet = planet
                break
            }
        }
    }
    
    return (fleet, homePlanet)
}

*/
export class Fleet {
	number: number;
	ships: number;
	ambush: boolean;
	hitedShots: number;
	//public ArrayList<FleetMovement> fleetMovements;
	fired: boolean;
	firesTo: string;
	firesToCommand: string;
	moved: boolean;
	hitAmbuschFleets: Array<Fleet> = null;
		    
	

	//TODO: niklas Kunstwerke ... V70:Plastik Mondstein
	//TODO: niklas schenken

    player: Player = null;


	constructor() {
		//TODO: fleetMovements = new ArrayList<FleetMovement>();
		this.hitAmbuschFleets = new Array<Fleet>();
		this.moved = false;
		this.fired = false;
    }
    
    name(): string {
        let result = `F${this.number}`;
		if (this.player !== null && this.player !== undefined) {
			result = `${result}${this.player.stringName()}`;
		} else {
			result = `${result}[---]`;
		}
		return result;
	}

	createInfoString(): string {
		const infoArray:Array <string> = new Array<string>();
        let result = '';
        
        if (this.moved === true) {
            infoArray.push('bewegt');
        }
        if (this.ambush === true) {
            let desc = 'Ambush: {';
            if (this.hitAmbuschFleets.length > 0) {
                let counter = 0;
                
                for (const fleet of this.hitAmbuschFleets) {
                    desc += fleet.name();
                    counter++;
                    if (counter < this.hitAmbuschFleets.length) {
                        desc += ', ';
                    }
                }
                desc += '}';
            }
            infoArray.push(desc)
        }
        if (this.fired === true) {
            infoArray.push(`feuert auf ${this.firesTo}`);
        }
        
        if (infoArray.length !== 0) {
            
            result = createBracketAndCommarStringWithStringArray(infoArray);
        }

        return result;
	}

	description(): string {
        let desc = `${this.name()} = ${this.ships}`;
        
        const infoString = this.createInfoString();
        
        if (infoString.length !== 0) {
            desc += " ";
            desc += infoString;
        }
        
        return desc;
	}
	//TODO:
	/*
	    func addHitAmbushFleets(aFleet: Fleet) {
        if hitAmbuschFleets.contains(aFleet) != true {
            let fleetClone = Fleet();
            fleetClone.player = aFleet.player
            fleetClone.ships = aFleet.ships
            fleetClone.number = aFleet.number
            hitAmbuschFleets.append(fleetClone)
        }
    }
*/
}