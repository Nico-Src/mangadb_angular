import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterState, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { inject, Injectable } from "@angular/core";

@Injectable()
export class AdminGuard implements CanActivate{
    private auth = inject(AuthService);
    constructor(private router: Router){}
    async canActivate(){
        const user:any = await this.auth.getSessionAsync();
        if(user?.role === "Admin") return true;
        this.router.navigate(['/']);
        return false;
    }
}