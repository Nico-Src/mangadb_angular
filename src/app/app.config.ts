import { NG_EVENT_PLUGINS } from "@taiga-ui/event-plugins";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from "@angular/common/http";
import { CookieService } from 'ngx-cookie-service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [provideAnimations(), provideHttpClient(withFetch()), CookieService, provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), NG_EVENT_PLUGINS]
};
