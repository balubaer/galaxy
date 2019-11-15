import { Fleet } from './fleet'
import { World } from './world';

export class FleetMovement {
    fleet: Fleet = null;
    toWorld: World = null;
    fromWorld: World = null;
    isMovementDone = false;
    
    description(): string {
        let desc = '(---)';
        if (this.fleet !== null && this.toWorld !== null) {
            desc = `${this.fleet.name()}-->${this.toWorld.name} `;
        }
        return desc;
    }
}
