import { Component, HostListener, inject, Injector, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiAlertService, TuiButton, TuiDataList, tuiDateFormatProvider, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { TuiComboBoxModule, TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CDN_BASE, CONTRIBUTOR_GENDERS, CONTRIBUTOR_RELATION_TYPES, CONTRIBUTOR_TYPES, errorAlert, getTranslation, LANGS, langToLocale, localeToLang, PUBLISHER_RELATION_TYPES, successAlert } from '../../../../globals';
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

interface ContributorItem {
    name: string;
};

const STRINGIFY_CONTRIBUTOR: TuiStringHandler<ContributorItem> = (item: ContributorItem) =>
    `${item.name}`;

@Component({
    selector: 'app-admin-contributor-detail',
    imports: [TranslatePipe,TuiButton,NgIf,NgFor,TuiEditor,TuiFilterByInputPipe,TuiLet,TuiInputDateModule,TuiFiles,TuiTabs,TuiComboBoxModule,ScrollingModule,TuiDataList,TuiTextfield,TuiLoader,NgIcon,TuiTextfieldControllerModule,TuiSelectModule,ReactiveFormsModule,FormsModule],
    templateUrl: './contributor-detail.component.html',
    styleUrl: './contributor-detail.component.less',
    providers: [
        {
          provide: TUI_EDITOR_EXTENSIONS,
          deps: [Injector],
          useFactory: (injector: Injector) => [
            ...TUI_EDITOR_DEFAULT_EXTENSIONS,
            import('@taiga-ui/editor').then(({setup}) => setup({injector})),
          ],
        },
        tuiItemsHandlersProvider({stringify: STRINGIFY_CONTRIBUTOR}),
        tuiDateFormatProvider({mode: 'YMD', separator: '/'})
    ],
    viewProviders: [provideIcons({tablerX,tablerPlus,tablerMinus,matFaceOutline,tablerUpload,tablerTrash,tablerChevronRight,tablerChevronLeft})]
})
export class AdminContributorDetailComponent {
    private readonly sidebar = inject(SideBarService);
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    readonly cdn_url = CDN_BASE;

    stringifyContributor = STRINGIFY_CONTRIBUTOR;

    min_day = new TuiDay(1,0,1);

    contributor:any = null;
    contributors:any = [];
    editContributor:any = null;
    loading:boolean = true;
    availableLanguages = LANGS;
    saving:boolean = false;

    base64:any = null;
    image:any = null;
    imageHash:string = '';
    uploadingImage:boolean = false;
    deletingImage:boolean = false;

    contributorTypes:any = CONTRIBUTOR_TYPES;
    contributorGenders:any = CONTRIBUTOR_GENDERS;

    showAliasDialog:boolean = false;
    addAliasItem:any = {first_name: '', last_name: ''};
    @ViewChild('aliasDialog') aliasDialog:any;

    showScrapeDialog:boolean = false;
    scraping:boolean = false;
    scraperUrl:string = '';
    @ViewChild('scrapeDialog') scrapeDialog:any;

    showRelationDialog:boolean = false;
    addRelationItem:any = null;
    @ViewChild('relationDialog') relationDialog:any;
    contributorRelationTypes:any = CONTRIBUTOR_RELATION_TYPES;

    descriptionTabIndex:number = 0;
    selectedDescription:any = null;
    showDescriptionDialog:boolean = false;
    addDescriptionItem:any = {description: '',language: this.availableLanguages[0],source: ''};
    @ViewChild('descriptionDialog') descriptionDialog:any;

    readonly tools = TUI_EDITOR_DEFAULT_TOOLS;

    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute, private location: Location, private http: HttpClient) { }

    ngOnInit() {
        // set title
        this.title.setTitle(`Edit Contributor | MangaDB`);

        const id = this.route.snapshot.paramMap.get('id');

        this.route.paramMap.subscribe(()=>{
            if(!this.contributor?.id) return;
            const conId = this.route.snapshot.paramMap.get('id');
            this.addLock(conId);
            this.loadContributor(conId);
        });

        this.addLock(id);
        this.loadContributor(id);
    }

    // get publisher array cast to publisher item
    get typedContributors(): ContributorItem[] {
        return this.contributors as ContributorItem[];
    }

    // load contributor data
    loadContributor(id:any){
        const prevScrollTop = this.sidebar.scrollTop();
        this.loading = true;
        this.api.request<any>(HttpMethod.GET, `admin-contributors/id/${id}`, {}).subscribe((res:any)=>{
            this.contributor = res;
            console.log(this.contributor)
            // convert string to object
            if(typeof this.contributor.type === "string") this.contributor.type = this.contributorTypes.find((c:any) => c.key === this.contributor.type);
            if(typeof this.contributor.gender === "string") this.contributor.gender = this.contributorGenders.find((c:any) => c.key === this.contributor.gender);
            for(const relation of this.contributor.relations){
                if(typeof relation.relation_type === "string") relation.relation_type = this.contributorRelationTypes.find((t:any) => t.key === relation.relation_type);
            }
            this.editContributor = JSON.parse(JSON.stringify(this.contributor));
            // set selected description if there is one
            if(this.editContributor.descriptions.length > 0) this.descriptionTabChanged(this.descriptionTabIndex);
            
            this.loadContributors();

            setTimeout(()=>{
                this.sidebar.setScrollTop(prevScrollTop);
                this.loading = false;
            }, 200);
        });
    }

    // load all contributors for relation select
    loadContributors(){
        this.api.request<any>(HttpMethod.POST, `admin-contributors`, {order: 'name-asc'}).subscribe((res:any)=>{
            for(const contributor of res.contributors){
                contributor.name = `${contributor.last_name?.toUpperCase()} ${contributor.first_name}`.trim();
            }
            this.contributors = res.contributors;
        });
    }

    // save changes to database
    saveEdit(){
        if(!this.editContributor || this.saving === true) return;
        this.saving = true;

        const added_aliases = []; const removed_aliases = [];
        for(const alias of this.editContributor.aliases) if(alias.id === -1) added_aliases.push(alias);
        for(const alias of this.contributor.aliases) if(!this.editContributor.aliases.find((a:any) => a.id == alias.id)) removed_aliases.push(alias);

        const modified_relations = []; const added_relations = []; const removed_relations = [];
        for(const rel of this.editContributor.relations){
            const relation = this.contributor.relations.find((d:any) => d.id == rel.id);
            // new items have an negative id
            if(rel.id === -1) added_relations.push(rel);
            // check if something has changed
            else if(relation && rel.relation_type.key !== relation.relation_type.key) modified_relations.push(rel);
        }
        // check if relations were removed
        for(const rel of this.contributor.relations) if(!this.editContributor.relations.find((d:any) => d.id == rel.id)) removed_relations.push(rel);

        const modified_descriptions = []; const added_descriptions = []; const removed_descriptions = [];
        for(const desc of this.editContributor.descriptions){
            const description = this.contributor.descriptions.find((d:any) => d.id == desc.id);
            // new items have an negative id
            if(desc.id === -1) added_descriptions.push(desc);
            // check if something has changed
            else if(description && desc.description !== description.description || desc.source !== description.source) modified_descriptions.push(desc);
        }
        // check if descriptions were removed
        for(const desc of this.contributor.descriptions) if(!this.editContributor.descriptions.find((d:any) => d.id == desc.id)) removed_descriptions.push(desc);

        this.api.request<string>(HttpMethod.POST, `admin-contributors/edit/${this.editContributor.id}`, {
            first_name: this.editContributor.first_name,
            last_name: this.editContributor.last_name,
            gender: this.editContributor.gender.key,
            type: this.editContributor.type.key,
            links: this.editContributor.linksText,
            added_aliases, removed_aliases,
            added_descriptions, removed_descriptions, modified_descriptions,
            added_relations, removed_relations, modified_relations
        }, 'text').subscribe(async (res:any)=>{
            this.saving = false;
            const msg = await getTranslation(this.translate, `volume.save-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadContributor(this.contributor.id);
        }, (err:any)=>{
            this.saving = false;
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }

    // add edit lock
    addLock(id:any){
        this.api.request<string>(HttpMethod.POST, `admin/lock`,{route:'contributor',id:id},'text').subscribe((res:any)=>{},(err)=>{
            this.location.back();
        });
    }

    // remove edit lock
    removeLock(redirect:boolean = true){
        this.api.request<string>(HttpMethod.DELETE, `admin/remove-lock`, {route:'contributor',id:this.contributor.id},'text').subscribe((res:any)=>{
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
        this.api.request<string>(HttpMethod.POST, `admin-contributors/update-avatar/${this.contributor.id}`, {image: this.base64}, 'text').subscribe(async(res:any)=>{
            this.uploadingImage = false;
            this.image = null;
            this.base64 = null;
            this.updateImageHash();
            this.loadContributor(this.contributor.id);
            const msg = await getTranslation(this.translate, `admin.upload-success`);
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

    // open relation dialog
    openRelationDialog(){
        this.showRelationDialog = true;
    }

    // if backdrop of dialog is clicked close it
    aliasDialogClick(e:any){
        if (e.target === this.aliasDialog.nativeElement) {
            this.showAliasDialog = false;
        }
    }

    // open alias dialog
    openAliasDialog(){
        this.showAliasDialog = true;
    }

    // delete cover of given type
    async deleteImage(){
        this.deletingImage = true;
        this.api.request<string>(HttpMethod.DELETE, `admin-contributors/delete-avatar/${this.contributor.id}`, {}, 'text').subscribe(async(res:any)=>{
            this.deletingImage = false;
            this.updateImageHash();
            this.loadContributor(this.contributor.id);
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
        const index = this.editContributor.aliases.indexOf(alias);
        if (index >= 0) {
            this.editContributor.aliases.splice(index, 1);
        }
    }

    // add alias
    addAlias(){
        this.editContributor.aliases.push({id: -1, first_name: this.addAliasItem.first_name, last_name: this.addAliasItem.last_name});
        this.addAliasItem.first_name = '';
        this.addAliasItem.last_name = '';
        this.showAliasDialog = false;
    }

    // add relation
    addRelation(){
        // check if everything is correct
        if(!this.addRelationItem || this.editContributor.relations.find((c:any) => c.relation_id === this.addRelationItem.id)) return;
        this.editContributor.relations.push({
            id: -1,
            relation_id: this.addRelationItem.id,
            name: this.addRelationItem.name,
            relation_type: this.contributorRelationTypes.find((c:any) => c.key === 'member'),
            image: this.addRelationItem?.image
        });
        this.showRelationDialog = false;
        this.addRelationItem = undefined;
    }

    // remove relation
    removeRelation(e:any,relation:ContributorItem){
        e.preventDefault();
        this.editContributor.relations = this.editContributor.relations.filter((c:ContributorItem) => c.name !== relation.name);
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
        if(this.editContributor.descriptions.find((d:any) => d.language === lang)){
            const msg = await getTranslation(this.translate, `add-description-dialog.exists`);
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }
    
        this.editContributor.descriptions.push({
            id: -1, description: '', source: '', language: lang
        });
    
        this.showDescriptionDialog = false;
        if(this.editContributor.descriptions.length === 1) this.descriptionTabChanged(0);
    }

    // remove description
    removeDescription(e:any,desc:any){
        e.preventDefault();
        this.editContributor.descriptions = this.editContributor.descriptions.filter((d:any) => d.language !== desc.language);
        // modify index and object based on if there are still descriptions left after removing
        if(this.editContributor.descriptions.length > 0){
            this.selectedDescription = this.editContributor.descriptions[0];
            this.descriptionTabIndex = 0;
        } else {
            this.selectedDescription = undefined;
            this.descriptionTabIndex = 0;
        }
    }

    // event handler for changing description tab
    descriptionTabChanged(e:any){
        // check if index is in range
        if(e > this.editContributor.descriptions.length - 1) return;
        // select description
        this.selectedDescription = this.editContributor.descriptions[e];
    }
}
