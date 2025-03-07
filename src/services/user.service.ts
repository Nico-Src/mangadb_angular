import { signal, Injectable, computed } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class UserService {
    private user:any = signal({});
    private loggedIn = signal(document.cookie.includes('auth_session'));
    public getUser = computed(() => this.user());
    public setUser = (data: any) => this.user.set(data);
    public isLoggedIn = computed(() => this.loggedIn());
    public setLoggedIn = (data: boolean) => this.loggedIn.set(data);
}