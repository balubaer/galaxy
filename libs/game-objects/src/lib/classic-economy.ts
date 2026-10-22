import { World } from './world';
import { Player } from './player';

/** Metall (und Industrie), um eine Einheit Industrie bzw. +1 Bevölkerungslimit zu bauen. */
export const CLASSIC_BUILD_COST = 5;
export const CLASSIC_EMPEROR_INDUSTRY_COST = 4;
/** I-Schiffe, die verschrottet werden müssen, um eine Einheit Industrie zu erhalten. */
export const CLASSIC_SCRAP_I_SHIPS = 6;
export const CLASSIC_EMPEROR_SCRAP_I_SHIPS = 4;
/** Anteil, um den eine Bevölkerung pro Runde wächst. */
export const CLASSIC_POPULATION_GROWTH = 0.1;
/** Nach so vielen Runden im Besitz bekommt eine Welt mit Minen eine Mine mehr. */
export const CLASSIC_TURNS_OWNED_CYCLE = 7;

export function industryBuildCost(player: Player): number {
    return player.characterType === 'emperor' ? CLASSIC_EMPEROR_INDUSTRY_COST : CLASSIC_BUILD_COST;
}

export function scrapIShipsPerIndustry(player: Player): number {
    return player.characterType === 'emperor' ? CLASSIC_EMPEROR_SCRAP_I_SHIPS : CLASSIC_SCRAP_I_SHIPS;
}

/** Metall der Welt, das in dieser Runde zum Bauen genutzt werden darf (entladenes Metall erst nächste Runde). */
export function availableMetal(world: World): number {
    return Math.max(0, world.metal - world.unloadedMetal);
}

function isAllyOf(owner: Player, other: Player): boolean {
    return Array.from(owner.allies).some(ally => ally.playerName === other.playerName);
}

/**
 * Industrie, die sich nicht ans Bauen traut: für jedes feindliche Schiff auf Flotten (nicht At Peace),
 * das die eigenen und verbündeten Schiffe übersteigt, eine Einheit. I-Schiffe zählen dabei doppelt.
 */
export function shelterPenalty(world: World): number {
    const owner = world.player;
    if (owner === null) {
        return 0;
    }
    let defenders = world.iShips * 2 + world.pShips;
    let enemies = 0;
    for (const fleet of world.fleets) {
        if (fleet.ships <= 0 || fleet.atPeace || fleet.player === null) {
            continue;
        }
        if (fleet.player.playerName === owner.playerName || isAllyOf(owner, fleet.player)) {
            defenders += fleet.ships;
        } else {
            enemies += fleet.ships;
        }
    }
    return Math.max(0, enemies - defenders);
}

/** Nutzbare Industrie: das Kleinste aus Industrie (abzüglich Schutzräume), Metall und Bevölkerung. */
export function usableIndustry(world: World): number {
    const industry = Math.max(0, world.industry - shelterPenalty(world));
    return Math.max(0, Math.min(industry, availableMetal(world), world.population));
}

/** Rest der nutzbaren Industrie dieser Runde; wird beim ersten Zugriff aus dem Stand der Welt berechnet. */
export function buildBudget(world: World): number {
    if (world.buildBudget === null) {
        world.buildBudget = usableIndustry(world);
        world.industryWorkers = world.buildBudget;
    }
    return world.buildBudget;
}

/** Verbraucht Industrie und gleich viel Metall der Welt; false, wenn die nutzbare Industrie nicht reicht. */
export function spendIndustry(world: World, units: number): boolean {
    if (buildBudget(world) < units) {
        return false;
    }
    world.buildBudget -= units;
    world.metal -= units;
    return true;
}

/** Setzt den Rundenzustand der Wirtschaft zurück. */
export function resetEconomyTurn(world: World) {
    world.unloadedMetal = 0;
    world.buildBudget = null;
    world.industryWorkers = 0;
    world.migratesTo = null;
}
