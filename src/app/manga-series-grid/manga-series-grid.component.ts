import { Component, Input, ViewChild } from '@angular/core';
import { CDN_BASE, readableDate, langToLocale, ANNOUNCED_DATE, UNKNOWN_DATE, isDateInFuture } from '../../globals';
import { NgIf } from '@angular/common';
import { TuiImgLazyLoading } from '@taiga-ui/kit';
import { TuiSkeleton } from '@taiga-ui/kit';
import { MangaCover } from '../manga-cover/manga-cover.component';
import { TuiIcon } from '@taiga-ui/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'manga-series-grid',
    imports: [MangaCover],
    templateUrl: './manga-series-grid.component.html',
    styleUrl: './manga-series-grid.component.less',
    viewProviders: [provideIcons({  })]
})
export class MangaSeriesGridComponent {
    readonly cdn_base = CDN_BASE;
    loading = true;
    @Input() series:any = {};
    @Input() search:any = "";

    constructor(private translate: TranslateService){}

    ngOnChanges(){
        
    }

    highlightSearch(text: string) {
        if(!text || text.trim() === "") return text;
        if(this.search.trim() === "") return text;
        const regex = new RegExp(this.search, 'gi');
        return text.replace(regex, match => `<b>${match}</b>`);
    }

    toLocale(lang:string){
        return langToLocale(lang);
    }
}
