import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShowMapsComponent } from './show-maps/show-maps.component';
import { ShowMapDetailComponent } from './show-map-detail/show-map-detail.component';
import { MapsComponent } from '../maps/maps.component';


const routes: Routes = [
  {
    path: '',
    component: MapsComponent,
    children: [
      {
        path: '',
        component: ShowMapsComponent
      },
      {
        path: ':key',
        component: ShowMapDetailComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MapRoutingModule { }
