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
import { CDN_BASE, CONTRIBUTOR_TYPES, errorAlert, getOriginByLang, getTranslation, LANGS, langToLocale, localeToLang, SCRAPER_BASE, SERIES_PUBLICATION_STATUSES, SERIES_RELATION_TYPES, SERIES_TYPES, successAlert } from '../../../../globals';
import { TuiCheckbox, TuiSwitch, TuiTabs } from '@taiga-ui/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerMinus, tablerPlus, tablerX } from '@ng-icons/tabler-icons';
import { NgAutoAnimateDirective } from 'ng-auto-animate';
import { TUI_EDITOR_DEFAULT_EXTENSIONS, TUI_EDITOR_DEFAULT_TOOLS, TUI_EDITOR_EXTENSIONS, TuiEditor } from '@taiga-ui/editor';
import { SideBarService } from '../../../../services/sidebar.service';
import { HttpClient } from '@angular/common/http';

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
    viewProviders: [provideIcons({tablerX,tablerPlus,tablerMinus})]
})
export class AdminSeriesDetailComponent {
    private readonly sidebar = inject(SideBarService);
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    readonly cdn_url = CDN_BASE;
    series:any = null;
    allSeries:any = [];
    allPublishers:any = [];
    allContributors:any = [];
    allTags:any = [];
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

    seriesPublicationStatuses:any = SERIES_PUBLICATION_STATUSES;
    showPublisherDialog:boolean = false;
    addPublisherItem:any = null;
    @ViewChild('publisherDialog') publisherDialog:any;
    publisherSearch: any = '';
    searchedPublishers:any = [];
    selectedPublisher:any = null;

    showContributorDialog:boolean = false;
    addContributorItem:any = null;
    @ViewChild('contributorDialog') contributorDialog:any;
    contributorSearch: any = '';
    searchedContributors:any = [];
    selectedContributor:any = null;
    contributorTypes:any = CONTRIBUTOR_TYPES;

    showTagDialog:boolean = false;
    addTagItem:any = null;
    @ViewChild('tagDialog') tagDialog:any;

    showScrapeDialog:boolean = false;
    scraping:boolean = false;
    scraperUrl:string = '';
    @ViewChild('scrapeDialog') scrapeDialog:any;
    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute, private location: Location, private http: HttpClient) { }
    
    ngOnInit() {
        // set title
        this.title.setTitle(`Edit Series | MangaDB`);

        const id = this.route.snapshot.paramMap.get('id');

        this.addLock(id);
        this.loadSeries(id);
    }

    // load series data
    loadSeries(id:any){
        const prevScrollTop = this.sidebar.scrollTop();
        this.loading = true;
        this.api.request<any>(HttpMethod.GET, `admin-series/id/${id}`, {}).subscribe((res:any)=>{
            console.log(res)
            // convert strings to their select values ('relation_type' | string => object (from relationTypes in this case))
            for(const relation of res.relations){
                if(typeof relation.relation_type === 'string') relation.relation_type = this.relationTypes.find((t:any) => t.key === relation.relation_type);
            }
            for(const publisher of res.publishers){
                publisher.origin = publisher.origin == 1;
                if(!publisher.start) publisher.start = 0;
                if(!publisher.end) publisher.end = 0;
                if(typeof publisher.status === 'string') publisher.status = this.seriesPublicationStatuses.find((s:any) => s.key === publisher.status);
                if(typeof publisher.language === 'string') publisher.language = this.availableLanguages.find((l:any) => l.value === this.toLocale(publisher.language));
            }
            for(const publisher of res.publisher_editions){
                if(typeof publisher.status === 'string') publisher.status = this.seriesPublicationStatuses.find((s:any) => s.key === publisher.status);
                if(!publisher.start) publisher.start = 0;
                if(!publisher.end) publisher.end = 0;
            }
            for(const contributor of res.contributors){
                if(typeof contributor.type === 'string') contributor.type = this.contributorTypes.find((t:any) => t.key === contributor.type);
            }
            res.public = res.public == 1;
            this.series = res;
            // set values
            const copy = JSON.parse(JSON.stringify(this.series));
            copy.type = this.seriesTypes.find((t:any)=>t.key === this.series.type);
            this.editSeries = copy;
            // set selected description if there is one
            if(this.editSeries.descriptions.length > 0) this.descriptionTabChanged(this.descriptionTabIndex);
            this.loadRelations();
            this.loadPublishers();
            this.loadContributors();
            this.loadTags();

            setTimeout(()=>{
                this.sidebar.setScrollTop(prevScrollTop);
                this.loading = false;
            }, 200);
        });
    }

    // load all series (for relation select)
    loadRelations(){
        this.api.request<any>(HttpMethod.POST, `admin-series`, {order: 'name-asc'}).subscribe((res:any)=>{
            this.allSeries = res.series;
        });
    }

    // load all publishers (for publisher select)
    loadPublishers(){
        this.api.request<any>(HttpMethod.POST, `admin-publishers`, {order: 'name-asc'}).subscribe((res:any)=>{
            this.allPublishers = res.publishers;
        });
    }

    // load all contributors (for contributor select)
    loadContributors(){
        this.api.request<any>(HttpMethod.POST, `admin-contributors`, {order: 'name-asc'}).subscribe((res:any)=>{
            for(const contributor of res.contributors){
                contributor.name = `${contributor.last_name?.toUpperCase()} ${contributor.first_name}`.trim();
            }
            this.allContributors = res.contributors;
        });
    }

    // load all tags (for tag select)
    loadTags(){
        this.api.request<any>(HttpMethod.GET, `filters`,{}).subscribe((res:any)=>{
            this.allTags = res;
            console.log(this.allTags)
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

        const modified_publishers = []; const added_publishers = []; const removed_publishers = [];
        for(const pub of this.editSeries.publishers){
            const publisher = this.series.publishers.find((p:any) => p.id == pub.id);
            // new items have a negative id
            if(pub.id === -1) added_publishers.push(pub);
            // check if something has changed
            else if(publisher && (publisher.chapter !== pub.chapter || publisher.volumes !== pub.volumes || publisher.status.key !== pub.status.key || publisher.language?.key !== pub.language?.key || publisher.origin !== pub.origin || publisher.start !== pub.start || publisher.end !== pub.end)) modified_publishers.push(pub);
        }
        for(const pub of this.series.publishers) if(!this.editSeries.publishers.find((p:any) => p.id == pub.id)) removed_publishers.push(pub);

        const modified_editions = []; const added_editions = []; const removed_editions = [];
        for(const ed of this.editSeries.publisher_editions){
            const edition = this.series.publisher_editions.find((e:any) => e.id == ed.id);
            // new items have a negative id
            if(ed.id === -1) added_editions.push(ed);
            // check if something has changed
            else if(edition && (edition.chapter !== ed.chapter || edition.volumes !== ed.volumes || edition.status.key !== ed.status.key || edition.name !== ed.name || edition.default_edition !== ed.default_edition || edition.start !== ed.start || edition.end !== ed.end)) modified_editions.push(ed);
        }
        for(const ed of this.series.publisher_editions) if(!this.editSeries.publisher_editions.find((e:any) => e.id == ed.id)) removed_editions.push(ed);

        const modified_contributors = []; const added_contributors = []; const removed_contributors = [];
        for(const con of this.editSeries.contributors){
            const contributor = this.series.contributors.find((c:any) => c.id == con.id);
            // new items have a negative id
            if(con.id === -1) added_contributors.push(con);
            // check if something has changed
            else if(contributor && (contributor.type.key !== con.type.key)) modified_contributors.push(con);
        }
        for(const con of this.series.contributors) if(!this.editSeries.contributors.find((c:any) => c.id == con.id)) removed_contributors.push(con);

        const added_tags = []; const removed_tags = [];
        for(const tag of this.editSeries.tags) if(tag.id === -1) added_tags.push(tag);
        for(const tag of this.series.tags) if(!this.editSeries.tags.find((t:any) => t.id == tag.id)) removed_tags.push(tag);

        const data = {
            name: this.editSeries.name,
            type: this.editSeries.type.key,
            public: this.editSeries.public ? 1 : 0,
            added_aliases, removed_aliases,
            added_descriptions, removed_descriptions, modified_descriptions,
            added_relations, removed_relations, modified_relations,
            added_publishers, removed_publishers, modified_publishers,
            added_editions, removed_editions, modified_editions,
            added_contributors, removed_contributors, modified_contributors,
            added_tags, removed_tags
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

        // show scraper with ctrl + k
        if(e.ctrlKey && e.key === 'k'){
            e.preventDefault();
            this.openScrapeDialog();
        }
    }

    descriptionTabChanged(e:any){
        if(e > this.editSeries.descriptions.length - 1) return;
        this.selectedDescription = this.editSeries.descriptions[e];
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

    scrape(){
        this.scraping = true;

        this.http.post(`${SCRAPER_BASE}/getAmazonData`, {link: this.scraperUrl}).subscribe((res:any)=>{
            const description = res.description.trim().replace('Klappentext:','');
            // remove a tags from description and replace them with the text in the a tag
            const descriptionWithoutATags = description.replace(/<a.*?>(.*?)<\/a>/g, '$1');
            let language = "";
            const linkParts = res.source.split('|')[0].split('.');
            switch(linkParts[linkParts.length-1].split('/')[0]){
                case 'de': language = 'German'; break;
                case 'com': language = 'English'; break;
                case 'fr': language = 'French'; break;
                case 'es': language = 'Spanish'; break;
                case 'it': language = 'Italian'; break;
                case 'jp': language = 'Japanese'; break;
            }
            if(!this.editSeries.descriptions.find((d:any) => d.language === language)){
                this.editSeries.descriptions.push({
                    id: -1,
                    description: descriptionWithoutATags,
                    language,
                    source: res.source.trim(),
                });
            }
            for(const tag of res.tags){
                if(tag === 'Action' || tag === 'Actiondrama') this.addTagObj(this.allTags.find((t:any) => t.name === 'Action'));
                if(tag === 'Abenteuer') this.addTagObj(this.allTags.find((t:any) => t.name === 'Adventure'));
                if(tag === 'Komödie') this.addTagObj(this.allTags.find((t:any) => t.name === 'Comedy'));
                if(tag === 'Drama' || tag === 'Psychodrama' || tag === 'Actiondrama' || tag === 'Alltragsdrama') this.addTagObj(this.allTags.find((t:any) => t.name === 'Drama'));
                if(tag === 'Fantasy') this.addTagObj(this.allTags.find((t:any) => t.name === 'Fantasy'));
                if(tag === 'Horror') this.addTagObj(this.allTags.find((t:any) => t.name === 'Horror'));
                if(tag === 'Mystery') this.addTagObj(this.allTags.find((t:any) => t.name === 'Mystery'));
                if(tag === 'Romanze') this.addTagObj(this.allTags.find((t:any) => t.name === 'Romance'));
                if(tag === 'Scifi') this.addTagObj(this.allTags.find((t:any) => t.name === 'Sci-Fi'));
                if(tag === 'Alltagsleben' || tag === 'Alltagsdrama') this.addTagObj(this.allTags.find((t:any) => t.name === 'Slice-of-Life'));
                if(tag === 'Romantische Komödie') this.addTagObj(this.allTags.find((t:any) => t.name === 'Romance'));
                if(tag === 'Romantische Komödie') this.addTagObj(this.allTags.find((t:any) => t.name === 'Comedy'));
                if(tag === 'Thriller') this.addTagObj(this.allTags.find((t:any) => t.name === 'Thriller'));
                if(tag === 'Dämonen') this.addTagObj(this.allTags.find((t:any) => t.name === 'Demons'));
                if(tag === 'Girls Love') this.addTagObj(this.allTags.find((t:any) => t.name === 'Yuri'));
                if(tag === 'Boys Love') this.addTagObj(this.allTags.find((t:any) => t.name === 'Yaoi'));
                if(tag === 'Ecchi') this.addTagObj(this.allTags.find((t:any) => t.name === 'Ecchi'));
                if(tag === 'Harem') this.addTagObj(this.allTags.find((t:any) => t.name === 'Harem'));
                if(tag === 'Magie') this.addTagObj(this.allTags.find((t:any) => t.name === 'Magic'));
                if(tag === 'Monster') this.addTagObj(this.allTags.find((t:any) => t.name === 'Monsters'));
                if(tag === 'Historisch') this.addTagObj(this.allTags.find((t:any) => t.name === 'Historical'));
                if(tag === 'Schule' || tag === 'Oberschule') this.addTagObj(this.allTags.find((t:any) => t.name === 'School Life'));
                if(tag === 'Ganbatte' || tag === 'Sport') this.addTagObj(this.allTags.find((t:any) => t.name === 'Sports'));
                if(tag === 'Vampire') this.addTagObj(this.allTags.find((t:any) => t.name === 'Vampires'));
                if(tag === 'Zombie') this.addTagObj(this.allTags.find((t:any) => t.name === 'Zombies'));
                if(tag === 'Außerirdische') this.addTagObj(this.allTags.find((t:any) => t.name === 'Aliens'));
                if(tag === 'Polizist' || tag === 'Polizei') this.addTagObj(this.allTags.find((t:any) => t.name === 'Police'));
                if(tag === 'Krimi') this.addTagObj(this.allTags.find((t:any) => t.name === 'Crime'));
                if(tag === 'Erotik') this.addTagObj(this.allTags.find((t:any) => t.name === 'Erotica'));
                if(tag === 'Geister') this.addTagObj(this.allTags.find((t:any) => t.name === 'Ghosts'));
                if(tag === 'Ninja') this.addTagObj(this.allTags.find((t:any) => t.name === 'Ninja'));
                if(tag === 'Musik') this.addTagObj(this.allTags.find((t:any) => t.name === 'Music'));
                if(tag === 'Isekai') this.addTagObj(this.allTags.find((t:any) => t.name === 'Isekai'));
                if(tag === 'Zeitsprung') this.addTagObj(this.allTags.find((t:any) => t.name === 'Time Travel'));
                if(tag === 'Geistergeschichten') this.addTagObj(this.allTags.find((t:any) => t.name === 'Ghosts'));
                if(tag === 'Überlebenskampf') this.addTagObj(this.allTags.find((t:any) => t.name === 'Survival'));
                if(tag === 'Militär') this.addTagObj(this.allTags.find((t:any) => t.name === 'Military'));
            }
            this.scraping = false;
        }, (err:any)=>{
            this.scraping = false;
        });
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
            this.searchedRelations = [];
            this.relationSearch = '';
        }
    }

    // open description dialog
    openRelationDialog(){
        this.showRelationDialog = true;
    }

    // if backdrop of dialog is clicked close it
    publisherDialogClick(e:any){
        if (e.target === this.publisherDialog.nativeElement) {
            this.showPublisherDialog = false;
            this.searchedPublishers = [];
            this.publisherSearch = '';
        }
    }

    // open publisher dialog
    openPublisherDialog(){
        this.showPublisherDialog = true;
    }

    // if backdrop of dialog is clicked close it
    contributorDialogClick(e:any){
        if (e.target === this.contributorDialog.nativeElement) {
            this.showContributorDialog = false;
            this.searchedContributors = [];
            this.contributorSearch = '';
        }
    }

    // open contributor dialog
    openContributorDialog(){
        this.showContributorDialog = true;
    }

    // if backdrop of dialog is clicked close it
    tagDialogClick(e:any){
        if (e.target === this.tagDialog.nativeElement) {
            this.showTagDialog = false;
        }
    }

    // open tag dialog
    openTagDialog(){
        this.showTagDialog = true;
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
        if(e.key == 'Enter' && this.relationSearch.length >= 3){
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

    // keydown event handler for publisher search
    publisherSearchKeyDown(e:any){
        if(e.key == 'Enter' && this.publisherSearch.length >= 3){
            this.searchedPublishers = this.allPublishers.filter((p:any)=>p.name.toLowerCase().includes(this.publisherSearch.toLowerCase()));
        }
    }

    // select publisher
    selectPublisher(item:any){
        for(const item of this.allPublishers){
            item.selected = false;
        }

        if(item) item.selected = true;
    }

    // keydown event handler for contributor search
    contributorSearchKeyDown(e:any){
        if(e.key == 'Enter' && this.contributorSearch.length >= 3){
            this.searchedContributors = this.allContributors.filter((p:any)=>p.name.toLowerCase().includes(this.contributorSearch.toLowerCase()));
        }
    }

    // select contributor
    selectContributor(item:any){
        for(const item of this.allContributors){
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
        this.searchedRelations = [];
        this.relationSearch = '';
        this.selectRelation(null);
    }

    // remove relation
    removeRelation(relation: any){
        this.editSeries.relations = this.editSeries.relations.filter((c:any) => c.name !== relation.name);
    }

    // add edition
    addEdition(publisher:any){
        this.editSeries.publisher_editions.push({
            id: -1,
            chapter: 0,
            volumes: 0,
            digital: false,
            default_edition: false,
            status: this.seriesPublicationStatuses.find((s:any) => s.key === 'Ongoing'),
            publisher_id: publisher.publisher_id,
            name: ''
        });
    }

    // remove edition
    removeEdition(edition:any){
        this.editSeries.publisher_editions = this.editSeries.publisher_editions.filter((e:any) => e != edition);
    }

    // remove publisher
    removePublisher(publisher:any){
        this.editSeries.publishers = this.editSeries.publishers.filter((p:any) => p.publisher_id !== publisher.publisher_id);
        this.editSeries.publisher_editions = this.editSeries.publisher_editions.filter((e:any) => e.publisher_id !== publisher.publisher_id);
    }

    // add publisher
    addPublisher(){
        const publisherItem = this.allPublishers.find((s:any)=>s.selected);
        if(!publisherItem) return;
        this.editSeries.publishers.push({
            id: -1,
            chapter: 0,
            volumes: 0,
            digital: false,
            origin: false,
            start: '0',
            end: '0',
            language: this.availableLanguages.find(l => l.value === 'en'),
            status: this.seriesPublicationStatuses.find((s:any) => s.key === 'Ongoing'),
            publisher_id: publisherItem.id,
            name: publisherItem.name
        });
        this.showPublisherDialog = false;
        this.searchedPublishers = [];
        this.publisherSearch = '';
        this.selectPublisher(null);
    }

    // add contributor
    addContributor(){
        const contributorItem = this.allContributors.find((s:any)=>s.selected);
        if(!contributorItem) return;

        this.editSeries.contributors.push({
            id: -1,
            first_name: contributorItem.first_name,
            last_name: contributorItem.last_name,
            contributor_id: contributorItem.id,
            image: contributorItem.image,
            type: this.contributorTypes[0]
        })

        this.showContributorDialog = false;
        this.searchedContributors = [];
        this.contributorSearch = '';
        this.selectContributor(null);
    }

    // remove contributor
    removeContributor(e:any,contributor:any){
        e.preventDefault();
        this.editSeries.contributors = this.editSeries.contributors.filter((c:any) => c.contributor_id !== contributor.contributor_id);
    }
    
    // auto assign tags based on publishers and other series data relevant for tags
    autoTags(){
        // remove language and status tags
        this.editSeries.tags = this.editSeries.tags.filter((t:any) => t.type !== 'language' && t.type !== 'publication-status' && t.type !== 'origin-country' && t.type !== 'content-type');

        // type tag
        const typeTag = this.allTags.find((t:any) => t.type === 'content-type' && t.name === this.editSeries.type.key);
        this.addTagObj(typeTag);

        for(const pub of this.editSeries.publishers){
            // add tags of available languages
            const languageTag = this.allTags.find((t:any) => t.type === 'language' && t.name === localeToLang(pub.language.value));
            if(languageTag && !this.editSeries.tags.find((t:any) => t.tag_id === languageTag.id)){
                this.addTagObj(languageTag);
            }

            // add status and origin tags
            if(pub.origin){
                const statusTag = this.allTags.find((t:any) => t.type === 'publication-status' && t.name === pub.status.name);
                if(statusTag && !this.editSeries.tags.find((t:any) => t.tag_id === statusTag.id)){
                    this.addTagObj(statusTag);
                }

                let origin = getOriginByLang(localeToLang(pub.language.value));
                const originTag = this.allTags.find((t:any) => t.type === 'origin-country' && t.name === origin);
                if(originTag && !this.editSeries.tags.find((t:any) => t.tag_id === originTag.id)){
                    this.addTagObj(originTag);
                }
            }
        }

        // sort a-z
        this.editSeries.tags.sort((a:any, b:any) => a.name.localeCompare(b.name));
    }

    addTag(){
        if(!this.addTagItem || this.editSeries.tags.find((t:any) => t.tag_id === this.addTagItem.id)) return;
    
        this.editSeries.tags.push({
            id: -1,
            name: this.addTagItem.name,
            type: this.addTagItem.type,
            tag_id: this.addTagItem.id
        });
    
        // sort a-z
        this.editSeries.tags.sort((a:any, b:any) => a.name.localeCompare(b.name));
    
        this.addTagItem = undefined;
        this.showTagDialog = false;
    }
    
    addTagObj(tag:any){
        if(!tag || this.editSeries.tags.find((t:any) => t.tag_id === tag.id)) return;
    
        this.editSeries.tags.push({
            id: -1,
            name: tag.name,
            type: tag.type,
            tag_id: tag.id
        });
    }

    // remove tag
    removeTag(tag:any){
        this.editSeries.tags = this.editSeries.tags.filter((t:any) => t.tag_id !== tag.tag_id);
    }
}
