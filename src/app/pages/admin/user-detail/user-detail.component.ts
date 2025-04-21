import { Component, computed, HostListener, inject, Injector, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiAlertService, TuiButton, TuiDataList, tuiDateFormatProvider, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { TuiComboBoxModule, TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CDN_BASE, CONTRIBUTOR_GENDERS, CONTRIBUTOR_RELATION_TYPES, CONTRIBUTOR_TYPES, errorAlert, getTranslation, LANGS, langToLocale, localeToLang, PUBLISHER_RELATION_TYPES, successAlert } from '../../../../globals';
import { TuiFiles, TuiFilterByInputPipe, tuiItemsHandlersProvider, TuiSwitch, TuiTabs } from '@taiga-ui/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerCashRegister, tablerChevronLeft, tablerChevronRight, tablerMinus, tablerPlus, tablerTrash, tablerUpload, tablerX } from '@ng-icons/tabler-icons';
import { TUI_EDITOR_DEFAULT_EXTENSIONS, TUI_EDITOR_DEFAULT_TOOLS, TUI_EDITOR_EXTENSIONS, TuiEditor } from '@taiga-ui/editor';
import { SideBarService } from '../../../../services/sidebar.service';
import { HttpClient } from '@angular/common/http';
import { matFaceOutline } from '@ng-icons/material-icons/outline';
import { TuiLet, TuiStringHandler } from '@taiga-ui/cdk';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TuiDay } from '@taiga-ui/cdk/date-time';
import { AuthService } from '../../../../services/auth.service';

@Component({
    selector: 'app-admin-user-detail',
    imports: [TranslatePipe,TuiButton,NgIf,TuiSwitch,TuiInputDateModule,TuiFiles,TuiTabs,TuiComboBoxModule,ScrollingModule,TuiDataList,TuiTextfield,TuiLoader,NgIcon,TuiTextfieldControllerModule,TuiSelectModule,ReactiveFormsModule,FormsModule],
    templateUrl: './user-detail.component.html',
    styleUrl: './user-detail.component.less',
    providers: [
        {
          provide: TUI_EDITOR_EXTENSIONS,
          deps: [Injector],
          useFactory: (injector: Injector) => [
            ...TUI_EDITOR_DEFAULT_EXTENSIONS,
            import('@taiga-ui/editor').then(({setup}) => setup({injector})),
          ],
        },
        tuiDateFormatProvider({mode: 'YMD', separator: '/'})
    ],
    viewProviders: [provideIcons({tablerX,tablerPlus,tablerMinus,matFaceOutline,tablerUpload,tablerTrash,tablerChevronRight,tablerChevronLeft})]
})
export class AdminUserDetailComponent {
    private readonly sidebar = inject(SideBarService);
    private readonly alerts = inject(TuiAlertService);
    private readonly auth = inject(AuthService);
    private readonly api = inject(APIService);
    readonly cdn_url = CDN_BASE;

    currentUser:any = computed(()=>this.auth.getUser());
    roles:any = ["Member", "Supporter", "Editor", "Admin", "Banned"];
    user:any = null;
    editUser:any = null;
    loading:boolean = true;
    availableLanguages = LANGS;
    saving:boolean = false;

    base64:any = null;
    image:any = null;
    imageHash:string = '';
    uploadingImage:boolean = false;
    deletingImage:boolean = false;

    readonly tools = TUI_EDITOR_DEFAULT_TOOLS;

    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute, private location: Location, private http: HttpClient) { }

    ngOnInit() {
        // set title
        this.title.setTitle(`Edit User | MangaDB`);

        const id = this.route.snapshot.paramMap.get('id');

        this.route.paramMap.subscribe(()=>{
            if(!this.user?.id) return;
            const uId = this.route.snapshot.paramMap.get('id');
            this.addLock(uId);
            this.loadUser(uId);
        });

        console.log(this.currentUser)

        this.addLock(id);
        this.loadUser(id);
    }

    // load use data
    loadUser(id:any){
        const prevScrollTop = this.sidebar.scrollTop();
        this.loading = true;
        this.api.request<any>(HttpMethod.GET, `admin-users/id/${id}`, {}).subscribe((res:any)=>{
            this.user = res;
            this.editUser = JSON.parse(JSON.stringify(this.user));
            console.log(res)

            setTimeout(()=>{
                this.sidebar.setScrollTop(prevScrollTop);
                this.loading = false;
            }, 200);
        });
    }

    // save changes to database
    saveEdit(){
        if(!this.editUser || this.saving === true) return;
        this.saving = true;

        this.api.request<string>(HttpMethod.POST, `admin-users/edit/${this.editUser.id}`, {
            username: this.editUser.username,
            age_verified: this.editUser.age_verified,
            role: this.editUser.role
        }, 'text').subscribe(async (res:any)=>{
            this.saving = false;
            const msg = await getTranslation(this.translate, `user.save-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadUser(this.user.id);
        }, (err:any)=>{
            this.saving = false;
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }

    // add edit lock
    addLock(id:any){
        this.api.request<string>(HttpMethod.POST, `admin/lock`,{route:'user',id:id},'text').subscribe((res:any)=>{},(err)=>{
            this.location.back();
        });
    }

    // remove edit lock
    removeLock(redirect:boolean = true){
        this.api.request<string>(HttpMethod.DELETE, `admin/remove-lock`, {route:'user',id:this.user.id},'text').subscribe((res:any)=>{
            if(redirect) this.location.back();
        });
    }

    // convert lang to locale
    toLocale(lang:string){
        return langToLocale(lang);
    }

    @HostListener('window:keydown', ['$event'])
    keyDown(e:KeyboardEvent){
        // save with ctrl + s
        if(e.ctrlKey && e.key === 's'){
            e.preventDefault();
            this.saveEdit();
        }
    }

    // read image when file changes (and store base64)
    imageUpdate(e:any,type:string){
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
    imageRemoved(e:any,type:string){
        this.image = null;
        this.base64 = null;
    }

    // upload image to database for given cover type (front,back,spine)
    async uploadImage(){
        this.uploadingImage = true;
        if(!this.image){
            const msg = await getTranslation(this.translate, `volume.no-image-upload`);
            errorAlert(this.alerts, msg, undefined, this.translate);
            this.uploadingImage = false;
            return;
        }
        this.api.request<string>(HttpMethod.POST, `admin-users/update-image/${this.user.id}`, {image: this.base64}, 'text').subscribe(async(res:any)=>{
            this.uploadingImage = false;
            this.image = null;
            this.base64 = null;
            this.updateImageHash();
            this.loadUser(this.user.id);
            const msg = await getTranslation(this.translate, `admin.upload-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
        }, (err:any)=>{
            this.uploadingImage = false;
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }

    // delete cover of given type
    async deleteImage(){
        this.deletingImage = true;
        this.api.request<string>(HttpMethod.DELETE, `admin-users/delete-image/${this.user.id}`, {}, 'text').subscribe(async(res:any)=>{
            this.deletingImage = false;
            this.updateImageHash();
            this.loadUser(this.user.id);
            const msg = await getTranslation(this.translate, `volume.image-delete-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
        }, (err:any)=>{
            this.deletingImage = false;
        });
    }

    // update image hash if cover was changed (to make sure it wont show the cached version)
    updateImageHash(){
        this.imageHash = (Math.random() + 1).toString(36).slice(2);
    }

    logoutUser(){
        this.api.request<string>(HttpMethod.POST, `admin-users/logout/${this.user.id}`, {}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `user.logout-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadUser(this.user.id);
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }
}
