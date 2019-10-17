import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { IPlayer } from '@galaxy/game-objects';

@Component({
  selector: 'galaxy-show-player',
  templateUrl: './show-player.component.html',
  styleUrls: ['./show-player.component.css']
})
export class ShowPlayerComponent implements OnInit {
  player$: Observable<IPlayer>; 

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.player$ = this.http.get<IPlayer>('/api/Player');
  }

}
