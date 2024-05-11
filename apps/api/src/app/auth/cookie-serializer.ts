import {Injectable} from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';

@Injectable()
export class CookieSerializer extends PassportSerializer {
    serializeUser(user: any, done: Function): any {
      //  console.log('CookieSerializer.serializeUser user: ' + user + 'done: ' + done);

        done(null, user);
    }

    deserializeUser(payload: any, done: Function): any {
     //   console.log('CookieSerializer.deserializeUser payload: ' + payload + 'done: ' + done);

        done(null, payload);
    }

}
