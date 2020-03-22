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
        try {
            if (request.path === '/api/game-play/GetTurnDataOnlyPlayer') {
                if (request.body) {
                    const body = request.body;
                    if (this.testBody(body)) {
                        playerName = body.playerName;
                    }
                }
            }
        } catch (e) {
            throw new AppError(AppErrorTypeEnum.NOT_IN_SESSION);
        }

        try {
            if (request.session.passport.user) {
                if (request.path === '/api/game-play/GetTurnDataOnlyPlayer') {

                    if (this.testUser(request.session.passport.user)) {
                        const login: LoginInterface = request.session.passport.user;
                        const result = (playerName === login.username);

                        return result;
                    } else {
                        throw new AppError(AppErrorTypeEnum.NOT_IN_SESSION);
                    }
                } else if (request.path === '/api/users') {
                    return true;
                } else if (request.path === '/api/users/user') {
                    return true;
                }
            }
        } catch (e) {
            throw new AppError(AppErrorTypeEnum.NOT_IN_SESSION);
        }
    }

    testUser(user: any): boolean {
        try {
            if (user.username) {
                const login: LoginInterface = user;
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
        } catch (e) {
            throw new AppError(AppErrorTypeEnum.NOT_IN_SESSION);
        }
    }
}
