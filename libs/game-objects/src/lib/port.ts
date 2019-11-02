import { World } from './world';

export class Port {
    worlds: World[];
    world: World;

    description: string;

    constructor(worlds: World[], world: World) {
        this.worlds = worlds;
        this.world = world;
        this.description = this.makeDiscription(this.worlds, this.world);
    }

    makeDiscription(worlds: World[], world: World): string {
        let result: string;
        const connectionCount = worlds.length;

        result = `W${world.number}`;

        if (connectionCount > 0) {
            result += '(';
            for (const aWorld of worlds){
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
