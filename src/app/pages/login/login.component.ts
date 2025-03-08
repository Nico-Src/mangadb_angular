import { Component, computed, effect, HostListener, inject } from '@angular/core';
import { TranslateService, TranslatePipe, TranslateDirective, _ } from "@ngx-translate/core";
import { HttpClient } from "@angular/common/http";
import { API_BASE, CDN_BASE, errorAlert, successAlert } from "../../../globals";
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
    login(){
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
            this.translate.get(_('login.fields-required')).subscribe((res: any) => {
                errorAlert(this.alerts, res);
            });
            this.loggingIn = false;
            return;
        }

        // send request to api
        this.http.post(`${API_BASE}/auth/login`, { username: this.username.trim(), password: this.password.trim() }).subscribe((res: any) => {
            // set cookie
            this.cookieService.set('auth_session', res.session.id);
            // set auth state
            this.auth.setUser(res.user);
            this.auth.setLoggedIn(true);
            // show success alert
            setTimeout(() => {
                this.loggingIn = false;
                this.translate.get(_('login.success')).subscribe((res: any) => {
                    successAlert(this.alerts, res);
                    // redirect to home
                    this.router.navigate(['/']);
                });
            },500);
        }, (err: any) => {
            this.loggingIn = false;
            // process errors
            if(err.status === 0){ // connection error
                this.translate.get(_('server.error.connection')).subscribe((res: any) => {
                    errorAlert(this.alerts, res, `Error (Code: ${err.status})`);
                });
            } else if(err.status === 401){ // invalid credentials
                this.translate.get(_('login.error')).subscribe((res: any) => {
                    errorAlert(this.alerts, res);
                });
            } else { // other error
                errorAlert(this.alerts, JSON.stringify(err), `Error (Code: ${err.status})`);
            }
        });
    }
}
