import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateWorldsComponent } from './create-worlds/create-worlds.component';
import { ShowPlayerComponent } from './show-player/show-player.component';
import { WorldListComponent } from './world-list/world-list.component';
import { CreateGameComponent } from './create-game/create-game.component';
import { ShowGamePrefComponent } from './show-game-pref/show-game-pref.component';
import { PlayerModule } from './player/player.module';
import { PlayerComponent } from './player/player/player.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './_helpers/auth.guard';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { NavigationComponentComponent } from './NavigationComponent/navigation-component/navigation-component.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'create-worlds',
    component: CreateWorldsComponent
  },
  {
    path: 'create-game',
    component: CreateGameComponent
  }, {
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
  },
   { path: 'register', component: RegisterComponent },
   { path: 'admin', component: NavigationComponentComponent},
   // otherwise redirect to home
   { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), PlayerModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }
