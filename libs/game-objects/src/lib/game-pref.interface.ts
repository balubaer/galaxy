import type { CharacterType } from './player';

/** Spieltyp: RSW Core (D-Schiffe) oder RSW Classic (Wirtschaft mit Metall, Industrie, I-/P-Schiffen). */
export type GameType = 'core' | 'classic';

export interface GamePref {
    /** Fehlt bei älteren Spielen und gilt dann als 'core'. */
    gameType?: GameType;
    distanceLevelHomes: number;
    fleetCount: number;
    fleetsOnHomeWorld: number;
    worldCount: number;
    playName: string;
    player: Array<string>;
    startShipCount: number;
    round: number;
    /** Classic Game: gewählter Charakter je Spieler ('random' = zufällig zugelost, fehlt = Emperor). */
    characterTypes?: { [playerName: string]: CharacterType | 'random' };
    /** Verdeckte Zielpunktzahl, wird nicht an die Spieler ausgeliefert. */
    targetScore?: number;
    finished?: boolean;
    winner?: string;
}

/** Spieltyp einer Gamepref, ältere Spiele ohne Angabe sind Core Games. */
export function gameTypeOf(gamePref: GamePref): GameType {
    return gamePref.gameType === 'classic' ? 'classic' : 'core';
}

/** Charakter eines Spielers für die Admin-Konsole: Wahl laut Gamepref und tatsächlicher Charakter im Spiel. */
export interface PlayerCharacter {
    playerName: string;
    /** Wahl bei der Spielanlage ('random' = zufällig zugelost). */
    chosen?: CharacterType | 'random';
    /** Charakter in der aktuellen Runde, null solange die Welten noch nicht erzeugt sind. */
    characterType: CharacterType | null;
    points: number;
}
