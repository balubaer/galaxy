import { World } from './world';
import { NumberKey } from './number-key.interface';

export class Port implements NumberKey {
    number: number;
    worlds: Array<World>;
    private world: World;

    constructor() {
    }

    setWorld(aWorld: World) {
        this.world = aWorld;
        this.number = aWorld.number;
    }

    getWorld(): World {
        return this.world;
    }

    description(): string {
        let result: string;
        const connectionCount = this.worlds.length;

        result = `W${this.world.number}`;

        if (connectionCount > 0) {
            result += '(';
            for (const aWorld of this.worlds){
                result += `${aWorld.number},`;
            }
            result = result.substring(0, result.length - 1);
            result += ')';
        }
        return result;
    }

    hasConnectionToWorld(world: World): boolean {
        return (this.worlds.indexOf(world) > -1);
    }

}
