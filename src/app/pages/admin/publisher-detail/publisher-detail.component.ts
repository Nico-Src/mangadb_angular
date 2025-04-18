import { Component, HostListener, inject, Injector, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiAlertService, TuiButton, TuiDataList, tuiDateFormatProvider, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { MangaCover } from '../../../manga-cover/manga-cover.component';
import { TuiComboBoxModule, TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CDN_BASE, CONTRIBUTOR_TYPES, COVER, errorAlert, getOriginByLang, getTranslation, LANGS, langToLocale, localeToLang, PUBLISHER_RELATION_TYPES, SCRAPER_BASE, SERIES_PUBLICATION_STATUSES, SERIES_RELATION_TYPES, SERIES_TYPES, successAlert, UNKNOWN_DATE, VOLUME_BINDING_TYPES } from '../../../../globals';
import { TuiCheckbox, TuiFiles, TuiFilterByInputPipe, TuiInputFiles, tuiItemsHandlersProvider, TuiSwitch, TuiTabs } from '@taiga-ui/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerChevronLeft, tablerChevronRight, tablerMinus, tablerPlus, tablerTrash, tablerUpload, tablerX } from '@ng-icons/tabler-icons';
import { NgAutoAnimateDirective } from 'ng-auto-animate';
import { TUI_EDITOR_DEFAULT_EXTENSIONS, TUI_EDITOR_DEFAULT_TOOLS, TUI_EDITOR_EXTENSIONS, TuiEditor } from '@taiga-ui/editor';
import { SideBarService } from '../../../../services/sidebar.service';
import { HttpClient } from '@angular/common/http';
import { matFaceOutline } from '@ng-icons/material-icons/outline';
import { TuiLet, TuiStringHandler } from '@taiga-ui/cdk';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TuiDay } from '@taiga-ui/cdk/date-time';

@Component({
    selector: 'app-admin-publisher-detail',
    imports: [TranslatePipe,TuiButton,NgIf,NgFor,MangaCover,TuiEditor,TuiInputDateModule,TuiFiles,TuiTabs,TuiComboBoxModule,ScrollingModule,TuiLet,TuiFilterByInputPipe,TuiDataList,TuiTextfield,TuiLoader,NgIcon,TuiTextfieldControllerModule,TuiSelectModule,ReactiveFormsModule,FormsModule,TuiSwitch],
    templateUrl: './publisher-detail.component.html',
    styleUrl: './publisher-detail.component.less',
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
export class AdminPublisherDetailComponent {
    private readonly sidebar = inject(SideBarService);
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    readonly cdn_url = CDN_BASE;

    min_day = new TuiDay(1,0,1);

    publisher:any = null;
    editPublisher:any = null;
    loading:boolean = true;
    availableLanguages = LANGS;
    saving:boolean = false;

    base64:any = null;
    image:any = null;
    imageHash:string = '';
    uploadingImage:boolean = false;
    deletingImage:boolean = false;

    showScrapeDialog:boolean = false;
    scraping:boolean = false;
    scraperUrl:string = '';
    @ViewChild('scrapeDialog') scrapeDialog:any;

    publisherRelationTypes:any = PUBLISHER_RELATION_TYPES;

    readonly tools = TUI_EDITOR_DEFAULT_TOOLS;

    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute, private location: Location, private http: HttpClient) { }

    ngOnInit() {
        // set title
        this.title.setTitle(`Edit Publisher | MangaDB`);

        const id = this.route.snapshot.paramMap.get('id');

        this.route.paramMap.subscribe(()=>{
            if(!this.publisher?.id) return;
            const pubId = this.route.snapshot.paramMap.get('id');
            this.addLock(pubId);
            this.loadPublisher(pubId);
        });

        this.addLock(id);
        this.loadPublisher(id);
    }

    // load series data
    loadPublisher(id:any){
        const prevScrollTop = this.sidebar.scrollTop();
        this.loading = true;
        this.api.request<any>(HttpMethod.GET, `admin-publishers/id/${id}`, {}).subscribe((res:any)=>{
            this.publisher = res;
            for(const relation of this.publisher.relations){
                if(typeof relation.relation_type === "string") relation.relation_type = this.publisherRelationTypes.find((t:any) => t.key === relation.relation_type);
            }
            this.editPublisher = JSON.parse(JSON.stringify(this.publisher));
            const dateParts = this.editPublisher.founding_date.toString().split('-').map((p:string) => parseInt(p));
            this.editPublisher.founding_date = new TuiDay(dateParts[0],dateParts[1]-1,dateParts[2]);
            console.log(this.publisher)

            setTimeout(()=>{
                this.sidebar.setScrollTop(prevScrollTop);
                this.loading = false;
            }, 200);
        });
    }

    // save changes to database
    saveEdit(){
        if(!this.editPublisher || this.saving === true) return;
        this.saving = true;
        this.editPublisher.founding_date = this.editPublisher.founding_date.toString().split('.').reverse().join('-');
        console.log(this.editPublisher)
        this.api.request<string>(HttpMethod.POST, `admin-publishers/edit/${this.editPublisher.id}`, {
            name: this.editPublisher.name,
            short_name: this.editPublisher.short_name,
            website: this.editPublisher.website || '',
            image_source: this.editPublisher.image_source,
            headquarter: this.editPublisher.headquarter,
            founding_date: this.editPublisher.founding_date,
            added_aliases: [], removed_aliases: [],
            added_descriptions: [], removed_descriptions: [], modified_descriptions: [],
            added_relations: [], removed_relations: [], modified_relations: []
        }, 'text').subscribe(async (res:any)=>{
            this.saving = false;
            const msg = await getTranslation(this.translate, `volume.save-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadPublisher(this.publisher.id);
        }, (err:any)=>{
            this.saving = false;
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }

    addLock(id:any){
        this.api.request<string>(HttpMethod.POST, `admin/lock`,{route:'publisher',id:id},'text').subscribe((res:any)=>{},(err)=>{
            this.location.back();
        });
    }

    removeLock(redirect:boolean = true){
        this.api.request<string>(HttpMethod.DELETE, `admin/remove-lock`, {route:'publisher',id:this.publisher.id},'text').subscribe((res:any)=>{
            if(redirect) this.location.back();
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
            this.openScrapeDialog();
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

    setDateUnknown(){
        const dateParts = '1001-01-01'.toString().split('-').map((p:string) => parseInt(p));
        this.editPublisher.founding_date = new TuiDay(dateParts[0],dateParts[1]-1,dateParts[2])
    }

    imageRejected(e:any,type:string){
        console.log(e)
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
        this.api.request<string>(HttpMethod.POST, `admin-publishers/update-image/${this.publisher.id}`, {image: this.base64}, 'text').subscribe(async(res:any)=>{
            this.uploadingImage = false;
            this.image = null;
            this.base64 = null;
            this.updateImageHash();
            this.loadPublisher(this.publisher.id);
            const msg = await getTranslation(this.translate, `volume.upload-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
        }, (err:any)=>{
            this.uploadingImage = false;
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }

    // if backdrop of dialog is clicked close it
    scrapeDialogClick(e:any){
        if (e.target === this.scrapeDialog.nativeElement) {
            this.showScrapeDialog = false;
        }
    }

    // open scrape dialog
    openScrapeDialog(){
        this.showScrapeDialog = true;
    }

    // keydown event handler for scraping
    scrapeSearchKeyDown(e:any){
        if(e.key == 'Enter' && this.scraperUrl.length >= 10){
            this.scrape();
        }
    }

    // delete cover of given type
    async deleteImage(){
        this.deletingImage = true;
        this.api.request<string>(HttpMethod.DELETE, `admin-publishers/delete-image/${this.publisher.id}`, {}, 'text').subscribe(async(res:any)=>{
            this.deletingImage = false;
            this.updateImageHash();
            this.loadPublisher(this.publisher.id);
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

    scrape(){
        this.scraping = true;

        this.http.post(`${SCRAPER_BASE}/getAmazonData`, {link: this.scraperUrl}).subscribe((res:any)=>{
            const data = res;
            
            this.scraping = false;
        }, (err:any)=>{
            this.scraping = false;
        });
    }
}
