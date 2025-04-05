import { Component, computed, inject, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { APIService, HttpMethod } from '../../../services/api.service';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiAlertService, TuiButton, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { TuiPagination } from '@taiga-ui/kit';
import { NgFor, NgIf } from '@angular/common';
import { MangaCover } from '../../manga-cover/manga-cover.component';
import { ago, CDN_BASE, errorAlert, getTranslation, langToLocale, readableDate, successAlert, UNKNOWN_DATE } from '../../../globals';
import { NgAutoAnimateDirective } from 'ng-auto-animate';
import { PluralTranslatePipe } from '../../../pipes/pluralTranslate';
import { tablerEdit, tablerList, tablerPlus, tablerTrash } from '@ng-icons/tabler-icons';

@Component({
    selector: 'app-dashboard',
    imports: [TuiTextfieldControllerModule, TuiTextfield, MangaCover, TuiButton, PluralTranslatePipe, NgAutoAnimateDirective, NgIf, TuiLoader, NgFor, TuiSelectModule, ReactiveFormsModule, FormsModule, NgIcon, TranslatePipe],
    templateUrl: './lists.component.html',
    styleUrl: './lists.component.less',
    viewProviders: [provideIcons({ tablerList, tablerTrash, tablerEdit, tablerPlus })]
})
export class ListsComponent {
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    readonly cdn_base = CDN_BASE;
    readonly theme = computed(() => this.auth.theme());
    search:string = "";
    loading:boolean = true;
    lists: any = [];
    volumeLists: any = [];
    seriesLists: any = [];
    showDeleteDialog: boolean = false;
    listToDelete: any = null;
    deletingList: boolean = false;
    showAddDialog: boolean = false;
    addListItem: any = {name: '', type: 'series'};
    addingList: boolean = false;
    showEditDialog: boolean = false;
    editListItem: any = {name: '', type: 'series'};;
    savingEdit: boolean = false;
    listTypes: any = ['series','volume'];

    @ViewChild('addDialog') addDialog:any;
    @ViewChild('editDialog') editDialog:any;
    @ViewChild('deleteDialog') deleteDialog:any;
    constructor(private translate: TranslateService, private title: Title, private router: Router) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.lists')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        this.loadLists();
    }

    // load reading history from api
    loadLists(){
        if(!this.auth.isLoggedIn()){
            this.loading = false;
            return;
        }
        // show loading indicator
        this.loading = true;
    
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;
    
        this.api.request<any>(HttpMethod.GET, `lists?user_lang=${lang}`, {}).subscribe((res:any)=>{
            this.lists = res;
            for(const list of this.lists){
                const user = this.auth.getUser();
                const nsfwMode = this.auth.getUserSetting('nsfw-mode');
                list.show = (!list.nsfw && !list.nsfw18) || (list.nsfw && nsfwMode.value === 'settings.nsfw.show-nsfw') || (list.nsfw18 && nsfwMode.value === 'settings.nsfw.show-nsfw-18' && (user?.age_verified || false));
            }
            console.log(this.lists)
            this.volumeLists = res.filter((l:any)=>l.type === 'volume');
            this.seriesLists = res.filter((l:any)=>l.type === 'series');
            this.loading = false;
        }, (err:any)=>{
            this.loading = false;
        });
    }

    // open add list dialog
    openAddListDialog(){
        this.showAddDialog = true;
    }

    // open delete list dialog
    openDeleteListDialog(list:any){
        this.listToDelete = list.id;
        this.showDeleteDialog = true;
    }

    // open delete list dialog
    openEditListDialog(list:any){
        this.editListItem = {id: list.id, name: list.name, type: list.type};
        this.showEditDialog = true;
    }

    // add list
    addList(){
        // check validity of input
        if(!this.addListItem.name || this.addListItem.name.trim() === ''){
            // TODO translate
            errorAlert(this.alerts, 'Invalid List Name.', undefined, this.translate);
            return;
        }
    
        if(!this.addListItem.type){
            // TODO translate
            errorAlert(this.alerts, 'Invalid List Type.', undefined, this.translate);
            return;
        }
    
        this.addingList = true;

        this.api.request<string>(HttpMethod.POST, `lists/add`, {name: this.addListItem.name, type: this.addListItem.type}, 'text').subscribe(async (res:string)=>{
            const msg = await getTranslation(this.translate, 'add-list-dialog.success');
            successAlert(this.alerts, msg, undefined, this.translate);
            this.showAddDialog = false;
            this.addingList = false;
            this.loadLists();
        }, async (err:any)=>{
            if(err.status === 409){
                const msg = await getTranslation(this.translate, `add-list-dialog.already-exists`);
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else {
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            }
            this.addingList = false;
        });
    }

    // save list edit
    saveListEdit(){
        if(!this.editListItem?.id) return;
        this.savingEdit = true;

        this.api.request<string>(HttpMethod.POST, `lists/edit/${this.editListItem.id}`, {name: this.editListItem.name, type: this.editListItem.type}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, 'edit-list-dialog.success');
            successAlert(this.alerts, msg, undefined, this.translate);
            this.showEditDialog = false;
            this.savingEdit = false;
            this.loadLists();
        }, async(err:any)=>{
            console.log(err)
            if(err.error === "cant-change-list-type"){
                const msg = await getTranslation(this.translate, `edit-list-dialog.error-change-type`)
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else {
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            }
            this.savingEdit = false;
        });
    }

    // delete list
    deleteList(){
        if(!this.listToDelete) return;
        this.deletingList = true;
        this.api.request<string>(HttpMethod.DELETE, `lists/delete/${this.listToDelete}`, {}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, 'add-list-dialog.delete-success');
            successAlert(this.alerts, msg, undefined, this.translate);
            this.showDeleteDialog = false;
            this.deletingList = false;
            this.loadLists();
        }, async(err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.deletingList = false;
        });
    }

    // if backdrop of dialog is clicked close it
    addDialogClick(event:any){
        if (event.target === this.addDialog.nativeElement) {
            this.showAddDialog = false;
        }
    }

    // if backdrop of dialog is clicked close it
    deleteDialogClick(event:any){
        if (event.target === this.deleteDialog.nativeElement) {
            this.showDeleteDialog = false;
        }
    }

    // if backdrop of dialog is clicked close it
    editDialogClick(event:any){
        if (event.target === this.editDialog.nativeElement) {
            this.showEditDialog = false;
        }
    }

    // search update
    searchUpdate(e:any){
        if(e.trim() !== ""){
            this.volumeLists = this.lists.filter((l:any)=>l.type === 'volume' && l.name.toLowerCase().includes(e.trim().toLowerCase()));
            this.seriesLists = this.lists.filter((l:any)=>l.type === 'series' && l.name.toLowerCase().includes(e.trim().toLowerCase()));
        } else {
            this.volumeLists = this.lists.filter((l:any)=>l.type === 'volume');
            this.seriesLists = this.lists.filter((l:any)=>l.type === 'series');
        }
    }

    // language to locale code
    toLocale(lang:string){
        return langToLocale(lang);
    }

    // return time that has passed since given datetime
    agoTime(time:string){
        return ago(time, this.translate.currentLang);
    }
}
