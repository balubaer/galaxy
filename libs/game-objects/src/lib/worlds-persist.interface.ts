import { PlayerPersist } from './player-persis.interfacet';
import { PortPersist } from './port-persist.interface';
import { FleetPersist } from './fleet-persist.interface';
import { WorldPersist } from './world-persist.interface';

export interface WorldsPersist {
    worlds: Array<WorldPersist>;
    players: Array<PlayerPersist>;
    ports: Array<PortPersist>;
    fleets: Array<FleetPersist>;
}
