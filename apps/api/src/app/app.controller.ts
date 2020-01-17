import { Controller, Get } from '@nestjs/common';

import { Message } from '@galaxy/api-interfaces';
import { Player, World, GamePref, objToMap } from '@galaxy/game-objects';

import { AppService } from './app.service';
import { readFileSync, writeFileSync } from 'fs';
import { Edge, Node } from '@swimlane/ngx-graph';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('hello')
  getData(): Message {
    return this.appService.getData();
  }

  @Get('Player')
  getPlayer(): Player {
    return this.appService.getPlayer();
  }

  @Get('World')
  getWorld(): World {
    const world: World = this.appService.getWorld();
    // tslint:disable-next-line: prefer-const
    let data = JSON.stringify(world);
    /* const gamePref: GamePref = {
       worldCount: 1
     };*/

    writeFileSync('world.json', data);
    // data = JSON.stringify(gamePref);
    // writeFileSync('gamePref.json', data);

    return world;
  }

  @Get('Worlds')
  getWorlds(): World[] {
    const worlds: World[] = this.appService.getWorlds();
    return worlds;
  }

  @Get('WorldsString')
  getWorldsString(): string[] {
    const stringArray: string[] = this.appService.getWorldsString();
    return stringArray;
  }

  @Get('WorldStringList')
  getWorldStringList(): string[] {
    const worldStringList: string[] = this.appService.getWorldStringList();
    return worldStringList;
  }

  @Get('GetWorldsNode')
  getWorldsNode(): Node[] {
    const worldsNodes: Node[] = this.appService.getWorldsNode();
    return worldsNodes;
  }

  @Get('GetWorldsEdge')
  getWorldsEdge(): Edge[] {
    const worldsEdges = this.appService.getWorldsEdge();
    return worldsEdges;
  }

  @Get('GetColors')
  getColors(): Array<string> {
    const colorMap: Map<string, string> = this.appService.getColors();
    const colors: Array<string> = new Array();
    for (const key of colorMap.keys()) {
      colors.push(key);
    }
    return colors;
  }
}
