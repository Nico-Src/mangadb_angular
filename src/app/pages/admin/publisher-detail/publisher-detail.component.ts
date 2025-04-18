import { Component, HostListener, inject, Injector, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiAlertService, TuiButton, TuiDataList, tuiDateFormatProvider, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { TuiComboBoxModule, TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CDN_BASE, errorAlert, getTranslation, LANGS, langToLocale, localeToLang, PUBLISHER_RELATION_TYPES, successAlert } from '../../../../globals';
import { TuiFiles, TuiFilterByInputPipe, tuiItemsHandlersProvider, TuiTabs } from '@taiga-ui/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerChevronLeft, tablerChevronRight, tablerMinus, tablerPlus, tablerTrash, tablerUpload, tablerX } from '@ng-icons/tabler-icons';
import { TUI_EDITOR_DEFAULT_EXTENSIONS, TUI_EDITOR_DEFAULT_TOOLS, TUI_EDITOR_EXTENSIONS, TuiEditor } from '@taiga-ui/editor';
import { SideBarService } from '../../../../services/sidebar.service';
import { HttpClient } from '@angular/common/http';
import { matFaceOutline } from '@ng-icons/material-icons/outline';
import { TuiLet, TuiStringHandler } from '@taiga-ui/cdk';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TuiDay } from '@taiga-ui/cdk/date-time';

interface PublisherItem {
    name: string;
};

const STRINGIFY_PUBLISHER: TuiStringHandler<PublisherItem> = (item: PublisherItem) =>
    `${item.name}`;

@Component({
    selector: 'app-admin-publisher-detail',
    imports: [TranslatePipe,TuiButton,NgIf,NgFor,TuiEditor,TuiFilterByInputPipe,TuiLet,TuiInputDateModule,TuiFiles,TuiTabs,TuiComboBoxModule,ScrollingModule,TuiDataList,TuiTextfield,TuiLoader,NgIcon,TuiTextfieldControllerModule,TuiSelectModule,ReactiveFormsModule,FormsModule],
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
        tuiItemsHandlersProvider({stringify: STRINGIFY_PUBLISHER}),
        tuiDateFormatProvider({mode: 'YMD', separator: '/'})
    ],
    viewProviders: [provideIcons({tablerX,tablerPlus,tablerMinus,matFaceOutline,tablerUpload,tablerTrash,tablerChevronRight,tablerChevronLeft})]
})
export class AdminPublisherDetailComponent {
    private readonly sidebar = inject(SideBarService);
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    readonly cdn_url = CDN_BASE;

    stringifyPublisher = STRINGIFY_PUBLISHER;

    min_day = new TuiDay(1,0,1);

    publisher:any = null;
    publishers:any = [];
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

    showRelationDialog:boolean = false;
    addRelationItem:any = null;
    @ViewChild('relationDialog') relationDialog:any;
    publisherRelationTypes:any = PUBLISHER_RELATION_TYPES;

    descriptionTabIndex:number = 0;
    selectedDescription:any = null;
    showDescriptionDialog:boolean = false;
    addDescriptionItem:any = {description: '',language: this.availableLanguages[0],source: ''};
    @ViewChild('descriptionDialog') descriptionDialog:any;

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

    // get publisher array cast to publisher item
    get typedPublishers(): PublisherItem[] {
        return this.publishers as PublisherItem[];
    }

    // load series data
    loadPublisher(id:any){
        const prevScrollTop = this.sidebar.scrollTop();
        this.loading = true;
        this.api.request<any>(HttpMethod.GET, `admin-publishers/id/${id}`, {}).subscribe((res:any)=>{
            this.publisher = res;
            // convert string to object
            for(const relation of this.publisher.relations){
                if(typeof relation.relation_type === "string") relation.relation_type = this.publisherRelationTypes.find((t:any) => t.key === relation.relation_type);
            }
            this.editPublisher = JSON.parse(JSON.stringify(this.publisher));
            const dateParts = this.editPublisher.founding_date.toString().split('-').map((p:string) => parseInt(p));
            this.editPublisher.founding_date = new TuiDay(dateParts[0],dateParts[1]-1,dateParts[2]);
            // set selected description if there is one
            if(this.editPublisher.descriptions.length > 0) this.descriptionTabChanged(this.descriptionTabIndex);
            
            this.loadPublishers();

            setTimeout(()=>{
                this.sidebar.setScrollTop(prevScrollTop);
                this.loading = false;
            }, 200);
        });
    }

    // load all publishers for relation select
    loadPublishers(){
        this.api.request<any>(HttpMethod.POST, `admin-publishers`, {order: 'name-asc'}).subscribe((res:any)=>{
            this.publishers = res.publishers;
        });
    }

    // save changes to database
    saveEdit(){
        if(!this.editPublisher || this.saving === true) return;
        this.saving = true;

        const added_aliases = []; const removed_aliases = [];
        for(const alias of this.editPublisher.aliases) if(alias.id === -1) added_aliases.push(alias);
        for(const alias of this.publisher.aliases) if(!this.editPublisher.aliases.find((a:any) => a.id == alias.id)) removed_aliases.push(alias);

        const modified_relations = []; const added_relations = []; const removed_relations = [];
        for(const rel of this.editPublisher.relations){
            const relation = this.publisher.relations.find((d:any) => d.id == rel.id);
            // new items have an negative id
            if(rel.id === -1) added_relations.push(rel);
            // check if something has changed
            else if(relation && rel.relation_type.key !== relation.relation_type.key) modified_relations.push(rel);
        }
        // check if relations were removed
        for(const rel of this.publisher.relations) if(!this.editPublisher.relations.find((d:any) => d.id == rel.id)) removed_relations.push(rel);

        const modified_descriptions = []; const added_descriptions = []; const removed_descriptions = [];
        for(const desc of this.editPublisher.descriptions){
            const description = this.publisher.descriptions.find((d:any) => d.id == desc.id);
            // new items have an negative id
            if(desc.id === -1) added_descriptions.push(desc);
            // check if something has changed
            else if(description && desc.description !== description.description || desc.source !== description.source) modified_descriptions.push(desc);
        }
        // check if descriptions were removed
        for(const desc of this.publisher.descriptions) if(!this.editPublisher.descriptions.find((d:any) => d.id == desc.id)) removed_descriptions.push(desc);

        this.editPublisher.founding_date = this.editPublisher.founding_date.toString().split('.').reverse().join('-');
        
        this.api.request<string>(HttpMethod.POST, `admin-publishers/edit/${this.editPublisher.id}`, {
            name: this.editPublisher.name,
            short_name: this.editPublisher.short_name,
            website: this.editPublisher.website || '',
            image_source: this.editPublisher.image_source,
            headquarter: this.editPublisher.headquarter,
            founding_date: this.editPublisher.founding_date,
            added_aliases, removed_aliases,
            added_descriptions, removed_descriptions, modified_descriptions,
            added_relations, removed_relations, modified_relations
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

    // add edit lock
    addLock(id:any){
        this.api.request<string>(HttpMethod.POST, `admin/lock`,{route:'publisher',id:id},'text').subscribe((res:any)=>{},(err)=>{
            this.location.back();
        });
    }

    // remove edit lock
    removeLock(redirect:boolean = true){
        this.api.request<string>(HttpMethod.DELETE, `admin/remove-lock`, {route:'publisher',id:this.publisher.id},'text').subscribe((res:any)=>{
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

    // set founding date to unknown
    setDateUnknown(){
        const dateParts = '1001-01-01'.toString().split('-').map((p:string) => parseInt(p));
        this.editPublisher.founding_date = new TuiDay(dateParts[0],dateParts[1]-1,dateParts[2])
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

    // if backdrop of dialog is clicked close it
    relationDialogClick(e:any){
        if (e.target === this.relationDialog.nativeElement) {
            this.showRelationDialog = false;
            this.addRelationItem = null;
        }
    }

    // open description dialog
    openRelationDialog(){
        this.showRelationDialog = true;
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

    // remove alias
    removeAlias(alias:any){
        const index = this.editPublisher.aliases.indexOf(alias);
        if (index >= 0) {
            this.editPublisher.aliases.splice(index, 1);
        }
    }

    // add alias
    addAlias(){
        const alias = prompt(`Add Alias:`); // TODO translate
        if(alias && alias?.trim() !== ""){
            this.editPublisher.aliases.push({id: -1, name: alias});
        }
    }

    // add relation
    addRelation(){
        // check if everything is correct
        if(!this.addRelationItem || this.editPublisher.relations.find((c:any) => c.relation_id === this.addRelationItem.id)) return;
        this.editPublisher.relations.push({
            id: -1,
            relation_id: this.addRelationItem.id,
            name: this.addRelationItem.name,
            relation_type: this.publisherRelationTypes.find((c:any) => c.key === 'imprint'),
            image: this.addRelationItem?.image
        });
        this.showRelationDialog = false;
        this.addRelationItem = undefined;
    }

    // remove relation
    removeRelation(e:any,relation:PublisherItem){
        e.preventDefault();
        this.editPublisher.relations = this.editPublisher.relations.filter((c:PublisherItem) => c.name !== relation.name);
    }

    // if backdrop of dialog is clicked close it
    descriptionDialogClick(e:any){
        if (e.target === this.descriptionDialog.nativeElement) {
            this.showDescriptionDialog = false;
        }
    }

    // open description dialog
    openDescriptionDialog(){
        this.showDescriptionDialog = true;
    }

    // add description
    async addDescription(){
        const lang = localeToLang(this.addDescriptionItem.language.value);
        // check if there is already a description for the given language
        if(this.editPublisher.descriptions.find((d:any) => d.language === lang)){
            const msg = await getTranslation(this.translate, `add-description-dialog.exists`);
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }
    
        this.editPublisher.descriptions.push({
            id: -1, description: '', source: '', language: lang
        });
    
        this.showDescriptionDialog = false;
    }

    // remove description
    removeDescription(e:any,desc:any){
        e.preventDefault();
        this.editPublisher.descriptions = this.editPublisher.descriptions.filter((d:any) => d.language !== desc.language);
        // modify index and object based on if there are still descriptions left after removing
        if(this.editPublisher.descriptions.length > 0){
            this.selectedDescription = this.editPublisher.descriptions[0];
            this.descriptionTabIndex = 0;
        } else {
            this.selectedDescription = undefined;
            this.descriptionTabIndex = 0;
        }
    }

    // event handler for changing description tab
    descriptionTabChanged(e:any){
        // check if index is in range
        if(e > this.editPublisher.descriptions.length - 1) return;
        // select description
        this.selectedDescription = this.editPublisher.descriptions[e];
    }
}
