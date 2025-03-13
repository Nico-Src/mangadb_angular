import { Component, Input, ViewChild } from '@angular/core';
import { CDN_BASE, readableDate, langToLocale, ANNOUNCED_DATE, UNKNOWN_DATE, isDateInFuture } from '../../globals';
import { NgIf, NgFor } from '@angular/common';
import { TuiImgLazyLoading, TuiFade } from '@taiga-ui/kit';
import { TuiSkeleton } from '@taiga-ui/kit';
import { MangaCover } from '../manga-cover/manga-cover.component';
import { TuiIcon } from '@taiga-ui/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'manga-series-list',
    imports: [MangaCover, NgIf, NgFor, TranslatePipe, TuiFade],
    templateUrl: './manga-series-list.component.html',
    styleUrl: './manga-series-list.component.less',
    viewProviders: [provideIcons({  })]
})
export class MangaSeriesListComponent {
    readonly cdn_base = CDN_BASE;
    loading = true;
    @Input() series:any = {};

    constructor(private translate: TranslateService){}

    ngOnInit(){
        this.series.contentTypeTags = this.series.tags.filter((t: { type: string; }) => t.type == 'content-type');
        this.series.contentRatingTags = this.series.tags.filter((t: { type: string; name: string; }) => t.type == 'content-rating' && t.name != 'Safe' && t.name);
        this.series.contentWarningTags = this.series.tags.filter((t: { type: string; }) => t.type == 'content-warning');
        this.series.otherTags = this.series.tags.filter((t: { type: string; }) => t.type != 'publication-status' && t.type != 'origin-country' && t.type != 'language' && t.type != 'content-rating' && t.type != 'content-warning' && t.type != 'content-type');
    }

    ngOnChanges(){
        
    }

    toLocale(lang:string){
        return langToLocale(lang);
    }
}
