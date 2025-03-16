import { Component, inject, ViewChild } from '@angular/core';
import { API_BASE } from '../../../globals';
import { Meta, Title } from '@angular/platform-browser';
import { _, TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiTextfield, TuiAppearance, TuiButton, TuiLoader, TuiDataList } from '@taiga-ui/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiDataListWrapper, TuiSegmented, TuiPagination, TuiBadgedContent } from '@taiga-ui/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerSortAscendingLetters, tablerSortDescendingLetters, tablerSortAscending, tablerSortDescending, tablerList, tablerLayoutColumns, tablerLayoutGrid, tablerFilter } from '@ng-icons/tabler-icons';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { MangaSeriesListComponent } from '../../manga-series-list/manga-series-list.component';
import { MangaSeriesColumnComponent } from '../../manga-series-column/manga-series-column.component';
import { MangaSeriesGridComponent } from '../../manga-series-grid/manga-series-grid.component';

@Component({
    selector: 'app-browse-series',
    imports: [TranslatePipe, TuiBadgedContent, TuiTextfield, TuiAppearance, ReactiveFormsModule, FormsModule, TuiButton, TuiLoader, TuiSelectModule, TuiTextfieldControllerModule, TuiDataList, TuiDataListWrapper, NgIcon, TuiSegmented, TuiPagination, NgFor, NgIf, MangaSeriesListComponent, MangaSeriesColumnComponent, MangaSeriesGridComponent],
    templateUrl: './browse-series.component.html',
    styleUrl: './browse-series.component.less',
    viewProviders: [provideIcons({ tablerSortAscendingLetters, tablerSortDescendingLetters, tablerSortAscending, tablerSortDescending, tablerList, tablerLayoutColumns, tablerLayoutGrid, tablerFilter })],
})
export class BrowseSeriesComponent {
    private auth = inject(AuthService);
    search:string = "";
    currentSearch:string = "";
    prevSearch:string = "";
    currentPage:number = 0;
    maxPages:number= 10;
    filters:string = "";
    dialogFilters:any = [];
    showFilterDialog:boolean = false;
    loading:boolean = true;
    viewIndex:number = 0;
    orders:any = [
        {key: 'name', value: 'name-asc', icon: 'tablerSortAscendingLetters'},
        {key: 'name', value: 'name-desc', icon: 'tablerSortDescendingLetters'},
        {key: 'added', value: 'added-asc', icon: 'tablerSortAscending'},
        {key: 'added', value: 'added-desc', icon: 'tablerSortDescending'},
    ]
    tags:any = [];
    tagCategories:any = [];
    selectedOrder: any = this.orders[0];
    series:any = [];
    @ViewChild('filterDialog') filterDialog:any
    constructor(private translate: TranslateService, private meta: Meta, private title: Title, private http:HttpClient, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.browse-series')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        // get query params (also on change)
        this.route.queryParams.subscribe(params => {
            if(params['order']) this.selectedOrder = this.orders.find((o: { value: any; }) => o.value === params['order']);
            if(params['page']) this.currentPage = parseInt(params['page']);
            if(params['search']) this.search = this.prevSearch = this.currentSearch = params['search'];
            if(params['filters']) this.filters = params['filters'];
        });

        // get users view mode (list, column or grid)
        this.viewIndex = parseInt(localStorage.getItem('viewMode') || '0');

        // update query params
        this.updateQueryParams();
        // load tags
        this.loadTags();
    }

    // hide filter dialog
    hideFilters(event:any){
        if(event.target === this.filterDialog.nativeElement) this.showFilterDialog = false;
    }

    // get selected filters as string for query params
    getFilters(){
        let filters = [];
        // for each filter with state include add the tag name else if exclude the tag name with an exclamation mark
        for(const filter of this.dialogFilters){
            if(filter.state === 'include') filters.push(`${filter.name}`);
            else if(filter.state === 'exclude') filters.push(`!${filter.name}`);
        }
        return filters.join(';');
    }

    // get selected filters array
    selectedFilters(){
        return this.dialogFilters.filter((f: { state: string; }) => f.state !== 'none');
    }

    // reset filters
    resetFilters(){
        // reset state
        for(const filter of this.dialogFilters){
            filter.state = 'none';
        }
        // empty filters
        this.filters = "";
        // reset page
        this.currentPage = 0;
        // hide window and update params
        this.updateQueryParams();
        this.showFilterDialog = false;
    };
    
    // apply changed filters
    applyFilters(){
        // reset page
        this.currentPage = 0;
        this.filters = this.getFilters();
        // hide window and update params
        this.updateQueryParams();
        this.showFilterDialog = false;
    };
    
    // filter click handler
    filterClick(e:any){
        // find filter
        const index = this.dialogFilters.findIndex((f: { id: any; }) => f.id == e.id);
        // based on current state change state
        if(this.dialogFilters[index].state == 'none') this.dialogFilters[index].state = 'include';
        else if(this.dialogFilters[index].state == 'include') this.dialogFilters[index].state = 'exclude';
        else this.dialogFilters[index].state = 'none';
    }

    // get tag state
    tagState(tag:any){
        return this.dialogFilters.find((f: { name: any; }) => f.name == tag.name).state;
    }

    // update query params
    updateQueryParams(){
        // navigate router without reloading and without pushing to history
        this.router.navigate([], { queryParams: {order: this.selectedOrder.value, page: this.currentPage, search: this.search.trim() !== '' ? this.search : null, filters: this.filters !== '' ? this.filters : null}, queryParamsHandling: 'merge', replaceUrl: true });
        // reload series after
        this.loadSeries();
    }

    // load tags
    loadTags(){
        this.http.get(`${API_BASE}/tags`).subscribe((res:any) => {
            this.tags = res;

            // group tags
            const groupedTags:any = {};
            const parsedSavedFilters = this.filters.split(';');
            for(const tag of res){
                if(!groupedTags[tag.type]){
                    this.tagCategories.push(tag.type);
                    groupedTags[tag.type] = [];
                }
                groupedTags[tag.type].push({id: tag.id, name: tag.name});
                
                // if filters are set, update dialog specific filters
                if(this.filters.trim() != ''){
                    if(parsedSavedFilters.includes(tag.name)) this.dialogFilters.push({id: tag.id, name: tag.name, state: 'include'});
                    else if(parsedSavedFilters.includes(`!${tag.name}`)) this.dialogFilters.push({id: tag.id, name: tag.name, state: 'exclude'});
                    else this.dialogFilters.push({id: tag.id, name: tag.name, state: 'none'});
                } else this.dialogFilters.push({id: tag.id, name: tag.name, state: 'none'});
            }
            this.tags = groupedTags;
            // load series
            this.loadSeries();
        });
    }

    // load series
    loadSeries(){
        const PAGE_LIMIT = 24;
        this.loading = true;
        
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        this.http.post(`${API_BASE}/series`,{order: this.selectedOrder.value, limit: PAGE_LIMIT, offset: PAGE_LIMIT * this.currentPage, search: this.search.trim(), lang: lang, filters: this.filters}).subscribe((res:any) => {
            setTimeout(()=>
                this.series = res.series
            , 300);

            this.maxPages = res.max;
            
            setTimeout(() => 
                this.loading = false
            , 600);
        });
    }

    // view mode changed
    viewChanged(index: number) {
        // save to local storage
        localStorage.setItem('viewMode', index.toString());
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
}
