import { Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { CDN_BASE, readableDate, langToLocale, ANNOUNCED_DATE, UNKNOWN_DATE, isDateInFuture, errorAlert, successAlert } from '../../globals';
import { NgFor, NgIf } from '@angular/common';
import { MangaCover } from '../manga-cover/manga-cover.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { solarNotebook, solarCalendar, solarTagPrice } from '@ng-icons/solar-icons/outline';
import { lucideLibrary } from '@ng-icons/lucide';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiAlertService, TuiDataList, TuiDropdown } from '@taiga-ui/core';
import { TuiDataListDropdownManager } from '@taiga-ui/kit';
import { AuthService } from '../../services/auth.service';
import { APIService, HttpMethod } from '../../services/api.service';
import { heroMinus, heroPlus, heroViewfinderCircle } from '@ng-icons/heroicons/outline';
import { tablerClockEdit, tablerShoppingBagEdit, tablerTrash } from '@ng-icons/tabler-icons';
import { TuiDay } from '@taiga-ui/cdk/date-time';

@Component({
    selector: 'manga-volume',
    imports: [MangaCover, NgIcon, NgFor, TuiDataList, TuiDataListDropdownManager, TuiDropdown, TranslatePipe, NgIf],
    templateUrl: './manga-volume.component.html',
    styleUrl: './manga-volume.component.less',
    viewProviders: [provideIcons({ solarNotebook, solarCalendar, tablerTrash, lucideLibrary, heroViewfinderCircle, heroPlus, heroMinus, solarTagPrice, tablerClockEdit, tablerShoppingBagEdit })]
})
export class MangaVolume {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    private readonly alerts = inject(TuiAlertService);
    @Output() openPriceEdit: EventEmitter<any> = new EventEmitter();
    @Output() openBuyDateEdit: EventEmitter<any> = new EventEmitter();
    readonly cdn_base = CDN_BASE;
    loading = true;
    @Input() volume:any = {};
    @Input() showRelease = true;
    @Input() showCollectionMetadata = false;
    @Input() customMenuItems:any = [];
    @ViewChild('release') release:any;
    @ViewChild('dropdown') dropdown:any;

    defaultMenuItems = [
        {title: 'quick-view', icon: 'heroViewfinderCircle', action: this.quickView.bind(this)},
        {title: 'toggle-collection', icon: '', action: this.toggleCollection.bind(this)},
    ];

    menuItems = this.defaultMenuItems;
    
    collectionMenuItems = [
        {title: 'quick-view', icon: 'heroViewfinderCircle', action: this.quickView.bind(this)},
        {title: 'edit-price', icon: 'tablerShoppingBagEdit', action: this.openPriceEditDialog.bind(this)},
        {title: 'edit-date', icon: 'tablerClockEdit', action: this.openBuyDateEditDialog.bind(this)},
    ];

    constructor(private translate: TranslateService){}

    // convert date to a more human-readable format
    releaseDate(date:string){
        return readableDate(date, this.translate.currentLang, true);
    }

    // open price edit dialog
    openPriceEditDialog(vol:any){
        this.openPriceEdit.emit({id: this.volume.item_id, price: this.volume.price, series: this.volume.series});
    }

    // open buy date edit dialog
    openBuyDateEditDialog(vol:any){
        this.openBuyDateEdit.emit({id: this.volume.item_id, date: this.volume.buy_date_tui, series: this.volume.series});
    }

    // executed whenever inputs change
    ngOnChanges(){
        if(!this.volume?.id) return;
        this.volume.price = parseFloat(this.volume.price);
        // update readable date variables
        this.volume.release_date_readable = this.releaseDate(this.volume.release_date);
        this.volume.release_date_text = (this.volume.release_date_readable === UNKNOWN_DATE || this.volume.release_date_readable === ANNOUNCED_DATE);

        if(this.volume.buy_date){
            this.volume.buy_date_readable = this.releaseDate(this.volume.buy_date);
            this.volume.buy_date_text = (this.volume.buy_date_readable === UNKNOWN_DATE || this.volume.buy_date_readable === ANNOUNCED_DATE);
        }

        this.menuItems = [
            ...this.defaultMenuItems,
            ...this.customMenuItems
        ];
    }

    public updateBuyDate(){
        this.volume.buy_date_readable = this.releaseDate(this.volume.buy_date);
        this.volume.buy_date_text = (this.volume.buy_date_readable === UNKNOWN_DATE || this.volume.buy_date_readable === ANNOUNCED_DATE);
        const dateParts = this.volume.buy_date.toString().split('-').map((p:string) => parseInt(p));
        this.volume.buy_date_tui = new TuiDay(dateParts[0],dateParts[1]-1,dateParts[2]);
    }

    // language to locale code
    toLocale(lang:string){
        return langToLocale(lang);
    }

    // check if date is in future
    preOrder(date:string){
        return isDateInFuture(date);
    }

    quickView(vol:any){
        
    }

    // toggle collection state
    toggleCollection(vol:any){
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
