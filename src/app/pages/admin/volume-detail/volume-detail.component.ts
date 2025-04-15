import { Component, HostListener, inject, Injector, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiAlertService, TuiButton, TuiDataList, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { MangaCover } from '../../../manga-cover/manga-cover.component';
import { TuiComboBoxModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CDN_BASE, CONTRIBUTOR_TYPES, COVER, errorAlert, getOriginByLang, getTranslation, LANGS, langToLocale, localeToLang, SCRAPER_BASE, SERIES_PUBLICATION_STATUSES, SERIES_RELATION_TYPES, SERIES_TYPES, successAlert } from '../../../../globals';
import { TuiCheckbox, TuiFiles, TuiFilterByInputPipe, TuiInputFiles, tuiItemsHandlersProvider, TuiSwitch, TuiTabs } from '@taiga-ui/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerMinus, tablerPlus, tablerTrash, tablerUpload, tablerX } from '@ng-icons/tabler-icons';
import { NgAutoAnimateDirective } from 'ng-auto-animate';
import { TUI_EDITOR_DEFAULT_EXTENSIONS, TUI_EDITOR_DEFAULT_TOOLS, TUI_EDITOR_EXTENSIONS, TuiEditor } from '@taiga-ui/editor';
import { SideBarService } from '../../../../services/sidebar.service';
import { HttpClient } from '@angular/common/http';
import { matFaceOutline } from '@ng-icons/material-icons/outline';
import { TuiLet, TuiStringHandler } from '@taiga-ui/cdk';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-admin-volume-detail',
    imports: [TranslatePipe,TuiButton,NgIf,NgFor,MangaCover,TuiEditor,TuiFiles,TuiTabs,TuiComboBoxModule,ScrollingModule,TuiLet,TuiFilterByInputPipe,TuiDataList,TuiTextfield,TuiLoader,NgIcon,TuiTextfieldControllerModule,TuiSelectModule,ReactiveFormsModule,FormsModule,TuiSwitch],
    templateUrl: './volume-detail.component.html',
    styleUrl: './volume-detail.component.less',
    providers: [
        {
          provide: TUI_EDITOR_EXTENSIONS,
          deps: [Injector],
          useFactory: (injector: Injector) => [
            ...TUI_EDITOR_DEFAULT_EXTENSIONS,
            import('@taiga-ui/editor').then(({setup}) => setup({injector})),
          ],
        },
    ],
    viewProviders: [provideIcons({tablerX,tablerPlus,tablerMinus,matFaceOutline,tablerUpload,tablerTrash})]
})
export class AdminVolumeDetailComponent {
    private readonly sidebar = inject(SideBarService);
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    readonly cdn_url = CDN_BASE;

    volume:any = null;
    editVolume:any = null;
    loading:boolean = true;
    availableLanguages = LANGS;
    saving:boolean = false;

    frontBase64:any = null;
    frontImage:any = null;
    backBase64:any = null;
    backImage:any = null;
    spineBase64:any = null;
    spineImage:any = null;
    uploadingImage:boolean = false;
    deletingImage:boolean = false;

    readonly tools = TUI_EDITOR_DEFAULT_TOOLS;

    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute, private location: Location, private http: HttpClient) { }
    
    ngOnInit() {
        // set title
        this.title.setTitle(`Edit Volume | MangaDB`);

        const id = this.route.snapshot.paramMap.get('id');

        this.addLock(id);
        this.loadVolume(id);
    }

    // load series data
    loadVolume(id:any){
        const prevScrollTop = this.sidebar.scrollTop();
        this.loading = true;
        this.api.request<any>(HttpMethod.GET, `admin-volumes/id/${id}`, {}).subscribe((res:any)=>{
            this.volume = res;
            console.log(this.volume)

            setTimeout(()=>{
                this.sidebar.setScrollTop(prevScrollTop);
                this.loading = false;
            }, 200);
        });
    }

    // save changes to database
    saveEdit(){
        if(!this.editVolume || this.saving === true) return;
        this.saving = true;
    }

    addLock(id:any){
        this.api.request<string>(HttpMethod.POST, `admin/lock`,{route:'volume',id:id},'text').subscribe((res:any)=>{},(err)=>{
            this.location.back();
        });
    }

    removeLock(){
        this.api.request<string>(HttpMethod.DELETE, `admin/remove-lock`, {route:'volume',id:this.volume.id},'text').subscribe((res:any)=>{
            this.location.back();
        });
    }

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

        // show scraper with ctrl + k
        if(e.ctrlKey && e.key === 'k'){
            e.preventDefault();
            //this.openScrapeDialog();
        }
    }

    // read image when file changes (and store base64)
    imageUpdate(e:any,type:string){
        const file = e;

        if (file) {
            const reader = new FileReader();

            reader.onload = (event) => {
                switch(type){
                    case COVER.FRONT:
                        this.frontBase64 = event.target?.result;
                        break;
                    case COVER.BACK:
                        this.backBase64 = event.target?.result;
                        break;
                    case COVER.SPINE:
                        this.spineBase64 = event.target?.result;
                        break;
                }
            }

            reader.readAsDataURL(file);
        }
    }

    imageRejected(e:any,type:string){
        console.log(e)
    }

    // reset image when image is removed
    imageRemoved(e:any,type:string){
        switch(type){
            case COVER.FRONT:
                this.frontImage = null;
                this.frontBase64 = null;
                break;
            case COVER.SPINE:
                this.spineImage = null;
                this.spineBase64 = null;
                break;
            case COVER.BACK:
                this.backImage = null;
                this.backBase64 = null;
                break;
        }
    }

    // upload image to database for given cover type (front,back,spine)
    async uploadImage(type:string){
        this.uploadingImage = true;
        switch(type){
            case COVER.FRONT:
                if(!this.frontImage){
                    const msg = await getTranslation(this.translate, `volume.no-image-upload`);
                    errorAlert(this.alerts, msg, undefined, this.translate);
                    this.uploadingImage = false;
                    return;
                }
    
                this.api.request<string>(HttpMethod.POST, `admin-volumes/update-image/${this.volume.id}/front`, {image: this.frontBase64}, 'text').subscribe(async (res:any)=>{
                    this.uploadingImage = false;
                    this.frontImage = null;
                    this.frontBase64 = null;
                    this.loadVolume(this.volume.id);
                    const msg = await getTranslation(this.translate, `volume.upload-success`);
                    successAlert(this.alerts, msg, undefined, this.translate);
                }, (err:any)=>{
                    this.uploadingImage = false;
                    errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
                });
                break;
            case COVER.BACK:
                if(!this.backImage){
                    const msg = await getTranslation(this.translate, `volume.no-image-upload`);
                    errorAlert(this.alerts, msg, undefined, this.translate);
                    this.uploadingImage = false;
                    return;
                }
    
                this.api.request<string>(HttpMethod.POST, `admin-volumes/update-image/${this.volume.id}/back`, {image: this.backBase64}, 'text').subscribe(async (res:any)=>{
                    this.uploadingImage = false;
                    this.backImage = null;
                    this.backBase64 = null;
                    this.loadVolume(this.volume.id);
                    const msg = await getTranslation(this.translate, `volume.upload-success`);
                    successAlert(this.alerts, msg, undefined, this.translate);
                }, (err:any)=>{
                    this.uploadingImage = false;
                    errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
                });
                break;
            case COVER.SPINE:
                if(!this.spineImage){
                    const msg = await getTranslation(this.translate, `volume.no-image-upload`);
                    errorAlert(this.alerts, msg, undefined, this.translate);
                    this.uploadingImage = false;
                    return;
                }
    
                this.api.request<string>(HttpMethod.POST, `admin-volumes/update-image/${this.volume.id}/spine`, {image: this.spineBase64}, 'text').subscribe(async (res:any)=>{
                    this.uploadingImage = false;
                    this.spineImage = null;
                    this.spineBase64 = null;
                    this.loadVolume(this.volume.id);
                    const msg = await getTranslation(this.translate, `volume.upload-success`);
                    successAlert(this.alerts, msg, undefined, this.translate);
                }, (err:any)=>{
                    this.uploadingImage = false;
                    errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
                });
                break;
        }
    }

    // delete cover of given type
    async deleteImage(type:string){
        this.deletingImage = true;
        this.api.request<string>(HttpMethod.DELETE, `admin-volumes/delete-image/${this.volume.id}/${type}`, {}, 'text').subscribe(async (res:any)=>{
            this.deletingImage = false;
            switch(type){
                case COVER.FRONT:
                    this.frontImage = null;
                    this.frontBase64 = null;
                    break;
                case COVER.SPINE:
                    this.spineImage = null;
                    this.spineBase64 = null;
                    break;
                case COVER.BACK:
                    this.backImage = null;
                    this.backBase64 = null;
                    break;
            }
            this.loadVolume(this.volume.id);
            const msg = await getTranslation(this.translate, `volume.image-delete-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
        }, (err:any)=>{
            this.deletingImage = false;
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }
}
