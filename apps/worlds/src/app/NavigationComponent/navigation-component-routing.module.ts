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
import { SetAdminComponent } from '../set-admin/set-admin.component';


const routes: Routes = [
  {
    path: 'admin/create-worlds',
    component: CreateWorldsComponent
  },
  {
    path: 'admin/create-game',
    component: CreateGameComponent
  },
  {
    path: 'admin/show-game',
    component: ShowGamePrefComponent
  },
  {
    path: 'admin/show-player',
    component: ShowPlayerComponent
  },
  {
    path: 'admin/world-list',
    component: WorldListComponent
  },
  {
    path: 'admin/set-admin',
    component: SetAdminComponent
  },
  {
    path: 'admin',
    pathMatch: 'full',
    redirectTo: 'admin/create-worlds'
  },
  {
    path: 'player',
    loadChildren: () => import('../player/player.module').then(m => m.PlayerModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes), PlayerModule],
  exports: [RouterModule]
})
export class NavigationComponentRoutingModule { }
