import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlayerDetailComponent } from './player-detail/player-detail.component';
import { PlayerComponent } from './player/player.component';
import { PlayerListComponent } from './player-list/player-list.component';
import { HomeComponent } from '../home/home.component';


const routes: Routes = [
  {
    path: 'player',
    component: PlayerComponent,
    children: [
      {
        path: '',
        component: PlayerListComponent
      },
      {
        path: ':player',
        component: PlayerDetailComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlayerRoutingModule { }
