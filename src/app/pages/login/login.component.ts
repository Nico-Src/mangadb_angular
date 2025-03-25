import { Component, computed, effect, HostListener, inject } from '@angular/core';
import { TranslateService, TranslatePipe, TranslateDirective, _ } from "@ngx-translate/core";
import { HttpClient } from "@angular/common/http";
import { API_BASE, CDN_BASE, errorAlert, getTranslation, successAlert } from "../../../globals";
import { NgForOf } from '@angular/common';
import { Meta, Title } from "@angular/platform-browser";
import { TuiIcon, TuiTextfield, TuiButton, TuiLoader, TuiHint } from '@taiga-ui/core';
import { TuiTextfieldControllerModule } from '@taiga-ui/legacy'; 
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { TuiAlertService } from '@taiga-ui/core';
import { AuthService } from '../../../services/auth.service';
import { TuiPassword } from '@taiga-ui/kit';

@Component({
    selector: 'login',
    imports: [TranslatePipe, TuiIcon, TuiTextfield, TuiTextfieldControllerModule, FormsModule, ReactiveFormsModule, TuiButton, RouterLink, TuiLoader, TuiHint],
    templateUrl: './login.component.html',
    styleUrl: './login.component.less'
})

export class LoginComponent {
    protected alerts = inject(TuiAlertService);
    protected auth = inject(AuthService);
    readonly loggedIn = computed(() => this.auth.isLoggedIn());
    username = "";
    password = "";
    passwordVisible = false;
    loggingIn = false;

    constructor(private http:HttpClient, private translate: TranslateService, private meta: Meta, private title: Title, private cookieService:CookieService, private router: Router) {
        // if user is already logged in, redirect to home
        if(this.loggedIn()){
            this.router.navigate(['/']);
        }
    }

    ngOnInit() {
        // set title
        this.translate.get(_('title.login')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });
    }

    // press enter to login (on form fields)
    keyLogin(event: KeyboardEvent){
        if(event.key === 'Enter'){
            this.login();
        }
    }

    // login user
    async login(){
        // if already logging in do nothing
        if(this.loggingIn) return;
        // if user is already logged in, redirect to home
        if(this.loggedIn()){
            this.router.navigate(['/']);
            return;
        }

        this.loggingIn = true;
        // if username or password is empty show error
        if(this.username.trim() === "" || this.password.trim() === ""){
            // show alert
            const msg = await getTranslation(this.translate, 'login.fields-required');
            errorAlert(this.alerts, msg, undefined, this.translate);
            this.loggingIn = false;
            return;
        }

        // send request to api
        this.http.post(`${API_BASE}/auth/login`, { username: this.username.trim(), password: this.password.trim() }).subscribe((res: any) => {
            // set cookie
            this.cookieService.set('auth_session', res.session.id, 31, '/');
            // set auth state
            this.auth.setUser(res.user);
            this.auth.setLoggedIn(true);
            // show success alert
            setTimeout(async () => {
                this.loggingIn = false;
                const msg = await getTranslation(this.translate, 'login.success');
                successAlert(this.alerts, msg, undefined, this.translate);
                // redirect to home
                this.router.navigate(['/']);
            },500);
        }, async (err: any) => {
            this.loggingIn = false;
            // process errors
            if(err.status === 0){ // connection error
                const msg = await getTranslation(this.translate, 'server.error.connection');
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else if(err.status === 401){ // invalid credentials
                const msg = await getTranslation(this.translate, 'login.error');
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else { // other error
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            }
        });
    }
}
