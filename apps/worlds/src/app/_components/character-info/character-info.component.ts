import { Component, Input } from '@angular/core';
import { CHARACTER_INFOS, CHARACTER_TYPE_NAMES, CharacterInfo, CharacterType, PLAYABLE_CHARACTER_TYPES } from '@galaxy/game-objects';

/**
 * Infos zu Charakteren des Classic Games. Mit characterType nur dieser Charakter
 * ('random' oder unbekannt: Hinweis auf Auslosung), ohne alle spielbaren Charaktere.
 */
@Component({
    selector: 'galaxy-character-info',
    templateUrl: 'character-info.component.html',
    styleUrls: ['character-info.component.css'],
    standalone: true
})
export class CharacterInfoComponent {
    @Input() characterType: string | undefined;

    get entries(): Array<{ name: string; info: CharacterInfo }> {
        const types = this.characterType === undefined
            ? PLAYABLE_CHARACTER_TYPES
            : PLAYABLE_CHARACTER_TYPES.filter(type => type === this.characterType);
        return types
            .filter(type => CHARACTER_INFOS[type] !== undefined)
            .map(type => ({ name: CHARACTER_TYPE_NAMES[type as CharacterType], info: CHARACTER_INFOS[type] as CharacterInfo }));
    }
}
