import { Component, computed, inject, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { _, TranslateService, TranslatePipe } from '@ngx-translate/core';
import { CDN_BASE, LANGS, localeToLang, langToLocale, ago, REPORT_TYPES, successAlert, errorAlert, getTranslation } from '../../../globals';
import { AuthService } from '../../../services/auth.service';
import { MangaCover } from '../../manga-cover/manga-cover.component';
import { NgIf, NgFor, NgForOf } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { faCopyright, faFlag, faBookmark, faStar } from '@ng-icons/font-awesome/regular';
import { faSolidPlus } from '@ng-icons/font-awesome/solid';
import { TuiButton, TuiAppearance, TuiHint, TuiAlertService, TuiTextfield } from '@taiga-ui/core';
import { TuiFade } from '@taiga-ui/kit';
import { TuiSelectModule, TuiInputModule, TuiTextfieldControllerModule, TuiTextareaModule, TuiInputDateModule } from '@taiga-ui/legacy';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { solarDoubleAltArrowDown, solarDoubleAltArrowUp, solarStar } from '@ng-icons/solar-icons/outline';
import { LinkWarnDialog } from '../../link-warn-dialog/link-warn-dialog.component';
import { TagDialog } from '../../tag-dialog/tag-dialog.component';
import { TuiSegmented } from '@taiga-ui/kit';
import { TuiBadge } from '@taiga-ui/kit';
import { MangaVolume } from '../../manga-volume/manga-volume.component';
import { MangaSeriesListComponent } from '../../manga-series-list/manga-series-list.component';
import { MangaSeriesColumnComponent } from '../../manga-series-column/manga-series-column.component';
import { MangaSeriesGridComponent } from '../../manga-series-grid/manga-series-grid.component';
import { TuiElasticContainer, TuiAccordion } from '@taiga-ui/kit';
import { TuiPagination } from '@taiga-ui/kit';
import { tablerList, tablerLayoutColumns, tablerLayoutGrid } from '@ng-icons/tabler-icons';
import { CookieService } from 'ngx-cookie-service';
import { TuiTable } from '@taiga-ui/addon-table';
import { heroArrowTurnDownRight, heroDocumentMagnifyingGlass } from '@ng-icons/heroicons/outline';
import { TuiLoader } from '@taiga-ui/core';
import { TuiInputNumber } from '@taiga-ui/kit';
import { APIService, HttpMethod } from '../../../services/api.service';
import { UserRole } from '../../../models/user';
import { SeriesRatingDialog } from '../../series-rating-dialog/series-rating-dialog.component';
import { ReadingStatusDialog } from '../../reading-status-dialog/reading-status-dialog.component';
import { SeriesListDialog } from '../../series-list-dialog/series-list-dialog.component';

@Component({
    selector: 'series-detail',
    imports: [MangaCover, SeriesRatingDialog, ReadingStatusDialog, SeriesListDialog, NgIf, NgFor, NgForOf, NgIcon, TuiInputNumber, TuiInputDateModule, TuiInputModule, TuiTextfield, TuiTextareaModule, TuiTable, TuiAccordion, TuiLoader, MangaVolume, MangaSeriesListComponent, TagDialog, MangaSeriesColumnComponent, MangaSeriesGridComponent, TuiButton, TuiPagination, TuiAppearance, TuiElasticContainer, TuiBadge, TranslatePipe, TuiSegmented, TuiHint, TuiFade, TuiSelectModule,TuiTextfieldControllerModule,ReactiveFormsModule,FormsModule, LinkWarnDialog],
    templateUrl: './series-detail.component.html',
    styleUrl: './series-detail.component.less',
    viewProviders: [provideIcons({ faCopyright, heroDocumentMagnifyingGlass, solarStar, heroArrowTurnDownRight, faFlag, faSolidPlus, faBookmark, faStar, solarDoubleAltArrowDown, solarDoubleAltArrowUp, tablerList, tablerLayoutColumns, tablerLayoutGrid })],
})
export class SeriesDetailComponent {
    private readonly api = inject(APIService);
    private readonly alerts = inject(TuiAlertService);
    private readonly auth = inject(AuthService);
    readonly theme = computed(() => this.auth.theme());
    readonly cdn_base = CDN_BASE;
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
    // Report Dialog
    showReportDialog: boolean = false;
    showReportViewDialog: boolean = false;
    reportsLoading: boolean = false;
    reports: any = [];
    reportTypes:any = REPORT_TYPES.filter((t:any)=>t.type === 'series');
    selectedReportType: any = this.reportTypes[0];
    reportDescription: string = "";
    // Contributors
    hasManyContributors: boolean = false;
    showMoreContributors: boolean = false;
    // 404
    show404: boolean = false;
    @ViewChild('seriesTitle') seriesTitle: any;
    @ViewChild('seriesAlias') seriesAlias: any;
    @ViewChild('content') content: any;
    @ViewChild('desc') desc: any;
    @ViewChild('linkDialog') linkDialog: any;
    @ViewChild('tagDialog') tagDialog: any;
    @ViewChild('reportDialog') reportDialog: any;
    @ViewChild('reportViewDialog') reportViewDialog: any;
    @ViewChild('ratingDialog') ratingDialog: any;
    @ViewChild('readingDialog') readingDialog: any;
    @ViewChild('listDialog') listDialog: any;
    constructor(private translate: TranslateService, private cookie: CookieService, private title: Title, private route: ActivatedRoute, private router: Router) { }

    async ngOnInit() {
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

        this.route.paramMap.subscribe(()=>{
            if(!this.series?.id) return;
            this.tabIndex = 0;
            this.page = 0;
            this.special_page = 0;

            // reset description state (not expanded, max height and remove clamp)
            this.expandDesc = false;
            this.desc.nativeElement.style.maxHeight = '120px';
            this.desc.nativeElement.classList.remove('clamp');
            // check overflow for new description
            this.checkingDescOverflow = true;

            this.hasManyContributors = false;
            this.showMoreContributors = false;

            this.content.nativeElement.classList.remove('fits');

            [this.readingDialog, this.listDialog, this.ratingDialog].forEach((dialog)=>{
                dialog.reset();
            });

            const slug = this.route.snapshot.paramMap.get('slug');
            this.loadSeries(slug);
        });
    }

    // load series by slug
    loadSeries(slug: any) {
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        this.api.request<any>(HttpMethod.GET, `series/slug/${slug}?lang=${lang}`, {}).subscribe((res)=>{
            this.series = res;
            console.log(this.series)
            this.series['relation_keys'] = Object.keys(this.series.relations);
            this.title.setTitle(`${(this.series.name || 'No Name')} | MangaDB`);

            // get count of relations
            this.relation_count = 0;
            for(let key in this.series.relations){
                this.relation_count += this.series.relations[key].length;
            }
            if(this.relation_count === 0 && this.tabIndex === 2) this.tabIndex = 0; 

            // put editions in publisher
            for(const publisher of this.series.publishers || []){
                const editions = this.series.publisher_editions?.filter((e:any)=>e.publisher_id === publisher.id) || [];
                publisher['editions'] = editions;
            }

            // check if there is a alias with the given language
            const langName = localeToLang(lang);
            let alias = this.series.aliases.find((a: { language: string; title: any; }) => a.language === langName && a.title !== this.series?.name);
            if(!alias) alias = this.series.aliases.find((a: { title: any; }) => a.title !== this.series?.name);
            if(alias) this.series['alias'] = alias.title;

            // group aliases
            const groupedAliases:any = [];
            for(const alias of this.series.aliases){
                if(!groupedAliases.find((ga:any) => ga.title === alias.title)){
                    groupedAliases.push({
                        title: alias.title,
                        languages: [{
                            name: alias.language
                        }]
                    });
                } else {
                    groupedAliases.find((ga:any) => ga.title === alias.title).languages.push({
                        name: alias.language
                    });
                }
            }
            this.series['groupedAliases'] = groupedAliases;

            // check if contributors should be collapsed
            if(this.series.contributors.length > 8){
                this.series.contributors_collapsed = this.series.contributors.slice(0,8);
                this.hasManyContributors = true;
            }

            // check if there is a description with the given language
            let description = this.series.descriptions.find((d: { language: string; }) => d.language === langName);
            if(!description && this.series.descriptions.length > 0) description = this.series.descriptions[0];
            if(description) this.series['description'] = description;

            // seperate tags
            this.series['contentTypeTags'] = this.series.tags.filter((t: { type: string; }) => t.type == 'content-type');
            this.series['contentRatingTags'] = this.series.tags.filter((t: { type: string; name: string; }) => t.type == 'content-rating' && t.name != 'Safe' && t.name);
            this.series['contentWarningTags'] = this.series.tags.filter((t: { type: string; }) => t.type == 'content-warning');
            this.series['otherTags'] = this.series.tags.filter((t: { type: string; }) => t.type != 'publication-status' && t.type != 'origin-country' && t.type != 'language' && t.type != 'content-rating' && t.type != 'content-warning' && t.type != 'content-type');

            // set selected description
            this.availableDescLangs = LANGS.filter(l => this.series?.descriptions.find((d: { language: string; }) => this.langToLoc(d.language) === l.value));
            this.selectedDescLang = this.availableDescLangs.find((l: { value: string; }) => l.value === this.langToLoc(description?.language || 'English'));

            // load editions
            this.loadEditions();

            setTimeout(()=>{
                // fit title and alias to container and check overflow for current description
                this.fitToParent(this.seriesTitle?.nativeElement,{max: 50, height: 120});
                if(this.series && this.series['alias']) this.fitToParent(this.seriesAlias?.nativeElement,{max: 25, height: 70});
                if(description) this.checkDescriptionOverflow(description?.description);
                else {
                    this.desc.nativeElement.classList.add('loaded');
                    this.checkingDescOverflow = false;
                }
            },500);
        }, (err)=>{
            this.show404 = true;
        });
    }

    // toggle contributors collapsed state (show more, less)
    toggleContributors(){
        this.showMoreContributors = !this.showMoreContributors;
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
        this.api.request<any>(HttpMethod.GET, `series/volume-editions/${this.series?.id}`, {}).subscribe((res:any)=>{
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
            if(exclude_default === false) promises.push(this.api.request<any>(HttpMethod.GET, `series/volumes/${this.series?.id}?edition=${edition}&limit=${VOLUME_LIMIT}&offset=${offset}`,{}).toPromise());
            promises.push(this.api.request<any>(HttpMethod.GET, `series/volumes/${this.series?.id}?edition=${edition}&special=true&limit=${VOLUME_LIMIT}&offset=${specialOffset}`,{}).toPromise());
        } else {
            promises.push(this.api.request<any>(HttpMethod.GET, `series/volumes/${this.series?.id}?edition=${edition}&limit=${VOLUME_LIMIT}&offset=${offset}`,{}).toPromise());
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
        return (Math.round((this.series?.rating || 0) * 100) / 100).toFixed(2)
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
        if(!this.series) return;
        // find description
        const desc = this.series.descriptions.find((d: { language: string; }) => this.langToLoc(d.language) === e.value);
        this.series['description'] = desc || null;
        // reset description state (not expanded, max height and remove clamp)
        this.expandDesc = false;
        this.desc.nativeElement.style.maxHeight = '120px';
        this.desc.nativeElement.classList.remove('clamp');
        // check overflow for new description
        this.checkingDescOverflow = true;
        this.checkDescriptionOverflow(desc?.description || '');
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
        this.router.navigate(['series', ser.slug]);
    }

    // redirect to amazon search in given language and with given text
    searchAmazon(alias:any,lang:any){
        switch(lang.name){
            case 'Japanese':
                window.open('https://www.amazon.co.jp/s?k='+alias.title,'_blank');
                break;
            case 'English':
                window.open('https://www.amazon.com/s?k='+alias.title,'_blank');
                break;
            case 'German':
                window.open('https://www.amazon.de/s?k='+alias.title,'_blank');
                break;
            case 'French':
                window.open('https://www.amazon.fr/s?k='+alias.title,'_blank');
                break;
            case 'Spanish':
                window.open('https://www.amazon.es/s?k='+alias.title,'_blank');
                break;
            case 'Italian':
                window.open('https://www.amazon.it/s?k='+alias.title,'_blank');
                break;
        }
    }

    // show report dialog and load reports
    openReportDialog(){
        this.reportsLoading = true;
        this.showReportDialog = true;
        this.loadReports();
    }

    // show report view dialog
    openReportViewDialog(){
        this.showReportDialog = false;
        this.showReportViewDialog = true;
    }

    // show rating dialog
    openRatingDialog(){
        // if not logged in show error
        if(!this.auth.isLoggedIn()){
            // TODO translate
            errorAlert(this.alerts, 'You need to be logged in to do this.', undefined, this.translate);
            return;
        }
        // load ratings
        this.ratingDialog.showDialog();
    }

    // show rating dialog
    openReadingDialog(){
        // if not logged in show error
        if(!this.auth.isLoggedIn()){
            // TODO translate
            errorAlert(this.alerts, 'You need to be logged in to do this.', undefined, this.translate);
            return;
        }
        // load reading status
        this.readingDialog.showDialog();
    }

    // show rating dialog
    openListDialog(){
        // if not logged in show error
        if(!this.auth.isLoggedIn()){
            // TODO translate
            errorAlert(this.alerts, 'You need to be logged in to do this.', undefined, this.translate);
            return;
        }
        // load reading status
        this.listDialog.showDialog();
    }

    // fetch updated ratings
    updateRatings(){
        if(!this.series) return;
        this.api.request<any>(HttpMethod.GET, `series/ratings/${this.series?.slug}`, {}).subscribe((res:any)=>{
            if(!this.series) return;
            this.series.rating = res.rating;
            this.series.rating_count = res.rating_count;
            this.series.ratings = res.ratings;
            this.ratingDialog.updateChart();
        });
    }

    // load reports from api
    loadReports(){
        this.api.request<any>(HttpMethod.GET, `reports/series/${this.series?.id}`, {}).subscribe((res)=>{
            this.reports = res;
            this.reportsLoading = false;
        });
    }

    // if backdrop of dialog is clicked close it
    reportDialogClick(event:any){
        if (event.target === this.reportDialog.nativeElement) {
            this.showReportDialog = false;
        }
    }

    // if backdrop of dialog is clicked close it
    reportViewDialogClick(event:any){
        if (event.target === this.reportViewDialog.nativeElement) {
            this.showReportViewDialog = false;
        }
    }

    // return time that has passed since given datetime
    agoTime(time:string){
        return ago(time, this.translate.currentLang);
    }

    // add report to series
    async addReport(){
        // if user isnt logged in show error
        if(!this.auth.isLoggedIn()){
            const msg = await getTranslation(this.translate, 'report-dialog.login-required');
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }

        const user = this.auth.getUser();
    
        // if user is not admin he doesnt have the permissions to add a report => show error
        if(user.role !== UserRole.ADMIN){
            const msg = await getTranslation(this.translate, 'report-dialog.role-required');
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }
    
        // check if description is set if not show error
        if(this.reportDescription.trim() === ''){
            const msg = await getTranslation(this.translate, 'report-dialog.empty-desc');
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }

        this.api.request<any>(HttpMethod.POST, `reports/add/series`, 
            {item_id: this.series?.id, type: this.selectedReportType.key, description: this.reportDescription},
            'text'
        ).subscribe(async (res)=>{
            this.reportDescription = "";
            this.showReportDialog = false;
            // reload reports
            this.loadReports();
            // show success message
            const msg = await getTranslation(this.translate, 'report-dialog.success');
            successAlert(this.alerts, msg, undefined, this.translate);
        },(err)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }

    // redirect to publisher
    publisherClick(publisher:any){
        this.router.navigate(['publisher',publisher.slug]);
    }

    // redirect to contributor
    contributorClick(contributor: any){
        this.router.navigate(['contributor',contributor.slug]);
    }

    // redirect to volume
    volumeClick(volume: any){
        const slug = volume.slug;
        const series = slug.split(':')[0];
        const volSlug = slug.split(':')[1];
        this.router.navigate(['volume', series, volSlug]);
    }
}
