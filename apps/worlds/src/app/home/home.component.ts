import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from '../_services/authentication.service';
import { User } from '@galaxy/api-interfaces';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { RespondTurnData, RequestTurnDataOnlyPlayer, PlayerCommands, GamePref, RequestTurnDataOnlyPlayerAndRound } from '@galaxy/game-objects';
import { GamePlayService } from '../player/game-play.service';
import { Node } from '@swimlane/ngx-graph';
import { GameServiceService } from '../game-service.service';


@Component({
  selector: 'galaxy-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: User;
  form: FormGroup;
  turnData$: Observable<RespondTurnData>;
  private readonly subscriptions = new Subscription();
  gamePref$: Observable<GamePref>;
  gamePrefSubsription: Subscription = null;

  public node: Node;
  autoZoom = true;
  autoCenter = true;

  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();
  round: number;
  changeround: number;


  constructor(
    private authenticationService: AuthenticationService,
    private gamePlayService: GamePlayService,
    private gamePrefService: GameServiceService,
    private fb: FormBuilder
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  ngOnInit() {
    const request: RequestTurnDataOnlyPlayer = {
      playerName: this.currentUser.username
    }
    this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayer(request);
    this.gamePref$ = this.gamePrefService.getGamePref();
    this.form = this.fb.group({
      Commands: ['']
    });
    this.subscriptions.add(this.form.valueChanges.subscribe());
    this.subscriptions.add(this.form.statusChanges.subscribe());
    setTimeout(() => this.autoCenter = false, 500);
    this.gamePrefSubsription = this.gamePref$.subscribe(aGamePref => {
      this.round = aGamePref.round;
      this.changeround = aGamePref.round
    });
  }

  onSubmit() {
    if (this.round === this.changeround) {
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
  }


  onNodeSelected(aNode) {
    this.node = aNode;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  readNewTurnDataWithRound(aRound: number) {
    if (this.gamePrefSubsription !== null) {
      this.gamePrefSubsription.unsubscribe();
      this.gamePrefSubsription = null;
    }
    const request: RequestTurnDataOnlyPlayerAndRound = {
      playerName: this.currentUser.username,
      round: this.changeround
    }
    this.autoCenter = true;
    this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayerAndRound(request);
    setTimeout(() => this.autoCenter = false, 500);
  }

  pressPrevRound() {
    if (this.changeround > 0) {
      this.changeround -= 1;
      this.readNewTurnDataWithRound(this.changeround);
    }
  }

  pressNextRound() {
    if (this.changeround < this.round) {
      this.changeround += 1;
      this.readNewTurnDataWithRound(this.changeround);
    }
  }

}