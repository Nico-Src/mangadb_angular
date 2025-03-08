import { Component } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { _, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-collection',
    imports: [],
    templateUrl: './collection.component.html',
    styleUrl: './collection.component.less'
})
export class CollectionComponent {
    constructor(private translate: TranslateService, private meta: Meta, private title: Title) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.collection')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });
    }
}
