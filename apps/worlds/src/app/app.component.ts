import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from './_services/authentication.service';

@Component({
    selector: 'galaxy-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  currentUser: any;
  
  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {
    this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
  }

    showMaps() {
        this.router.navigate(['/showMaps']);
    }
  logout() {
    this.authenticationService.logout();
    this.router.navigate(['/logout']);
  }
}
