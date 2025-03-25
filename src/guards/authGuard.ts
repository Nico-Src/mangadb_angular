import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { inject, Injectable } from "@angular/core";

// Guard to authenticate user before navigating
@Injectable()
export class AuthGuard implements CanActivate{
    private auth = inject(AuthService);
    constructor(private router: Router){}

    async canActivate(route: ActivatedRouteSnapshot){
        const user:any = await this.auth.getSessionAsync();
        // check if user should be redirected if he is logged in
        const loggedInRedirect = route.data['loggedInRedirect'];
        if(loggedInRedirect && user.id){
            this.router.navigate([loggedInRedirect]);
        }
        return true;
    }
}