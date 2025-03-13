import { Component, inject } from '@angular/core';
import { API_BASE } from '../../../globals';
import { Meta, Title } from '@angular/platform-browser';
import { _, TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiTextfield, TuiAppearance, TuiButton, TuiLoader, TuiDataList } from '@taiga-ui/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiDataListWrapper, TuiSegmented, TuiPagination } from '@taiga-ui/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerSortAscendingLetters, tablerSortDescendingLetters, tablerSortAscending, tablerSortDescending, tablerList, tablerLayoutColumns, tablerLayoutGrid } from '@ng-icons/tabler-icons';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { MangaSeriesListComponent } from '../../manga-series-list/manga-series-list.component';
import { MangaSeriesColumnComponent } from '../../manga-series-column/manga-series-column.component';
import { MangaSeriesGridComponent } from '../../manga-series-grid/manga-series-grid.component';

@Component({
    selector: 'app-browse-series',
    imports: [TranslatePipe, TuiTextfield, TuiAppearance, ReactiveFormsModule, FormsModule, TuiButton, TuiLoader, TuiSelectModule, TuiTextfieldControllerModule, TuiDataList, TuiDataListWrapper, NgIcon, TuiSegmented, TuiPagination, NgFor, NgIf, MangaSeriesListComponent, MangaSeriesColumnComponent, MangaSeriesGridComponent],
    templateUrl: './browse-series.component.html',
    styleUrl: './browse-series.component.less',
    viewProviders: [provideIcons({ tablerSortAscendingLetters, tablerSortDescendingLetters, tablerSortAscending, tablerSortDescending, tablerList, tablerLayoutColumns, tablerLayoutGrid })],
})
export class BrowseSeriesComponent {
    private auth = inject(AuthService);
    search:string = "";
    prevSearch:string = "";
    currentPage:number = 0;
    maxPages:number= 10;
    loading:boolean = true;
    viewIndex:number = 0;
    orders:any = [
        {key: 'name', value: 'name-asc', icon: 'tablerSortAscendingLetters'},
        {key: 'name', value: 'name-desc', icon: 'tablerSortDescendingLetters'},
        {key: 'added', value: 'added-asc', icon: 'tablerSortAscending'},
        {key: 'added', value: 'added-desc', icon: 'tablerSortDescending'},
    ]
    selectedOrder: any = this.orders[0];
    series:any = [];
    constructor(private translate: TranslateService, private meta: Meta, private title: Title, private http:HttpClient, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.browse-series')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        this.route.queryParams.subscribe(params => {
            if(params['order']){
                this.selectedOrder = this.orders.find((o: { value: any; }) => o.value === params['order']);
            }
            if(params['page']){
                this.currentPage = parseInt(params['page']);
            }
            if(params['search']){
                this.search = params['search'];
                this.prevSearch = params['search'];
            }
        });

        this.viewIndex = parseInt(localStorage.getItem('viewMode') || '0');

        this.updateQueryParams();
        this.loadSeries();
    }

    updateQueryParams(){
        this.router.navigate([], { queryParams: {order: this.selectedOrder.value, page: this.currentPage, search: this.search.trim() !== '' ? this.search : null}, queryParamsHandling: 'merge', replaceUrl: true });

        this.loadSeries();
    }

    loadSeries(){
        const PAGE_LIMIT = 24;
        this.loading = true;
        
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        this.http.post(`${API_BASE}/series`,{order: this.selectedOrder.value, limit: PAGE_LIMIT, offset: PAGE_LIMIT * this.currentPage, search: this.search.trim(), lang: lang, filter: {}}).subscribe((res:any) => {
            console.log(res)
            this.series = res.series;
            this.maxPages = res.max;
            
            setTimeout(() => this.loading = false, 500);
        });
    }

    viewChanged(index: number) {
        // save to local storage
        localStorage.setItem('viewMode', index.toString());
    }

    searchKeyDown(event: KeyboardEvent) {
        if(event.key === 'Enter') {
            // check if search is different from previous search
            if(this.search !== this.prevSearch) {
                this.currentPage = 0;
                this.prevSearch = this.search;
                this.updateQueryParams();
            }
        }
    }
}
