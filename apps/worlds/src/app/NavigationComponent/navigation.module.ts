import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
//import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NavigationComponentRoutingModule } from './navigation-component-routing.module';
import { ShowGamePrefComponent } from '../show-game-pref/show-game-pref.component';
import { CreateWorldsComponent } from '../create-worlds/create-worlds.component';
import { WorldListComponent } from '../world-list/world-list.component';
import { CreateGameComponent } from '../create-game/create-game.component';
import { AdminComponent } from './admin.component';
import { NavigationComponentComponent } from './navigation-component/navigation-component.component';
import { SetAdminComponent } from '../set-admin/set-admin.component';
import { AdminLoginComponent } from '../adminLogin/admin-login.component';
import { CharacterInfoComponent } from '../_components/character-info/character-info.component';
import { PlayerCharactersComponent } from '../_components/player-characters/player-characters.component';

@NgModule({ declarations: [
        AdminComponent,
        CreateWorldsComponent,
        WorldListComponent,
        CreateGameComponent,
        ShowGamePrefComponent,
        NavigationComponentComponent,
        SetAdminComponent,
        AdminLoginComponent
    ],
    exports: [AdminComponent], imports: [CommonModule,
        NavigationComponentRoutingModule,
        ReactiveFormsModule,
        CharacterInfoComponent,
        PlayerCharactersComponent], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class NavigationModule { }
