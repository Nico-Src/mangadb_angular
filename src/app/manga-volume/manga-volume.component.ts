import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { CDN_BASE, readableDate, langToLocale, ANNOUNCED_DATE, UNKNOWN_DATE, isDateInFuture, errorAlert, successAlert } from '../../globals';
import { NgFor, NgIf } from '@angular/common';
import { MangaCover } from '../manga-cover/manga-cover.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { solarNotebook, solarCalendar } from '@ng-icons/solar-icons/outline';
import { lucideLibrary } from '@ng-icons/lucide';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiAlertService, TuiDataList, TuiDropdown } from '@taiga-ui/core';
import { TuiDataListDropdownManager } from '@taiga-ui/kit';
import { AuthService } from '../../services/auth.service';
import { APIService, HttpMethod } from '../../services/api.service';
import { heroMinus, heroPlus, heroViewfinderCircle } from '@ng-icons/heroicons/outline';

@Component({
    selector: 'manga-volume',
    imports: [MangaCover, NgIcon, NgFor, TuiDataList, TuiDataListDropdownManager, TuiDropdown, TranslatePipe, NgIf],
    templateUrl: './manga-volume.component.html',
    styleUrl: './manga-volume.component.less',
    viewProviders: [provideIcons({ solarNotebook, solarCalendar, lucideLibrary, heroViewfinderCircle, heroPlus, heroMinus })]
})
export class MangaVolume {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    private readonly alerts = inject(TuiAlertService);
    readonly cdn_base = CDN_BASE;
    loading = true;
    @Input() volume:any = {};
    @Input() showRelease = true;
    @ViewChild('release') release:any;
    @ViewChild('dropdown') dropdown:any;

    protected readonly menuItems = [
        {title: 'quick-view', icon: 'heroViewfinderCircle', action: this.quickView.bind(this)},
        {title: 'toggle-collection', icon: '', action: this.toggleCollection.bind(this)},
    ] as const;
    

    constructor(private translate: TranslateService){}

    // convert date to a more human-readable format
    releaseDate(date:string){
        return readableDate(date, this.translate.currentLang, true);
    }

    // executed whenever inputs change
    ngOnChanges(){
        if(!this.volume?.id) return;
        // update readable date variables
        this.volume.release_date_readable = this.releaseDate(this.volume.release_date);
        this.volume.release_date_text = (this.volume.release_date_readable === UNKNOWN_DATE || this.volume.release_date_readable === ANNOUNCED_DATE);
    }

    // language to locale code
    toLocale(lang:string){
        return langToLocale(lang);
    }

    // check if date is in future
    preOrder(date:string){
        return isDateInFuture(date);
    }

    quickView(){
        
    }

    // toggle collection state
    toggleCollection(){
        // if not logged in show error
        if(!this.auth.isLoggedIn()){
            // TODO translate
            errorAlert(this.alerts, 'You need to be logged in to do this.', undefined, this.translate);
            return;
        }

        this.api.request<any>(HttpMethod.GET, `volumes/toggle-collection/id/${this.volume.id}`, {}).subscribe((res)=>{
            this.volume.collected = res;
            // TODO translate
            if(res) successAlert(this.alerts, 'Successfully added to collection.', undefined, this.translate);
            else successAlert(this.alerts, 'Successfully removed from collection.', undefined, this.translate);
        });
    }
}
