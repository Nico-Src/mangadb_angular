import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiTable, TuiTableCell } from '@taiga-ui/addon-table';
import { TuiAlertService, TuiButton, TuiDataList, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { TuiComboBoxModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerEdit, tablerLock, tablerMenuOrder, tablerPlus, tablerRating16Plus, tablerRating18Plus, tablerReorder, tablerSortAscendingLetters, tablerSortDescendingLetters, tablerTrash } from '@ng-icons/tabler-icons';
import { NgFor, NgIf } from '@angular/common';
import { TuiCell } from '@taiga-ui/layout';
import { TuiFade, TuiFilterByInputPipe, tuiItemsHandlersProvider, TuiPagination } from '@taiga-ui/kit';
import { solarGlobal, solarMagicStick3 } from '@ng-icons/solar-icons/outline';
import { solarGlobalBold } from '@ng-icons/solar-icons/bold';
import { CDN_BASE, errorAlert, getTranslation, LANGS, SERIES_TYPES, successAlert, langToLocale } from '../../../../globals';
import { TuiLet, TuiStringHandler } from '@taiga-ui/cdk';

interface SeriesItem {
    type: string;
    name: string;
};



const STRINGIFY_SERIES: TuiStringHandler<SeriesItem> = (item: SeriesItem) =>
    `[${item.type}] ${item.name}`;

@Component({
    selector: 'app-admin-volumes',
    imports: [NgFor,NgIf,TuiTable,TuiTextfield,ScrollingModule,TuiComboBoxModule,TuiFilterByInputPipe,TuiLet,TuiDataList,TuiButton,TuiLoader,TuiPagination,TuiSelectModule,ReactiveFormsModule,FormsModule,TranslatePipe,NgIcon,TuiTextfieldControllerModule],
    templateUrl: './volumes.component.html',
    styleUrl: './volumes.component.less',
    providers: [tuiItemsHandlersProvider({stringify: STRINGIFY_SERIES})],
    viewProviders: [provideIcons({tablerSortAscendingLetters,tablerSortDescendingLetters,tablerLock,solarGlobal,tablerEdit,tablerPlus,tablerTrash,tablerMenuOrder,tablerReorder,solarMagicStick3})]
})

export class AdminVolumesComponent {
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
        {key: 'series-title', value: 'series-title-asc', icon: 'tablerSortAscendingLetters'},
        {key: 'series-title', value: 'series-title-desc', icon: 'tablerSortDescendingLetters'},
    ]
    selectedOrder: any = this.orders[0];
    series: SeriesItem[] = [];
    groups: any = [];
    groupMenuItems = [
        {title: 'edit', icon: 'tablerEdit', action: this.editGroup.bind(this)},
        {title: 'reorder', icon: 'tablerReorder', action: (group:any)=>{}},
        {title: 'reorder-groups', icon: 'tablerMenuOrder', action: (group:any)=>{}},
        {title: 'auto-reorder', icon: 'solarMagicStick3', action: (group:any)=>{}},
        {title: 'delete', icon: 'tablerTrash', action: (group:any)=>{}},
    ];
    volumeMenuItems = [
        {title: 'edit', icon: 'tablerEdit', action: this.editVolume.bind(this)},
        {title: 'delete', icon: 'tablerTrash', action: this.confirmDeleteVolume.bind(this)},
    ];
    @ViewChild('dropdown') dropdown:any;

    showAddDialog:boolean = false;
    @ViewChild('addDialog') addDialog:any;
    addingVolume:boolean = false;
    availableLangs:any = LANGS;
    addVolumeItem:any = {name: undefined, group: undefined, edition: undefined, language: this.availableLangs[0]};

    showEditGroupDialog:boolean = false;
    @ViewChild('editGroupDialog') editGroupDialog:any;
    savingGroupEdit:boolean = false;
    editGroupItem:any = {id:-1,series:null,name:''};
    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.admin-volumes')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        // get query params (also on change)
        this.route.queryParams.subscribe(params => {
            if(params['order']) this.selectedOrder = this.orders.find((o: { value: any; }) => o.value === params['order']);
            if(params['page']) this.currentPage = parseInt(params['page']);
            if(params['search']) this.search = this.prevSearch = this.currentSearch = params['search'];
        });

        this.loadSeries();
        this.updateQueryParams();
    }

    updateQueryParams(){
        // navigate router without reloading and without pushing to history
        this.router.navigate([], { queryParams: {order: this.selectedOrder.value, page: this.currentPage, search: this.search.trim() !== '' ? this.search : null}, queryParamsHandling: 'merge', replaceUrl: true });
        this.loadGroups();
    }

    toLoc(lang:string){
        return langToLocale(lang);
    }

    loadSeries(){
        this.api.request<any>(HttpMethod.POST, `admin-series`, {order: 'name-asc'}).subscribe((res:any)=>{
            this.series = res.series;
            console.log(this.series)
        });
    }

    get typedSeries(): SeriesItem[] {
        return this.series as SeriesItem[];
    }

    loadGroups(showLoader:boolean=true){
        const PAGE_LIMIT = 50;
        if(showLoader) this.loading = true;

        const offset = this.currentPage * PAGE_LIMIT;

        this.api.request<any>(HttpMethod.POST, `admin-volumes`, {order: this.selectedOrder.value, limit: PAGE_LIMIT,offset,search:this.search}).subscribe((res:any)=>{
            this.groups = res.groups;
            console.log(this.groups)
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

    // edit group
    editGroup(group:any){
        this.showEditGroupDialog = true;
        this.editGroupItem.id = group.id;
        this.editGroupItem.name = group.name;
        this.editGroupItem.series = group.series;
    }

    // edit volume
    editVolume(volume:any){
        this.router.navigate(['admin','volume',volume.id]);
    }

    saveGroupEdit(){
        console.log(this.editGroupItem)
        if(!this.editGroupItem.series || !this.editGroupItem.name || !this.editGroupItem.id) return;
        this.savingGroupEdit = true;

        this.api.request<string>(HttpMethod.POST, `admin-volumes/edit-group/${this.editGroupItem.id}`, {name: this.editGroupItem.name, series: this.editGroupItem.series.id},'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `edit-group-dialog.success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadGroups(false);
            this.editGroupItem= {id: -1, name: '', series: undefined};
            this.savingGroupEdit = false;
            this.showEditGroupDialog = false;
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.savingGroupEdit = false;
        });
    }

    // if backdrop of dialog is clicked close it
    editGroupDialogClick(e:any){
        if (e.target === this.editGroupDialog.nativeElement) {
            this.showEditGroupDialog = false;
        }
    }

    // if backdrop of dialog is clicked close it
    addDialogClick(e:any){
        if (e.target === this.addDialog.nativeElement) {
            this.showAddDialog = false;
        }
    }

    // open add dialog
    openAddDialog(){
        this.showAddDialog = true;
    }

    // add volume
    addVolume(){
        
    }

    // delete series
    async confirmDeleteVolume(vol:any){
        if(!vol) return;
    }
}
