import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AuthenticationService } from '../_services/authentication.service';
import { UserService } from '../_services/user.service';
import { AlertService } from '../_services/alert.service';
import { User } from '@galaxy/api-interfaces';
import { Observable } from 'rxjs';
import { GameServiceService } from '../game-service.service';
import { PlayerColor } from '@galaxy/game-objects';
import { GamePlayService } from '../player/game-play.service';

@Component({
    selector: 'galaxy-register',
    templateUrl: 'register.component.html',
    styleUrls: ['register.component.css']
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    loading = false;
    submitted = false;
    colors$: Observable<Array<string>>;
    isPickerHidden = false;
    color = '';
    isColorHidden = true;
    isButtonHidden = true;
    playercolor$: Observable<Array<PlayerColor>>;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authenticationService: AuthenticationService,
        private userService: UserService,
        private alertService: AlertService,
        private gameService: GameServiceService,
        private gamePlayService: GamePlayService
    ) {
        // redirect to home if already logged in
        if (this.authenticationService.currentUserValue) {
            this.router.navigate(['/']);
        }
    }

    ngOnInit() {
        this.registerForm = this.formBuilder.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            username: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
        this.colors$ = this.gameService.getColors();
        this.playercolor$ = this.gamePlayService.getPlayerColor();

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

        const user: User = {
            id: 1,
            username: this.registerForm.value.username,
            password: this.registerForm.value.password,
            firstName: this.registerForm.value.firstName,
            lastName: this.registerForm.value.lastName,
            token: '',
            color: this.color
        }

        this.loading = true;
        this.userService.register(user)
            .subscribe(
                data => {
                    this.alertService.success('Registration successful', true);
                    this.router.navigate(['/login']);
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                });
    }

    showHideColorPicker() {
        if (this.isPickerHidden === true) {
           this.isPickerHidden = false;
         } else {
           this.isPickerHidden = true;
           this.isColorHidden = true;
           this.isButtonHidden = true;
         }
       }

    pickColor(colorString: string) {
        this.color = colorString;
        this.isColorHidden = false;
        this.isButtonHidden = false;
        this.isPickerHidden = true;
    }
}
