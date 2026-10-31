import { artifactPoints, ownedArtifacts } from './classic-artifacts';
import { Player, isWorldOwnedByPlayer, isFleetOwnedByPlayer, CHARACTER_TYPE_NAMES } from './player';
import { World } from './world';

/** Übersicht eines Spielers im Classic Game für den Rundenbericht. */
export class OutputPlayerStatisticClassicGame {
    worldsCount = 0;
    population = 0;
    industry = 0;
    mines = 0;
    metalOnWorlds = 0;
    metalOnFleets = 0;
    iShips = 0;
    pShips = 0;
    fleetCount = 0;
    shipsOnFleets = 0;
    pbbCount = 0;
    artifactCount = 0;
    artifactPoints = 0;

    constructor(private worlds: Array<World>, private player: Player) { }

    calculateStatistic() {
        const artifacts = ownedArtifacts(this.player, this.worlds);
        this.artifactCount = artifacts.length;
        this.artifactPoints = artifacts.reduce((sum, artifact) => sum + artifactPoints(this.player, artifact), 0);
        for (const world of this.worlds) {
            if (isWorldOwnedByPlayer(this.player, world)) {
                this.worldsCount++;
                this.population += world.population;
                this.industry += world.industry;
                this.mines += world.mines;
                this.metalOnWorlds += world.metal;
                this.iShips += world.iShips;
                this.pShips += world.pShips;
            }
            for (const fleet of world.fleets) {
                if (isFleetOwnedByPlayer(this.player, fleet)) {
                    this.fleetCount++;
                    this.shipsOnFleets += fleet.ships;
                    this.metalOnFleets += fleet.metal;
                    if (fleet.pbb) {
                        this.pbbCount++;
                    }
                }
            }
        }
    }

    private names(players: Set<Player>): string {
        return `(${Array.from(players).map(p => p.playerName).sort().join(',')})`;
    }

    description(): string {
        const character = this.player.characterType !== null ? CHARACTER_TYPE_NAMES[this.player.characterType] : 'ohne Charakter';
        let desc = `Punkte: ${this.player.points ?? 0} | Charakter: ${character}\n`;
        desc += `Welten: ${this.worldsCount} | Bevölkerung: ${this.population} | Industrie: ${this.industry} | Minen: ${this.mines}\n`;
        desc += `Metall auf Welten: ${this.metalOnWorlds} | Metall auf Flotten: ${this.metalOnFleets}\n`;
        desc += `Flotten: ${this.fleetCount} | Schiffe auf Flotten: ${this.shipsOnFleets} | I-Schiffe: ${this.iShips} | P-Schiffe: ${this.pShips}`;
        if (this.pbbCount > 0) {
            desc += ` | PBB: ${this.pbbCount}`;
        }
        desc += '\n';
        if (this.artifactCount > 0) {
            desc += `Artefakte: ${this.artifactCount} | Artefakt-Punkte je Runde: ${this.artifactPoints}\n`;
        }
        desc += `Verbündete: ${this.names(this.player.allies)} | Loader: ${this.names(this.player.loaders)}\n`;
        return desc;
    }
}
