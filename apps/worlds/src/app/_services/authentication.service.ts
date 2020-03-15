import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoginInterface, User } from '@galaxy/api-interfaces';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    public currentUser: Observable<User>;
    private currentUserSubject: BehaviorSubject<User>;
    private currentAdminLoginSubject: BehaviorSubject<LoginInterface>;

    constructor(private http: HttpClient) {
        this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
        this.currentUser = this.currentUserSubject.asObservable();
        this.currentAdminLoginSubject = new BehaviorSubject<LoginInterface>(JSON.parse(localStorage.getItem('currentAdminUser')));
    }

    public get currentUserValue(): User {
        return this.currentUserSubject.value;
    }

    public get currentAdminLoginValue(): LoginInterface {
        return this.currentAdminLoginSubject.value;
    }

    login(login: LoginInterface): Observable<User> {
        const result = this.http.post<User>('/api/users/authenticate', login);
        result.subscribe(aUser => {
            localStorage.setItem('currentUser', JSON.stringify(aUser));
            this.currentUserSubject.next(aUser);
        });
        return result;
    }

    loginAdmin(login: LoginInterface): Observable<LoginInterface> {
        const result = this.http.post<LoginInterface>('/api/users/authenticateAdmin', login);
        result.subscribe(aUser => {
            localStorage.setItem('currentAdminUser', JSON.stringify(aUser));
            this.currentAdminLoginSubject.next(aUser);
        });
        return result;
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