import { Fleet } from './fleet'
import { World } from './world'
export const enum WhatsBuildEnum {
    SHIP,
    INDUSTRY
}
const NEEDEDMETALFORSHIP = 1;
const NEEDEDMETALFORINDUSTRY = 5;
export class Industry {
    fleet: Fleet;
    world: World;
    whatsBuild: WhatsBuildEnum;
constructor(aWorld: World){
    this.world = aWorld
}
build(){
if (this.whatsBuild === WhatsBuildEnum.SHIP) {
    if (this.world.metal >= NEEDEDMETALFORSHIP) {
        this.fleet.ships += NEEDEDMETALFORSHIP;
        this.world.metal -= NEEDEDMETALFORSHIP;
    }
    
}
else if (this.whatsBuild === WhatsBuildEnum.INDUSTRY) {
    if (this.world.metal >= NEEDEDMETALFORINDUSTRY) {
        this.world.industry.push(new Industry(this.world));
        this.world.metal -= NEEDEDMETALFORINDUSTRY;
        
    }
  
}}
}
