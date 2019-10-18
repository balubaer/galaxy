import { Injectable } from '@nestjs/common';
import { Message } from '@galaxy/api-interfaces';
import { IPlayer, World } from '@galaxy/game-objects';

@Injectable()
export class AppService {
  getData(): Message {
    return { message: 'Welcome to api!' };
  }

  getPlayer(): IPlayer {
    return { name: 'Bernd',
             points: 10,
             ambushOff: false
                              }
  }

  getWorld(): World {
    return new World;
  }

  getWorlds(): World[] {
    const fs = require('fs');

    const rawdata = fs.readFileSync('worlds.json');
    const worlds: World[] = JSON.parse(rawdata);
    console.log(worlds);

    return worlds;
  }
}
