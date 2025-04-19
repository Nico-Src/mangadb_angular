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
import { tablerEdit, tablerLock, tablerMenuOrder, tablerPlus, tablerReorder, tablerSortAscendingNumbers, tablerSortDescendingLetters, tablerSortDescendingNumbers, tablerTrash, tablerX } from '@ng-icons/tabler-icons';
import { NgFor, NgIf } from '@angular/common';
import { TuiFiles, TuiPagination, } from '@taiga-ui/kit';
import { solarGlobal, solarMagicStick3 } from '@ng-icons/solar-icons/outline';
import { CDN_BASE, errorAlert, getTranslation, LANGS, successAlert, langToLocale } from '../../../../globals';

@Component({
    selector: 'app-admin-media',
    imports: [NgFor,NgIf,TuiTable,TuiTextfield,TuiFiles,ScrollingModule,TuiComboBoxModule,TuiDataList,TuiButton,TuiLoader,TuiPagination,TuiSelectModule,ReactiveFormsModule,FormsModule,TranslatePipe,NgIcon,TuiTextfieldControllerModule],
    templateUrl: './media-library.component.html',
    styleUrl: './media-library.component.less',
    viewProviders: [provideIcons({tablerSortAscendingNumbers,tablerX,tablerSortDescendingNumbers,tablerSortDescendingLetters,tablerLock,solarGlobal,tablerEdit,tablerPlus,tablerTrash,tablerMenuOrder,tablerReorder,solarMagicStick3})]
})

export class AdminMediaComponent {
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
    media: any = [];
    mediaMenuItems = [
        {title: 'edit', icon: 'tablerEdit', action: this.editMedia.bind(this)},
        {title: 'delete', icon: 'tablerTrash', action: this.confirmDeleteMedia.bind(this)},
    ];
    @ViewChild('dropdown') dropdown:any;

    base64:any = null;
    image:any = null;
    uploadingImage:boolean = false;

    showAddDialog:boolean = false;
    @ViewChild('addDialog') addDialog:any;
    addingMedia:boolean = false;
    availableLangs:any = LANGS;
    addMediaItem:any = {name: '', tags: []};
    addTagName:any = '';

    showEditDialog:boolean = false;
    @ViewChild('editDialog') editDialog:any;
    editingMedia:boolean = false;
    editMediaItem:any = undefined;
    editTagName:any = '';

    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.media-library')).subscribe((res: any) => {
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
        this.loadMedia();
    }

    // lang to locale converter
    toLoc(lang:string){
        return langToLocale(lang);
    }

    // load contributors
    loadMedia(){
        this.loading = true;
        const PAGE_LIMIT = 50;
        const offset = this.currentPage * PAGE_LIMIT;
        this.api.request<any>(HttpMethod.POST, `media`, {order: this.selectedOrder.value,limit: PAGE_LIMIT,offset,search:this.search}).subscribe((res:any)=>{
            this.media = res.media;
            this.maxPages = res.max;
            for(const item of this.media){
                if(item.tags.includes(',')) item.tags = item.tags.split(',');
                else if(typeof item.tags === 'string') item.tags = [item.tags];
            }
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

    // keydown handler for add tag input
    addTagKeyDown(event: KeyboardEvent) {
        if(event.key === 'Enter') {
            if(this.addTagName.length > 0){
                this.addMediaItem.tags.push(this.addTagName.trim());
                this.addTagName = '';
            }
        }
    }

    // keydown handler for edit tag input
    editTagKeyDown(event: KeyboardEvent) {
        if(event.key === 'Enter') {
            if(this.editTagName.length > 0){
                this.editMediaItem.tags.push(this.editTagName.trim());
                this.editTagName = '';
            }
        }
    }

    // read image when file changes (and store base64)
    imageUpdate(e:any){
        const file = e;

        if (file) {
            const reader = new FileReader();

            reader.onload = (event) => {
                this.base64 = event.target?.result;
            }

            reader.readAsDataURL(file);
        }
    }

    // reset image when image is removed
    imageRemoved(e:any){
        this.image = null;
        this.base64 = null;
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

    // if backdrop of dialog is clicked close it
    editDialogClick(e:any){
        if (e.target === this.editDialog.nativeElement) {
            this.showEditDialog = false;
            this.editMediaItem = undefined;
        }
    }

    // add media item to library
    async addMedia(){
        if(!this.addMediaItem.name || this.addMediaItem.tags.length == 0 || !this.image) return;

        this.addingMedia = true;

        this.api.request<string>(HttpMethod.POST, `media/add`, {name: this.addMediaItem.name, tags: this.addMediaItem.tags.join(','), image: this.base64}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `add-media-dialog.success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.addingMedia = false;
            this.showAddDialog = false;
            this.addMediaItem.name = '';
            this.addMediaItem.tags = [];
            this.image = undefined;
            this.base64 = undefined;
            this.loadMedia();
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.addingMedia = false;
        });
    }

    // save changes for media item
    saveMediaEdit(){
        if(!this.editMediaItem) return;

        this.editingMedia = true;

        this.api.request<string>(HttpMethod.POST, `media/edit/${this.editMediaItem.id}`, {name: this.editMediaItem.name, tags: this.editMediaItem.tags.join(',')}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `add-media-dialog.save-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.editingMedia = false;
            this.showEditDialog = false;
            this.editMediaItem = undefined;
            this.loadMedia();
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.editingMedia = false;
        });
    }

    // open edit dialog with the given media item
    editMedia(media:any){
        this.showEditDialog = true;
        this.editMediaItem = {id: media.id, name: media.name, tags: JSON.parse(JSON.stringify(media.tags))};
    }

    // delete contributor
    async confirmDeleteMedia(media:any){
        if(!media) return;
        const msg = await getTranslation(this.translate, `media.delete-question`);
        const confirmDelete = confirm(msg);
        // if user wants to delete publisher send delete request
        if(confirmDelete){
            this.api.request<string>(HttpMethod.DELETE, `media/delete/${media.id}`, {}, 'text').subscribe(async(res:any)=>{
                const msg = await getTranslation(this.translate, `add-media-dialog.delete-success`);
                successAlert(this.alerts, msg, undefined, this.translate);
                this.loadMedia();
            }, (err:any)=>{
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            });
        }
    }

    // remove tag from add media item
    removeAddTag(tag:any){
        this.addMediaItem.tags = this.addMediaItem.tags.filter((t:any)=>t !== tag);
    }

    // remove tag from edit media item
    removeEditTag(tag:any){
        this.editMediaItem.tags = this.editMediaItem.tags.filter((t:any)=>t !== tag);
    }
}
