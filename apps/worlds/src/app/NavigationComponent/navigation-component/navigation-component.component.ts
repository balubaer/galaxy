import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../_services/authentication.service';

@Component({
  selector: 'galaxy-navigation-component',
  templateUrl: './navigation-component.component.html',
  styleUrls: ['./navigation-component.component.scss']
})
export class NavigationComponentComponent {

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  logout() {
    this.authenticationService.logoutAdmin();
    this.router.navigate(['admin/admin-login']);
  }

}
