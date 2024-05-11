import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreateWorldController } from './create-world/create-world.controller';
import { GamePlayController } from './game-play/game-play.controller';
import { UsersController } from './users/users.controller';
import { HttpStrategy } from './auth/http.strategy';
import { AuthService } from './auth/auth.service';
import { CookieSerializer } from './auth/cookie-serializer';

@Module({
  imports: [],
  controllers: [AppController, CreateWorldController, GamePlayController, UsersController],
  providers: [AppService, HttpStrategy, AuthService, CookieSerializer]
})
export class AppModule {}
