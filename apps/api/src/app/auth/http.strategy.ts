import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import {AuthService} from './auth.service';

@Injectable()
export class HttpStrategy extends PassportStrategy(Strategy) {

    constructor(private readonly authService: AuthService) {
        super();
        console.log('HttpStrategy.constructor');
    }

    async validate(token: any, done: Function) {
        let authObject: {username: string, password: string} = null;
        const decoded = Buffer.from(token, 'base64').toString();

        console.log('HttpStrategy.validate done:'+ done);
        try {
            authObject = JSON.parse(decoded);
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
