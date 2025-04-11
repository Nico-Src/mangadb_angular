import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { inject, Injectable } from "@angular/core";

@Injectable()
export class EditGuard implements CanActivate{
    private auth = inject(AuthService);
    constructor(private router: Router){}
    async canActivate(route: ActivatedRouteSnapshot){
        return true;
    }
}