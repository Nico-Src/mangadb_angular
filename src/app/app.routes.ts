import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { CollectionComponent } from './pages/collection/collection.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { RoleGuard } from '../guards/roleGuard';
import { AuthGuard } from '../guards/authGuard';
import { BrowseSeriesComponent } from './pages/browse-series/browse-series.component';
import { SeriesDetailComponent } from './pages/series-detail/series-detail.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { UserRole } from '../models/user';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'register',
        component: RegisterComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'collection',
        component: CollectionComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'browse-series',
        component: BrowseSeriesComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'series/:slug',
        component: SeriesDetailComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/dashboard',
        component: DashboardComponent,
        canActivate: [RoleGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR]
        }
    },
    // auto redirect
    { 
        path: '**', 
        redirectTo: '' 
    }
];