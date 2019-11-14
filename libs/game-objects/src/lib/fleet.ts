import { createBracketAndCommarStringWithStringArray } from './utils';
import { FleetMovement } from './fleet-movement';
import { World } from './world';
import { Player } from './player';
import { NumberKey } from './number-key.interface';

export function fleetAndHomeWorldWithNumber(worlds: Array<World>, number: number): { fleet: Fleet, homeWorld: World} {
    let fleet: Fleet = null;
    let homeWorld: World = null;
    for (const world of worlds) {
        for (const aFleet of world.fleets) {
            if (aFleet.number === number) {
                fleet = aFleet;
                homeWorld = world;
                break;
            }
        }
    }

    return {fleet, homeWorld};
}

export class Fleet implements NumberKey {
    number: number;
    ships: number;
    ambush: boolean;
    hitedShots: number;
    fleetMovements: Array<FleetMovement>;
    fired: boolean;
    firesTo: string;
    firesToCommand: string;
    moved: boolean;
    hitAmbuschFleets: Array<Fleet> = null;



    //TODO: niklas Kunstwerke ... V70:Plastik Mondstein
    //TODO: niklas schenken

    player: Player = null;


    constructor() {
        this.fleetMovements = new Array<FleetMovement>();
        this.hitAmbuschFleets = new Array<Fleet>();
        this.moved = false;
        this.fired = false;
        this.ships = 0;
        this.hitedShots = 0;
        this.ambush = false;
        this.firesTo = '';
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
        const infoArray: Array<string> = new Array<string>();
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
            desc += ' ';
            desc += infoString;
        }

        return desc;
    }

    addHitAmbushFleets(aFleet: Fleet) {
        if (this.hitAmbuschFleets.indexOf(aFleet) === -1) {
            const fleetClone = new Fleet();
            fleetClone.player = aFleet.player;
            fleetClone.ships = aFleet.ships;
            fleetClone.number = aFleet.number;
            this.hitAmbuschFleets.push(fleetClone);
        }
    }
}