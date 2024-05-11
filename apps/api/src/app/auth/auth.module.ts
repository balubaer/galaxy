import { Module } from '@nestjs/common';
import {AppAuthGuard} from './AppAuthGuard';

@Module({
  providers: [AppAuthGuard]
})
export class AuthModule {}
