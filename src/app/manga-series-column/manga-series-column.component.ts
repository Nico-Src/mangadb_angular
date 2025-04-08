import { Component, Input, ViewChild } from '@angular/core';
import { CDN_BASE, langToLocale } from '../../globals';
import { NgIf, NgFor } from '@angular/common';
import { MangaCover } from '../manga-cover/manga-cover.component';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiFade } from '@taiga-ui/kit';
import { TuiDataList, TuiDropdown } from '@taiga-ui/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerTrash } from '@ng-icons/tabler-icons';

@Component({
    selector: 'manga-series-column',
    imports: [MangaCover, NgIf, NgFor, TranslatePipe, TuiFade, TuiDropdown, TuiDataList, NgIcon],
    templateUrl: './manga-series-column.component.html',
    styleUrl: './manga-series-column.component.less',
    viewProviders: [provideIcons({tablerTrash})]
})
export class MangaSeriesColumnComponent {
    readonly cdn_base = CDN_BASE;
    loading = true;
    @Input() series:any = {};
    @Input() search:any = "";
    @Input() customMenuItems:any = [];
    @ViewChild('dropdown') dropdown:any;
    menuItems: any = [];

    ngOnInit(){
        // seperate tags
        this.series.contentTypeTags = this.series.tags.filter((t: { type: string; }) => t.type == 'content-type');
        this.series.contentRatingTags = this.series.tags.filter((t: { type: string; name: string; }) => t.type == 'content-rating' && t.name != 'Safe' && t.name);
        this.series.contentWarningTags = this.series.tags.filter((t: { type: string; }) => t.type == 'content-warning');
        this.series.otherTags = this.series.tags.filter((t: { type: string; }) => t.type != 'publication-status' && t.type != 'origin-country' && t.type != 'language' && t.type != 'content-rating' && t.type != 'content-warning' && t.type != 'content-type');
    }

    ngOnChanges(){
        this.menuItems = [...this.customMenuItems];
    }

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
