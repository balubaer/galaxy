import { FleetPersist } from './fleet-persist';

export interface WorldPersist {
    number: number;
    name: string;
    player: string;
    fleets: Array<number>;
    dShips: number;
}
