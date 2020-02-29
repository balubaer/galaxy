import { World, worldWithName, worldWithNumber } from './world';
import { NodesAndLinks } from './nodes-and-links.interface';
import { Node, Edge} from '@swimlane/ngx-graph';
import { DistanceLevel } from './distance-level';

export class StripGraphFactory {
    worldString: string;
    worldsArray: Array<World>;
    graphData: NodesAndLinks;
    disdance: number;

    constructor(aWorldString: string, aWorldsArray:Array<World>, aGraphData: NodesAndLinks, aDistance: number) {
        this.worldString = aWorldString;
        this.worldsArray = aWorldsArray;
        this.graphData = aGraphData;
        this.disdance = aDistance + 1;
    }

    getResult(): NodesAndLinks {
        const links: Edge[] = new Array;
        const nodes: Node[] = new Array;
        const world: World = worldWithName(this.worldsArray, this.worldString);
        const distanceLevel: DistanceLevel = new DistanceLevel(world, this.disdance);
        const passedWorlds = distanceLevel.passedWorlds;

        for (const node of this.graphData.nodes) {
            const foundWorld = worldWithName(passedWorlds, node.id);
            if (foundWorld !== null) {
                nodes.push(node);
            }
        }

        for (const link of this.graphData.links) {
            const foundSourceWorld = worldWithName(passedWorlds, link.source);
            const foundTargetWorld = worldWithName(passedWorlds, link.target);
            if (foundSourceWorld !== null && foundTargetWorld !== null) {
                links.push(link);
            }
        }

        return {
            links: links,
            nodes: nodes
        }
    }
}
