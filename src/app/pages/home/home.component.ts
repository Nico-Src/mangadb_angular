import { Component } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { _, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-home',
    imports: [],
    templateUrl: './home.component.html',
    styleUrl: './home.component.less'
})
export class HomeComponent {
    constructor(private translate: TranslateService, private meta: Meta, private title: Title) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.home')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });
    }
}
