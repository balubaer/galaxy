import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlayerDetailComponent } from './player-detail/player-detail.component';
import { PlayerComponent } from './player/player.component';
import { PlayerListComponent } from './player-list/player-list.component';


const routes: Routes = [
  {
    path: '',
    component: PlayerComponent,
    children: [
      {
        path: 'player',
        component: PlayerListComponent
      },
      {
        path: 'player/player',
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
