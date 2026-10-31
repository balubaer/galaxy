import {Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import {AuthService} from './auth.service';

@Injectable()
export class HttpStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(HttpStrategy.name);

    constructor(private readonly authService: AuthService) {
        super();
    }

    async validate(token: any, done: Function) {
        let authObject: {username: string, password: string} = null;
        const decoded = Buffer.from(token, 'base64').toString();

        try {
            authObject = JSON.parse(decoded);
            this.logger.debug(`Anmeldung von ${authObject?.username}`);
            const user = await this.authService.validateUser(authObject);
            if (!user) {
                return done(new UnauthorizedException(), false);
            }
            done(null, user);
        } catch (e) {
            return done(new UnauthorizedException(), false);
        }
    }
}
