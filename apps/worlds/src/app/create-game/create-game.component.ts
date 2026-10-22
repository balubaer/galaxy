import { Component, OnInit, OnDestroy } from '@angular/core';
import { GamePref, GameType, PlayerColor, coreGameDefaults, classicGameDefaults } from '@galaxy/game-objects';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { GameServiceService } from '../game-service.service';
import { Observable, Subscribable, Subscription } from 'rxjs';
import { GamePlayService } from '../player/game-play.service';

@Component({
    selector: 'galaxy-create-game',
    templateUrl: './create-game.component.html',
    styleUrls: ['./create-game.component.css'],
    standalone: false
})
export class CreateGameComponent implements OnDestroy {
  form: FormGroup = this.fb.group({
    DistanceLevelHomes: [''],
    FleetCount: [''],
    FleetsOnHomeWorld: [''],
    WorldsCount: ['', Validators.required],
    GameType: ['core'],
    PlayName: [''],
    StartShipCount: ['']
  });
  players: Array<string> = [];
  playerForm: FormGroup = this.fb.group({
    PlayerName: ['']
  });
  playercolor$: Observable<Array<PlayerColor>>;
  playercolorubscription: Subscription;

  constructor(private fb: FormBuilder,
    private gameService: GameServiceService,
    private gamePlayService: GamePlayService
  ) {
    this.playercolor$ = this.gamePlayService.getPlayerColor();
    this.playercolorubscription = this.playercolor$.subscribe(aPlyerColor => {
      for (const onePlayerColor of aPlyerColor) {
        this.players.push(onePlayerColor.playername);
      }
      this.useDefaults();
    })

  }

  useDefaults() {
    const gameType: GameType = this.form.value.GameType;
    const defaults = gameType === 'classic'
      ? classicGameDefaults(this.players.length)
      : coreGameDefaults(this.players.length);
    this.form.patchValue({
      DistanceLevelHomes: defaults.distanceLevelHomes,
      FleetCount: defaults.fleetCount,
      FleetsOnHomeWorld: defaults.fleetsOnHomeWorld,
      WorldsCount: defaults.worldCount,
      StartShipCount: defaults.startShipCount
    });
  }

  ngOnDestroy(): void {
    this.playercolorubscription.unsubscribe();
  }

  onSubmitPlayer() {
    this.players.push(this.playerForm.value.PlayerName);
  }

  onSubmit() {
    const gamepref: GamePref = {
      gameType: this.form.value.GameType,
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
