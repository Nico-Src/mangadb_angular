import { CanActivate } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { inject, Injectable } from "@angular/core";

// Guard to authenticate user before navigating
@Injectable()
export class AuthGuard implements CanActivate{
    private auth = inject(AuthService);

    async canActivate(){
        await this.auth.getSessionAsync();
        return true;
    }
}