import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoginInterface, User } from '@galaxy/api-interfaces';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    public currentUser: Observable<LoginInterface>;
    private currentUserSubject: BehaviorSubject<LoginInterface>;
    private currentAdminLoginSubject: BehaviorSubject<LoginInterface>;
    private loginUser: LoginInterface;


    constructor(private http: HttpClient) {
        this.currentUserSubject = new BehaviorSubject<LoginInterface>(JSON.parse(localStorage.getItem('currentUser')));
        this.currentUser = this.currentUserSubject.asObservable();
        this.currentAdminLoginSubject = new BehaviorSubject<LoginInterface>(JSON.parse(localStorage.getItem('currentAdminUser')));
    }


    public get currentUserValue(): LoginInterface {
        return this.currentUserSubject.value;
        }

    public get currentAdminLoginValue(): LoginInterface {
        return this.currentAdminLoginSubject.value;
    }

    createAccessToken(login: LoginInterface): string {
        return btoa(JSON.stringify(login));
    }

    login(login: LoginInterface): Observable<LoginInterface> {
        localStorage.setItem('AccessToken', this.createAccessToken(login));
        const result = this.http.get<LoginInterface>('/api/users/authenticate');
        result.subscribe(aLogin => {
            localStorage.setItem('currentUser', JSON.stringify(aLogin));
            this.currentUserSubject.next(aLogin);
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

    getAccessToken(): string {
        const result = localStorage.getItem('AccessToken');

        return result;
    }
}