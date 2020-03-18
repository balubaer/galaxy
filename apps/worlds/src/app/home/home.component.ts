import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from '../_services/authentication.service';
import { User } from '@galaxy/api-interfaces';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { RespondTurnData, RequestTurnDataOnlyPlayer, PlayerCommands, GamePref, RequestTurnDataOnlyPlayerAndRound, PlayerColor, extractNumberString } from '@galaxy/game-objects';
import { GamePlayService } from '../player/game-play.service';
import { Node } from '@swimlane/ngx-graph';
import { GameServiceService } from '../game-service.service';
import { CookieService } from 'ngx-cookie-service';

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
  subscriptionsTurnData: Subscription = null;
  gamePref$: Observable<GamePref>;
  gamePrefSubsription: Subscription = null;
  homeWorldName: string;
  distanceLevelHomes: number;
  selectWorld: number;

  public node: Node;
  autoZoom = true;
  autoCenter = true;

  draggingEnabled = false;
  panningEnabled = false;

  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();
  round: number;
  changeround: number;
  playercolor$: Observable<Array<PlayerColor>>;

  turnCommandTxt = '';

  ishidden = false;
  ishiddenNextButton = true;
  ishiddenPrevButton = false;

  cookieValue = 'UNKNOWN';

  constructor(
    private authenticationService: AuthenticationService,
    private gamePlayService: GamePlayService,
    private gamePrefService: GameServiceService,
    private fb: FormBuilder,
    private cookieService: CookieService
  ) {
    //this.currentUser = this.authenticationService.currentUserValue;
    this.form = this.fb.group({
      Commands: ['']
    });
  }

  ngOnInit() {
    this.distanceLevelHomes = 3;
    this.cookieService.set( 'Test', 'Hello World' );
        this.cookieValue = this.cookieService.get('Test');
        console.log(`Home this.cookieValue: ${this.cookieValue}`);
        console.log(`Home this.cookieService.get: ${this.cookieService.get('sess-tutorial')}`);
        console.log(`Home this.cookieService.getAll: ${this.cookieService.getAll()}`);


    const request: RequestTurnDataOnlyPlayer = {
      playerName: this.currentUser.username,
      distanceLevelHomes: this.distanceLevelHomes
    }
    const playerCommands$: Observable<PlayerCommands> = this.gamePlayService.getCommand(request);
    playerCommands$.subscribe(aPlayerCommands => {
      this.turnCommandTxt = aPlayerCommands.commands;
      this.form.get('Commands').setValue(aPlayerCommands.commands);
    })

    this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayer(request);
    this.subscriptionsTurnData = this.turnData$.subscribe(aTurnData => {
      this.homeWorldName = aTurnData.homeWorldName;
      this.selectWorld = +extractNumberString(aTurnData.homeWorldName);
    });

    this.gamePref$ = this.gamePrefService.getGamePref();
    this.playercolor$ = this.gamePlayService.getPlayerColor();

    this.subscriptions.add(this.form.valueChanges.subscribe(console.log));
    this.subscriptions.add(this.form.statusChanges.subscribe(console.log));
    this.gamePrefSubsription = this.gamePref$.subscribe(aGamePref => {
      this.round = aGamePref.round;
      this.changeround = aGamePref.round
    });
    setTimeout(() => this.autoCenter = false, 500);
  }

  onSubmit() {
    if (this.round === this.changeround) {
      const commands: PlayerCommands = {
        player: this.currentUser.username,
        commands: this.form.value.Commands
      }
      this.subscriptions.add(this.gamePlayService.setCommands(commands).subscribe());
      this.turnCommandTxt = this.form.value.Commands;
    }
  }

  onNodeSelected(aNode) {
    this.node = aNode;
    if (this.draggingEnabled === false && this.panningEnabled === false) {
      this.readNewTurnDataWithRoundAndWorldName(this.changeround, this.node.id);
      this.selectWorld = +extractNumberString(this.node.id);
    }
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
      round: this.changeround,
      worldName: `W${this.selectWorld}`,
      distanceLevelHomes: this.distanceLevelHomes
    }
    this.autoCenter = true;

    if (this.subscriptionsTurnData !== null) {
      this.subscriptionsTurnData.unsubscribe();
      this.subscriptionsTurnData = null;
    }
    this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayerAndRound(request);
    this.subscriptionsTurnData = this.turnData$.subscribe(aTurnData => {
      this.turnCommandTxt = aTurnData.turnCommanTxt;
      if (this.changeround === this.round) {
        this.form.get('Commands').setValue(aTurnData.turnCommanTxt);
      }
    });
    setTimeout(() => this.autoCenter = false, 500);
  }

  readNewTurnDataWithRoundAndWorldName(aRound: number, aWorldName: string) {
    if (this.gamePrefSubsription !== null) {
      this.gamePrefSubsription.unsubscribe();
      this.gamePrefSubsription = null;
    }
    const request: RequestTurnDataOnlyPlayerAndRound = {
      playerName: this.currentUser.username,
      round: this.changeround,
      worldName: aWorldName,
      distanceLevelHomes: this.distanceLevelHomes
    }
    this.autoCenter = true;

    this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayerAndRound(request);
    setTimeout(() => this.autoCenter = false, 500);
  }

  pressPrevRound() {
    if (this.changeround > 0) {
      this.changeround -= 1;
      this.readNewTurnDataWithRound(this.changeround);
      this.ishidden = true;
      this.ishiddenNextButton = false;
      if (this.changeround === 0) {
        this.ishiddenPrevButton = true;
      }
    }
  }

  pressNextRound() {
    if (this.changeround < this.round) {
      this.changeround += 1;
      this.readNewTurnDataWithRound(this.changeround);
      if (this.changeround === this.round) {
        this.ishidden = false;
        this.ishiddenNextButton = true;
      }
      if (this.changeround > 0) {
        this.ishiddenPrevButton = false;
      }
    }
  }

  pressViewHomeWorld() {
    this.selectWorld = +extractNumberString(this.homeWorldName);
    this.readNewTurnDataWithRound(this.changeround);
  }

  pressViewWorld() {
    this.readNewTurnDataWithRoundAndWorldName(this.changeround, `W${this.selectWorld}`);
  }
}