import { Controller, Get } from '@nestjs/common';

import { Message } from '@galaxy/api-interfaces';
import { Player, World, GamePref } from '@galaxy/game-objects';

import { AppService } from './app.service';
import { readFileSync, writeFileSync } from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getData(): Message {
    return this.appService.getData();
  }

  @Get('Player')
  getPlayer(): Player {
    return  this.appService.getPlayer();
  }

  @Get('World')
  getWorld(): World {
    const world : World = this.appService.getWorld();
    let data = JSON.stringify(world);
    const gamePref: GamePref = {
      worldCount: 1
    };

    writeFileSync('world.json', data);
    data = JSON.stringify(gamePref);
    writeFileSync('gamePref.json', data);

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
}
