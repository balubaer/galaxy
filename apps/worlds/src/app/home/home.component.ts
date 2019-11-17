import { Component, OnInit, OnDestroy } from '@angular/core';
import { first } from 'rxjs/operators';
import { AuthenticationService } from '../_services/authentication.service';
import { UserService } from '../_services/user.service';
import { User } from '@galaxy/api-interfaces';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { RespondTurnData, RequestTurnDataOnlyPlayer, PlayerCommands } from '@galaxy/game-objects';
import { GamePlayService } from '../player/game-play.service';


@Component({
    selector: 'galaxy-home',
    templateUrl: 'home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
    currentUser: User;
    form: FormGroup;
    turnData$: Observable<RespondTurnData>;
    private readonly subscriptions = new Subscription();
    
    constructor(
        private authenticationService: AuthenticationService,
        private gamePlayService: GamePlayService,
        private fb: FormBuilder
    ) {
        this.currentUser = this.authenticationService.currentUserValue;
    }

    ngOnInit() {
        const request: RequestTurnDataOnlyPlayer = {
            playerName: this.currentUser.username
          }
          this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayer(request);
          this.form = this.fb.group({
            Commands: ['']
          });
          this.subscriptions.add(this.form.valueChanges.subscribe());
          this.subscriptions.add(this.form.statusChanges.subscribe());
    }

    onSubmit() {

        const commands: PlayerCommands = {
          player: this.currentUser.username,
          commands: this.form.value.Commands
        }
    
        this.subscriptions.add(this.gamePlayService.setCommands(commands).subscribe());
        const request: RequestTurnDataOnlyPlayer = {
          playerName: this.currentUser.username
        }
        this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayer(request);
        
      }
    

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
      }
}