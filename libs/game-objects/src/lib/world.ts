import { Port } from './port';
import { Fleet } from './fleet';
import { Player } from './player';
import { createBracketAndCommarStringWithStringArray } from './utils';
import { FleetMovement } from './fleet-movement';
import { NumberKey } from './number-key.interface';

export function worldWithNumber(worlds: Array<World>, number: number): World {
    let aResult: World = null;
    for (const aWorld of worlds) {
        if (aWorld.number === number) {
            aResult = aWorld;
            break;
        }
    }
    return aResult;
}

export function worldWithName(worlds: Array<World>, name: string): World {
    let aResult: World = null;
    for (const aWorld of worlds) {
        if (aWorld.name === name) {
            aResult = aWorld;
            break;
        }
    }
    return aResult;
}

export class World implements NumberKey {
    number: number;
    name: string;
    port: Port = null;
    fleets: Array<Fleet> = null;
    fleetMovements: Array<FleetMovement> = null;
    player: Player = null;
    dShips: number;
    dShipsAmbush: boolean;
    dShipsFired: boolean;
    dShipsFiredFleet: Fleet = null;

    ambushOff: boolean;
    hitAmbuschFleets: Array<Fleet>;
    hitedShotsDShips = 0;

    constructor() {
        this.fleets = new Array<Fleet>();
        this.fleetMovements = new Array<FleetMovement>();
        this.hitAmbuschFleets = new Array<Fleet>();
        this.dShips = 0;
        this.ambushOff = false;
        this.dShipsFired = false;
    }

    setNumber(aNumber: number) {
        this.number = aNumber;
        this.name = `W${this.number}`;
    }

    createResourceString(): string {
        const resourceArray: Array<string> = new Array<string>();
        let aResult = '';

        if (this.ambushOff === true) {
            resourceArray.push('Ambush "Aus" für diese Runde!!!');
        }
        if (this.dShips !== 0) {
            if (this.dShipsAmbush === true) {
                let desc = `D-Schiffe=${this.dShips} (Ambusch: {`;
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
                desc += ')';

                resourceArray.push(desc);
            } else if (this.dShipsFired === true) {
                if (this.dShipsFiredFleet !== null) {
                    resourceArray.push(`D-Schiffe=${this.dShips} (feuert auf ${this.dShipsFiredFleet.name()})`);
                }
            } else {
                resourceArray.push(`D-Schiffe=${this.dShips}`);
            }
        }
        if (resourceArray.length !== 0) {

            aResult = createBracketAndCommarStringWithStringArray(resourceArray);
        }
        return aResult;
    }

    description(): string {
        let desc = this.name;
        if (this.port !== null) {
            desc = this.port.description();
        }
        if (this.player !== null) {
            desc += ` ${this.player.stringName()}`;
        }

        const resouceString = this.createResourceString();

        if (resouceString.length !== 0) {
            desc += ' ';
            desc += resouceString;
        }

        if (this.fleets.length > 0) {
            for (const fleet of this.fleets) {
                desc += '\n   '
                desc += fleet.description();
            }
        }

        let fleetMovementsCount = 0;
        if (this.fleetMovements !== null) {
            fleetMovementsCount = this.fleetMovements.length;
        }

        if (fleetMovementsCount > 0) {
            let counter = 0;

            desc += '\n   (';
            for (const fleetMovement of this.fleetMovements) {
                desc += fleetMovement.description();
                counter++;
                if (counter < fleetMovementsCount) {
                    desc += '';
                }
            }
            desc += ')';
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

    hasConnectionToWorld(aWorld: World): boolean {
        let result = false;
        if (this.port !== null) {
            result = this.port.hasConnectionToWorld(aWorld);
        }
        return result;
    }
}