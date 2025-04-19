import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiAlertService, TuiButton, TuiDataList, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { TuiComboBoxModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerArrowsMove, tablerEdit, tablerLock, tablerMenuOrder, tablerPlus, tablerReorder, tablerSortAscendingLetters, tablerSortDescendingLetters, tablerTrash } from '@ng-icons/tabler-icons';
import { NgFor, NgIf } from '@angular/common';
import { TuiPagination, } from '@taiga-ui/kit';
import { solarGlobal, solarMagicStick3 } from '@ng-icons/solar-icons/outline';
import { CDN_BASE, errorAlert, getTranslation, LANGS, successAlert, langToLocale } from '../../../../globals';

@Component({
    selector: 'app-admin-contributors',
    imports: [NgFor,NgIf,TuiTable,TuiTextfield,ScrollingModule,TuiComboBoxModule,TuiDataList,TuiButton,TuiLoader,TuiPagination,TuiSelectModule,ReactiveFormsModule,FormsModule,TranslatePipe,NgIcon,TuiTextfieldControllerModule],
    templateUrl: './contributors.component.html',
    styleUrl: './contributors.component.less',
    providers: [],
    viewProviders: [provideIcons({tablerSortAscendingLetters,tablerArrowsMove,tablerSortDescendingLetters,tablerLock,solarGlobal,tablerEdit,tablerPlus,tablerTrash,tablerMenuOrder,tablerReorder,solarMagicStick3})]
})

export class AdminContributorsComponent {
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
    contributors: any = [];
    contributorMenuItems = [
        {title: 'edit', icon: 'tablerEdit', action: this.editContributor.bind(this)},
        {title: 'delete', icon: 'tablerTrash', action: this.confirmDeleteContributor.bind(this)},
    ];
    @ViewChild('dropdown') dropdown:any;

    showAddDialog:boolean = false;
    @ViewChild('addDialog') addDialog:any;
    addingContributor:boolean = false;
    availableLangs:any = LANGS;
    addContributorItem:any = {first_name: undefined, last_name: undefined};

    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.admin-contributors')).subscribe((res: any) => {
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
        this.loadContributors();
    }

    // lang to locale converter
    toLoc(lang:string){
        return langToLocale(lang);
    }

    // load contributors
    loadContributors(){
        this.loading = true;
        const PAGE_LIMIT = 50;
        const offset = this.currentPage * PAGE_LIMIT;
        this.api.request<any>(HttpMethod.POST, `admin-contributors`, {order: this.selectedOrder.value,limit: PAGE_LIMIT,offset,search:this.search}).subscribe((res:any)=>{
            this.contributors = res.contributors;
            for(const contributor of this.contributors){
                contributor.name = `${contributor.last_name?.toUpperCase()} ${contributor.first_name}`.trim();
            }
            this.maxPages = res.max;
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

    // open add dialog
    openAddDialog(){
        this.showAddDialog = true;
    }

    // if backdrop of dialog is clicked close it
    addDialogClick(e:any){
        if (e.target === this.addDialog.nativeElement) {
            this.showAddDialog = false;
        }
    }

    async addContributor(){
        if(!this.addContributorItem.first_name) return;
        console.log(this.addContributorItem)

        this.addingContributor = true;

        this.api.request<string>(HttpMethod.POST, `admin-contributors/add`, {first_name: this.addContributorItem.first_name, last_name: this.addContributorItem.last_name || ''}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `add-contributor-dialog.success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.addingContributor = false;
            this.showAddDialog = false;
            this.addContributorItem.first_name = '';
            this.addContributorItem.last_name = '';
            this.loadContributors();
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.addingContributor = false;
        });
    }

    editContributor(contributor:any){
        this.router.navigate(['admin','contributors',contributor.id]);
    }

    // delete contributor
    async confirmDeleteContributor(contributor:any){
        if(!contributor) return;
        const msg = await getTranslation(this.translate, `contributor.delete-question`);
        const confirmDelete = confirm(msg);
        // if user wants to delete publisher send delete request
        if(confirmDelete){
            this.api.request<string>(HttpMethod.DELETE, `admin-contributors/delete/${contributor.id}`, {}, 'text').subscribe(async(res:any)=>{
                const msg = await getTranslation(this.translate, `add-contributor-dialog.delete-success`);
                successAlert(this.alerts, msg, undefined, this.translate);
                this.loadContributors();
            }, (err:any)=>{
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            });
        }
    }
}
