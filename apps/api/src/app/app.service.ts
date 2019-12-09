import { Injectable } from '@nestjs/common';
import { Message, Node } from '@galaxy/api-interfaces';
import { Player, World, TestWorldsArrayFactory, WorldsPersist, PersistenceManager } from '@galaxy/game-objects';
import { readFileSync, writeFileSync } from 'fs';
import { Edge } from '@swimlane/ngx-graph';

@Injectable()
export class AppService {
  getData(): Message {
    return { message: 'Welcome to api!' };
  }

  getPlayer(): Player {
    const player: Player = new Player('Bernd');
    return player;
  }

  getWorld(): World {
    return new World;
  }

  getWorlds(): World[] {
    const rawdata = readFileSync('worlds.json', 'utf8');
    const worldsPersist: WorldsPersist = JSON.parse(rawdata);
    const pm = new PersistenceManager(new Array<World>());
    const worlds = pm.createWorldsWithWorldsPersist(worldsPersist);
    return worlds;
  }

  getWorldsString(): string[] {
    const stringArray = new Array();
    const string = readFileSync(`worlds.txt`, 'utf8');
    stringArray.push(string);
    return stringArray;
  }

  getWorldStringList(): string[] {
    const worlds = new TestWorldsArrayFactory().worlds;
    const worldStringList = new Array();

    for (const world of worlds) {
      worldStringList.push(world.description());
    }
    return worldStringList;
  }

  getWorldsNode(): Node[] {
    const worlds: World[] = this.getWorlds();
    const nodeArray: Array<Node> = new Array<Node>();

    for (const world of worlds) {
      nodeArray.push(
        {
          id: world.name,
          label: world.name
        }
      )
    }

    return nodeArray;
  }

  getWorldsEdge(): Edge[] {
    const worlds: World[] = this.getWorlds();
    const edgeArray: Array<Edge> = new Array<Edge>();
    for (const world of worlds) {
      for (const portWorld of world.port.worlds) {
        edgeArray.push(
          {
            id: world.name + portWorld.name,
            source: world.name,
            target: portWorld.name,
            label: `${world.name}->${portWorld.name}`
          }
        )
      }
    }
    return edgeArray;
  }
}
