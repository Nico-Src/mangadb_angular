import { Component, computed, inject } from '@angular/core';
import { TranslateService, TranslatePipe, TranslateDirective, _ } from "@ngx-translate/core";
import { Meta, Title } from "@angular/platform-browser";
import { HttpClient } from '@angular/common/http';
import { TuiAlertService, TuiIcon } from '@taiga-ui/core';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';

@Component({
    selector: 'register',
    imports: [TranslatePipe, TuiIcon],
    templateUrl: './register.component.html',
    styleUrl: './register.component.less'
})
export class RegisterComponent {
    protected alerts = inject(TuiAlertService);
    user_service = inject(UserService);
    loggedIn = computed(() => this.user_service.isLoggedIn());
    username = "";
    password = "";
    registering = false;

    constructor(private http:HttpClient, private translate: TranslateService, private meta: Meta, private title: Title, private router: Router) {
        if(this.loggedIn()){
            this.router.navigate(['/']);
        }
    }
    
    ngOnInit() {
        this.translate.get(_('title.register')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });
    }
}
