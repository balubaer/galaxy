import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger, UnauthorizedException} from '@nestjs/common';
import {AppError} from '../error/AppError';

@Catch()
export class DispatchError implements ExceptionFilter {
    private readonly logger = new Logger(DispatchError.name);

    catch(exception: any, host: ArgumentsHost): any {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();

        if (exception instanceof AppError) {
            return res.status(exception.httpStatus).json({
                errorCode: exception.errorCode,
                errorMsg: exception.errorMessage,
                usrMsg: exception.userMessage,
                httpCode: exception.httpStatus
            });
        } else if (exception instanceof UnauthorizedException) {
            this.logger.warn(exception.stack);
            return res.status(HttpStatus.UNAUTHORIZED).json(exception.message);
        } else if (exception.status === 403) {
            return res.status(HttpStatus.FORBIDDEN).json(exception.message);
        }

        else {
            this.logger.error(exception.message, exception.stack);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
        }
    }

}
