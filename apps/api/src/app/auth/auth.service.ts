import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { LoginInterface, User } from '@galaxy/api-interfaces';

@Injectable()
export class AuthService {

    public static async authenticateUser(user: { username: string, password: string }): Promise<LoginInterface> {

        return new Promise((resolve, reject) => {
            let u: LoginInterface;
            let userFound = false;

            if (existsSync('user.json')) {
                const stringData = readFileSync('user.json', 'utf8');
                const userArray: Array<User> = JSON.parse(stringData);

                for (const aUser of userArray) {
                    if (aUser.username === user.username
                        && (user.password === aUser.password) === true) {
                        u = aUser;
                        userFound = true;
                        break;
                    }
                }
            }
            if (userFound) {
                resolve(u); // pass values
            } else {
                reject(u); // pass values
            }
        });
    }
    async validateUser(user: { username: string, password: string }): Promise<LoginInterface> {
        return await AuthService.authenticateUser(user);
    }
}
