import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlayerRoutingModule } from './player-routing.module';
import { PlayerDetailComponent } from '../player/player-detail/player-detail.component';
import { PlayerComponent } from './player/player.component';
import { PlayerListComponent } from './player-list/player-list.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NavigationPlayerComponent } from './navigation-component/NavigationPlayerComponent';


@NgModule({
  declarations: [
    PlayerDetailComponent,
    PlayerComponent,
    PlayerListComponent,
    NavigationPlayerComponent
  ],
  imports: [
    CommonModule,
    PlayerRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgxGraphModule
  ],
  exports: [
    PlayerComponent,
    PlayerListComponent
  ]
})
export class PlayerModule { }
