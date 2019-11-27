import { Controller, Post, Body, Get, HttpException, HttpStatus, UnauthorizedException, Res } from '@nestjs/common';
import { Login, User, Message } from '@galaxy/api-interfaces';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { compareSync, hashSync } from 'bcryptjs';

//import {Response} from "express";

@Controller('users')
export class UsersController {
    @Get('')
    getUsers(): User[] {
        let userArray: Array<User> = [];

        if (existsSync('user.json')) {
            const stringData = readFileSync('user.json', 'utf8');
            userArray = JSON.parse(stringData);
        }
        return userArray;
    }

    @Post('register')
    register(@Body() user: User): Message {
        let userArray: Array<User>;

        if (existsSync('user.json')) {
            const stringData = readFileSync('user.json', 'utf8');
            userArray = JSON.parse(stringData);
        } else {
            userArray = new Array();
        }
        user.password = hashSync(user.password, 10);

        userArray.push(user);

        const data = JSON.stringify(userArray);
        writeFileSync('user.json', data);
        return { message: 'OK' };

    }

    @Post('authenticate')
    authenticate(@Res() res, @Body() login: Login): User { //, @Res() res: Response @Body() login: Login
        let user: User = null;
        if (existsSync('user.json')) {
            const stringData = readFileSync('user.json', 'utf8');
            const userArray: Array<User> = JSON.parse(stringData);

            for (const aUser of userArray) {
                if (aUser.username === login.username
                    && (compareSync(login.password, aUser.password) === true)) {
                    user = aUser;
                    break;
                }
            }
        }
        if (user === null) {
            const leerUser: User = {
                firstName: '',
                id: 0,
                lastName: '',
                password: '',
                token: '',
                username: ''
            }

            return res.status(HttpStatus.UNAUTHORIZED).json(leerUser);
        }
        return res.status(HttpStatus.CREATED).json(user);
    }
}
