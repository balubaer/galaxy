import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from './_services/authentication.service';
import { CookieService } from 'ngx-cookie-service';
import { Cookie } from 'ng2-cookies';

@Component({
  selector: 'galaxy-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  currentUser: any;
  cookies: Object;
  keys: Array<string>;


  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private cookieService: CookieService
  ) {
    this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
  }

  update() {
    this.cookies = Cookie.getAll();
    this.keys = Object.keys(this.cookies);
  }

  logout() {
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }
}
