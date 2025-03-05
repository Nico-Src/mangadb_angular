import { signal, Injectable, computed } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class UserService {
    private user:any = signal({});
    public getUser = computed(() => this.user());
    public setUser = (data: any) => this.user.set(data);
}