import { Controller, Post, Body, Get, HttpException, HttpStatus, UnauthorizedException, Res, UseGuards, Req, Session } from '@nestjs/common';
import { LoginInterface, User, Message } from '@galaxy/api-interfaces';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { compareSync, hashSync } from 'bcryptjs';
import { AppAuthGuard } from '../auth/AppAuthGuard';
import { Request, Response } from 'express';
import { SessionGuard } from '../auth/SessionGuard';
import { AppError } from '../common/error/AppError';
import { AppErrorTypeEnum } from '../common/error/AppErrorTypeEnum';


//import {Response} from "express";

@Controller('users')
export class UsersController {
    @Get('')
    @UseGuards(SessionGuard)
    getUsers(): User[] {
        let userArray: Array<User> = [];

        if (existsSync('user.json')) {
            const stringData = readFileSync('user.json', 'utf8');
            userArray = JSON.parse(stringData);
        }
        return userArray;
    }

    @Get('user')
    @UseGuards(SessionGuard)
    getUser(@Req() req: Request): User {
        let returnUser: User;
        let userArray: Array<User> = [];

        if (existsSync('user.json')) {
            const stringData = readFileSync('user.json', 'utf8');
            userArray = JSON.parse(stringData);
        }
        try {
            if (req.session.passport.user && userArray.length) {
                for (const user of userArray) {
                    if (user.username === req.session.passport.user.username) {
                        returnUser = user;
                        returnUser.password = '';
                        break;
                    }
                }
            }
        } catch (e) {
            throw new AppError(AppErrorTypeEnum.NOT_IN_SESSION);
        }
        return returnUser;
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

    @Get('authenticate')
    @UseGuards(AppAuthGuard)
    authenticate(@Req() req: Request, @Res() res: Response, @Session() session) {
        let userLogin: LoginInterface = null;

        if (existsSync('user.json')) {
            const stringData = readFileSync('user.json', 'utf8');
            const userArray: Array<User> = JSON.parse(stringData);

            for (const aUser of userArray) {
                if (aUser.username === session.passport.user.username) {
                    userLogin = {
                        username: aUser.username,
                        password: ''
                    }
                    break;
                }
            }
            if (userLogin === null) {
                userLogin = {
                    username: '',
                    password: ''
                }
            }
        }
        return res.status(HttpStatus.OK).json(userLogin);
    }

    @Post('setAdminUser')
    setAdminUser(@Body() login: LoginInterface): Message {
        if (existsSync('adminLogin.json') === false) {
            login.password = hashSync(login.password, 10);

            const data = JSON.stringify(login);
            writeFileSync('adminLogin.json', data);
            return { message: 'OK' };
        } else {
            return { message: 'Error' };
        }
    }

    @Post('authenticateAdmin')
    authenticateAdmin(@Res() res, @Body() login: LoginInterface): LoginInterface {
        let adminLogin: LoginInterface = null;
        if (existsSync('adminLogin.json')) {
            const stringData = readFileSync('adminLogin.json', 'utf8');
            adminLogin = JSON.parse(stringData);

            if (adminLogin !== null) {
                console.log(`login.password: ${login.password}`);
                console.log(`aUser.password: ${adminLogin.password}`);
                console.log(`compareSync: ${compareSync(login.password, adminLogin.password)}`)
                if ((adminLogin.username === login.username)
                    && (compareSync(login.password, adminLogin.password) === true)) {
                    adminLogin.password = '';
                } else {
                    adminLogin = null;
                }

            }
        }
        if (adminLogin === null) {
            const leerLogin: LoginInterface = {
                username: '',
                password: ''
            }

            return res.status(HttpStatus.UNAUTHORIZED).json(leerLogin);
        }
        return res.status(HttpStatus.CREATED).json(adminLogin);
    }

}
