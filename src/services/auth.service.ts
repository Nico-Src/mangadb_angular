import { HttpClient } from "@angular/common/http";
import { API_BASE, DEFAULT_SETTINGS } from "../globals";
import { signal, Injectable, computed, WritableSignal, inject } from "@angular/core";
import { CookieService } from "ngx-cookie-service";

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http:HttpClient = inject(HttpClient);
    private cookie:CookieService = inject(CookieService);
    // null user (for when the user is not logged in)
    nullUser: User = { id: null, slug: null, username: null, profile_image: null, role: null, age_verified: null, settings: null };
    // current user data
    private user:WritableSignal<User> = signal<User>(this.nullUser);
    // current user logged in status
    private loggedIn:WritableSignal<boolean> = signal<boolean>(document.cookie.includes('auth_session'));
    // getters and setters for both user data and logged in status
    public getUser = computed(() => this.user());
    public setUser = (data: User) => this.user.set(data);
    public setUserField = (field: string, value: any) => this.user.update(user => ({ ...user, [field]: value }));
    public isLoggedIn = computed(() => this.loggedIn());
    public setLoggedIn = (data: boolean) => this.loggedIn.set(data);
    public getSessionAsync = async () => {
        return new Promise(resolve => {
            // else send validation request with session token
            const session_id = this.cookie.get('auth_session');
            const header = "Bearer " + session_id;
            if(!session_id) resolve(this.nullUser);
            this.http.post<User>(`${API_BASE}/auth/session`, {}, { headers: { 'Authorization': header } }).subscribe(user => {
                if(!user.settings || Object.keys(user.settings).length === 0){
                    this.updateSettings(user.id || -1, DEFAULT_SETTINGS);
                    user.settings = DEFAULT_SETTINGS;
                }
                this.setUser(user);
                this.setLoggedIn(true);
                resolve(user);
            }, (err: any) => {
                resolve(this.nullUser);
            });
        });
    }
    public updateSettings = async (id: number, settings: any) => {
        if(!id || id < 0) return;
        const header = "Bearer " + this.cookie.get('auth_session');
        this.http.post(`${API_BASE}/users/${id}/save-settings`,{settings: settings}, { headers: { 'Authorization': header }, responseType: 'text' }).subscribe((res: any) => {});
    }
    public getUserSetting = (setting:string) => {
        const loggedIn = this.isLoggedIn();
        if(!loggedIn) return DEFAULT_SETTINGS[setting];
        const user = this.getUser();
        const settings = user.settings;
        if(!settings || Object.keys(settings).length === 0) return DEFAULT_SETTINGS[setting];
        return settings[setting];
    }
}

interface User {
    id: number | null;
    slug: string | null;
    username: string | null;
    profile_image: string | null;
    role: string | null;
    age_verified: boolean | null;
    settings: any;
}