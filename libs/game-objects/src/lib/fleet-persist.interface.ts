export interface FleetPersist {
    number: number;
    ships: number;
    player: string;
    moved: boolean;
    // Classic Game, fehlt bei Core Games.
    metal?: number;
    atPeace?: boolean;
    pbb?: boolean;
}
