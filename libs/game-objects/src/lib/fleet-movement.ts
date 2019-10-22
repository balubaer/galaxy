import { Fleet } from './fleet'
import { World } from './world';

export class FleetMovement {
    fleet: Fleet;
    toPlanet: World;
    fromPlanet: World;
    isMovementDone = false;
    
    description(): String {
        let desc = '(---)';
        if (this.fleet !== null && this.toPlanet !== null) {
            desc = `${this.fleet.name}-->${this.toPlanet.name}`;
        }
        return desc;
    }
}
