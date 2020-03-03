import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { GamePlayService } from '../game-play.service';
import { RespondTurnData, RequestTurnData, GamePref, RequestTurnDataOnlyPlayer, PlayerCommands, PlayerColor, RequestTurnDataOnlyPlayerAndRound, extractNumberString } from '@galaxy/game-objects';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Node } from '@swimlane/ngx-graph';
import { GameServiceService } from '../../game-service.service';

@Component({
  selector: 'galaxy-player-detail',
  templateUrl: './player-detail.component.html',
  styleUrls: ['./player-detail.component.css']
})
export class PlayerDetailComponent implements OnInit, OnDestroy {
  form: FormGroup;
  playerName: string;
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
  
  constructor(
    private route: ActivatedRoute,
    private gamePlayService: GamePlayService,
    private gamePrefService: GameServiceService,
    private fb: FormBuilder) {
    this.playerName = route.snapshot.params["player"];
    this.form = this.fb.group({
      Commands: ['']
    });
  }

  ngOnInit() {
    this.distanceLevelHomes = 3;

    const request: RequestTurnDataOnlyPlayer = {
      playerName: this.playerName,
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
        player: this.playerName,
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
      playerName: this.playerName,
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
      playerName: this.playerName,
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