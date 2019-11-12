import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GamePlayService } from '../game-play.service';
import { RespondTurnData, RequestTurnData, GamePref, RequestTurnDataOnlyPlayer } from '@galaxy/game-objects';

@Component({
  selector: 'galaxy-player-detail',
  templateUrl: './player-detail.component.html',
  styleUrls: ['./player-detail.component.css']
})
export class PlayerDetailComponent implements OnInit {
  playerName: string;
  turnData$: Observable<RespondTurnData>;

  constructor(private route: ActivatedRoute,
    private gamePlayService: GamePlayService) {
    this.playerName = route.snapshot.params["player"];
  }

  ngOnInit() {
    const request: RequestTurnDataOnlyPlayer = {
      playerName : this.playerName
    }
    this.turnData$ = this.route.params =
      this.gamePlayService.getTurnDataOnlyPlayer(request);  
  }

}
