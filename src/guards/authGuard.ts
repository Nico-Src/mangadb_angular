import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterState, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { inject, Injectable } from "@angular/core";

@Injectable()
export class AuthGuard implements CanActivate{
    private auth = inject(AuthService);
    constructor(private router: Router){}
    async canActivate(){
        await this.auth.getSessionAsync();
        return true;
    }
}