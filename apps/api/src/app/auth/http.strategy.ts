import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';

@Injectable()
export class HttpStrategy extends PassportStrategy(Strategy) {

    constructor() {
        super();
    }

    async validate(token: any, done: Function) {
        let authObject: {username: string, password: string} = null;
        const decoded = Buffer.from(token, 'base64').toString();
        try {
            authObject = JSON.parse(decoded);
            console.log('authObject' + authObject);
            const user = {user: 'test'};
            /* = await this.authService.validateUser(authObject);
            if (!user) {
                return done(new UnauthorizedException(), false);
            }*/
            done(null, user);
        } catch (e) {
            return done(new UnauthorizedException(), false);
        }
    }
}
