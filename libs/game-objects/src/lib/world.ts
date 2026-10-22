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

/** Classic-Werte einer Welt, wie sie an die Karte im Frontend geliefert werden. */
export interface ClassicWorldInfo {
    blackHole: boolean;
    population: number;
    populationLimit: number;
    industry: number;
    metal: number;
    mines: number;
    turnsOwned: number;
    iShips: number;
    pShips: number;
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

    // Classic Game: Wirtschaft der Welt (im Core Game immer 0).
    population = 0;
    populationLimit = 0;
    industry = 0;
    metal = 0;
    mines = 0;
    /** Runden im Besitz des aktuellen Eigners, zählt 1..7 und beginnt dann wieder bei 1. */
    turnsOwned = 0;
    iShips = 0;
    pShips = 0;
    blackHole = false;

    // Rundenzustand der Classic-Wirtschaft, wird nicht gespeichert und am Rundenende zurückgesetzt.
    /** Metall, das in dieser Runde entladen wurde und erst nächste Runde zum Bauen bereitsteht. */
    unloadedMetal = 0;
    /** Noch verfügbare nutzbare Industrie dieser Runde, null bis zum ersten Bauen. */
    buildBudget: number | null = null;
    /** Bevölkerung, die in dieser Runde an der Industrie arbeitet (fehlt dann in den Minen). */
    industryWorkers = 0;
    /** Zielwelt der Migration dieser Runde (pro Welt nur eine). */
    migratesTo: World | null = null;
    /** Geschenk dieser Runde an einen anderen Spieler, wird am Rundenende vollzogen. */
    giftTo: Player | null = null;

    ambushOff: boolean;
    hitAmbuschFleets: Array<Fleet>;
    hitedShotsDShips = 0;
    /** Spieler, die in dieser Runde auf der Welt beschossen wurden oder Welt bzw. Flotten verloren haben (nur für den Bericht). */
    reportPlayers: Array<Player>;
    /** Hinweise zu Eroberung und Neutralisierung in dieser Runde (nur für den Bericht). */
    events: Array<string>;

    constructor() {
        this.fleets = new Array<Fleet>();
        this.fleetMovements = new Array<FleetMovement>();
        this.hitAmbuschFleets = new Array<Fleet>();
        this.reportPlayers = new Array<Player>();
        this.events = new Array<string>();
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
        if (this.dShipsFired === true && this.dShipsFiredFleet !== null) {
            // Auch anzeigen, wenn die D-Schiffe danach selbst zerstört wurden.
            resourceArray.push(`D-Schiffe=${this.dShips} (feuert auf ${this.dShipsFiredFleet.name()})`);
        } else if (this.dShips !== 0) {
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
            } else {
                resourceArray.push(`D-Schiffe=${this.dShips}`);
            }
        }
        if (resourceArray.length !== 0) {

            aResult = createBracketAndCommarStringWithStringArray(resourceArray);
        }
        return aResult;
    }

    /** Hat die Welt Classic-Werte (Wirtschaft, I-/P-Schiffe oder Schwarzes Loch)? Im Core Game immer false. */
    isClassic(): boolean {
        return this.blackHole || this.population > 0 || this.populationLimit > 0 || this.industry > 0
            || this.metal > 0 || this.mines > 0 || this.iShips > 0 || this.pShips > 0 || this.turnsOwned > 0;
    }

    /** Werte der Welt für Bericht und Karte, null im Core Game. */
    classicInfo(): ClassicWorldInfo | null {
        if (this.isClassic() === false) {
            return null;
        }
        return {
            blackHole: this.blackHole,
            population: this.population,
            populationLimit: this.populationLimit,
            industry: this.industry,
            metal: this.metal,
            mines: this.mines,
            turnsOwned: this.turnsOwned,
            iShips: this.iShips,
            pShips: this.pShips,
        };
    }

    createClassicString(): string {
        if (this.blackHole) {
            return '(Schwarzes Loch)';
        }
        if (this.isClassic() === false) {
            return '';
        }
        const parts = [
            `Bev=${this.population}/${this.populationLimit}`,
            `Ind=${this.industry}`,
            `Metall=${this.metal}`,
            `Minen=${this.mines}`,
            `I-Schiffe=${this.iShips}`,
            `P-Schiffe=${this.pShips}`,
        ];
        if (this.player !== null) {
            parts.push(`Besitz seit ${this.turnsOwned}`);
        }
        return createBracketAndCommarStringWithStringArray(parts);
    }

    description(): string {
        let desc = this.name;
        if (this.port !== null) {
            desc = this.port.description();
        }
        if (this.player !== null) {
            desc += ` ${this.player.stringName()}`;
        }

        const classicString = this.createClassicString();
        if (classicString.length !== 0) {
            desc += ` ${classicString}`;
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

        for (const event of this.events) {
            desc += `\n   >> ${event}`;
        }

        return desc;
    }

    addReportPlayer(aPlayer: Player) {
        if (aPlayer !== null && aPlayer !== undefined && this.reportPlayers.indexOf(aPlayer) === -1) {
            this.reportPlayers.push(aPlayer);
        }
    }

    addEvent(event: string) {
        this.events.push(event);
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