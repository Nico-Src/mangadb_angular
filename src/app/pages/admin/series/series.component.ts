import { Component, computed, inject, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiAlertService, TuiButton, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerEdit, tablerLock, tablerPlus, tablerSortAscendingLetters, tablerSortDescendingLetters, tablerTrash } from '@ng-icons/tabler-icons';
import { NgFor, NgIf } from '@angular/common';
import { TuiPagination } from '@taiga-ui/kit';
import { solarGlobal } from '@ng-icons/solar-icons/outline';
import { CDN_BASE, errorAlert, getTranslation, SERIES_TYPES, successAlert } from '../../../../globals';

@Component({
    selector: 'app-admin-series',
    imports: [NgFor,NgIf,TuiTable,TuiTextfield,TuiButton,TuiLoader,TuiPagination,TuiSelectModule,ReactiveFormsModule,FormsModule,TranslatePipe,NgIcon,TuiTextfieldControllerModule],
    templateUrl: './series.component.html',
    styleUrl: './series.component.less',
    viewProviders: [provideIcons({tablerSortAscendingLetters,tablerSortDescendingLetters,tablerLock,solarGlobal,tablerEdit,tablerPlus,tablerTrash})]
})
export class AdminSeriesComponent {
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    readonly theme = computed(() => this.auth.theme());
    cdn_base = CDN_BASE;
    tableSize:any = 's';
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
    menuItems = [
        {title: 'edit', icon: 'tablerEdit', action: this.editSeries.bind(this)},
        {title: 'delete', icon: 'tablerTrash', action: this.confirmDeleteSeries.bind(this)},
    ];
    @ViewChild('dropdown') dropdown:any;

    showAddDialog:boolean = false;
    @ViewChild('addDialog') addDialog:any;
    addingSeries:boolean = false;
    seriesTypes:any = SERIES_TYPES;
    addSeriesItem:any = {name: undefined, type: this.seriesTypes[0]};
    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.admin-series')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        // get query params (also on change)
        this.route.queryParams.subscribe(params => {
            if(params['order']) this.selectedOrder = this.orders.find((o: { value: any; }) => o.value === params['order']);
            if(params['page']) this.currentPage = parseInt(params['page']);
            if(params['search']) this.search = this.prevSearch = this.currentSearch = params['search'];
        });

        this.updateQueryParams();
    }

    // update query params
    updateQueryParams(){
        // navigate router without reloading and without pushing to history
        this.router.navigate([], { queryParams: {order: this.selectedOrder.value, page: this.currentPage, search: this.search.trim() !== '' ? this.search : null}, queryParamsHandling: 'merge', replaceUrl: true });
        this.loadSeries();
    }

    // load series data
    loadSeries(){
        const PAGE_LIMIT = 50;
        this.loading = true;

        const offset = this.currentPage * PAGE_LIMIT;

        this.api.request<any>(HttpMethod.POST, `admin-series`, {order: this.selectedOrder.value, limit: PAGE_LIMIT,offset,search:this.search}).subscribe((res:any)=>{
            this.series = res.series;
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

    // edit series
    editSeries(ser:any){
        this.router.navigate(['admin','series',ser.id]);
    }

    // if backdrop of dialog is clicked close it
    addDialogClick(e:any){
        if (e.target === this.addDialog.nativeElement) {
            this.showAddDialog = false;
        }
    }

    // open alias dialog
    openAddDialog(){
        this.showAddDialog = true;
    }

    // add series
    addSeries(){
        if(!this.addSeriesItem?.name || !this.addSeriesItem?.type?.key) return;
        this.addingSeries = true;

        this.api.request<string>(HttpMethod.POST, `admin-series/add`, {name: this.addSeriesItem.name, type: this.addSeriesItem.type.key}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `add-series-dialog.success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.addSeriesItem = {name: '', type: this.seriesTypes[0]};
            this.loadSeries();
            this.addingSeries = false;
            this.showAddDialog = false;
        }, async (err:any)=>{
            if(err.status == 409){ // exists-already
                const msg = await getTranslation(this.translate, `add-series-dialog.exists-already`);
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else {
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            }
            this.addingSeries = false;
        });
    }

    // delete series
    async confirmDeleteSeries(ser:any){
        if(!ser) return;
        const msg = await getTranslation(this.translate, 'series.delete-question');
        const deleteSeries = confirm(msg);
        if(!deleteSeries) return;

        this.api.request<string>(HttpMethod.DELETE, `admin-series/delete/${ser.id}`, {}, 'text').subscribe(async (res:any)=>{
            const msg = await getTranslation(this.translate, `series.delete-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadSeries();
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }
}
