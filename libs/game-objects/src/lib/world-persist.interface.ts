import { FleetPersist } from './fleet-persist.interface';

export interface WorldPersist {
    number: number;
    name: string;
    player: string;
    fleets: Array<number>;
    dShips: number;
}
