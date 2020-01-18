import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../_services/authentication.service';
import { Login } from '@galaxy/api-interfaces';
import { UserService, AlertService } from '../_services';

@Component({
  selector: 'galaxy-set-admin',
  templateUrl: './set-admin.component.html',
  styleUrls: ['./set-admin.component.css']
})
export class SetAdminComponent implements OnInit {
  registerForm: FormGroup;
  submitted = false;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService,
    private userService: UserService,
    private alertService: AlertService,
  ) {
    // redirect to home if already logged in
    if (this.authenticationService.currentUserValue) {
      //this.router.navigate(['/admin']);
    }
  }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  onSubmit() {
    this.submitted = true;

    // reset alerts on submit
    this.alertService.clear();

    // stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    const login: Login = {
      username: this.registerForm.value.username,
      password: this.registerForm.value.password
    }

    this.loading = true;
    this.userService.setAdminUser(login)
      .subscribe(
        data => {
          this.alertService.success('Registration successful', true);
          this.router.navigate(['/admin']);
        },
        error => {
          this.alertService.error(error);
          this.loading = false;
        });
  }
}
