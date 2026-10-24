import { World } from './world';
import { Player } from './player';

// Punkte und Strafen des Classic Games (Handbuch "Character Types and Scoring").
/** Emperor: 1 Punkt je 10 Bevölkerung einer Welt, je Industrie und je Mine. */
export const EMPEROR_POPULATION_PER_POINT = 10;
/** Strafe je getöteter (menschlicher) Bevölkerung. */
export const PENALTY_PER_POPULATION_KILLED = 1;
/** Strafe je abgeworfener PBB (dazu die getötete Bevölkerung). */
export const PENALTY_PER_PBB = 50;
/** Strafe je Plünderung (für alle außer den Raider). */
export const PENALTY_PER_PLUNDER = 5;

/** Punkte, die eine Welt ihrem Emperor in einer Runde bringt. */
export function emperorWorldPoints(world: World): number {
    if (world.blackHole) {
        return 0;
    }
    return Math.floor(world.population / EMPEROR_POPULATION_PER_POINT) + world.industry + world.mines;
}

/** Punkte dieser Runde für den Besitz von Welten, je nach Charakter (bisher nur Emperor). */
export function turnPoints(player: Player, worlds: Array<World>): number {
    if (player.characterType !== 'emperor') {
        return 0;
    }
    return worlds
        .filter(world => world.player === player)
        .reduce((sum, world) => sum + emperorWorldPoints(world), 0);
}

/**
 * Zieht Strafpunkte ab. Positronix und Missionar (gegen ihren Feind) wären ausgenommen,
 * diese Charaktere gibt es noch nicht.
 */
export function addPenalty(player: Player | null, points: number) {
    if (player !== null && points > 0) {
        player.points = (player.points ?? 0) - points;
    }
}
