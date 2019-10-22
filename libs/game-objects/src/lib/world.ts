import { Port } from './port';
import { Fleet } from './fleet';

export function worldWithNumber(worlds:Array<World>, number:number): World {
    let result: World = null;
    for (const aWorld of worlds){
        if (aWorld.number === number) {
            result = aWorld;
            break;
        }
    }
    return result;
}
export class World {
    number: number;
    name: string;
    port: Port;
    fleets: Array<Fleet>;

    constructor() {
        this.fleets = new Array<Fleet>();
    }

    setNumber(aNumber: number) {
        this.name = `W${this.number}`;
        this.number = aNumber;
    }
}
