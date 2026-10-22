import { FleetPersist } from './fleet-persist.interface';

export interface WorldPersist {
    number: number;
    name: string;
    player: string;
    fleets: Array<number>;
    dShips: number;
    // Classic Game, fehlt bei Core Games und Spielen vor Einführung von Classic.
    population?: number;
    populationLimit?: number;
    industry?: number;
    metal?: number;
    mines?: number;
    turnsOwned?: number;
    iShips?: number;
    pShips?: number;
    blackHole?: boolean;
}
