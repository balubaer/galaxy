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

}
