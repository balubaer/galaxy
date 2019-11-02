import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GamePref } from '@galaxy/game-objects';
import { ActivatedRoute } from '@angular/router';
import { GameServiceService } from '../game-service.service';

@Component({
  selector: 'galaxy-show-game-pref',
  templateUrl: './show-game-pref.component.html',
  styleUrls: ['./show-game-pref.component.css']
})
export class ShowGamePrefComponent implements OnInit {
  gamePref$: Observable<GamePref>;
  players$: Observable<Array<string>>;

  constructor(private route: ActivatedRoute, private gamePrefService: GameServiceService) { }

  ngOnInit() {
    this.gamePref$ = this.route.params =
      this.gamePrefService.getGamePref();
      this.players$ = this.gamePrefService.getPlayerList();

  }

}
