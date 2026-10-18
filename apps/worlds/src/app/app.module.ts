import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { JwtInterceptor } from './_helpers/jwt.interceptor';
import { HttpErrorInterceptor } from './_helpers/error.interceptor';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register';
import { AlertComponent } from './_components';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationModule } from './NavigationComponent/navigation.module';
import { CommandTableComponent } from './command-table/command-table.component';

@NgModule({ declarations: [
        HomeComponent,
        AppComponent,
        LoginComponent,
        RegisterComponent,
        AlertComponent
    ],
    bootstrap: [AppComponent],
    exports: [], imports: [BrowserModule,
        ReactiveFormsModule,
        AppRoutingModule,
        //NgxGraphModule,
        BrowserAnimationsModule,
        NavigationModule,
        CommandTableComponent], providers: [
        // { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        // { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }
        {
            provide: HTTP_INTERCEPTORS,
            useClass: HttpErrorInterceptor,
            multi: true,
        },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
