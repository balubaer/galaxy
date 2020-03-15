import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AppError } from '../common/error/AppError';
import { AppErrorTypeEnum } from '../common/error/AppErrorTypeEnum';
import { RequestTurnDataOnlyPlayer } from '@galaxy/game-objects';
import { LoginInterface } from '@galaxy/api-interfaces';
import { AuthService } from './auth.service';


function instanceOfRequestTurnDataOnlyPlayer(object: any): object is RequestTurnDataOnlyPlayer {
    return ('playerName' in object && 'distanceLevelHomes' in object);
}

export class SessionGuard implements CanActivate {

    constructor(private readonly authService: AuthService) {
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        let playerName: string

        console.log("SessionGuard canActivate user");
        //request.

        try {
            if (request.body) {
                const body = request.body;
                if (this.testBody(body)) {
                    playerName = body.playerName;
                    console.log("SessionGuard canActivate playerName " + playerName);

                }
            }

        } catch (e) {
            throw new AppError(AppErrorTypeEnum.NOT_IN_SESSION);
        }

        try {
            if (request.session.passport.user) {
                if (this.testUser(request.session.passport.user)) {
                    const login: LoginInterface = request.session.passport.user;
                    const result = (playerName === login.username);
                    console.log("SessionGuard canActivate result " + result);

                    return result;
                } else {
                    throw new AppError(AppErrorTypeEnum.NOT_IN_SESSION);
                }
            }
        } catch (e) {
            throw new AppError(AppErrorTypeEnum.NOT_IN_SESSION);
        }
    }

    testUser(user:any): boolean {
        try {
            //if (user.username && user.password) {
                if (user.username) {
                    const login: LoginInterface = user;
              //  const promissUuser = this.authService.validateUser(login);

                return true;
            } else {
                return false;
            }
        } catch (e) {
            throw new AppError(AppErrorTypeEnum.NOT_IN_SESSION);
        }
    }

    testBody(body: any): boolean {
        try {
            if (instanceOfRequestTurnDataOnlyPlayer(body)) {
                return true;
            }
//            if (body instanceof RequestTurnDataOnlyPlayer) {
  //          }
        } catch (e) {
            throw new AppError(AppErrorTypeEnum.NOT_IN_SESSION);
        }
    }
}
