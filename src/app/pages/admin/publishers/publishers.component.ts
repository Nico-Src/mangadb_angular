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
    selector: 'app-admin-publishers',
    imports: [NgFor,NgIf,TuiTable,TuiTextfield,ScrollingModule,TuiComboBoxModule,TuiDataList,TuiButton,TuiLoader,TuiPagination,TuiSelectModule,ReactiveFormsModule,FormsModule,TranslatePipe,NgIcon,TuiTextfieldControllerModule],
    templateUrl: './publishers.component.html',
    styleUrl: './publishers.component.less',
    providers: [],
    viewProviders: [provideIcons({tablerSortAscendingLetters,tablerArrowsMove,tablerSortDescendingLetters,tablerLock,solarGlobal,tablerEdit,tablerPlus,tablerTrash,tablerMenuOrder,tablerReorder,solarMagicStick3})]
})

export class AdminPublishersComponent {
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
    publishers: any = [];
    publisherMenuItems = [
        {title: 'edit', icon: 'tablerEdit', action: this.editPublisher.bind(this)},
        {title: 'delete', icon: 'tablerTrash', action: this.confirmDeletePublisher.bind(this)},
    ];
    @ViewChild('dropdown') dropdown:any;

    showAddDialog:boolean = false;
    @ViewChild('addDialog') addDialog:any;
    addingPublisher:boolean = false;
    availableLangs:any = LANGS;
    addPublisherItem:any = {name: undefined};

    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.admin-publishers')).subscribe((res: any) => {
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
        this.loadPublishers();
    }

    // lang to locale converter
    toLoc(lang:string){
        return langToLocale(lang);
    }

    // load publishers
    loadPublishers(){
        this.loading = true;
        const PAGE_LIMIT = 50;
        const offset = this.currentPage * PAGE_LIMIT;
        this.api.request<any>(HttpMethod.POST, `admin-publishers`, {order: this.selectedOrder.value,limit: PAGE_LIMIT,offset,search:this.search}).subscribe((res:any)=>{
            this.publishers = res.publishers;
            console.log(this.publishers)
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

    async addPublisher(){
        if(!this.addPublisherItem.name) return;

        this.addingPublisher = true;

        this.api.request<string>(HttpMethod.POST, `admin-publishers/add`, {name: this.addPublisherItem.name}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `add-publisher-dialog.success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.addingPublisher = false;
            this.showAddDialog = false;
            this.addPublisherItem.name = '';
            this.loadPublishers();
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.addingPublisher = false;
        });
    }

    editPublisher(pub:any){
        this.router.navigate(['admin','publishers',pub.id]);
    }

    // delete publishers
    async confirmDeletePublisher(pub:any){
        if(!pub) return;
        const msg = await getTranslation(this.translate, `publisher.delete-question`);
        const confirmDelete = confirm(msg);
        // if user wants to delete publisher send delete request
        if(confirmDelete){
            this.api.request<string>(HttpMethod.DELETE, `admin-publishers/delete/${pub.id}`, {}, 'text').subscribe(async(res:any)=>{
                const msg = await getTranslation(this.translate, `add-publisher-dialog.delete-success`);
                successAlert(this.alerts, msg, undefined, this.translate);
                this.loadPublishers();
            }, (err:any)=>{
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            });
        }
    }
}
