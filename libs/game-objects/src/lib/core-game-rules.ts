import { GamePref } from './game-pref.interface';
import { Player } from './player';

export const CORE_FLEETS_ON_HOME_WORLD = 5;
export const CORE_START_SHIP_COUNT = 6;
export const CORE_MIN_WORLDS_PER_PLAYER = 13;
export const CORE_MAX_WORLDS_PER_PLAYER = 20;
export const CORE_EMPTY_FLEETS_PER_PLAYER = 2;
export const CORE_MIN_TARGET_SCORE = 6000;
export const CORE_MAX_TARGET_SCORE = 9000;

export interface CoreGameDefaults {
    distanceLevelHomes: number;
    fleetCount: number;
    fleetsOnHomeWorld: number;
    worldCount: number;
    startShipCount: number;
}

/**
 * Vorbelegung für ein neues Core Game: 5 Flotten à 6 Schiffe auf der Heimatwelt,
 * ca. 13–20 Welten pro Spieler und zusätzliche leere Flotten je Spieler.
 */
export function coreGameDefaults(playerCount: number): CoreGameDefaults {
    const players = Math.max(playerCount, 1);
    return {
        distanceLevelHomes: 3,
        fleetCount: players * (CORE_FLEETS_ON_HOME_WORLD + CORE_EMPTY_FLEETS_PER_PLAYER),
        fleetsOnHomeWorld: CORE_FLEETS_ON_HOME_WORLD,
        worldCount: players * Math.round((CORE_MIN_WORLDS_PER_PLAYER + CORE_MAX_WORLDS_PER_PLAYER) / 2),
        startShipCount: CORE_START_SHIP_COUNT,
    };
}

/** Zufällige Zielpunktzahl zwischen 6.000 und 9.000. */
export function randomTargetScore(random: () => number = Math.random): number {
    return CORE_MIN_TARGET_SCORE + Math.floor(random() * (CORE_MAX_TARGET_SCORE - CORE_MIN_TARGET_SCORE + 1));
}

/** Setzt die Zielpunktzahl für ein neues Spiel zurück. */
export function startGamePref(gamePref: GamePref, random: () => number = Math.random): GamePref {
    return { ...gamePref, targetScore: randomTargetScore(random), finished: false, winner: undefined };
}

/** Gamepref ohne verdeckte Daten (Zielpunktzahl) für die Auslieferung an Spieler. */
export function publicGamePref(gamePref: GamePref): GamePref {
    const result = { ...gamePref };
    delete result.targetScore;
    return result;
}

/** Übernimmt die verdeckten Felder des gespeicherten Spiels in eine neue Gamepref. */
export function keepHiddenGamePref(newPref: GamePref, storedPref: GamePref): GamePref {
    return {
        ...newPref,
        targetScore: storedPref.targetScore,
        finished: storedPref.finished,
        winner: storedPref.winner,
    };
}

/**
 * Prüft nach einer Runde, ob ein Spieler die Zielpunktzahl erreicht hat.
 * Sieger ist der Spieler mit den meisten Punkten (bei Gleichstand alle, mit Komma getrennt).
 */
export function checkGameEnd(gamePref: GamePref, players: Iterable<Player>): void {
    if (gamePref.targetScore === undefined || gamePref.finished) {
        return;
    }
    const all = Array.from(players);
    const best = Math.max(...all.map(p => p.points ?? 0));
    if (best >= gamePref.targetScore) {
        gamePref.finished = true;
        gamePref.winner = all.filter(p => (p.points ?? 0) === best).map(p => p.playerName).join(', ');
    }
}
