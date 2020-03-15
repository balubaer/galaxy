import { Controller, Post, Body, Get, HttpException, HttpStatus, UnauthorizedException, Res, UseGuards, Req, Session } from '@nestjs/common';
import { LoginInterface, User, Message } from '@galaxy/api-interfaces';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { compareSync, hashSync } from 'bcryptjs';
import { AppAuthGuard } from '../auth/AppAuthGuard';
import {Request, Response} from 'express';


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
    @UseGuards(AppAuthGuard)
     authenticate(@Req() req: Request, @Res() res: Response, @Session() session) {
        const ses = session;
        return res.status(HttpStatus.OK).send();
    }

    @Post('setAdminUser')
    setAdminUser(@Body() login: LoginInterface): Message {
        if (existsSync('adminLogin.json') === false) {
            login.password = hashSync(login.password, 10);

            const data = JSON.stringify(login);
            writeFileSync('adminLogin.json', data);
            return  {message: 'OK' };
        } else {
            return {message: 'Error' };
        }
    }

    @Post('authenticateAdmin')
    authenticateAdmin(@Res() res, @Body() login: LoginInterface): LoginInterface { 
        let adminLogin: LoginInterface = null;
        if (existsSync('adminLogin.json')) {
            const stringData = readFileSync('adminLogin.json', 'utf8');
            adminLogin = JSON.parse(stringData);

            if (adminLogin !== null) {
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
