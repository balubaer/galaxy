import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './_helpers/auth.guard';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { NavigationModule } from './NavigationComponent/navigation.module';
import { AdminAuthGuard } from './_helpers/adminauth.guard';

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
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'showMaps',
    loadChildren: () => import('./map/map.module').then(m => m.MapModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./NavigationComponent/navigation.module').then(m => m.NavigationModule)
  },
  // otherwise redirect to home
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), NavigationModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }
