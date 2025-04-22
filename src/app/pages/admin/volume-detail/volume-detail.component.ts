import { Component, HostListener, inject, Injector, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiAlertService, TuiButton, TuiDataList, tuiDateFormatProvider, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { MangaCover } from '../../../manga-cover/manga-cover.component';
import { TuiComboBoxModule, TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CDN_BASE, COVER, errorAlert, getTranslation, LANGS, langToLocale, localeToLang, SCRAPER_BASE, successAlert, VOLUME_BINDING_TYPES } from '../../../../globals';
import { TuiFiles, TuiFilterByInputPipe, tuiItemsHandlersProvider, TuiSwitch, TuiTabs } from '@taiga-ui/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerChevronLeft, tablerChevronRight, tablerMinus, tablerPlus, tablerTrash, tablerUpload, tablerX } from '@ng-icons/tabler-icons';
import { TUI_EDITOR_DEFAULT_EXTENSIONS, TUI_EDITOR_DEFAULT_TOOLS, TUI_EDITOR_EXTENSIONS, TuiEditor } from '@taiga-ui/editor';
import { SideBarService } from '../../../../services/sidebar.service';
import { HttpClient } from '@angular/common/http';
import { matFaceOutline } from '@ng-icons/material-icons/outline';
import { TuiLet, TuiStringHandler } from '@taiga-ui/cdk';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TuiDay } from '@taiga-ui/cdk/date-time';

interface GroupItem {
    name: string;
    s_name: string;
    s_type: string;
};

interface EditionItem {
    name: string;
    language: string;
};

const STRINGIFY_GROUP: TuiStringHandler<GroupItem> = (item: GroupItem) =>
    `${item.name} - ${item.s_name} [${item.s_type}]`;

const STRINGIFY_EDITION: TuiStringHandler<EditionItem> = (item: EditionItem) =>
    `${item.name} - ${item.language}`;

@Component({
    selector: 'app-admin-volume-detail',
    imports: [TranslatePipe,TuiButton,NgIf,NgFor,MangaCover,TuiEditor,TuiInputDateModule,TuiFiles,TuiTabs,TuiComboBoxModule,ScrollingModule,TuiLet,TuiFilterByInputPipe,TuiDataList,TuiTextfield,TuiLoader,NgIcon,TuiTextfieldControllerModule,TuiSelectModule,ReactiveFormsModule,FormsModule,TuiSwitch],
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
        tuiItemsHandlersProvider({stringify: STRINGIFY_GROUP}),
        tuiItemsHandlersProvider({stringify: STRINGIFY_EDITION}),
        tuiDateFormatProvider({mode: 'YMD', separator: '/'})
    ],
    viewProviders: [provideIcons({tablerX,tablerPlus,tablerMinus,matFaceOutline,tablerUpload,tablerTrash,tablerChevronRight,tablerChevronLeft})]
})
export class AdminVolumeDetailComponent {
    private readonly sidebar = inject(SideBarService);
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    readonly cdn_url = CDN_BASE;

    stringifyGroup = STRINGIFY_GROUP;
    stringifyEdition = STRINGIFY_EDITION;

    volume:any = null;
    editVolume:any = null;
    loading:boolean = true;
    availableLanguages = LANGS;
    saving:boolean = false;

    editions:any = [];
    groups:any = [];

    frontBase64:any = null;
    frontImage:any = null;
    backBase64:any = null;
    backImage:any = null;
    spineBase64:any = null;
    spineImage:any = null;
    uploadingImage:boolean = false;
    deletingImage:boolean = false;
    imageHash:string = '';

    volumeBindingTypes:any = VOLUME_BINDING_TYPES;
    availableLangs:any = LANGS;

    showMediaDialog:boolean = false;
    @ViewChild('mediaDialog') mediaDialog:any;
    media:any = [];
    mediaSearch:string = '';

    showScrapeDialog:boolean = false;
    scraping:boolean = false;
    scraperUrl:string = '';
    @ViewChild('scrapeDialog') scrapeDialog:any;

    readonly tools = TUI_EDITOR_DEFAULT_TOOLS;

    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute, private location: Location, private http: HttpClient) { }
    
    // get groups array cast to group item
    get typedGroups(): GroupItem[] {
        return this.groups as GroupItem[];
    }

    // get edition array cast to edition item
    get typedEditions(): EditionItem[] {
        return this.editions as EditionItem[];
    }

    ngOnInit() {
        // set title
        this.title.setTitle(`Edit Volume | MangaDB`);

        const id = this.route.snapshot.paramMap.get('id');

        this.route.paramMap.subscribe(()=>{
            if(!this.volume?.id) return;
            const volId = this.route.snapshot.paramMap.get('id');
            this.addLock(volId);
            this.loadVolume(volId);
        });

        this.addLock(id);
        this.loadVolume(id);
    }

    // load series data
    loadVolume(id:any){
        const prevScrollTop = this.sidebar.scrollTop();
        this.loading = true;
        this.api.request<any>(HttpMethod.GET, `admin-volumes/id/${id}`, {}).subscribe((res:any)=>{
            this.volume = res;
            // set binding type and language
            if(typeof this.volume.type === "string") this.volume.type = this.volumeBindingTypes.find((b:any) => b.key === this.volume.type);
            if(typeof this.volume.language === "string") this.volume.language = this.availableLangs.find((l:any) => l.value === langToLocale(this.volume.language));
            // if the copyright is null, set it to the last copyright in the series
            if(this.volume.copyright == null || this.volume.copyright == "NULL" || this.volume.copyright == "null"){ // eslint-disable-line
                this.volume.copyright = this.volume.lastCopyright;
            }
            // copy volume to editVolume for editing and detecting changes
            this.editVolume = JSON.parse(JSON.stringify(this.volume));
            const dateParts = this.editVolume.release_date.toString().split('-').map((p:string) => parseInt(p));
            this.editVolume.release_date = new TuiDay(dateParts[0],dateParts[1]-1,dateParts[2]);

            this.loadGroups();
            this.loadEditions();

            setTimeout(()=>{
                this.sidebar.setScrollTop(prevScrollTop);
                this.loading = false;
            }, 200);
        });
    }

    // load groups
    loadGroups(){
        this.api.request<any>(HttpMethod.POST, `admin-volumes/names`, {order: 'series-title-asc'}).subscribe((res:any)=>{
            this.groups = res.groups;
            this.editVolume.group = this.groups.find((g:any)=>g.id === this.volume.group_id);
        });
    }

    // load editions
    loadEditions(){
        this.api.request<any>(HttpMethod.GET, `series/editions/${this.volume.series_id}`, {}).subscribe((res:any)=>{
            this.editions = res;
            this.editVolume.edition = this.editions.find((e:any)=>e.id === this.volume.edition_id) || null;
            this.volume.edition = this.editVolume.edition;
        });
    }

    // save changes to database
    saveEdit(){
        if(!this.editVolume || this.saving === true || !this.editVolume.language?.value) return;
        this.saving = true;

        const added_links = []; const removed_links = [];
        for(const link of this.editVolume.links) if(link.id === -1) added_links.push(link);
        for(const link of this.volume.links) if(!this.editVolume.links.find((l:any) => l.id == link.id)) removed_links.push(link);

        const added_media = []; const removed_media = [];
        for(const med of this.editVolume.media) if(!this.volume.media.find((l:any) => l.id == med.id)) added_media.push(med);
        for(const med of this.volume.media) if(!this.editVolume.media.find((l:any) => l.id == med.id)) removed_media.push(med);

        if(this.editVolume.description){
            this.editVolume.description = this.editVolume.description.replaceAll("<div>", "<br>");
            this.editVolume.description = this.editVolume.description.replaceAll("</div>", "");
        }

        this.editVolume.release_date = this.editVolume.release_date.toString().split('.').reverse().join('-');

        this.api.request<string>(HttpMethod.POST, `admin-volumes/edit-volume/${this.editVolume.id}`, {
            name: this.editVolume.name,
            copyright: this.editVolume.copyright,
            description: this.editVolume.description,
            nsfw: this.editVolume.nsfw,
            nsfw18: this.editVolume.nsfw18,
            special: this.editVolume.special,
            three_d: this.editVolume.three_d,
            edition: this.editVolume?.edition ? this.editVolume.edition.id : null,
            extras: this.editVolume.extras,
            file_size: this.editVolume.file_size,
            group: this.editVolume.group.id,
            asin: this.editVolume.asin,
            isbn10: this.editVolume.isbn10,
            isbn13: this.editVolume.isbn13,
            language: localeToLang(this.editVolume.language.value),
            measures: this.editVolume.measures,
            pages: this.editVolume.pages,
            rating: this.editVolume.rating,
            release_date: this.editVolume.release_date,
            special_name: this.editVolume.special_name,
            type: this.editVolume.type.key,
            added_links, removed_links,
            added_media, removed_media
        }, 'text').subscribe(async (res:any)=>{
            this.saving = false;
            const msg = await getTranslation(this.translate, `volume.save-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadVolume(this.volume.id);
        }, (err:any)=>{
            this.saving = false;
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }

    // add edit lock
    addLock(id:any){
        this.api.request<string>(HttpMethod.POST, `admin/lock`,{route:'volume',id:id},'text').subscribe((res:any)=>{},(err)=>{
            this.location.back();
        });
    }

    // remove edit lock
    removeLock(redirect:boolean = true){
        this.api.request<string>(HttpMethod.DELETE, `admin/remove-lock`, {route:'volume',id:this.volume.id},'text').subscribe((res:any)=>{
            if(redirect) this.location.back();
        });
    }

    // redirect to next volume (if there is one)
    nextVolume(){
        if(this.volume.next){
            this.removeLock(false);
            this.router.navigate(['admin', 'volumes', this.volume.next], { replaceUrl: true });
        }
    }
    
    // redirect to prev volume (if there is one)
    prevVolume(){
        if(this.volume.prev){
            this.removeLock(false);
            this.router.navigate(['admin', 'volumes', this.volume.prev], { replaceUrl: true });
        }
    }

    // convert language to locale
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

        // left arrow
        if(e.keyCode === 39 && e.ctrlKey){
            this.nextVolume();
        }

        // right arrow
        if(e.keyCode === 37 && e.ctrlKey){
            this.prevVolume();
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

    // set founding date to unknown
    setDateUnknown(){
        const dateParts = '1001-01-01'.toString().split('-').map((p:string) => parseInt(p));
        this.editVolume.release_date = new TuiDay(dateParts[0],dateParts[1]-1,dateParts[2])
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
                    this.updateImageHash();
                    this.loadVolume(this.volume.id);
                    const msg = await getTranslation(this.translate, `admin.upload-success`);
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
                    this.updateImageHash();
                    this.loadVolume(this.volume.id);
                    const msg = await getTranslation(this.translate, `admin.upload-success`);
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
                    this.updateImageHash();
                    this.loadVolume(this.volume.id);
                    const msg = await getTranslation(this.translate, `admin.upload-success`);
                    successAlert(this.alerts, msg, undefined, this.translate);
                }, (err:any)=>{
                    this.uploadingImage = false;
                    errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
                });
                break;
        }
    }

    // if backdrop of dialog is clicked close it
    mediaDialogClick(e:any){
        if (e.target === this.mediaDialog.nativeElement) {
            this.showMediaDialog = false;
        }
    }

    // open media dialog
    openMediaDialog(){
        this.showMediaDialog = true;
        this.media = [];
        this.mediaSearch = '';
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
            this.updateImageHash();
            this.loadVolume(this.volume.id);
            const msg = await getTranslation(this.translate, `volume.image-delete-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
        }, (err:any)=>{
            this.deletingImage = false;
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }

    // update image hash if cover was changed (to make sure it wont show the cached version)
    updateImageHash(){
        this.imageHash = (Math.random() + 1).toString(36).slice(2);
    }

    // remove link
    removeLink(link:any){
        this.editVolume.links = this.editVolume.links.filter((l:any) => !(l.url === link.url && l.id === link.id));
    }

    // add link
    addLink(){
        // TODO Translate
        const link = prompt("URL:");
        if(!link || link?.trim() == "") return;
        this.editVolume.links.push({id: -1, url: link});
    }

    // add media item
    addMedia(media:any){
        this.editVolume.media.push(media);
    }

    // remove media item
    removeMedia(e:any,media:any){
        e.preventDefault();
        this.editVolume.media = this.editVolume.media.filter((m:any) => m.id !== media.id);
    }

    // keydown event handler for scraping
    mediaSearchKeyDown(e:any){
        if(e.key == 'Enter'){
            this.loadMedia();
        }
    }

    // load media
    loadMedia(){
        this.api.request<any>(HttpMethod.POST, `media`, {order:'added-desc',search: this.mediaSearch.trim()}).subscribe((res:any)=>{
            this.media = res.media;
            for(const item of this.media){
                if(item.tags.includes(',')) item.tags = item.tags.split(',');
                else item.tags = [item.tags];
            }
        });
    }

    // scrape url
    scrape(){
        this.scraping = true;

        this.http.post(`${SCRAPER_BASE}/getAmazonData`, {link: this.scraperUrl}).subscribe((res:any)=>{
            const data = res;
            // exract number out of string
            const age = data.age === undefined ? undefined : parseInt(data.age.match(/\d+/)[0]);
            let measures = ""; // 12.6 x 1.7 x 18.5 cm
            // split and remove cm from measures if available
            if(data.measures != undefined){
                if(data.measures.includes('inches')){
                    // convert to cm
                    const parts = data.measures.replace('inches','').split('x');
                    let count = 0;
                    for(const part of parts){
                        if(count === 0){
                            measures += (parseFloat(part) * 2.54).toFixed(2);
                        } else {
                            measures += ' x ' + (parseFloat(part) * 2.54).toFixed(2);
                        }
                        count++;
                    }
                }
            }
            const measureParts = data.measures === undefined ? [] : data.measures.replace('cm','').split('x');
            let count = 0;
            for(const part of measureParts){
                if(count === 0){
                    const numberParts = part.trim().split('.');
                    // check if number has a decimal point or not
                    if(numberParts.length === 1){
                        // if number is greater than 9 padEnd with 0
                        // else add 1 zero in front and pad end with 0
                        let number = parseInt(numberParts[0]) > 9
                                    ? numberParts[0].padEnd(4,'0') 
                                    : numberParts[0].padStart(2,'0').padEnd(4,'0');
                        if(!number.includes('.')){
                            // add decimal point in between the 4 digits
                            number = number.slice(0,2) + '.' + number.slice(2,4);
                        }
                        measures += number;
                    } else {
                        // pad numbers
                        const number = numberParts[0].padStart(2,'0') + '.' + numberParts[1].padEnd(2,'0');
                        measures += number;
                    }
                }
                else {
                    const numberParts = part.trim().split('.');
                    // check if number has a decimal point or not
                    if(numberParts.length === 1){
                        // if number is greater than 9 padEnd with 0
                        // else add 1 zero in front and pad end with 0
                        let number = parseInt(numberParts[0]) > 9
                                    ? numberParts[0].padEnd(4,'0') 
                                    : numberParts[0].padStart(2,'0').padEnd(4,'0');
                        if(!number.includes('.')){
                            // add decimal point in between the 4 digits
                            number = number.slice(0,2) + '.' + number.slice(2,4);
                        }
                        measures += ' x ' + number;
                    } else {
                        // pad numbers
                        const number = numberParts[0].padStart(2,'0') + '.' + numberParts[1].padEnd(2,'0');
                        measures += ' x ' + number;
                    }
                }
                count++;
            }

            // get locale and language of amazon data
            let locale = 'de';
            let language = 'German';

            if(data.link.includes("amazon.es")){
                locale = 'es';
                language = 'Spanish';
            } else if(data.link.includes("amazon.fr")){
                locale = 'fr';
                language = 'French';
            } else if(data.link.includes("amazon.it")){
                locale = 'it';
                language = 'Italian';
            } else if(data.link.includes("amazon.co.jp")){
                language = 'Japanese';
            } else if(data.link.includes("amazon.com")){
                language = 'English';
            }

            if(this.editVolume.links.filter((l:any) => l.url == data.link).length === 0) this.editVolume.links.push({id: -1,url: data.link}); // eslint-disable-line
            if(data.measures) this.editVolume.measures = measures;
            if(age) this.editVolume.rating = age;
            if(data.description) this.editVolume.description = data.description.replace(/<\/?p[^>]*>/g, "");
            if(data.isbn10) this.editVolume.isbn10 = data.isbn10;
            if(data.isbn13) this.editVolume.isbn13 = data.isbn13;
            if(data.pages) this.editVolume.pages = data.pages;
            this.editVolume.language = this.availableLangs.find((l:any) => l.value == langToLocale(language)); // eslint-disable-line
            this.scraping = false;
        }, (err:any)=>{
            this.scraping = false;
        });
    }
}
