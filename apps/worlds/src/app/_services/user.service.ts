import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, Message, Login } from '@galaxy/api-interfaces';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class UserService {
    constructor(private http: HttpClient) { }

    getAll(): Observable<User[]> {
        return this.http.get<User[]>('api/users');
    }

    register(user: User): Observable<Message> {
        return this.http.post<Message>('api/users/register', user);
    }

    setAdminUser(login: Login): Observable<Message>  {
        return this.http.post<Message>('api/users/setAdminUser', login);
    }

   /* delete(id: number) {
        return this.http.delete('api/users/${id}`);
    }*/
}