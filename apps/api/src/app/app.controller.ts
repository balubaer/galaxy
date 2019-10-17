import { Controller, Get } from '@nestjs/common';

import { Message } from '@galaxy/api-interfaces';
import { IPlayer, World } from '@galaxy/game-objects';

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
    const data = JSON.stringify(world);
    const fs = require('fs');

    fs.writeFileSync('world.json', data);
    return world;
  }
}
