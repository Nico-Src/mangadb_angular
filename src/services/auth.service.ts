import { DEFAULT_SETTINGS } from "../globals";
import { signal, Injectable, computed, WritableSignal, inject } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { APIService, HttpMethod } from "./api.service";

@Injectable({ providedIn: 'root' })
export class AuthService {
    private cookie:CookieService = inject(CookieService);
    private api:APIService = inject(APIService);

    // null user (for when the user is not logged in)
    readonly nullUser: any = { id: null, slug: null, username: null, profile_image: null, role: null, age_verified: null, settings: null };

    // current user data
    private user:WritableSignal<any> = signal<any>(this.nullUser);

    // current theme
    theme:WritableSignal<string> = signal<string>("light");

    // current user logged in status
    private loggedIn:WritableSignal<boolean> = signal<boolean>(document.cookie.includes('auth_session'));

    // getters and setters for both user data and logged in status
    public getUser = computed(() => this.user());
    public setUser = (data: any) => this.user.set(data);
    public setUserField = (field: string, value: any) => this.user.update(user => ({ ...user, [field]: value }));

    public isLoggedIn = computed(() => this.loggedIn());
    public setLoggedIn = (data: boolean) => this.loggedIn.set(data);

    public setTheme = (data: string) => this.theme.set(data);

    // methods to get, set and delete session cookie
    public setSessionCookie = (id:string) => this.cookie.set('auth_session', id, 31, '/');
    public deleteSessionCookie = () => this.cookie.delete('auth_session'); 
    public getSessionCookie = () => this.cookie.get('auth_session');

    // verify session and get user data
    public getSessionAsync = async () => {
        return new Promise(resolve => {
            // else send validation request with session token
            const session_id = this.cookie.get('auth_session');
            if(!session_id) resolve(this.nullUser);
            this.api.request<any>(HttpMethod.POST, 'auth/session', {}, 'json').subscribe((user:any)=>{
                if(!user.settings || Object.keys(user.settings).length === 0){
                    this.updateSettings(user.id || -1, DEFAULT_SETTINGS);
                    user.settings = DEFAULT_SETTINGS;
                    this.theme.set(user.settings.theme);
                }
                this.setUser(user);
                this.setLoggedIn(true);
                resolve(user);
            }, (err:any)=>{
                // resolve with empty user
                resolve(this.nullUser);
            });
        });
    }

    // update settings for user with given id
    public updateSettings = async (id: number, settings: any) => {
        if(!id || id < 0) return;
        this.api.request<string>(HttpMethod.POST, `users/${id}/save-settings`, { settings: settings }, 'text').subscribe((res:any)=>{});
    }

    // get user setting with given key
    public getUserSetting = (setting:string) => {
        const loggedIn = this.isLoggedIn();
        // if not logged in return default setting
        if(!loggedIn) return DEFAULT_SETTINGS[setting];
        const user = this.getUser();
        const settings = user.settings;
        // also if settings are not set
        const keys = Object.keys(settings);
        if(!settings || keys.length === 0 || !keys.includes(setting)) return DEFAULT_SETTINGS[setting];
        // else return setting
        return settings[setting];
    }
}