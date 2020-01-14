import { Injectable } from '@nestjs/common';
import { Message, User } from '@galaxy/api-interfaces';
import { Player, World, TestWorldsArrayFactory, WorldsPersist, PersistenceManager, objToMap, GamePref} from '@galaxy/game-objects';
import { readFileSync, writeFileSync } from 'fs';
import { Edge, Node } from '@swimlane/ngx-graph';

const piVirtel: number = Math.PI/4;
const radiusForFleet = 70;

@Injectable()
export class AppService {
  colorPlayerMap: Map<string, string>;
  pos: number;

  constructor() {
    const stringData = readFileSync('gamePref.json', 'utf8');
    const gamepref: GamePref = JSON.parse(stringData);
    const playerNameArray = gamepref.player;
    const colorData = readFileSync('color.json', 'utf8');
    const colors = JSON.parse(colorData);
    const colorMap = objToMap(colors);
    const usersData = readFileSync('user.json', 'utf8');
    const users = JSON.parse(usersData);

    this.colorPlayerMap = new Map();

    for (const playerName of playerNameArray) {
      const foundColor = this.findeUserColorWithUserName(playerName, users);
      this.colorPlayerMap.set(playerName, colorMap.get(foundColor));
    }
    //this.colorMap.set('MARVIN', 'rgb(255, 164, 43)');
    //this.colorMap.set('ZAPHOD', 'rgb(45, 134, 202)');
  }

  findeUserColorWithUserName(userName: string, users: Array<User>): string {
    let result = '';
    for (const user of users) {
      if (user.username === userName) {
        result = user.color;
        break;
      }
    }
    return result;
  }


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
    const rawdata = readFileSync('TestGame/Turn0/worlds.json', 'utf8');
    //const rawdata = readFileSync('worlds.json', 'utf8');
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

  getColors(): Map<string, string> {
    //TODO: Color from File 'color.json
    const ob = {
      "#277553": "rgba( 39,117, 83,1)",
      "#23D186": "rgba( 35,209,134,1)",
      "#289E6B": "rgba( 40,158,107,1)",
      "#1F4B38": "rgba( 31, 75, 56,1)",
      "#11221B": "rgba( 17, 34, 27,1)"
    }
    const colorMap: Map<string, string> = objToMap(ob);
    return colorMap;
  }

  getWorldStringList(): string[] {
    const worlds = new TestWorldsArrayFactory().worlds;
    const worldStringList = new Array();

    for (const world of worlds) {
      worldStringList.push(world.description());
    }
    return worldStringList;
  }

  getColorPlayerMap(): Map<string, string> {
    return this.colorPlayerMap;
  }

  getColorWithPlayer(player: Player): string {
   // let result = '\'rgb(193, 193, 193)\'';
    let result = 'lightgray';
    if (player !== null) {
      result = this.colorPlayerMap.get(player.playerName);
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

  /*getFleetsWithWorld(world: World): string {
    let fleets: string = '';

    this.startPosForFleet();
    console.log(`fleets.length: ${world.fleets.length}`)

    for (const fleet of world.fleets) {
      fleets += `<ellipse stroke="none" fill="${this.getColorWithPlayer(fleet.player)}" cx="${this.getXForFleet()}" cy="${this.getYForFleet()}" rx="10" ry="20"/>\r\n`
      this.nextPosForFleet();
    }
    return fleets;
  }*/

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

  getWorldsNode(): Node[] {
    const worlds: World[] = this.getWorlds();
    const nodeArray: Array<Node> = new Array<Node>();

    for (const world of worlds) {
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
