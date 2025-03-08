import { signal, Injectable, computed, WritableSignal } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class AuthService {
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