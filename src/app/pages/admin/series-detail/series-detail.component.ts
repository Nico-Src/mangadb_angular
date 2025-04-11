import { Component, HostListener, inject, Injector, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiAlertService, TuiButton, TuiDataList, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { Location, NgFor, NgIf } from '@angular/common';
import { MangaCover } from '../../../manga-cover/manga-cover.component';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { errorAlert, getTranslation, LANGS, langToLocale, localeToLang, SERIES_RELATION_TYPES, SERIES_TYPES, successAlert } from '../../../../globals';
import { TuiCheckbox, TuiSwitch, TuiTabs } from '@taiga-ui/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerPlus, tablerX } from '@ng-icons/tabler-icons';
import { NgAutoAnimateDirective } from 'ng-auto-animate';
import { TUI_EDITOR_DEFAULT_EXTENSIONS, TUI_EDITOR_DEFAULT_TOOLS, TUI_EDITOR_EXTENSIONS, TuiEditor } from '@taiga-ui/editor';

@Component({
    selector: 'app-admin-series-detail',
    imports: [TranslatePipe,TuiButton,NgIf,NgFor,MangaCover,TuiEditor,TuiTabs,TuiDataList,NgAutoAnimateDirective,TuiCheckbox,TuiTextfield,TuiLoader,NgIcon,TuiTextfieldControllerModule,TuiSelectModule,ReactiveFormsModule,FormsModule,TuiSwitch],
    templateUrl: './series-detail.component.html',
    styleUrl: './series-detail.component.less',
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
    viewProviders: [provideIcons({tablerX,tablerPlus})]
})
export class AdminSeriesDetailComponent {
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    series:any = null;
    allSeries:any = [];
    editSeries:any = null;
    seriesTypes: any = SERIES_TYPES;
    loading:boolean = true;
    availableLanguages = LANGS;
    saving:boolean = false;

    readonly tools = TUI_EDITOR_DEFAULT_TOOLS;

    showAliasDialog:boolean = false;
    addAliasItem:any = {name: '',language: this.availableLanguages[0]};
    @ViewChild('aliasDialog') aliasDialog:any;

    descriptionTabIndex:number = 0;
    selectedDescription:any = null;
    showDescriptionDialog:boolean = false;
    addDescriptionItem:any = {description: '',language: this.availableLanguages[0],source: ''};
    @ViewChild('descriptionDialog') descriptionDialog:any;

    showRelationDialog:boolean = false;
    addRelationItem:any = null;
    @ViewChild('relationDialog') relationDialog:any;
    relationSearch: any = '';
    searchedRelations:any = [];
    selectedRelation:any = null;
    relationTypes:any = SERIES_RELATION_TYPES;
    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute, private location: Location) { }
    
    ngOnInit() {
        // set title
        this.title.setTitle(`Edit Series | MangaDB`);

        const id = this.route.snapshot.paramMap.get('id');

        this.addLock(id);
        this.loadSeries(id);
    }

    // load series data
    loadSeries(id:any){
        this.api.request<any>(HttpMethod.GET, `admin-series/id/${id}`, {}).subscribe((res:any)=>{
            console.log(res)
            this.series = res;
            for(const relation of this.series.relations){
                if(typeof relation.relation_type === 'string') relation.relation_type = this.relationTypes.find((t:any) => t.key === relation.relation_type);
            }
            this.series.public = this.series.public == 1;
            // set values
            const copy = JSON.parse(JSON.stringify(this.series));
            copy.type = this.seriesTypes.find((t:any)=>t.key === this.series.type);
            this.editSeries = copy;
            // set selected description if there is one
            if(this.editSeries.descriptions.length > 0) this.descriptionTabChanged(this.descriptionTabIndex);
            this.loading = false;
            this.loadRelations();
        });
    }

    // load all series (for relation select)
    loadRelations(){
        this.api.request<any>(HttpMethod.POST, `admin-series`, {order: 'name-asc'}).subscribe((res:any)=>{
            console.log(res);
            this.allSeries = res.series;
        });
    }

    // save changes to database
    saveEdit(){
        if(!this.editSeries || this.saving === true) return;
        this.saving = true;

        // check if aliases were added or removed
        const added_aliases = []; const removed_aliases = [];
        for(const alias of this.editSeries.aliases) if(alias.id === -1) added_aliases.push(alias);
        for(const alias of this.series.aliases) if(!this.editSeries.aliases.find((a:any) => a.id == alias.id)) removed_aliases.push(alias);

        // check if descriptions were added or removed
        const modified_descriptions = []; const added_descriptions = []; const removed_descriptions = [];
        for(const desc of this.editSeries.descriptions){
            const description = this.series.descriptions.find((d:any) => d.id == desc.id);
            // new items have a negative id
            if(desc.id === -1) added_descriptions.push(desc);
            // check if something has changed
            else if(description && desc.description !== description.description || desc.source !== description.source) modified_descriptions.push(desc);
        }
        // check if descriptions were removed
        for(const desc of this.series.descriptions) if(!this.editSeries.descriptions.find((d:any) => d.id == desc.id)) removed_descriptions.push(desc);

        const modified_relations = []; const added_relations = []; const removed_relations = [];
        for(const rel of this.editSeries.relations){
            const relation = this.series.relations.find((d:any) => d.id == rel.id);
            // new items have a negative id
            if(rel.id === -1) added_relations.push(rel);
            // check if something has changed
            else if(relation && rel.relation_type.key !== relation.relation_type.key) modified_relations.push(rel);
        }
        // check if relations were removed
        for(const rel of this.series.relations) if(!this.editSeries.relations.find((d:any) => d.id == rel.id)) removed_relations.push(rel);

        const data = {
            name: this.editSeries.name,
            type: this.editSeries.type.key,
            public: this.editSeries.public ? 1 : 0,
            added_aliases, removed_aliases,
            added_descriptions, removed_descriptions, modified_descriptions,
            added_relations, removed_relations, modified_relations,
            added_publishers: [], removed_publishers: [], modified_publishers: [],
            added_editions: [], removed_editions: [], modified_editions: [],
            added_contributors: [], removed_contributors: [], modified_contributors: [],
            added_tags: [], removed_tags: []
        };

        this.api.request<string>(HttpMethod.POST, `admin-series/edit/${this.series.id}`, data, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `series.save-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.saving = false;
            this.loadSeries(this.series.id);
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.saving = false;
        });
    }

    addLock(id:any){
        this.api.request<string>(HttpMethod.POST, `admin/lock`,{route:'series',id:id},'text').subscribe((res:any)=>{},(err)=>{
            this.location.back();
        });
    }

    removeLock(){
        this.api.request<string>(HttpMethod.DELETE, `admin/remove-lock`, {route:'series',id:this.series.id},'text').subscribe((res:any)=>{
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
    }

    descriptionTabChanged(e:any){
        if(e > this.editSeries.descriptions.length - 1) return;
        this.selectedDescription = this.editSeries.descriptions[e];
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

    // if backdrop of dialog is clicked close it
    relationDialogClick(e:any){
        if (e.target === this.relationDialog.nativeElement) {
            this.showRelationDialog = false;
        }
    }

    // open description dialog
    openRelationDialog(){
        this.showRelationDialog = true;
    }

    // add alias
    addAlias(){
        if(!this.addAliasItem.name || !this.addAliasItem.language || this.addAliasItem.name.trim().length === 0) return;
        this.editSeries.aliases.push({id: -1, title: this.addAliasItem.name, language: localeToLang(this.addAliasItem.language.value)});
        this.addAliasItem.name = '';
        this.addAliasItem.language = this.availableLanguages[0];
        this.showAliasDialog = false;
    }

    // remove alias
    removeAlias(alias:any){
        const index = this.editSeries.aliases.indexOf(alias);
        if (index >= 0) {
            this.editSeries.aliases.splice(index, 1);
        }
    }

    // add description
    async addDescription(){
        const lang = localeToLang(this.addDescriptionItem.language.value);
        if(this.editSeries.descriptions.find((d:any) => d.language === lang)){
            const msg = await getTranslation(this.translate, `add-description-dialog.exists`);
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }
    
        this.editSeries.descriptions.push({
            id: -1, description: '', source: '', language: lang
        });
    
        this.showDescriptionDialog = false;
    }

    // remove description
    removeDescription(e:any,desc:any){
        e.preventDefault();
        this.editSeries.descriptions = this.editSeries.descriptions.filter((d:any) => d.language !== desc.language);
        if(this.editSeries.descriptions.length > 0){
            this.selectedDescription = this.editSeries.descriptions[0];
            this.descriptionTabIndex = 0;
        } else {
            this.selectedDescription = undefined;
            this.descriptionTabIndex = 0;
        }
    }

    // keydown event handler for relation search
    relationSearchKeyDown(e:any){
        if(e.key == 'Enter'){
            this.searchedRelations = this.allSeries.filter((s:any)=>s.name.toLowerCase().includes(this.relationSearch.toLowerCase()));
        }
    }

    // select relation
    selectRelation(item:any){
        for(const item of this.allSeries){
            item.selected = false;
        }

        if(item) item.selected = true;
    }

    // add relation
    addRelation(){
        const relationItem = this.allSeries.find((s:any)=>s.selected);
        if(!relationItem) return;
        this.editSeries.relations.push({
            id: -1,
            relation_id: relationItem.id,
            name: relationItem.name,
            relation_type: SERIES_RELATION_TYPES.find(c => c.key === 'Spin-Off')
        });
        this.showRelationDialog = false;
        this.selectRelation(null);
    }

    // remove relation
    removeRelation(relation: any){
        this.editSeries.relations = this.editSeries.relations.filter((c:any) => c.name !== relation.name);
    }
}
