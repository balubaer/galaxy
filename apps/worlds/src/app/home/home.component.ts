import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from '../_services/authentication.service';
import { User } from '@galaxy/api-interfaces';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { RespondTurnData, RequestTurnDataOnlyPlayer, PlayerCommands } from '@galaxy/game-objects';
import { GamePlayService } from '../player/game-play.service';
import { Node } from '@swimlane/ngx-graph';


@Component({
  selector: 'galaxy-home',
  templateUrl: 'home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: User;
  form: FormGroup;
  turnData$: Observable<RespondTurnData>;
  private readonly subscriptions = new Subscription();

  public node: Node;
  autoZoom = true;
  autoCenter = true;

  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();


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
    setTimeout(()=> this.autoCenter = false, 500);
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


  onNodeSelected(aNode) {
    this.node = aNode;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}