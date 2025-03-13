import { Component, Input, ViewChild } from '@angular/core';
import { CDN_BASE, readableDate, langToLocale, ANNOUNCED_DATE, UNKNOWN_DATE, isDateInFuture } from '../../globals';
import { NgIf } from '@angular/common';
import { TuiImgLazyLoading } from '@taiga-ui/kit';
import { TuiSkeleton } from '@taiga-ui/kit';
import { MangaCover } from '../manga-cover/manga-cover.component';
import { TuiIcon } from '@taiga-ui/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { solarNotebook, solarCalendar } from '@ng-icons/solar-icons/outline';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'manga-volume',
    imports: [MangaCover, NgIcon, TranslatePipe, NgIf],
    templateUrl: './manga-volume.component.html',
    styleUrl: './manga-volume.component.less',
    viewProviders: [provideIcons({ solarNotebook, solarCalendar })]
})
export class MangaVolume {
    readonly cdn_base = CDN_BASE;
    loading = true;
    @Input() volume:any = {};
    @Input() showRelease = true;
    @ViewChild('release') release:any;

    constructor(private translate: TranslateService){}

    releaseDate(date:string){
        return readableDate(date, this.translate.currentLang, true);
    }

    ngOnChanges(){
        if(!this.volume?.id) return;
        this.volume.release_date_readable = this.releaseDate(this.volume.release_date);
        this.volume.release_date_text = (this.volume.release_date_readable === UNKNOWN_DATE || this.volume.release_date_readable === ANNOUNCED_DATE);
    }

    toLocale(lang:string){
        return langToLocale(lang);
    }

    preOrder(date:string){
        return isDateInFuture(date);
    }
}
