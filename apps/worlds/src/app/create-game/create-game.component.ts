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

  constructor(private fb: FormBuilder, private gameService: GameServiceService) { }

  ngOnInit() {
    this.form = this.fb.group({
      DistanceLevelHomes: [''],
      FleetCount: [''],
      FleetsOnHomeWorld: [''],
      WorldsCount: ['', Validators.required],
      PlayName: [''],
      StartShipCount: ['']
    });
  }

  onSubmit() {

    const gamepref: GamePref = {
      distanceLevelHomes: this.form.value.DistanceLevelHomes,
      fleetCount: this.form.value.FleetCount,
      fleetsOnHomeWorld: this.form.value.FleetsOnHomeWorld,
      worldCount: this.form.value.WorldsCount,
      playName: this.form.value.PlayName,
      player: ['ZAPHOD'],
      startShipCount: this.form.value.StartShipCount
    }

    console.log('Added new game', gamepref)

    this.gameService.setGamePref(gamepref)
      .subscribe((gamepref01: GamePref) => console.log('Added new game', gamepref01));
  }
  
}
