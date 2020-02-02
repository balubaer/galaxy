import { Fleet } from './fleet'
import { World } from './world'
export const enum WhatsBuildEnum {
    SHIP,
    INDUSTRY
}
export class Industry {
    metal: number;
    fleet: Fleet;
    world: World;
    whatsBuild: WhatsBuildEnum;
constructor(aMetal: number, aFleet: Fleet, aWorld: World, aWhatsBuildEnum: WhatsBuildEnum){
    this.metal = aMetal;
    this.fleet = aFleet
    this.world = aWorld
    this.whatsBuild = aWhatsBuildEnum
}

}
