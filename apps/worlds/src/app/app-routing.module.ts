import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateWorldsComponent } from './create-worlds/create-worlds.component';
import { ShowPlayerComponent } from './show-player/show-player.component';
import { WorldListComponent } from './world-list/world-list.component';

const routes: Routes = [
  {
    path: 'create-worlds',
    component: CreateWorldsComponent
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
    path: '',
    pathMatch: 'full',
    redirectTo: '/world-list'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
