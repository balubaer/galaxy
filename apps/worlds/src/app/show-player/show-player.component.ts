import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player } from '@galaxy/game-objects';
import { GameServiceService } from '../game-service.service';

@Component({
  selector: 'galaxy-show-player',
  templateUrl: './show-player.component.html',
  styleUrls: ['./show-player.component.css']
})
export class ShowPlayerComponent implements OnInit {
  players$: Observable<Array<string>>;
  isPickerShown = true;

  constructor(private gameService: GameServiceService) { }

  ngOnInit() {
    this.players$ = this.gameService.getPlayerList();
  }

  showHideColorPicker() {
   if (this.isPickerShown === false) {
      this.isPickerShown = true;
    } else {
      this.isPickerShown = false;
    }
  }

  pickColor(colorString: string) {
    console.log('Color: ' + colorString);
  }
}
