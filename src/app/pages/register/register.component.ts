import { Component, computed, inject } from '@angular/core';
import { TranslateService, TranslatePipe, TranslateDirective, _ } from "@ngx-translate/core";
import { Meta, Title } from "@angular/platform-browser";
import { HttpClient } from '@angular/common/http';
import { TuiAlertService, TuiIcon, TuiTextfield, TuiButton, TuiLoader } from '@taiga-ui/core';
import { TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CONFIG, API_BASE, errorAlert, successAlert, getTranslation } from '../../../globals';

@Component({
    selector: 'register',
    imports: [TranslatePipe, TuiIcon, TuiTextfield, TuiTextfieldControllerModule, FormsModule, ReactiveFormsModule, TuiButton, RouterLink, TuiLoader],
    templateUrl: './register.component.html',
    styleUrl: './register.component.less'
})
export class RegisterComponent {
    protected alerts = inject(TuiAlertService);
    protected auth = inject(AuthService);
    readonly loggedIn = computed(() => this.auth.isLoggedIn());
    username = "";
    password = "";
    passwordVisible = false;
    confirmPassword = "";
    registering = false;

    constructor(private http:HttpClient, private translate: TranslateService, private meta: Meta, private title: Title, private router: Router) {
        // if user is already logged in, redirect to home
        if(this.loggedIn()){
            this.router.navigate(['/']);
        }
    }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.register')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });
    }

    // press enter to login (on form fields)
    keyRegister(event: KeyboardEvent){
        if(event.key === 'Enter'){
            this.register();
        }
    }

    // register user
    async register(){
        // if already registering, return
        if(this.registering) return;

        // if user is already logged in, redirect to home
        if(this.loggedIn()){
            this.router.navigate(['/']);
        }

        // check if all fields are filled
        if(!this.username.trim() || !this.password.trim() || !this.confirmPassword.trim()){
            const msg = await getTranslation(this.translate, 'register.fields-required');
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }

        // check if passwords match
        if(this.password !== this.confirmPassword){
            const msg = await getTranslation(this.translate, 'register.password-mismatch');
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }

        // check if username is valid (length)
        if(this.username.length < CONFIG.auth.min_username_length || this.username.length > CONFIG.auth.max_username_length){
            const msg = await getTranslation(this.translate, 'register.invalid-username');
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }

        // check if password is valid (length)
        if(this.password.length < CONFIG.auth.min_password_length || this.password.length > CONFIG.auth.max_password_length){
            const msg = await getTranslation(this.translate, 'register.invalid-password');
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }

        // send request to api
        this.registering = true;
        this.http.post(`${API_BASE}/auth/register`, { username: this.username, password: this.password }, { responseType: 'text' }).subscribe((res: any) => {
            // show success alert and redirect to login
            setTimeout(async () => {
                this.registering = false;
                const msg = await getTranslation(this.translate, 'register.success');
                successAlert(this.alerts, msg, undefined, this.translate);
                this.router.navigate(['/login']);
            },500);
        }, async (err: any) => {
            this.registering = false;
            // process errors
            if(err.status === 0){ // connection error
                const msg = await getTranslation(this.translate, 'server.error.connection');
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else if(err.status === 402){ // invalid username
                const msg = await getTranslation(this.translate, 'register.invalid-username');
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else if(err.status === 403){ // invalid password
                const msg = await getTranslation(this.translate, 'register.invalid-password');
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else if(err.status === 409) { // username already exists
                const msg = await getTranslation(this.translate, 'register.username-taken');
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else { // other error
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            }
        });
    }
}
