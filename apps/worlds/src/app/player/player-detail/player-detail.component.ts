import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GamePlayService } from '../game-play.service';
import { RespondTurnData, RequestTurnData, GamePref, RequestTurnDataOnlyPlayer, PlayerCommands } from '@galaxy/game-objects';
import { FormGroup, FormBuilder } from '@angular/forms';

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

  constructor(private route: ActivatedRoute,
    private gamePlayService: GamePlayService, private fb: FormBuilder) {
    this.playerName = route.snapshot.params["player"];
  }

  ngOnInit() {
    const request: RequestTurnDataOnlyPlayer = {
      playerName: this.playerName
    }
    this.turnData$ = this.route.params = this.gamePlayService.getTurnDataOnlyPlayer(request);
    this.form = this.fb.group({
      Commands: ['']
    });
    this.subscriptions.add(this.form.valueChanges.subscribe());
    this.subscriptions.add(this.form.statusChanges.subscribe());
  }

  onSubmit() {

    const commands: PlayerCommands = {
      player: this.playerName,
      commands: this.form.value.Commands
    }

    this.subscriptions.add(this.gamePlayService.setCommands(commands).subscribe());
    const request: RequestTurnDataOnlyPlayer = {
      playerName: this.playerName
    }
    this.turnData$ = this.route.params = this.gamePlayService.getTurnDataOnlyPlayer(request);
    
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}