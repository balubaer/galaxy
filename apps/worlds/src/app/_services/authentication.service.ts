import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Login, User } from '@galaxy/api-interfaces';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    public currentUser: Observable<User>;
    private currentUserSubject: BehaviorSubject<User | null>;
    private currentAdminLoginSubject: BehaviorSubject<Login>;

    constructor(private http: HttpClient) {
        this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser') as string));
        this.currentUser = this.currentUserSubject.asObservable();
        this.currentAdminLoginSubject = new BehaviorSubject<Login>(JSON.parse(localStorage.getItem('currentAdminUser') as string));
    }

    public get currentUserValue(): User {
        return this.currentUserSubject.value;
    }

    public get currentAdminLoginValue(): Login {
        return this.currentAdminLoginSubject.value;
    }

    login(login: Login): Observable<User> {
        return this.http.post<User>('/api/users/authenticate', login).pipe(
            tap(aUser => {
                localStorage.setItem('currentUser', JSON.stringify(aUser));
                this.currentUserSubject.next(aUser);
            })
        );
    }

    loginAdmin(login: Login): Observable<Login> {
        return this.http.post<Login>('/api/users/authenticateAdmin', login).pipe(
            tap(aUser => {
                localStorage.setItem('currentAdminUser', JSON.stringify(aUser));
                this.currentAdminLoginSubject.next(aUser);
            })
        );
    }

    logout() {
        // remove user from local storage and set current user to null
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }

    logoutAdmin() {
        // remove admin from local storage and set current admin to null
        localStorage.removeItem('currentAdminUser');
        this.currentAdminLoginSubject.next(null);
    }
}