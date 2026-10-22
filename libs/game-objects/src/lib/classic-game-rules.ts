import { GamePref } from './game-pref.interface';
import { CoreGameDefaults } from './core-game-rules';

export const CLASSIC_FLEETS_ON_HOME_WORLD = 5;
export const CLASSIC_MIN_WORLDS_PER_PLAYER = 13;
export const CLASSIC_MAX_WORLDS_PER_PLAYER = 20;
export const CLASSIC_EMPTY_FLEETS_PER_PLAYER = 2;
/** Industrie auf der Heimatwelt zu Spielbeginn (Classic-Spiel; Advanced hätte 40). */
export const CLASSIC_START_INDUSTRY = 30;

export interface ClassicGameDefaults extends CoreGameDefaults {
    startIndustry: number;
}

/**
 * Vorbelegung für ein neues Classic Game: 5 leere Flotten auf der Heimatwelt (Schiffe entstehen erst
 * durch Bauen, daher 0 Startschiffe), ca. 13–20 Welten pro Spieler und 30 Industrie auf der Heimatwelt.
 */
export function classicGameDefaults(playerCount: number): ClassicGameDefaults {
    const players = Math.max(playerCount, 1);
    return {
        distanceLevelHomes: 3,
        fleetCount: players * (CLASSIC_FLEETS_ON_HOME_WORLD + CLASSIC_EMPTY_FLEETS_PER_PLAYER),
        fleetsOnHomeWorld: CLASSIC_FLEETS_ON_HOME_WORLD,
        worldCount: players * Math.round((CLASSIC_MIN_WORLDS_PER_PLAYER + CLASSIC_MAX_WORLDS_PER_PLAYER) / 2),
        startShipCount: 0,
        startIndustry: CLASSIC_START_INDUSTRY,
    };
}

/** Gamepref eines neuen Classic Games auf Basis der Standardwerte. */
export function classicGamePref(base: GamePref): GamePref {
    const defaults = classicGameDefaults(base.player.length);
    return {
        ...base,
        gameType: 'classic',
        distanceLevelHomes: defaults.distanceLevelHomes,
        fleetCount: defaults.fleetCount,
        fleetsOnHomeWorld: defaults.fleetsOnHomeWorld,
        worldCount: defaults.worldCount,
        startShipCount: defaults.startShipCount,
    };
}
