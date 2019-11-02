import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { Player } from '@galaxy/game-objects';
import { GameServiceService } from '../game-service.service';

@Component({
  selector: 'galaxy-show-player',
  templateUrl: './show-player.component.html',
  styleUrls: ['./show-player.component.css']
})
export class ShowPlayerComponent implements OnInit {
  player$: Observable<Player>;
  players$: Observable<Array<string>>;

  constructor(private http: HttpClient, private gameService: GameServiceService) {}

  ngOnInit() {
    this.player$ = this.http.get<Player>('/api/Player');
    this.players$ = this.gameService.getPlayerList();
  }

}
