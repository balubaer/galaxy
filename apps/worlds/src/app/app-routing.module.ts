import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateWorldsComponent } from './create-worlds/create-worlds.component';
import { ShowPlayerComponent } from './show-player/show-player.component';
import { WorldListComponent } from './world-list/world-list.component';
import { CreateGameComponent } from './create-game/create-game.component';
import { ShowGamePrefComponent } from './show-game-pref/show-game-pref.component';
import { PlayerModule } from './player/player.module';
import { PlayerComponent } from './player/player/player.component';

const routes: Routes = [
  {
    path: 'create-worlds',
    component: CreateWorldsComponent
  },
  {
    path: 'create-game',
    component: CreateGameComponent
  },{
    path: 'show-game',
    component: ShowGamePrefComponent
  },
  {
    path: 'show-player',
    component: ShowPlayerComponent
  },
  {
    path: 'world-list',
    component: WorldListComponent
  },
  {
    path: 'player',
    loadChildren: () => import('./player/player.module').then(m => m.PlayerModule)
    //component: PlayerComponent
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/world-list'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), PlayerModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }
