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
import { PublisherDetailComponent } from './pages/publisher-detail/publisher-detail.component';
import { ContributorDetailComponent } from './pages/contributor-detail/contributor-detail.component';
import { VolumeDetailComponent } from './pages/volume-detail/volume-detail.component';
import { ReadingHistoryComponent } from './pages/reading-history/reading-history.component';
import { ListsComponent } from './pages/lists/lists.component';
import { ListDetailComponent } from './pages/list-detail/list-detail.component';
import { AdminSeriesComponent } from './pages/admin/series/series.component';
import { AdminSeriesDetailComponent } from './pages/admin/series-detail/series-detail.component';
import { EditGuard } from '../guards/editGuard';
import { AdminVolumesComponent } from './pages/admin/volumes/volumes.component';
import { AdminVolumeDetailComponent } from './pages/admin/volume-detail/volume-detail.component';
import { AdminPublishersComponent } from './pages/admin/publishers/publishers.component';
import { AdminPublisherDetailComponent } from './pages/admin/publisher-detail/publisher-detail.component';
import { AdminContributorsComponent } from './pages/admin/contributors/contributors.component';
import { AdminContributorDetailComponent } from './pages/admin/contributor-detail/contributor-detail.component';
import { AdminMediaComponent } from './pages/admin/media-library/media-library.component';
import { AdminReportsComponent } from './pages/admin/reports/reports.component';
import { AdminUsersComponent } from './pages/admin/users/users.component';
import { AdminUserDetailComponent } from './pages/admin/user-detail/user-detail.component';

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
        data: { loggedInRedirect: '/' }
    },
    {
        path: 'register',
        component: RegisterComponent,
        canActivate: [AuthGuard],
        data: { loggedInRedirect: '/' }
    },
    {
        path: 'collection',
        component: CollectionComponent,
        canActivate: [AuthGuard],
        data: { requiresLogin: true }
    },
    {
        path: 'reading-history',
        component: ReadingHistoryComponent,
        canActivate: [AuthGuard],
        data: { requiresLogin: true }
    },
    {
        path: 'lists',
        component: ListsComponent,
        canActivate: [AuthGuard],
        data: { requiresLogin: true }
    },
    {
        path: 'list/:slug',
        component: ListDetailComponent,
        canActivate: [AuthGuard],
        data: { requiresLogin: true }
    },
    {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [AuthGuard],
        data: { requiresLogin: true }
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
        path: 'publisher/:slug',
        component: PublisherDetailComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'contributor/:slug',
        component: ContributorDetailComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'volume/:series/:slug',
        component: VolumeDetailComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'admin/dashboard',
        component: DashboardComponent,
        canActivate: [RoleGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR]
        }
    },
    {
        path: 'admin/series',
        component: AdminSeriesComponent,
        canActivate: [RoleGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR]
        }
    },
    {
        path: 'admin/series/:id',
        component: AdminSeriesDetailComponent,
        canActivate: [RoleGuard,EditGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR],
            route: 'series'
        }
    },
    {
        path: 'admin/volumes',
        component: AdminVolumesComponent,
        canActivate: [RoleGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR]
        }
    },
    {
        path: 'admin/volumes/:id',
        component: AdminVolumeDetailComponent,
        canActivate: [RoleGuard,EditGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR],
            route: 'volume'
        }
    },
    {
        path: 'admin/publishers',
        component: AdminPublishersComponent,
        canActivate: [RoleGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR]
        }
    },
    {
        path: 'admin/publishers/:id',
        component: AdminPublisherDetailComponent,
        canActivate: [RoleGuard,EditGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR],
            route: 'volume'
        }
    },
    {
        path: 'admin/contributors',
        component: AdminContributorsComponent,
        canActivate: [RoleGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR]
        }
    },
    {
        path: 'admin/contributors/:id',
        component: AdminContributorDetailComponent,
        canActivate: [RoleGuard,EditGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR],
            route: 'volume'
        }
    },
    {
        path: 'admin/media',
        component: AdminMediaComponent,
        canActivate: [RoleGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR]
        }
    },
    {
        path: 'admin/reports',
        component: AdminReportsComponent,
        canActivate: [RoleGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR]
        }
    },
    {
        path: 'admin/users',
        component: AdminUsersComponent,
        canActivate: [RoleGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR]
        }
    },
    {
        path: 'admin/users/:id',
        component: AdminUserDetailComponent,
        canActivate: [RoleGuard,EditGuard],
        data: {
            roles: [UserRole.ADMIN, UserRole.EDITOR],
            route: 'volume'
        }
    },
    // auto redirect
    { 
        path: '**', 
        redirectTo: '' 
    }
];