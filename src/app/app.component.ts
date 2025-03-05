import { TuiRoot } from "@taiga-ui/core";
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideBar } from "./sidebar/sidebar.component";
import { TopBar } from "./topbar/topbar.component";
import { API_BASE, DEFAULT_SETTINGS } from "../globals";
import { HttpClient } from "@angular/common/http";
import { CookieService } from "ngx-cookie-service";
import { UserService } from "../services/user.service";
// @ts-ignore
import { pSBC, Color, Solver } from '../libs/filterTint.js';

@Component({
    standalone: true,
    selector: 'app-root',
    imports: [TuiRoot, RouterOutlet, SideBar, TopBar],
    templateUrl: './app.component.html',
    styleUrl: './app.component.less'
})

export class AppComponent {
    title = 'calorie-tracker';
    version = '0.0.1';
    user_service = inject(UserService);

    constructor(private http:HttpClient, private cookieService:CookieService) {}

    protected expanded = signal(true);

    protected handleToggle(): void {
        this.expanded.update((e) => !e);
    }

    ngOnInit(): void {
        const user_data = localStorage.getItem('user') || '{}'
        const user = JSON.parse(user_data);
        // stored in cookie with name 'auth_session'
        const session_id = this.cookieService.get('auth_session');
        const header = "Bearer " + session_id;
        this.http.get(`${API_BASE}/admin-users/id/${user.id}`, { headers: { 'Authorization': header } }).subscribe((res: any) => {
            this.user_service.setUser(res);
        });
    }
}