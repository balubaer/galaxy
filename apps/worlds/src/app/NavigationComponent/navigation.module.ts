import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NavigationComponentRoutingModule } from './navigation-component-routing.module';
import { ShowGamePrefComponent } from '../show-game-pref/show-game-pref.component';
import { CreateWorldsComponent } from '../create-worlds/create-worlds.component';
import { ShowPlayerComponent } from '../show-player/show-player.component';
import { WorldListComponent } from '../world-list/world-list.component';
import { CreateGameComponent } from '../create-game/create-game.component';
import { AdminComponent } from './admin.component';
import { NavigationComponentComponent } from './navigation-component/navigation-component.component';

@NgModule({
  declarations: [
    AdminComponent,
    ShowPlayerComponent,
    CreateWorldsComponent,
    WorldListComponent,
    CreateGameComponent,
    ShowGamePrefComponent,
    NavigationComponentComponent
  ],
  imports: [
    CommonModule,
    NavigationComponentRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgxGraphModule
  ],
  exports: [AdminComponent]
})
export class NavigationModule { }
