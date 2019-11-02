import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ShowPlayerComponent } from './show-player/show-player.component';
import { CreateWorldsComponent } from './create-worlds/create-worlds.component';
import { ReactiveFormsModule } from '@angular/forms';
import { WorldListComponent } from './world-list/world-list.component';
import { NavigationComponentComponent } from './NavigationComponent/navigation-component/navigation-component.component';
import { CreateGameComponent } from './create-game/create-game.component';

@NgModule({
  declarations: [AppComponent, ShowPlayerComponent, CreateWorldsComponent, WorldListComponent, NavigationComponentComponent, CreateGameComponent],
  imports: [BrowserModule, HttpClientModule, ReactiveFormsModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
  exports: [ShowPlayerComponent]
})
export class AppModule {}
