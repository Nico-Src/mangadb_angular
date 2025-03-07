import { TUI_ALERT_POSITION, TuiAlertContext, TuiAlertService, TuiRoot } from "@taiga-ui/core";
import { Component, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { SideBar } from "./sidebar/sidebar.component";
import { TopBar } from "./topbar/topbar.component";
import { API_BASE, DEFAULT_SETTINGS } from "../globals";
import { HttpClient } from "@angular/common/http";
import { CookieService } from "ngx-cookie-service";
import { UserService } from "../services/user.service";
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
    title = 'calorie-tracker';
    version = '0.0.1';
    user_service = inject(UserService);
    private readonly alerts = inject(TuiAlertService);

    constructor(private http:HttpClient, private cookieService:CookieService, private translate: TranslateService) {
        this.translate.addLangs(['de', 'en']);
        this.translate.setDefaultLang('en');
        this.translate.use(this.cookieService.get('language') || 'en');
    }

    protected expanded = signal(true);

    protected handleToggle(): void {
        this.expanded.update((e) => !e);
    }

    protected errorAlert(message: string, label: string = 'Error'): void {
        this.alerts.open(message, {label: label, appearance: 'negative'}).subscribe();
    }

    ngOnInit(): void {
        const user_data = localStorage.getItem('user') || '{}'
        const user = JSON.parse(user_data);
        // stored in cookie with name 'auth_session'
        const session_id = this.cookieService.get('auth_session');
        if(!session_id) return;
        const header = "Bearer " + session_id;
        this.http.post(`${API_BASE}/auth/session`, {}, { headers: { 'Authorization': header } }).subscribe((res: any) => {
            this.user_service.setUser(res);
            this.user_service.setLoggedIn(true);
        }, (err: any) => {
            if(err.status === 0){
                this.translate.get(_('server.error.connection')).subscribe((res: any) => {
                    this.errorAlert(res, `Error (Code: ${err.status})`);
                });
            } else if(err.status === 440){
                this.translate.get(_('server.error.session-expired')).subscribe((res: any) => {
                    this.errorAlert(res, `Error (Code: ${err.status})`);
                });
                this.cookieService.delete('auth_session');
                this.user_service.setLoggedIn(false);
                this.user_service.setUser({});
            }
        });
    }
}