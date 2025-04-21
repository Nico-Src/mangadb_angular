import { NG_EVENT_PLUGINS } from "@taiga-ui/event-plugins";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, HttpClient } from "@angular/common/http";
import { CookieService } from 'ngx-cookie-service';
import { provideTranslateService, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { RoleGuard } from '../guards/roleGuard';
import { routes } from './app.routes';
import { AuthGuard } from "../guards/authGuard";
import { EditGuard } from "../guards/editGuard";

const httpLoaderFactory: (http: HttpClient) => TranslateHttpLoader = (http: HttpClient) => new TranslateHttpLoader(http, './i18n/', '.json');

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimations(), 
        provideHttpClient(withFetch()), 
        CookieService, 
        provideZoneChangeDetection({ eventCoalescing: true }), 
        provideRouter(routes, withViewTransitions(), withHashLocation()),
        NG_EVENT_PLUGINS,
        provideTranslateService({
            defaultLanguage: 'en',
            loader: {
                provide: TranslateLoader,
                useFactory: httpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        RoleGuard,
        AuthGuard,
        EditGuard
    ]
};
