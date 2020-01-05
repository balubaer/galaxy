import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { GamePlayService } from '../game-play.service';
import { RespondTurnData, RequestTurnData, GamePref, RequestTurnDataOnlyPlayer, PlayerCommands } from '@galaxy/game-objects';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Node } from '@swimlane/ngx-graph';

@Component({
  selector: 'galaxy-player-detail',
  templateUrl: './player-detail.component.html',
  styleUrls: ['./player-detail.component.css']
})
export class PlayerDetailComponent implements OnInit, OnDestroy {
  form: FormGroup;
  playerName: string;
  turnData$: Observable<RespondTurnData>;
  
  public node: Node;
  autoZoom = true;
  autoCenter = false; 

  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();
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

  onNodeSelected(aNode) {
    this.node = aNode;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}