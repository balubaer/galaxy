import { Component, OnInit } from '@angular/core';
import { GamePref } from '@galaxy/game-objects';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { GameServiceService } from '../game-service.service';

@Component({
  selector: 'galaxy-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.css']
})
export class CreateGameComponent implements OnInit {
  form: FormGroup;
  players: Array<string> = new Array();
  playerForm: FormGroup;

  constructor(private fb: FormBuilder, private gameService: GameServiceService) {
   }

  ngOnInit() {
    this.form = this.fb.group({
      DistanceLevelHomes: [''],
      FleetCount: [''],
      FleetsOnHomeWorld: [''],
      WorldsCount: ['', Validators.required],
      PlayName: [''],
      StartShipCount: ['']
    });
    this.playerForm = this.fb.group({
      PlayerName: ['']
    });
  }

  onSubmitPlayer() {
    this.players.push(this.playerForm.value.PlayerName);
  }

  onSubmit() {
    const gamepref: GamePref = {
      distanceLevelHomes: this.form.value.DistanceLevelHomes,
      fleetCount: this.form.value.FleetCount,
      fleetsOnHomeWorld: this.form.value.FleetsOnHomeWorld,
      worldCount: this.form.value.WorldsCount,
      playName: this.form.value.PlayName,
      player: this.players,
      startShipCount: this.form.value.StartShipCount,
      round: 0
    }

    this.gameService.setGamePref(gamepref)
      .subscribe();
  }
  
}
