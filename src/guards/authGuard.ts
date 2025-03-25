import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { inject, Injectable } from "@angular/core";
import { TuiAlertService } from "@taiga-ui/core";
import { errorAlert, getTranslation } from "../globals";
import { TranslateService } from "@ngx-translate/core";

// Guard to authenticate user before navigating
@Injectable()
export class AuthGuard implements CanActivate{
    private auth = inject(AuthService);
    private alerts = inject(TuiAlertService);
    constructor(private router: Router, private translate: TranslateService){}

    async canActivate(route: ActivatedRouteSnapshot){
        const user:any = await this.auth.getSessionAsync();
        // check if user should be redirected if he is logged in
        const loggedInRedirect = route.data['loggedInRedirect'];
        if(loggedInRedirect && user.id){
            this.router.navigate([loggedInRedirect]);
        }
        const requiresLogin = route.data['requiresLogin'] == true;
        if(requiresLogin && !user.id){
            this.router.navigate(['/']);
            const msg = await getTranslation(this.translate, `auth.requires-login.${route.url[0].path}`);
            errorAlert(this.alerts, msg, undefined, this.translate);
        }
        return true;
    }
}