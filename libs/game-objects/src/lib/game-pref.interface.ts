export interface GamePref {
    distanceLevelHomes: number;
    fleetCount: number;
    fleetsOnHomeWorld: number;
    worldCount: number;
    playName: string;
    player: Array<string>;
    startShipCount: number;
    round: number;
    /** Verdeckte Zielpunktzahl, wird nicht an die Spieler ausgeliefert. */
    targetScore?: number;
    finished?: boolean;
    winner?: string;
}
