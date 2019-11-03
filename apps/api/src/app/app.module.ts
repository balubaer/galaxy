import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreateWorldController } from './create-world/create-world.controller';
import { GamePlayController } from './game-play/game-play.controller';

@Module({
  imports: [],
  controllers: [AppController, CreateWorldController, GamePlayController],
  providers: [AppService]
})
export class AppModule {}
