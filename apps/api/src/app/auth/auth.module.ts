import { Module } from '@nestjs/common';
import {AppAuthGuard} from './AppAuthGuard';
import { CookieSerializer } from './cookie-serializer';

@Module({
  providers: [AppAuthGuard, CookieSerializer]
})
export class AuthModule {}
