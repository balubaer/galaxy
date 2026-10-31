import { Component, Input, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { CHARACTER_TYPE_NAMES, CharacterType, PlayerCharacter } from '@galaxy/game-objects';
import { GameServiceService } from '../../game-service.service';

/** Admin-Konsole: Spieler mit gewähltem und tatsächlichem Charakter sowie Punkten. */
@Component({
    selector: 'galaxy-player-characters',
    templateUrl: 'player-characters.component.html',
    styleUrls: ['player-characters.component.css'],
    standalone: true,
    imports: [AsyncPipe, RouterLink]
})
export class PlayerCharactersComponent implements OnInit {
    /** Spielernamen verlinken auf die Spieler-Detailseite (relativ zur aktuellen Route). */
    @Input() linkPrefix: string | undefined;

    players$: Observable<Array<PlayerCharacter>> | undefined;

    constructor(private gameService: GameServiceService) { }

    ngOnInit() {
        this.players$ = this.gameService.getPlayerCharacters();
    }

    characterName(type: CharacterType | 'random' | null | undefined): string {
        if (type === 'random') {
            return 'Zufällig';
        }
        return type ? CHARACTER_TYPE_NAMES[type] : '–';
    }
}
