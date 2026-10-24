import { World, worldWithName, worldWithNumber } from './world';
import { NodesAndLinks } from './nodes-and-links.interface';
import { DistanceLevel } from './distance-level';
import { Edge, Node } from '@galaxy/api-interfaces';

export class StripGraphFactory {
  worldString: string;
  worldsArray: Array<World>;
  graphData: NodesAndLinks;
  disdance: number;

  constructor(
    aWorldString: string,
    aWorldsArray: Array<World>,
    aGraphData: NodesAndLinks,
    aDistance: number
  ) {
    this.worldString = aWorldString;
    this.worldsArray = aWorldsArray;
    this.graphData = aGraphData;
    this.disdance = aDistance * 1 + 1; //Erzwingen das aDistance immer eine number ist mit aDistance*1
    //Durch den Request über http kann aDistance zu einem string werden
  }

  getResult(): NodesAndLinks {
    const links: Edge[] = new Array();
    const nodes: Node[] = new Array();
    const world: World = worldWithName(this.worldsArray, this.worldString);

    const distanceLevel: DistanceLevel = new DistanceLevel(
      world,
      this.disdance
    );
    const passedWorlds = distanceLevel.passedWorlds;

    for (const node of this.graphData.nodes) {
      const foundWorld = worldWithName(passedWorlds, node.id);
      if (foundWorld !== null) {
        nodes.push(node);
      }
    }

    // Verbindungen, deren anderes Ende außerhalb des Distanzlevels liegt, werden
    // als hiddenLinks (source = sichtbare Welt) mitgeliefert, je Weltenpaar einmal.
    const shownIds = new Set(nodes.map((node) => node.id));
    const hiddenLinks: Edge[] = new Array();
    const hiddenKeys = new Set<string>();
    for (const link of this.graphData.links) {
      const foundSourceWorld = worldWithName(passedWorlds, link.source);
      const foundTargetWorld = worldWithName(passedWorlds, link.target);
      if (foundSourceWorld !== null && foundTargetWorld !== null) {
        links.push(link);
      } else if (foundSourceWorld !== null || foundTargetWorld !== null) {
        const shown = foundSourceWorld !== null ? link.source : link.target;
        const hidden = foundSourceWorld !== null ? link.target : link.source;
        const key = `${shown}-${hidden}`;
        if (shownIds.has(shown) && !hiddenKeys.has(key)) {
          hiddenKeys.add(key);
          hiddenLinks.push({ source: shown, target: hidden });
        }
      }
    }

    return {
      links: links,
      nodes: nodes,
      hiddenLinks: hiddenLinks,
    };
  }
}
