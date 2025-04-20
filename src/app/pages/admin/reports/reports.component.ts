import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiAlertService, TuiButton, TuiDataList, TuiHint, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { TuiComboBoxModule, TuiSelectModule, TuiTextareaModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerEdit, tablerExternalLink, tablerEye, tablerPlus, tablerSortAscendingNumbers, tablerSortDescendingNumbers, tablerTrash } from '@ng-icons/tabler-icons';
import { NgFor, NgIf } from '@angular/common';
import { TuiPagination, } from '@taiga-ui/kit';
import { CDN_BASE, errorAlert, getTranslation, LANGS, successAlert, langToLocale, REPORT_STATUSES, REPORT_TYPES } from '../../../../globals';
import { TuiTable } from '@taiga-ui/addon-table';

@Component({
    selector: 'app-admin-reports',
    imports: [NgFor,NgIf,TuiTextfield,ScrollingModule,TuiTextareaModule,TuiTable,TuiHint,TuiComboBoxModule,TuiDataList,TuiButton,TuiLoader,TuiPagination,TuiSelectModule,ReactiveFormsModule,FormsModule,TranslatePipe,NgIcon,TuiTextfieldControllerModule],
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.less',
    providers: [],
    viewProviders: [provideIcons({tablerSortAscendingNumbers,tablerExternalLink,tablerEye,tablerSortDescendingNumbers,tablerEdit,tablerPlus,tablerTrash})]
})

export class AdminReportsComponent {
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
        {key: 'added', value: 'added-asc', icon: 'tablerSortAscendingNumbers'},
        {key: 'added', value: 'added-desc', icon: 'tablerSortDescendingNumbers'},
    ]
    selectedOrder: any = this.orders[1];
    reports: any = [];
    reportTypes:any = REPORT_TYPES;
    reportStatuses = REPORT_STATUSES;
    reportMenuItems = [
        {title: 'view', icon: 'tablerEye', action: this.viewReport.bind(this)},
        {title: 'view-item', icon: 'tablerExternalLink', action: this.viewReportItem.bind(this)},
        {title: 'delete', icon: 'tablerTrash', action: this.confirmDeleteReport.bind(this)},
    ];
    @ViewChild('dropdown') dropdown:any;

    showViewDialog:boolean = false;
    @ViewChild('viewDialog') viewDialog:any;
    viewReportObj:any = {};

    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.reports')).subscribe((res: any) => {
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

    // update query parameter
    updateQueryParams(){
        // navigate router without reloading and without pushing to history
        this.router.navigate([], { queryParams: {order: this.selectedOrder.value, page: this.currentPage, search: this.search.trim() !== '' ? this.search : null}, queryParamsHandling: 'merge', replaceUrl: true });
        this.loadReports();
    }

    // lang to locale converter
    toLoc(lang:string){
        return langToLocale(lang);
    }

    // load reports
    loadReports(){
        this.loading = true;
        const PAGE_LIMIT = 50;
        const offset = this.currentPage * PAGE_LIMIT;
        this.api.request<any>(HttpMethod.POST, `reports`, {order: this.selectedOrder.value,limit: PAGE_LIMIT,offset,search:this.search}).subscribe((res:any)=>{
            for(const report of res.reports){
                report.type = this.reportTypes.find((t:any) => t.key === report.type);
            }
            this.reports = res.reports;
            console.log(this.reports)
            this.maxPages = res.max;
            for(const report of this.reports){
                if(typeof report.status === "string") report.status = this.reportStatuses.find(r => r.key === report.status);
            }
            this.loading = false;
        });
    }

    reportStatusUpdate(e:any,id:number,type:string){
        this.api.request<string>(HttpMethod.POST, `reports/update/${id}/${type}`, {status: e.key}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `report.update-status-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadReports();
        });
    }

    // if backdrop of dialog is clicked close it
    viewDialogClick(e:any){
        if (e.target === this.viewDialog.nativeElement) {
            this.showViewDialog = false;
        }
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

    viewReport(report:any){
        this.viewReportObj = JSON.parse(JSON.stringify(report));
        this.showViewDialog = true;
    }

    viewReportItem(report:any){
        console.log(report)
        if(report.report_type == 'series') this.router.navigate(['series',report.series.slug]);
        else {
            const slug = report.volume.slug;
            const series = slug.split(':')[0];
            const volSlug = slug.split(':')[1];
            this.router.navigate(['volume', series, volSlug]);
        }
    }

    // delete report
    async confirmDeleteReport(report:any){
        if(!report) return;
        const msg = await getTranslation(this.translate, `report.delete-question`);
        const confirmDelete = confirm(msg);
        // if user wants to delete publisher send delete request
        if(confirmDelete){
            this.api.request<string>(HttpMethod.DELETE, `reports/delete/${report.id}/${report.report_type}`, {}, 'text').subscribe(async(res:any)=>{
                const msg = await getTranslation(this.translate, `report.delete-success`);
                successAlert(this.alerts, msg, undefined, this.translate);
                this.loadReports();
            }, (err:any)=>{
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            });
        }
    }
}
