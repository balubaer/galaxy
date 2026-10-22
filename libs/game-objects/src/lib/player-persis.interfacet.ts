export interface PlayerPersist {
    name: string;
    points: number;
    teammates: Array<string>;
    // Classic Game, fehlt bei Core Games.
    characterType?: string;
    allies?: Array<string>;
    loaders?: Array<string>;
}
