import { Component, computed, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { APIService, HttpMethod } from '../../../services/api.service';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { TuiPagination } from '@taiga-ui/kit';
import { tablerProgress, tablerSortAscending, tablerSortAscendingLetters, tablerSortAscendingNumbers, tablerSortDescending, tablerSortDescendingLetters, tablerSortDescendingNumbers, tablerView360Arrow } from '@ng-icons/tabler-icons';
import { NgFor, NgIf } from '@angular/common';
import { MangaCover } from '../../manga-cover/manga-cover.component';
import { ago, getTranslation, langToLocale, readableDate, UNKNOWN_DATE } from '../../../globals';
import { matPriorityHighOutline, matStarOutline, matStarOutlineOutline } from '@ng-icons/material-icons/outline';

@Component({
    selector: 'app-dashboard',
    imports: [TuiTextfieldControllerModule, TuiTextfield, MangaCover, NgIf, TuiLoader, NgFor, TuiSelectModule, ReactiveFormsModule, FormsModule, NgIcon, TuiPagination, TranslatePipe],
    templateUrl: './reading-history.component.html',
    styleUrl: './reading-history.component.less',
    viewProviders: [provideIcons({ tablerSortAscendingLetters, matStarOutline, matStarOutlineOutline, tablerSortAscendingNumbers, tablerSortDescendingNumbers, matPriorityHighOutline, tablerProgress, tablerView360Arrow, tablerSortDescendingLetters, tablerSortAscending, tablerSortDescending })]
})
export class ReadingHistoryComponent {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    readonly theme = computed(() => this.auth.theme());
    search:string = "";
    currentSearch:string = "";
    prevSearch:string = "";
    currentPage:number = 0;
    maxPages:number= 10;
    loading:boolean = true;
    orders:any = [
        {key: 'name', value: 'name-asc', icon: 'tablerSortAscendingLetters'},
        {key: 'name', value: 'name-desc', icon: 'tablerSortDescendingLetters'},
        {key: 'update', value: 'update-asc', icon: 'tablerSortAscendingNumbers'},
        {key: 'update', value: 'update-desc', icon: 'tablerSortDescendingNumbers'},
        {key: 'priority', value: 'priority-asc', icon: 'tablerSortAscendingNumbers'},
        {key: 'priority', value: 'priority-desc', icon: 'tablerSortDescendingNumbers'},
        {key: 'score', value: 'score-asc', icon: 'tablerSortAscendingNumbers'},
        {key: 'score', value: 'score-desc', icon: 'tablerSortDescendingNumbers'},
        {key: 'start-date', value: 'start-date-asc', icon: 'tablerSortAscending'},
        {key: 'start-date', value: 'start-date-desc', icon: 'tablerSortDescending'},
        {key: 'end-date', value: 'end-date-asc', icon: 'tablerSortAscending'},
        {key: 'end-date', value: 'end-date-desc', icon: 'tablerSortDescending'},
    ]
    series: any = [];
    selectedOrder: any = this.orders[0];
    constructor(private translate: TranslateService, private title: Title, private router: Router) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.reading-history')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        this.updateQueryParams();
    }

    // load reading history from api
    loadReadingHistory(){
        const PAGE_LIMIT = 20;
        if(!this.auth.isLoggedIn()){
            this.loading = false;
            return;
        }
        // show loading indicator
        this.loading = true;
    
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        const offset = this.currentPage * PAGE_LIMIT;
    
        this.api.request<any>(HttpMethod.POST, `user/reading-history`, {order:this.selectedOrder.value,limit: PAGE_LIMIT, offset, search: this.search, user_lang: lang}).subscribe((res:any)=>{
            console.log(res)
            this.series = res.series;
            this.maxPages = res.max;

            this.loading = false;
        }, (err:any)=>{
            this.loading = false;
        });
    }

    // update query params
    updateQueryParams(){
        // navigate router without reloading and without pushing to history
        this.router.navigate([], { queryParams: {order: this.selectedOrder.value, page: this.currentPage, search: this.search.trim() !== '' ? this.search : null}, queryParamsHandling: 'merge', replaceUrl: true });
        // reload series after
        this.loadReadingHistory();
    }

    // keydown handler for search input
    searchKeyDown(event: KeyboardEvent) {
        if(event.key === 'Enter') {
            // check if search is different from previous search
            if(this.search !== this.prevSearch) {
                this.currentPage = 0;
                this.prevSearch = this.search;
                this.currentSearch = this.search;
                // update query params
                this.updateQueryParams();
            }
        }
    }

    // language to locale code
    toLocale(lang:string){
        return langToLocale(lang);
    }

    // return time that has passed since given datetime
    agoTime(time:string){
        return ago(time, this.translate.currentLang);
    }

    // convert date to a more human-readable format
    historyDate(date:string){
        return readableDate(date, this.translate.currentLang, true);
    }

    // return readable date span for reading history items
    historyDateRange(ser:any){
        if(ser.start && ser.end) return `${this.historyDate(ser.start)} - ${this.historyDate(ser.end)}`;
        else if (ser.start) return `${this.historyDate(ser.start)} - ?`;
        else return '? - ?';
    }
}
