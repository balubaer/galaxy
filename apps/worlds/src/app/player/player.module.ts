import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlayerRoutingModule } from './player-routing.module';
import { PlayerDetailComponent } from '../player/player-detail/player-detail.component';
import { PlayerComponent } from './player/player.component';
import { PlayerListComponent } from './player-list/player-list.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [PlayerDetailComponent, PlayerComponent, PlayerListComponent],
  imports: [
    CommonModule,
    PlayerRoutingModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  exports: [PlayerComponent, PlayerListComponent]
})
export class PlayerModule { }
