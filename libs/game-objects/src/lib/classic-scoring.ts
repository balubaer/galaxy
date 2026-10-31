import { World } from './world';
import { Player } from './player';
import { artifactTurnPoints } from './classic-artifacts';

// Punkte und Strafen des Classic Games (Handbuch "Character Types and Scoring").
/** Emperor: 1 Punkt je 10 Bevölkerung einer Welt, je Industrie und je Mine. */
export const EMPEROR_POPULATION_PER_POINT = 10;
/** Raider: Punkte je Plünderung derselben Welt (1., 2., 3., 4. Mal), danach RAIDER_PLUNDER_POINTS_AFTER. */
export const RAIDER_PLUNDER_POINTS = [50, 40, 30, 20];
export const RAIDER_PLUNDER_POINTS_AFTER = 10;
/** Raider: Punkte je Runde für jede eigene Flotte. */
export const RAIDER_POINTS_PER_FLEET = 3;
/** Strafe je getöteter (menschlicher) Bevölkerung. */
export const PENALTY_PER_POPULATION_KILLED = 1;
/** Strafe je abgeworfener PBB (dazu die getötete Bevölkerung). */
export const PENALTY_PER_PBB = 50;
/** Strafe je Plünderung (für alle außer den Raider). */
export const PENALTY_PER_PLUNDER = 5;

/** Anlass einer Strafe: Bevölkerung getötet, PBB abgeworfen oder geplündert. */
export type PenaltyKind = 'kill' | 'pbb' | 'plunder';

/** Punkte, die eine Welt ihrem Emperor in einer Runde bringt. */
export function emperorWorldPoints(world: World): number {
    if (world.blackHole) {
        return 0;
    }
    return Math.floor(world.population / EMPEROR_POPULATION_PER_POINT) + world.industry + world.mines;
}

/** Punkte des Raiders für eine Plünderung; plunderCount ist die Zahl der Plünderungen einschließlich dieser. */
export function raiderPlunderPoints(plunderCount: number): number {
    return RAIDER_PLUNDER_POINTS[plunderCount - 1] ?? RAIDER_PLUNDER_POINTS_AFTER;
}

function ownsFleets(player: Player, worlds: Array<World>): number {
    return worlds.reduce((sum, world) => sum + world.fleets.filter(fleet => fleet.player === player).length, 0);
}

/** Punkte dieser Runde aus dem Besitz am Rundenende: je nach Charakter, dazu die Artefakte. */
export function turnPoints(player: Player, worlds: Array<World>): number {
    return characterTurnPoints(player, worlds) + artifactTurnPoints(player, worlds);
}

/** Punkte aus dem Besitz von Welten bzw. Flotten, je nach Charakter (ohne Artefakte). */
export function characterTurnPoints(player: Player, worlds: Array<World>): number {
    switch (player.characterType) {
        case 'emperor':
            return worlds
                .filter(world => world.player === player)
                .reduce((sum, world) => sum + emperorWorldPoints(world), 0);
        case 'raider':
            return ownsFleets(player, worlds) * RAIDER_POINTS_PER_FLEET;
        default:
            return 0;
    }
}

/**
 * Ist der Spieler von dieser Strafe ausgenommen? Der Raider plündert straffrei, der Positronix tötet
 * und wirft PBBs straffrei ab. (Der Missionar gegen seinen Feind folgt mit dem Judgment.)
 */
export function isPenaltyExempt(player: Player, kind: PenaltyKind): boolean {
    if (kind === 'plunder') {
        return player.characterType === 'raider';
    }
    return player.characterType === 'positronix';
}

/** Zieht Strafpunkte ab, sofern der Charakter nicht davon ausgenommen ist. Liefert die abgezogenen Punkte. */
export function addPenalty(player: Player | null, points: number, kind: PenaltyKind): number {
    if (player === null || points <= 0 || isPenaltyExempt(player, kind)) {
        return 0;
    }
    player.points = (player.points ?? 0) - points;
    return points;
}
