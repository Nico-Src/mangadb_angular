import { Component, Input, ViewChild } from '@angular/core';
import { CDN_BASE, langToLocale } from '../../globals';
import { MangaCover } from '../manga-cover/manga-cover.component';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { NgFor, NgIf } from '@angular/common';
import { TuiDataList, TuiDropdown } from '@taiga-ui/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerTrash } from '@ng-icons/tabler-icons';

@Component({
    selector: 'manga-series-grid',
    imports: [MangaCover, NgIf, TuiDataList, NgIcon, NgFor, TuiDropdown, TranslatePipe],
    templateUrl: './manga-series-grid.component.html',
    styleUrl: './manga-series-grid.component.less',
    viewProviders: [provideIcons({tablerTrash})]
})
export class MangaSeriesGridComponent {
    readonly cdn_base = CDN_BASE;
    loading = true;
    @Input() series:any = {};
    @Input() search:any = "";
    @Input() customMenuItems:any = [];
    @ViewChild('dropdown') dropdown:any;
    menuItems: any = [];

    ngOnChanges(){
        this.menuItems = [...this.customMenuItems];
        console.log(this.menuItems)
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
