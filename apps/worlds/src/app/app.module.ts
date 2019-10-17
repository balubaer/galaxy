import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ShowPlayerComponent } from './show-player/show-player.component';
import { CreateWorldsComponent } from './create-worlds/create-worlds.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [AppComponent, ShowPlayerComponent, CreateWorldsComponent],
  imports: [BrowserModule, HttpClientModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
  exports: [ShowPlayerComponent]
})
export class AppModule {}
