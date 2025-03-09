import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { _, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    imports: [],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.less'
})
export class DashboardComponent {
    constructor(private translate: TranslateService, private meta: Meta, private title: Title, private router: Router) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.admin-dashboard')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });
    }
}
