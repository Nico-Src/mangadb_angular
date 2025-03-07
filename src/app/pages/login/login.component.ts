import { Component, computed, effect, HostListener, inject } from '@angular/core';
import { TranslateService, TranslatePipe, TranslateDirective, _ } from "@ngx-translate/core";
import { HttpClient } from "@angular/common/http";
import { API_BASE, CDN_BASE } from "../../../globals";
import { NgForOf } from '@angular/common';
import { Meta, Title } from "@angular/platform-browser";
import { TuiIcon, TuiTextfield, TuiButton, TuiLoader, TuiHint } from '@taiga-ui/core';
import { TuiTextfieldControllerModule } from '@taiga-ui/legacy'; 
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { TuiAlertService } from '@taiga-ui/core';
import { UserService } from '../../../services/user.service';
import { TuiPassword } from '@taiga-ui/kit';

@Component({
    selector: 'login',
    imports: [TranslatePipe, TuiIcon, TuiTextfield, TuiTextfieldControllerModule, FormsModule, ReactiveFormsModule, TuiButton, RouterLink, TuiLoader, TuiHint],
    templateUrl: './login.component.html',
    styleUrl: './login.component.less'
})

export class LoginComponent {
    protected alerts = inject(TuiAlertService);
    user_service = inject(UserService);
    loggedIn = computed(() => this.user_service.isLoggedIn());
    username = "";
    password = "";
    passwordVisible = false;
    loggingIn = false;

    constructor(private http:HttpClient, private translate: TranslateService, private meta: Meta, private title: Title, private cookieService:CookieService, private router: Router) {
        if(this.loggedIn()){
            this.errorAlert('You are already logged in.');
            this.router.navigate(['/']);
        }
    }

    ngOnInit() {
        this.translate.get(_('title.login')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });
    }

    keyLogin(event: KeyboardEvent){
        if(event.key === 'Enter'){
            this.login();
        }
    }

    login(){
        if(this.loggingIn) return;
        if(this.loggedIn()){
            this.router.navigate(['/']);
            return;
        }

        this.loggingIn = true;
        if(this.username.trim() === "" || this.password.trim() === ""){
            this.errorAlert('Username and Password are required.');
            this.loggingIn = false;
            return;
        }
        this.http.post(`${API_BASE}/auth/login`, { username: this.username.trim(), password: this.password.trim() }).subscribe((res: any) => {
            this.cookieService.set('auth_session', res.session.id);
            this.user_service.setUser(res.user);
            this.user_service.setLoggedIn(true);
            setTimeout(() => {
                this.loggingIn = false;
                this.translate.get(_('login.success')).subscribe((res: any) => {
                    this.successAlert(res);
                    // redirect to home
                    this.router.navigate(['/']);
                });
            },500);
        }, (err: any) => {
            console.log(err)
            if(err.status === 401){
                this.translate.get(_('login.error')).subscribe((res: any) => {
                    this.errorAlert(res);
                });
                setTimeout(() => {
                    this.loggingIn = false;
                },500);
            }
        });
    }

    protected successAlert(message: string, label: string = 'Success'): void {
        this.alerts.open(message, {label: label, appearance: 'positive'}).subscribe();
    }

    protected errorAlert(message: string, label: string = 'Error'): void {
        this.alerts.open(message, {label: label, appearance: 'negative'}).subscribe();
    }
}
