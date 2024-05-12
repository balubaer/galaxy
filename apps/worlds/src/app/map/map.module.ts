import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapRoutingModule } from './map-routing.module';
import { ShowMapsComponent } from './show-maps/show-maps.component';
import { ShowMapDetailComponent } from './show-map-detail/show-map-detail.component';
import { MapsComponent } from '../maps/maps.component';


@NgModule({
  declarations: [
    ShowMapsComponent,
    ShowMapDetailComponent,
    MapsComponent
  ],
  imports: [
    CommonModule,
    MapRoutingModule
  ],
  exports: [
    MapsComponent,
    ShowMapsComponent,
    ShowMapDetailComponent
  ]
})
export class MapModule { }
