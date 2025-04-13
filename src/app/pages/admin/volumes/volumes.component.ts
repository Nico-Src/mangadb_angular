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
import { tablerArrowsMove, tablerEdit, tablerLock, tablerMenuOrder, tablerPlus, tablerRating16Plus, tablerRating18Plus, tablerReorder, tablerSortAscendingLetters, tablerSortDescendingLetters, tablerTrash } from '@ng-icons/tabler-icons';
import { NgFor, NgIf } from '@angular/common';
import { TuiCell } from '@taiga-ui/layout';
import { TuiFade, TuiFilterByInputPipe, tuiItemsHandlersProvider, TuiPagination, } from '@taiga-ui/kit';
import { solarGlobal, solarMagicStick3 } from '@ng-icons/solar-icons/outline';
import { solarGlobalBold } from '@ng-icons/solar-icons/bold';
import { CDN_BASE, errorAlert, getTranslation, LANGS, SERIES_TYPES, successAlert, langToLocale } from '../../../../globals';
import { TuiLet, TuiStringHandler } from '@taiga-ui/cdk';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';

interface SeriesItem {
    type: string;
    name: string;
};

const STRINGIFY_SERIES: TuiStringHandler<SeriesItem> = (item: SeriesItem) =>
    `[${item.type}] ${item.name}`;

@Component({
    selector: 'app-admin-volumes',
    imports: [NgFor,NgIf,TuiTable,TuiTextfield,CdkDropList,CdkDrag,ScrollingModule,TuiComboBoxModule,TuiFilterByInputPipe,TuiLet,TuiDataList,TuiButton,TuiLoader,TuiPagination,TuiSelectModule,ReactiveFormsModule,FormsModule,TranslatePipe,NgIcon,TuiTextfieldControllerModule],
    templateUrl: './volumes.component.html',
    styleUrl: './volumes.component.less',
    providers: [tuiItemsHandlersProvider({stringify: STRINGIFY_SERIES})],
    viewProviders: [provideIcons({tablerSortAscendingLetters,tablerArrowsMove,tablerSortDescendingLetters,tablerLock,solarGlobal,tablerEdit,tablerPlus,tablerTrash,tablerMenuOrder,tablerReorder,solarMagicStick3})]
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
        {title: 'reorder', icon: 'tablerReorder', action: this.openReorderDialog.bind(this)},
        {title: 'reorder-groups', icon: 'tablerMenuOrder', action: this.openReorderGroupDialog.bind(this)},
        {title: 'auto-reorder', icon: 'solarMagicStick3', action: this.autoOrderSeries.bind(this)},
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

    showReorderDialog:boolean = false;
    @ViewChild('reorderDialog') reorderDialog:any;
    savingOrder:boolean = false;
    reorderVolumes:any = [];

    showReorderGroupDialog:boolean = false;
    @ViewChild('reorderGroupDialog') reorderGroupDialog:any;
    savingGroupOrder:boolean = false;
    reorderGroups:any = [];
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

    // drop event for reorder drag and drop in volume reorder dialog
    volumeDrop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.reorderVolumes, event.previousIndex, event.currentIndex);
    }

    // drop event for reorder drag and drop in group reorder dialog
    groupDrop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.reorderGroups, event.previousIndex, event.currentIndex);
    }

    // lang to locale converter
    toLoc(lang:string){
        return langToLocale(lang);
    }

    // load all series (for series select)
    loadSeries(){
        this.api.request<any>(HttpMethod.POST, `admin-series`, {order: 'name-asc'}).subscribe((res:any)=>{
            this.series = res.series;
        });
    }

    // get series array cast to series item
    get typedSeries(): SeriesItem[] {
        return this.series as SeriesItem[];
    }

    // load all volume groups (+ their volumes)
    loadGroups(showLoader:boolean=true){
        const PAGE_LIMIT = 50;
        if(showLoader) this.loading = true;

        const offset = this.currentPage * PAGE_LIMIT;

        this.api.request<any>(HttpMethod.POST, `admin-volumes`, {order: this.selectedOrder.value, limit: PAGE_LIMIT,offset,search:this.search}).subscribe((res:any)=>{
            this.groups = res.groups;
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

    // auto order volumes of current group
    autoOrderVolumes(){
        const priorities:any = {
            'German': 1,
            'English': 2,
            'French': 3,
            'Spanish': 4,
            'Italian': 5,
            'Japanese': 6,
            'Korean': 7,
        };
    
        // sort based on language priority
        this.reorderVolumes.sort((a: { language: string | number; id: number; },b: { language: string | number; id: number; }) => {
            if(a.language === b.language) return a.id - b.id;
            else return priorities[a.language] - priorities[b.language];
        });
    }

    // auto order all groups of a givens group series
    async autoOrderSeries(group:any){
        if(!group) return;
        const priorities:any = {
            'German': 1,
            'English': 2,
            'French': 3,
            'Spanish': 4,
            'Italian': 5,
            'Japanese': 6,
            'Korean': 7,
        };

        const seriesId = group.series_id;
        const groupsTmp = this.groups.filter((group:any) => group.series_id === seriesId);
    
        // iterate over all groups
        for(const group of groupsTmp){
            if(group.volumes.length > 1){
                group.updating = true;
                // sort the volumes based on the priorities
                group.volumes.sort((a: { language: string | number; id: number; },b: { language: string | number; id: number; }) => {
                    if(a.language === b.language) return a.id - b.id;
                    else return priorities[a.language] - priorities[b.language];
                });
    
                const orderedVolumes = [];
    
                // add volume ids to array in order
                for(const volume of group.volumes){
                    orderedVolumes.push(volume.id);
                }
    
                // update volume order
                await this.updateVolumeOrder(orderedVolumes);
            }
        }

        for(const group of groupsTmp){
            group.updating = false;
        }
    
        const msg = await getTranslation(this.translate, `reorder-dialog.success`);
        successAlert(this.alerts, msg, undefined, this.translate);
        this.loadGroups(false);
    }

    // send updated order of volumes to backend
    updateVolumeOrder(volumes:any){
        return new Promise((resolve)=>{
            this.api.request<string>(HttpMethod.POST, `admin-volumes/update-order`, {order:volumes}, 'text').subscribe((res:any)=>{resolve(true)},(err:any)=>{resolve(false)})
        });
    }

    // save group changes
    saveGroupEdit(){
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
    reorderDialogClick(e:any){
        if (e.target === this.reorderDialog.nativeElement) {
            this.showReorderDialog = false;
        }
    }

    // if backdrop of dialog is clicked close it
    addDialogClick(e:any){
        if (e.target === this.addDialog.nativeElement) {
            this.showAddDialog = false;
        }
    }

    // if backdrop of dialog is clicked close it
    reorderGroupDialogClick(e:any){
        if (e.target === this.reorderGroupDialog.nativeElement) {
            this.showReorderGroupDialog = false;
        }
    }

    // open add dialog
    openAddDialog(){
        this.showAddDialog = true;
    }

    // open reorder group dialog (fetch groups of series)
    openReorderGroupDialog(group:any){
        const seriesId = group.series_id;
        this.api.request<any>(HttpMethod.GET, `admin-volumes/groups/${seriesId}`,{}).subscribe((res:any)=>{
            this.reorderGroups = res;
            this.showReorderGroupDialog = true;
        });
    }

    // open add dialog
    openReorderDialog(group:any){
        this.reorderVolumes = JSON.parse(JSON.stringify(group.volumes));
        this.showReorderDialog = true;
    }

    // save volume order
    saveVolumeOrder(){
        if(!this.reorderVolumes) return;
        const order = [];
        // add volume ids to array in order
        for(const volume of this.reorderVolumes){
            order.push(volume.id);
        }

        this.savingOrder = true;

        this.api.request<string>(HttpMethod.POST, `admin-volumes/update-order`, {order}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `reorder-dialog.success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.savingOrder = false;
            this.loadGroups(false);
            this.showReorderDialog = false;
            this.reorderVolumes = [];
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.savingOrder = false;
        });
    }

    // save volume group order
    saveGroupOrder(){
        if(!this.reorderGroups || this.reorderGroups.length === 0) return;
        const order = [];
        // add volume ids to array in order
        for(const group of this.reorderGroups){
            order.push(group.id);
        }
        this.savingGroupOrder = true;

        this.api.request<string>(HttpMethod.POST, `admin-volumes/reorder-groups`, {order}, 'text').subscribe(async (res:any)=>{
            const msg = await getTranslation(this.translate, `reorder-group-dialog.success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadGroups(false);
            this.savingGroupOrder = false;
            this.showReorderGroupDialog = false;
            this.reorderGroups = [];
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.savingGroupOrder = false;
        });
    }

    // add volume
    addVolume(){
        
    }

    // delete series
    async confirmDeleteVolume(vol:any){
        if(!vol) return;
    }
}
