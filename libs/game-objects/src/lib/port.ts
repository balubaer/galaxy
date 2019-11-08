import { World } from './world';

export class Port {
    worlds: Array<World>;
    world: World;

    constructor() {
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
