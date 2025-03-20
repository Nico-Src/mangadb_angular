import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { inject, Injectable } from "@angular/core";

@Injectable()
export class RoleGuard implements CanActivate{
    private auth = inject(AuthService);
    constructor(private router: Router){}
    async canActivate(route: ActivatedRouteSnapshot){
        // verify user session
        const user:any = await this.auth.getSessionAsync();
        // check if user meets requirement to navigate to route
        const allowedRoles = route.data['roles'];
        if(allowedRoles.includes(user.role)) return true;
        // if not navigate to home page
        this.router.navigate(['/']);
        return false;
    }
}