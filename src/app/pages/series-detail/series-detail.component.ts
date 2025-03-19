import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, TitleStrategy } from '@angular/router';
import { _, TranslateService, TranslatePipe } from '@ngx-translate/core';
import { API_BASE, LANGS, localeToLang, langToLocale } from '../../../globals';
import { AuthService } from '../../../services/auth.service';
import { MangaCover } from '../../manga-cover/manga-cover.component';
import { NgIf, NgFor } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { faCopyright, faFlag, faBookmark, faStar } from '@ng-icons/font-awesome/regular';
import { faSolidPlus } from '@ng-icons/font-awesome/solid';
import { TuiButton, TuiAppearance, TuiHint } from '@taiga-ui/core';
import { TuiFade } from '@taiga-ui/kit';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { solarDoubleAltArrowDown, solarDoubleAltArrowUp } from '@ng-icons/solar-icons/outline';
import { LinkWarnDialog } from '../../link-warn-dialog/link-warn-dialog.component';
import { TagDialog } from '../../tag-dialog/tag-dialog.component';
import { TuiSegmented } from '@taiga-ui/kit';
import { TuiBadge } from '@taiga-ui/kit';
import { MangaVolume } from '../../manga-volume/manga-volume.component';
import { MangaSeriesListComponent } from '../../manga-series-list/manga-series-list.component';
import { MangaSeriesColumnComponent } from '../../manga-series-column/manga-series-column.component';
import { MangaSeriesGridComponent } from '../../manga-series-grid/manga-series-grid.component';
import { TuiElasticContainer } from '@taiga-ui/kit';
import { TuiPagination } from '@taiga-ui/kit';
import { tablerList, tablerLayoutColumns, tablerLayoutGrid } from '@ng-icons/tabler-icons';
import { CookieService } from 'ngx-cookie-service';

@Component({
    selector: 'series-detail',
    imports: [MangaCover, NgIf, NgFor, NgIcon, MangaVolume, MangaSeriesListComponent, TagDialog, MangaSeriesColumnComponent, MangaSeriesGridComponent, TuiButton, TuiPagination, TuiAppearance, TuiElasticContainer, TuiBadge, TranslatePipe, TuiSegmented, TuiHint, TuiFade, TuiSelectModule,TuiTextfieldControllerModule,ReactiveFormsModule,FormsModule, LinkWarnDialog],
    templateUrl: './series-detail.component.html',
    styleUrl: './series-detail.component.less',
    viewProviders: [provideIcons({ faCopyright, faFlag, faSolidPlus, faBookmark, faStar, solarDoubleAltArrowDown, solarDoubleAltArrowUp, tablerList, tablerLayoutColumns, tablerLayoutGrid })],
})
export class SeriesDetailComponent {
    private auth = inject(AuthService);
    readonly theme = computed(() => this.auth.theme());
    series: any = {};
    // Description
    availableDescLangs: any = [];
    selectedDescLang: any = {};
    descOverflowing: boolean = false;
    expandDesc: boolean = false;
    checkingDescOverflow: boolean = true;
    // Link Dialog
    linkDialogURL: string = "";
    // Tag Dialog
    tagDialogTag: string = "";
    // Tab Controls
    tabIndex: number = 0;
    viewIndex: number = 0;
    tabsLoading: boolean = true;
    editions: any = [];
    selectedEdition:any = "";
    volumes: any = [];
    volume_count: number = 0;
    special_editions: any = [];
    special_count: number = 0;
    relation_count: number = 0;
    // Pagination
    page: number = 0;
    max: number = 0;
    special_page: number = 0;
    special_max: number = 0;
    @ViewChild('seriesTitle') seriesTitle: any;
    @ViewChild('seriesAlias') seriesAlias: any;
    @ViewChild('content') content: any;
    @ViewChild('desc') desc: any;
    @ViewChild('linkDialog') linkDialog: any;
    @ViewChild('tagDialog') tagDialog: any;
    constructor(private translate: TranslateService, private meta: Meta, private cookie: CookieService, private title: Title, private route: ActivatedRoute, private http: HttpClient, private router: Router) { }
    
    ngOnInit() {
        this.title.setTitle(`Series | MangaDB`);
        // get route param (slug)
        const slug = this.route.snapshot.paramMap.get('slug');
        this.loadSeries(slug);

        const tab = this.route.snapshot.queryParamMap.get('tab') || "0";
        this.tabIndex = parseInt(tab);
        this.page = parseInt(this.route.snapshot.queryParamMap.get('page') || "0");
        this.special_page = parseInt(this.route.snapshot.queryParamMap.get('special_page') || "0");

        // get users view mode (list, column or grid)
        this.viewIndex = parseInt(localStorage.getItem('viewMode') || '0');
    }

    // load series by slug
    loadSeries(slug: any) {
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        this.http.get(`${API_BASE}/series/slug/${slug}?lang=${lang}`).subscribe((res: any) => {
            this.series = res;
            console.log(this.series)
            this.series.relation_keys = Object.keys(this.series.relations);
            this.title.setTitle(this.series.name);

            // get count of relations
            this.relation_count = 0;
            for(let key in this.series.relations){
                this.relation_count += this.series.relations[key].length;
            }
            if(this.relation_count === 0 && this.tabIndex === 2) this.tabIndex = 0; 

            // check if there is a alias with the given language
            const langName = localeToLang(lang);
            let alias = this.series.aliases.find((a: { language: string; title: any; }) => a.language === langName && a.title !== this.series.name);
            if(!alias) alias = this.series.aliases.find((a: { title: any; }) => a.title !== this.series.name);
            if(alias) this.series.alias = alias.title;

            // check if there is a description with the given language
            let description = this.series.descriptions.find((d: { language: string; }) => d.language === langName);
            if(!description) description = this.series.descriptions[0];
            if(description) this.series.description = description;

            // seperate tags
            this.series.contentTypeTags = this.series.tags.filter((t: { type: string; }) => t.type == 'content-type');
            this.series.contentRatingTags = this.series.tags.filter((t: { type: string; name: string; }) => t.type == 'content-rating' && t.name != 'Safe' && t.name);
            this.series.contentWarningTags = this.series.tags.filter((t: { type: string; }) => t.type == 'content-warning');
            this.series.otherTags = this.series.tags.filter((t: { type: string; }) => t.type != 'publication-status' && t.type != 'origin-country' && t.type != 'language' && t.type != 'content-rating' && t.type != 'content-warning' && t.type != 'content-type');

            // set selected description
            this.availableDescLangs = LANGS.filter(l => this.series.descriptions.find((d: { language: string; }) => this.langToLoc(d.language) === l.value));
            this.selectedDescLang = this.availableDescLangs.find((l: { value: string; }) => l.value === this.langToLoc(description.language));

            // load editions
            this.loadEditions();

            setTimeout(()=>{
                // fit title and alias to container and check overflow for current description
                this.fitToParent(this.seriesTitle?.nativeElement,{max: 50, height: 120});
                if(this.series.alias) this.fitToParent(this.seriesAlias?.nativeElement,{max: 25, height: 70});
                this.checkDescriptionOverflow(description?.description);
            },500);
        });
    }

    // view mode changed
    viewChanged(index: number) {
        // save to local storage
        localStorage.setItem('viewMode', index.toString());
    }

    // open tag dialog for given tag
    openTagDialog(tag:any){
        this.tagDialog.showDialog(tag);
    }

    // load editions of seris
    loadEditions(){
        this.http.get(`${API_BASE}/series/volume-editions/${this.series.id}`).subscribe((res: any) => {
            this.editions = res;

            // get users prefered content language
            const contentLang = this.auth.getUserSetting('prefered-content-language');
            const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;
            const userLang = localeToLang(lang);

            let edition;
            const queryEdition = this.route.snapshot.queryParamMap.get('edition');
            // check if query already has an edition stored
            if(queryEdition){
                // if edition includes a ':' it contains an id to find the edition
                if(queryEdition.includes(':')){
                    const id = queryEdition.split(':')[1];
                    edition = this.editions.find((e:any)=> e.id == id);
                // otherwise just find the edition with the given language and no id
                } else {
                    edition = this.editions.find((e:any)=>!e.id && e.language === queryEdition)
                }
            } else {
                edition = this.editions.find((e:any)=>e.language === userLang);
            }
            // if there is no edition in the users language just take the first one
            if(!edition) edition = this.editions[0];
            this.selectedEdition = edition;

            // load volumes for given edition
            this.loadVolumes(this.getEditionKey(edition), true, false);
            // update router params
            this.updateRouterParams();
        });
    }

    // load volumes for given edition and optionally include special volumes or exclude default volumes
    async loadVolumes(edition:any, include_special:boolean, exclude_default:boolean){
        const VOLUME_LIMIT = 24;
        const promises = [];

        // calc offsets
        const offset = this.page * VOLUME_LIMIT;
        const specialOffset = this.special_page * VOLUME_LIMIT;

        // get session_id
        const session_id = this.cookie.get('auth_session');
        const header = "Bearer " + session_id;

        // based on which volumes to fetch add requests to promises array
        if(include_special === true){
            if(exclude_default === false) promises.push(this.http.get(`${API_BASE}/series/volumes/${this.series.id}?edition=${edition}&limit=${VOLUME_LIMIT}&offset=${offset}`,{headers: {'Authorization': header}}).toPromise());
            promises.push(this.http.get(`${API_BASE}/series/volumes/${this.series.id}?edition=${edition}&special=true&limit=${VOLUME_LIMIT}&offset=${specialOffset}`,{headers: {'Authorization': header}}).toPromise());
        } else {
            promises.push(this.http.get(`${API_BASE}/series/volumes/${this.series.id}?edition=${edition}&limit=${VOLUME_LIMIT}&offset=${offset}`,{headers: {'Authorization': header}}).toPromise());
        }

        // execute all promises
        const data:any = await Promise.all(promises);

        if(exclude_default === false){
            this.volumes = data[0].volumes;
            this.max = data[0].max;
            this.volume_count = data[0].count;
        }

        if(include_special === true){
            this.special_editions = data[1].volumes;
            this.special_max = data[1].max;
            this.special_count = data[1].count;

            if(this.special_count === 0 && this.tabIndex === 1) this.tabIndex = 0; 
        }

        // show tabs
        this.tabsLoading = false;
    }

    // fit text to its parent height
    // ref = ref to element, el = element, opts = options (max: max font size, height: max height the text should have)
    fitToParent(el:any,opts:any){
        // start at max font size
        var currentFontSize = opts.max;
        // set sstyle
        el.style.fontSize = `${currentFontSize}px`;
        el.style.lineHeight = `${currentFontSize}px`;
        const availableSpace = {width: el.parentElement.clientWidth, height: opts.height};
        var currentHeight = el.clientHeight;
        // make font smaller till the height of the text fits in the available space
        while(currentHeight > availableSpace.height){
            el.style.fontSize = `${currentFontSize}px`;
            el.style.lineHeight = `${currentFontSize}px`;
            currentHeight = el.clientHeight;
            currentFontSize--;
        }
        // add class 'fits' to show text (hidden during calculation to prevent flickering if it takes longer)
        this.content.nativeElement.classList.add('fits');
    }

    // round rating
    roundRating(){
        return (Math.round(this.series?.rating * 100) / 100).toFixed(2)
    }

    // convert language to locale code
    langToLoc(lang:string){
        return langToLocale(lang);
    }

    // get current language
    currentLang(){
        return localeToLang(this.translate.currentLang || 'en');
    }

    // description changed event
    descSelected(e:any){
        // find description
        const desc = this.series.descriptions.find((d: { language: string; }) => this.langToLoc(d.language) === e.value);
        this.series.description = desc;
        // reset description state (not expanded, max height and remove clamp)
        this.expandDesc = false;
        this.desc.nativeElement.style.maxHeight = '120px';
        this.desc.nativeElement.classList.remove('clamp');
        // check overflow for new description
        this.checkingDescOverflow = true;
        this.checkDescriptionOverflow(desc.description);
    }

    // edition changed event
    editionSelected(e:any){
        // load volumes for new edition
        this.loadVolumes(this.getEditionKey(this.selectedEdition),true, false);
        // update router params
        this.updateRouterParams();
    }

    // toggle description expanded state
    toggleDesc(){
        this.expandDesc = !this.expandDesc;
        this.desc.nativeElement.classList.toggle('clamp');
        // based on expanded state set max-height of description
        if(this.expandDesc) this.desc.nativeElement.style.maxHeight = `${this.desc.nativeElement.getAttribute('data-max-height')}px`;
        else this.desc.nativeElement.style.maxHeight = '120px';
    }

    // check overflow of given description
    checkDescriptionOverflow(descText:string){
        if(!descText) return;
        // create temporary element
        const tmpDesc = document.createElement('div');
        tmpDesc.innerHTML = descText;
        tmpDesc.classList.add('tmp-description');
        const desc = this.desc.nativeElement;
        // append to parent for same styling
        desc.parentElement.appendChild(tmpDesc);
        // get before and after height (clamping)
        const tmpRectBefore = tmpDesc.getBoundingClientRect();
        const maxHeight = tmpRectBefore.height;
        desc.setAttribute('data-max-height', maxHeight.toString());
        tmpDesc.classList.add('clamp');
        const tmpRectAfter = tmpDesc.getBoundingClientRect();
        // compare to check for overflowing content
        this.descOverflowing = tmpRectAfter.height < maxHeight;
        if(this.descOverflowing) desc.classList.add('clamp');
        // remove temp element
        tmpDesc.remove();
        // show description
        this.checkingDescOverflow = false;
        desc.classList.add('loaded');
    }

    // open link dialog for given link
    openLinkDialog(link:string){
        this.linkDialog.showDialog();
        this.linkDialogURL = link;
    }

    // tab selected event
    tabSelected(){
        // update router params
        this.updateRouterParams();
    }

    // convert edition to a string (key)
    getEditionKey(edition:any){
        let key = edition.id ? `${edition.language.toLowerCase()}:${edition.id}` : edition.language;
        // add '-digital' if edition is for e-books
        if(edition.digital) key += '-digital';
        return key;
    }

    // page update event
    pageUpdate(){
        // update router params
        this.updateRouterParams();
        // load new volumes (exclude special)
        this.loadVolumes(this.getEditionKey(this.selectedEdition), false, false);
    }

    // special edition page update
    specialPageUpdate(){
        // update router params
        this.updateRouterParams();
        // load new volumes (exclude default)
        this.loadVolumes(this.getEditionKey(this.selectedEdition), true, true);
    }

    // update router params
    updateRouterParams(){
        // navigate router without reloading and without pushing to history
        this.router.navigate([], { queryParams: {edition:this.getEditionKey(this.selectedEdition),tab:this.tabIndex.toString(),page:this.page,special_page:this.special_page}, queryParamsHandling: 'merge', replaceUrl: true });
    }

    // series click event
    seriesClick(ser:any){
        // navigate to empty without location change and redirect to series page again (for seamless reload)
        this.router.navigateByUrl('/empty', { skipLocationChange: true }).then(() => {this.router.navigate(['series', ser.slug])});
    }
}
