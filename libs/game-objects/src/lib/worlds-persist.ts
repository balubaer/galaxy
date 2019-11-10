import { PlayerPersist } from './player-persist';
import { PortPersist } from './port-persist';
import { FleetPersist } from './fleet-persist';
import { WorldPersist } from './world-persist';

export interface WorldsPersist {
    worlds: Array<WorldPersist>;
    players: Array<PlayerPersist>;
    ports: Array<PortPersist>;
    fleets: Array<FleetPersist>;
}
