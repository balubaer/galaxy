import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NavigationComponentComponent } from './navigation-component/navigation-component.component';
import { PlayerComponent } from '../player/player/player.component';
import { PlayerDetailComponent } from '../player/player-detail/player-detail.component';
import { ShowGamePrefComponent } from '../show-game-pref/show-game-pref.component';
import { CreateWorldsComponent } from '../create-worlds/create-worlds.component';
import { CreateGameComponent } from '../create-game/create-game.component';
import { ShowPlayerComponent } from '../show-player/show-player.component';
import { WorldListComponent } from '../world-list/world-list.component';
import { PlayerModule } from '../player/player.module';
import { AdminComponent } from './admin.component';


const routes: Routes = [
  {
    path: 'create-worlds',
    component: CreateWorldsComponent
  },
  {
    path: 'create-game',
    component: CreateGameComponent
  },
  {
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
    path: 'admin',
    component: AdminComponent,
    children: [
      {
        path: 'player',
        loadChildren: () => import('../player/player.module').then(m => m.PlayerModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes), PlayerModule],
  exports: [RouterModule]
})
export class NavigationComponentRoutingModule { }
