import { Component, computed, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiTable, TuiTableCell } from '@taiga-ui/addon-table';
import { TuiTextfield } from '@taiga-ui/core';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerLock, tablerSortAscendingLetters, tablerSortDescendingLetters } from '@ng-icons/tabler-icons';
import { NgFor, NgIf } from '@angular/common';
import { TuiCell } from '@taiga-ui/layout';
import { TuiFade, TuiPagination } from '@taiga-ui/kit';
import { solarGlobal } from '@ng-icons/solar-icons/outline';
import { solarGlobalBold } from '@ng-icons/solar-icons/bold';

@Component({
    selector: 'app-admin-series',
    imports: [TuiCell,NgFor,NgIf,TuiTable,TuiTextfield,TuiPagination,TuiSelectModule,ReactiveFormsModule,FormsModule,TranslatePipe,NgIcon,TuiTextfieldControllerModule,TuiFade],
    templateUrl: './series.component.html',
    styleUrl: './series.component.less',
    viewProviders: [provideIcons({tablerSortAscendingLetters,tablerSortDescendingLetters,tablerLock,solarGlobal})]
})
export class AdminSeriesComponent {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    readonly theme = computed(() => this.auth.theme());
    tableSize:any = 'm';
    search:string = "";
    currentSearch:string = "";
    prevSearch:string = "";
    currentPage:number = 0;
    maxPages:number= 10;
    loading:boolean = true;
    orders:any = [
        {key: 'name', value: 'name-asc', icon: 'tablerSortAscendingLetters'},
        {key: 'name', value: 'name-desc', icon: 'tablerSortDescendingLetters'},
    ]
    selectedOrder: any = this.orders[0];
    series: any = [];
    constructor(private translate: TranslateService, private title: Title, private router: Router) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.admin-series')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        this.updateQueryParams();
    }

    updateQueryParams(){
        // navigate router without reloading and without pushing to history
        this.router.navigate([], { queryParams: {order: this.selectedOrder.value, page: this.currentPage, search: this.search.trim() !== '' ? this.search : null}, queryParamsHandling: 'merge', replaceUrl: true });
        this.loadSeries();
    }


    loadSeries(){
        const PAGE_LIMIT = 50;
        this.loading = true;

        const offset = this.currentPage * PAGE_LIMIT;

        this.api.request<any>(HttpMethod.POST, `admin-series`, {order: this.selectedOrder.value, limit: PAGE_LIMIT,offset,search:this.search}).subscribe((res:any)=>{
            this.series = res.series;
            console.log(this.series)
            this.maxPages = res.max;
            this.loading = false;
        }, (err:any)=>{
            this.loading = false;
        });
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
