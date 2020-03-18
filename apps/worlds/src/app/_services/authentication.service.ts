import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoginInterface, User } from '@galaxy/api-interfaces';
//import { CookieService } from 'ngx-cookie-service';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    public currentUser: Observable<User>;
    private currentUserSubject: BehaviorSubject<User>;
    private currentAdminLoginSubject: BehaviorSubject<LoginInterface>;
    private loginUser: LoginInterface;
    cookieValue = 'UNKNOWN';


    constructor(private http: HttpClient) {
    //    constructor(private http: HttpClient, private cookieService: CookieService) {
            this.currentAdminLoginSubject = new BehaviorSubject<LoginInterface>(JSON.parse(localStorage.getItem('currentAdminUser')));
       // this.cookieValue = this.cookieService.get('sess-tutorial');
       // console.log(`this.cookieValue: ${this.cookieValue}`);

       // this.currentUserSubject = new BehaviorSubject<User>(this.makeUser());
       // this.currentUser = this.currentUserSubject.asObservable();
    }

    private makeUser(): User {
        const decoded = atob(this.cookieValue);
        const authObject = JSON.parse(decoded);

        return {
            color: '',
            firstName: '',
            id: 0,
            lastName: '',
            password: authObject.password,
            token: '',
            username: authObject.username
        }
    }

    public get currentUserValue(): User {
        return this.makeUser();
    }

    public get currentAdminLoginValue(): LoginInterface {
        return this.currentAdminLoginSubject.value;
    }

    login(login: LoginInterface): Observable<User> {
        this.loginUser = login;
        const result = this.http.get<User>('/api/users/authenticate');  result.subscribe(aUser => {
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
       // this.cookieService.delete('sess-tutorial');
        this.currentUserSubject.next(null);
    }

    logoutAdmin() {
        // remove admin from local storage and set current admin to null
        localStorage.removeItem('currentAdminUser');
        this.currentAdminLoginSubject.next(null);
    }

    getAccessToken(): string {
        let result = '';
        if (typeof this.loginUser !== 'undefined') {
            const loginUser: LoginInterface = {
                username: this.loginUser.username,
                password: this.loginUser.password
            }
            result = btoa(JSON.stringify(loginUser));
        }
        console.log(`getAccessToken: ${result}`);
        return result;
    }
}