import { World } from '..';

export class TestWorldsArrayFactory {
    worlds: Array<World> = new Array();

    constructor() {
        let world: World = new World();
        world.number = 1;
        this.worlds.push(world);

        world = new World();
        world.number = 2;
        this.worlds.push(world);

        world = new World();
        world.number = 3;
        this.worlds.push(world);
    }
}
