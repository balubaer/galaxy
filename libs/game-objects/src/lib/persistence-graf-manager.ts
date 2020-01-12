import { World } from './world';
import { NodesAndLinks } from './nodes-and-links.interface';
import { Player, isWorldOutPutForPlayer } from './player';
import { Edge, Node } from '@swimlane/ngx-graph';

const piVirtel: number = Math.PI / 4;
const radiusForFleet = 70;

export class PersistenceGrafManager {
    worlds: Array<World>;
    allPlayerDict: Map<string, Player>;
    colorMap: Map<string, string>;
    pos: number;

    //TODO: colorMap einführen 
    //constructor(worlds: Array<World>, allPlayerDict: Map<string, Player>, colorMap: Map<string, string>) {
        constructor(worlds: Array<World>, allPlayerDict: Map<string, Player>) {
            this.worlds = worlds;
        this.allPlayerDict = allPlayerDict;
        //this.colorMap = colorMap;
        this.colorMap = new Map();

        this.colorMap.set('MARVIN', 'rgb(255, 164, 43)');
        this.colorMap.set('ZAPHOD', 'rgb(45, 134, 202)');
    }

    getColorWithPlayer(player: Player): string {
        // let result = '\'rgb(193, 193, 193)\'';
        let result = 'lightgray';
        if (player !== null) {
            result = this.colorMap.get(player.playerName);
        }
        return result;
    }

    startPosForFleet() {
        this.pos = 0;
    }

    nextPosForFleet() {
        this.pos += 1;
    }

    getCircleX(radians: number, radius: number) {
        return Math.cos(radians) * radius;
    }

    getCircleY(radians: number, radius: number) {
        return Math.sin(radians) * radius;
    }

    getXForFleet(): number {
        return this.getCircleX(piVirtel * this.pos, radiusForFleet);
    }

    getYForFleet(): number {
        return this.getCircleY(piVirtel * this.pos, radiusForFleet)
    }
    getFleetsWithWorld(world: World): any {
        const fleets = new Array();

        this.startPosForFleet();

        for (const fleet of world.fleets) {
            fleets.push(
                {
                    x: this.getXForFleet(),
                    y: this.getYForFleet(),
                    backgroundColor: this.getColorWithPlayer(fleet.player),
                    label: `F${fleet.number}=${fleet.ships}`
                }
            )
            this.nextPosForFleet();
        }
        return fleets;
    }

    generateNodesAndLinks(playerName: string): NodesAndLinks {
        const player = this.allPlayerDict.get(playerName);
        const edgeArray: Array<Edge> = new Array<Edge>();
        const nodeArray: Array<Node> = new Array<Node>();
        const worldSet: Set<World> = new Set<World>();

        for (const world of this.worlds) {
            if (isWorldOutPutForPlayer(player, world)) {
                nodeArray.push(
                    {
                        id: world.name,
                        label: world.name,
                        data: {
                            dships: world.dShips,
                            backgroundColor: this.getColorWithPlayer(world.player),
                            fleets: this.getFleetsWithWorld(world)
                        }
                    }
                )
                worldSet.add(world);
                // outPutString += `${world.description()}\n\n`;
            }
        }
        const worldArray = Array.from(worldSet);

        for (const world of worldArray) {
            const edgeIdSet = new Set();

            for (const portWorld of world.port.worlds) {
                const worldNumberArray: Array<number> = new Array(2);
                let idString: string = null;
                worldNumberArray[0] = portWorld.number;
                worldNumberArray[1] = world.number;

                worldNumberArray.sort((a, b) => a - b);

                idString = `W${worldNumberArray[0]}W${worldNumberArray[1]}`;

                if (edgeIdSet.has(idString) === false) {
                    edgeArray.push(
                        {
                            id: idString,
                            source: world.name,
                            target: portWorld.name,
                            label: `${world.name}->${portWorld.name}`
                        }
                    )
                    edgeIdSet.add(idString);
                }

                if (worldSet.has(portWorld) === false) {
                    worldSet.add(portWorld);
                    nodeArray.push(
                        {
                            id: portWorld.name,
                            label: portWorld.name,
                            data: {
                                backgroundColor: 'whitesmoke'
                            }
                        }
                    )
                }
            }
        }
        return {
            nodes: nodeArray,
            links: edgeArray
        };
    }
}
