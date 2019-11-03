import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GameServiceService } from '../../game-service.service';

@Component({
  selector: 'galaxy-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss']
})
export class PlayerListComponent implements OnInit {
  players$: Observable<Array<string>>;

  constructor(private gameService: GameServiceService) { }

  ngOnInit() {
    this.players$ = this.gameService.getPlayerList();
  }

}
