import { Controller, Get } from '@nestjs/common';

import { Message } from '@galaxy/api-interfaces';
import { IPlayer, World, GamePref } from '@galaxy/game-objects';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getData(): Message {
    return this.appService.getData();
  }

  @Get('Player')
  getPlayer(): IPlayer {
    return  this.appService.getPlayer();
  }

  @Get('World')
  getWorld(): World {
    const world : World = this.appService.getWorld();
    let data = JSON.stringify(world);
    const fs = require('fs');
    const gamePref: GamePref = {
      worldCount: 1
    };

    fs.writeFileSync('world.json', data);
    data = JSON.stringify(gamePref);
    fs.writeFileSync('gamePref.json', data);

    return world;
  } 

  @Get('Worlds')
  getWorlds(): World[] {
    const worlds : World[] = this.appService.getWorlds();
    return worlds;
  } 
}
