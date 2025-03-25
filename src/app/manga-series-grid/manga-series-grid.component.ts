import { Component, Input } from '@angular/core';
import { CDN_BASE, langToLocale } from '../../globals';
import { MangaCover } from '../manga-cover/manga-cover.component';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'manga-series-grid',
    imports: [MangaCover],
    templateUrl: './manga-series-grid.component.html',
    styleUrl: './manga-series-grid.component.less',
})
export class MangaSeriesGridComponent {
    readonly cdn_base = CDN_BASE;
    loading = true;
    @Input() series:any = {};
    @Input() search:any = "";

    // highlight search term in given text
    highlightSearch(text: string) {
        if(!text || text.trim() === "") return text;
        if(this.search.trim() === "") return text;
        const regex = new RegExp(this.search, 'gi');
        return text.replace(regex, match => `<b>${match}</b>`);
    }

    // language to locale code
    toLocale(lang:string){
        return langToLocale(lang);
    }
}
