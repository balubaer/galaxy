import { Port } from './port';
import { Fleet } from './fleet';
import { Player } from './player';
import { createBracketAndCommarStringWithStringArray } from './utils';
import { FleetMovement } from './fleet-movement';

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

export class World {
    number: number;
    name: string;
    port: Port;
    fleets: Array<Fleet>;
    fleetMovements: Array<FleetMovement>;
    player: Player;
    round: number;
    dShips: number;
    dShipsAmbush: number;
    dShipsFired: boolean;
    dShipsFiredFleet: Fleet;

    ambushOff: boolean;
    hitAmbuschFleets: Array<Fleet>;

    constructor() {
        this.fleets = new Array<Fleet>();
    }

    setNumber(aNumber: number) {
        this.name = `W${this.number}`;
        this.number = aNumber;
    }

    createResourceString(): string {
        const resourceArray: Array<string> = new Array<string>();
        let aResult = '';

        if (this.ambushOff === true) {
            resourceArray.push('Ambush "Aus" für diese Runde!!!');
        }
        if (this.round !== 0) {
            resourceArray.push(`Runden=${this.round}`)
        }
        if (this.dShips !== 0) {
            if (this.dShipsAmbush === 0) {
                let desc = `D-Schiffe=${this.dShips} (Ambusch: {`;
                if (this.hitAmbuschFleets.length > 0) {
                    let counter = 0;

                    for (const fleet of this.hitAmbuschFleets) {
                        desc += fleet.name;
                        counter++;
                        if (counter < this.hitAmbuschFleets.length) {
                            desc += ", "
                        }
                    }
                    desc += "}"
                }
                desc += ")"

                resourceArray.push(desc);
            } else if (this.dShipsFired === true) {
                if (this.dShipsFiredFleet !== null) {
                    resourceArray.push(`D-Schiffe=${this.dShips} (feuert auf ${this.dShipsFiredFleet.name})`);
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
        let desc = self.name
        if (this.port !== null) {
            desc = this.port.description;
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
                desc += fleet.name();
            }
        }

        const fleetMovementsCount = this.fleetMovements.length;

        if (fleetMovementsCount > 0) {
            let counter = 0;

            desc += '\n   (';
            for (const fleetMovement of this.fleetMovements) {
                desc += fleetMovement.description
                counter++
                if (counter < fleetMovementsCount) {
                    desc += '';
                }
            }
            desc += ')';
        }

        return desc;
    }
}
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

    func hasConnectionToPlanet(aPlant: Planet) -> Bool {
    var result = false
    if port != nil {
        result = port!.hasConnectionToPlanet(aPlant)
    }
    return result
}
    
    */