import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  GamePref, GameType, CharacterType, gameTypeOf, coreGameDefaults, classicGameDefaults, PLAYABLE_CHARACTER_TYPES, CHARACTER_TYPE_NAMES
} from '@galaxy/game-objects';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { GameServiceService } from '../game-service.service';
import { Subscription } from 'rxjs';
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
  /** Gültige Charakterwahl aus user.json, hat Vorrang vor der gamePref.json. */
  private userCharacterTypes: { [playerName: string]: CharacterType | 'random' } = {};
  characterTypeOptions = PLAYABLE_CHARACTER_TYPES.map(type => ({ value: type, name: CHARACTER_TYPE_NAMES[type] }));
  playerForm: FormGroup = this.fb.group({
    PlayerName: ['']
  });
  private readonly subscriptions = new Subscription();

  constructor(private fb: FormBuilder,
    private gameService: GameServiceService,
    private gamePlayService: GamePlayService,
    private userService: UserService
  ) {
    // Vorbelegung mit der vorhandenen gamePref.json, ohne sie mit Spielern und Standardwerten des Spieltyps.
    this.subscriptions.add(this.gameService.getGamePref().subscribe({
      next: gamePref => this.useGamePref(gamePref),
      error: () => this.useDefaultPlayers()
    }));
    // Vorbelegung mit dem Charakter, den der User bei der Registrierung gewählt hat (ungültige Werte zählen nicht).
    this.subscriptions.add(this.userService.getAll().subscribe(users => {
      for (const user of users) {
        const type = user.characterType;
        if (type === 'random' || PLAYABLE_CHARACTER_TYPES.includes(type as CharacterType)) {
          this.userCharacterTypes[user.username] = type as CharacterType | 'random';
        }
      }
      this.characterTypes = { ...this.characterTypes, ...this.userCharacterTypes };
    }));

  }

  /** Übernimmt Spieltyp, Werte, Spieler und Charaktere der gespeicherten Gamepref. */
  useGamePref(gamePref: GamePref | null) {
    if (!gamePref) {
      this.useDefaultPlayers();
      return;
    }
    this.players = [...(gamePref.player ?? [])];
    this.characterTypes = { ...this.characterTypes, ...gamePref.characterTypes, ...this.userCharacterTypes };
    this.form.patchValue({
      GameType: gameTypeOf(gamePref),
      PlayName: gamePref.playName,
      DistanceLevelHomes: gamePref.distanceLevelHomes,
      FleetCount: gamePref.fleetCount,
      FleetsOnHomeWorld: gamePref.fleetsOnHomeWorld,
      WorldsCount: gamePref.worldCount,
      StartShipCount: gamePref.startShipCount
    });
  }

  /** Ohne gamePref.json: alle Spieler mit Farbe und die Standardwerte des Spieltyps. */
  useDefaultPlayers() {
    this.subscriptions.add(this.gamePlayService.getPlayerColor().subscribe(aPlayerColor => {
      this.players = aPlayerColor.map(onePlayerColor => onePlayerColor.playername);
      this.useDefaults();
    }));
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
    this.subscriptions.unsubscribe();
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
