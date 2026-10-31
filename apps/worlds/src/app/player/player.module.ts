import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlayerRoutingModule } from './player-routing.module';
import { PlayerDetailComponent } from '../player/player-detail/player-detail.component';
import { PlayerComponent } from './player/player.component';
import { PlayerListComponent } from './player-list/player-list.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { NavigationPlayerComponent } from './navigation-component/NavigationPlayerComponent';
import { CharacterInfoComponent } from '../_components/character-info/character-info.component';
import { PlayerCharactersComponent } from '../_components/player-characters/player-characters.component';


@NgModule({ declarations: [
        PlayerDetailComponent,
        PlayerComponent,
        PlayerListComponent,
        NavigationPlayerComponent
    ],
    exports: [
        PlayerComponent,
        PlayerListComponent,
    ], imports: [CommonModule,
        PlayerRoutingModule,
        ReactiveFormsModule,
        CharacterInfoComponent,
        PlayerCharactersComponent], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class PlayerModule { }
