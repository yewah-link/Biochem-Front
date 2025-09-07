import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Dashboard } from './features/admin/dashboard/dashboard';

export const routes: Routes = [
{path:'login',component: Login},
{path:'signup',component:Register},
{ path: 'dashboard', component: Dashboard },
{ path: '', redirectTo: '/login', pathMatch: 'full' },
{ path: '**', redirectTo: '/login' }

];
