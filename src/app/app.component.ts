import { TUI_ALERT_POSITION, TuiAlertContext, TuiAlertService, TuiRoot } from "@taiga-ui/core";
import { Component, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { SideBar } from "./sidebar/sidebar.component";
import { TopBar } from "./topbar/topbar.component";
import { API_BASE, DEFAULT_SETTINGS, CONFIG, LANGS, errorAlert } from "../globals";
import { HttpClient } from "@angular/common/http";
import { CookieService } from "ngx-cookie-service";
import { AuthService } from "../services/auth.service";
// @ts-ignore
import { pSBC, Color, Solver } from '../libs/filterTint.js';
import { TranslateService, _ } from "@ngx-translate/core";

@Component({
    standalone: true,
    selector: 'app-root',
    imports: [TuiRoot, RouterOutlet, SideBar, TopBar],
    templateUrl: './app.component.html',
    styleUrl: './app.component.less',
    providers: [
        {
            provide: TUI_ALERT_POSITION,
            useValue: 'auto 1rem 1rem auto',
        }
    ],
})

export class AppComponent {
    private readonly auth = inject(AuthService);
    private readonly alerts = inject(TuiAlertService);

    constructor(private http:HttpClient, private cookieService:CookieService, private translate: TranslateService) {
        // setup languages
        this.translate.addLangs(LANGS.map(l => l.value));
        // set default locale
        this.translate.setDefaultLang(CONFIG.default_locale);
        // set locale (based on cookie, if user already selected a language) or default
        this.translate.use(this.cookieService.get('language') || CONFIG.default_locale);
    }

    // sidebar state
    protected expanded = signal(true);
    protected handleToggle(): void { this.expanded.update((e) => !e); }

    ngOnInit(): void {
        // get session cookie
        const session_id = this.cookieService.get('auth_session');
        // return if there is no session
        if(!session_id) return;
        // else send validation request with session token
        const header = "Bearer " + session_id;
        this.http.post(`${API_BASE}/auth/session`, {}, { headers: { 'Authorization': header } }).subscribe((res: any) => {
            // set auth state
            this.auth.setUser(res);
            this.auth.setLoggedIn(true);
        }, (err: any) => {
            // process errors
            if(err.status === 0){ // connection error
                this.translate.get(_('server.error.connection')).subscribe((res: any) => {
                    errorAlert(this.alerts, res, `Error (Code: ${err.status})`);
                });
            } else if(err.status === 440){ // session expired
                this.translate.get(_('server.error.session-expired')).subscribe((res: any) => {
                    errorAlert(this.alerts, res, `Error (Code: ${err.status})`);
                });
                // delete cookie
                this.cookieService.delete('auth_session');
                // set auth state
                this.auth.setUser({});
                this.auth.setLoggedIn(false);
            }
        });
    }
}