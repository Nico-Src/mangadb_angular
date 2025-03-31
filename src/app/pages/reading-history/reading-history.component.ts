import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-dashboard',
    imports: [],
    templateUrl: './reading-history.component.html',
    styleUrl: './reading-history.component.less'
})
export class ReadingHistoryComponent {
    private readonly auth = inject(AuthService);
    constructor(private translate: TranslateService, private title: Title, private router: Router) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.reading-history')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });
    }
}
