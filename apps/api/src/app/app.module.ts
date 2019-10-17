import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreateWorldController } from './create-world/create-world.controller';

@Module({
  imports: [],
  controllers: [AppController, CreateWorldController],
  providers: [AppService]
})
export class AppModule {}
