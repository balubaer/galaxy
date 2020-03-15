import { Module } from '@nestjs/common';
import {HttpStrategy} from './http.strategy';
import {AppAuthGuard} from './AppAuthGuard';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService, HttpStrategy, AppAuthGuard]
})
export class AuthModule {}
