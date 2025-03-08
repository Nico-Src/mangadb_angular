import { Component, computed, inject } from '@angular/core';
import { TranslateService, TranslatePipe, TranslateDirective, _ } from "@ngx-translate/core";
import { Meta, Title } from "@angular/platform-browser";
import { HttpClient } from '@angular/common/http';
import { TuiAlertService, TuiIcon } from '@taiga-ui/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'register',
    imports: [TranslatePipe, TuiIcon],
    templateUrl: './register.component.html',
    styleUrl: './register.component.less'
})
export class RegisterComponent {
    protected alerts = inject(TuiAlertService);
    protected auth = inject(AuthService);
    readonly loggedIn = computed(() => this.auth.isLoggedIn());
    username = "";
    password = "";
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
}
