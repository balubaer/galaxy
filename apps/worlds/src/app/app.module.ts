import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ShowPlayerComponent } from './show-player/show-player.component';

@NgModule({
  declarations: [AppComponent, ShowPlayerComponent],
  imports: [BrowserModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent],
  exports: [ShowPlayerComponent]
})
export class AppModule {}
