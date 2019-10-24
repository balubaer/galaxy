import { Player } from "..";

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
	hitAmbuschFleets: Array<number> = null;
		    
	

	//TODO: niklas Kunstwerke ... V70:Plastik Mondstein
	//TODO: niklas schenken

    player: Player = null;


	constructor() {
		//TODO: fleetMovements = new ArrayList<FleetMovement>();
		this.hitAmbuschFleets = new Array<number>();
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
}