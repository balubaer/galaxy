import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { LoginInterface, User } from '@galaxy/api-interfaces';
import { compareSync } from 'bcryptjs';

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
                        && (compareSync(user.password, aUser.password) === true)) {
                        u = {
                            username: user.username,
                            password: aUser.password
                        };
                        console.log('Alles Gut #############')
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
