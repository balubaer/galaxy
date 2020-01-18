import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShowGamePrefComponent } from '../show-game-pref/show-game-pref.component';
import { CreateWorldsComponent } from '../create-worlds/create-worlds.component';
import { CreateGameComponent } from '../create-game/create-game.component';
import { ShowPlayerComponent } from '../show-player/show-player.component';
import { WorldListComponent } from '../world-list/world-list.component';
import { PlayerModule } from '../player/player.module';
import { SetAdminComponent } from '../set-admin/set-admin.component';
import { AdminComponent } from './admin.component';
import { AdminAuthGuard } from '../_helpers/adminauth.guard';
import { AdminLoginComponent } from '../adminLogin/admin-login.component';


const routes: Routes = [
  {
    path: 'admin/create-worlds',
    component: CreateWorldsComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'admin/create-game',
    component: CreateGameComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'admin/show-game',
    component: ShowGamePrefComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'admin/show-player',
    component: ShowPlayerComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'admin/world-list',
    component: WorldListComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'admin/set-admin',
    component: SetAdminComponent
  },
  {
    path: 'admin/admin-login',
    component: AdminLoginComponent
  },
  {
    path: 'admin',
    canActivate: [AdminAuthGuard],
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
