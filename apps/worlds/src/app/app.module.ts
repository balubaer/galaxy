import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ShowPlayerComponent } from './show-player/show-player.component';
import { CreateWorldsComponent } from './create-worlds/create-worlds.component';
import { ReactiveFormsModule } from '@angular/forms';
import { WorldListComponent } from './world-list/world-list.component';
import { NavigationComponentComponent } from './NavigationComponent/navigation-component/navigation-component.component';
import { CreateGameComponent } from './create-game/create-game.component';
import { ShowGamePrefComponent } from './show-game-pref/show-game-pref.component';
import { LoginComponent } from './login/login.component';
import { JwtInterceptor } from './_helpers/jwt.interceptor';
import { HttpErrorInterceptor } from './_helpers/error.interceptor';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register';
import { AlertComponent } from './_components';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    HomeComponent,
    AppComponent,
    ShowPlayerComponent,
    CreateWorldsComponent,
    WorldListComponent,
    NavigationComponentComponent,
    CreateGameComponent,
    ShowGamePrefComponent,
    LoginComponent,
    RegisterComponent,
    AlertComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    NgxGraphModule,
    BrowserAnimationsModule],
  providers: [
    // { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    // { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true,
    }
  ], bootstrap: [AppComponent],
  exports: [ShowPlayerComponent]
})
export class AppModule { }
