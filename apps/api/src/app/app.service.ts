import { Injectable } from '@nestjs/common';
import { Message, User } from '@galaxy/api-interfaces';
import { Player, World, TestWorldsArrayFactory, WorldsPersist, PersistenceManager, objToMap, GamePref } from '@galaxy/game-objects';
import { readFileSync, writeFileSync } from 'fs';
import { Edge, Node } from '@swimlane/ngx-graph';

const piVirtel: number = Math.PI / 4;
const radiusForFleet = 70;

@Injectable()
export class AppService {
  pos: number;
  colorMap: Map<any, any>;
  fontColorMap: Map<any, any>;

  constructor() {
    let colorData = readFileSync('color.json', 'utf8');
    let colors = JSON.parse(colorData);
    this.colorMap = objToMap(colors);

    colorData = readFileSync('fontColor.json', 'utf8');
    colors = JSON.parse(colorData);
    this.fontColorMap = objToMap(colors);
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

  isColorInUsers(users: Array<User>, color: string): boolean {
    let result = false;
    for (const user of users) {
      if (user.color === color) {
        result = true;
        break;
      }
    }
    return result;
  }

  getColors(): Map<string, string> {
    const resultColorMap = new Map<string, string>();
    const usersData = readFileSync('user.json', 'utf8');
    const users: Array<User> = JSON.parse(usersData);

    for (const key of this.colorMap.keys()) {
      if (this.isColorInUsers(users, key) === false) {
        resultColorMap.set(key, this.colorMap.get(key));
      }
    }

    return resultColorMap;
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
    const colorPlayerMap: Map<string, string> = new Map();
    const usersData = readFileSync('user.json', 'utf8');
    const users: Array<User> = JSON.parse(usersData);
    const playerNameArray: Array<string> = new Array();

    for (const user of users) {
      playerNameArray.push(user.username);
    }

    for (const playerName of playerNameArray) {
      const foundColor = this.findeUserColorWithUserName(playerName, users);
      colorPlayerMap.set(playerName, this.colorMap.get(foundColor));
    }
    return colorPlayerMap;
  }

  getColorWithPlayer(player: Player): string {
    let result = 'lightgray';
    const colorPlayerMap = this.getColorPlayerMap();
    if (player !== null) {
      result = colorPlayerMap.get(player.playerName);
    }
    return result;
  }

  getFontColorPlayerMap(): Map<string, string> {
    const fontColorPlayerMap: Map<string, string> = new Map();
    const usersData = readFileSync('user.json', 'utf8');
    const users: Array<User> = JSON.parse(usersData);
    const playerNameArray: Array<string> = new Array();

    for (const user of users) {
      playerNameArray.push(user.username);
    }

    for (const playerName of playerNameArray) {
      const foundColor = this.findeUserColorWithUserName(playerName, users);
      fontColorPlayerMap.set(playerName, this.fontColorMap.get(foundColor));
    }
    return fontColorPlayerMap;
  }

  getFontColorWithPlayer(player: Player): string {
    let result = 'rgba( 0, 0, 0, 1)';
    const colorFontPlayerMap = this.getFontColorPlayerMap();
    if (player !== null) {
      result = colorFontPlayerMap.get(player.playerName);
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
