import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  GamePref, GameType, PlayerColor, CharacterType, coreGameDefaults, classicGameDefaults, PLAYABLE_CHARACTER_TYPES, CHARACTER_TYPE_NAMES
} from '@galaxy/game-objects';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { GameServiceService } from '../game-service.service';
import { Observable, Subscribable, Subscription } from 'rxjs';
import { GamePlayService } from '../player/game-play.service';
import { UserService } from '../_services/user.service';

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
  /** Classic Game: gewählter Charakter je Spieler. */
  characterTypes: { [playerName: string]: CharacterType | 'random' } = {};
  characterTypeOptions = PLAYABLE_CHARACTER_TYPES.map(type => ({ value: type, name: CHARACTER_TYPE_NAMES[type] }));
  playerForm: FormGroup = this.fb.group({
    PlayerName: ['']
  });
  playercolor$: Observable<Array<PlayerColor>>;
  playercolorubscription: Subscription;
  userSubscription: Subscription;

  constructor(private fb: FormBuilder,
    private gameService: GameServiceService,
    private gamePlayService: GamePlayService,
    private userService: UserService
  ) {
    this.playercolor$ = this.gamePlayService.getPlayerColor();
    this.playercolorubscription = this.playercolor$.subscribe(aPlyerColor => {
      for (const onePlayerColor of aPlyerColor) {
        this.players.push(onePlayerColor.playername);
      }
      this.useDefaults();
    })
    // Vorbelegung mit dem Charakter, den der User bei der Registrierung gewählt hat.
    this.userSubscription = this.userService.getAll().subscribe(users => {
      for (const user of users) {
        if (user.characterType !== undefined && this.characterTypes[user.username] === undefined) {
          this.characterTypes[user.username] = user.characterType as CharacterType | 'random';
        }
      }
    });

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
    this.userSubscription.unsubscribe();
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
    if (gamepref.gameType === 'classic') {
      gamepref.characterTypes = {};
      for (const player of this.players) {
        gamepref.characterTypes[player] = this.characterTypes[player] ?? 'emperor';
      }
    }

    this.gameService.setGamePref(gamepref)
      .subscribe();
  }

}
