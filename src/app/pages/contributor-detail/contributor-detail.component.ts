import { Component, computed, ElementRef, HostListener, inject, Input, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiAppearance, TuiLoader, TuiAlertService, TuiTextfield, tuiDateFormatProvider } from '@taiga-ui/core';
import { TuiElasticContainer, TuiFade, TuiPagination, TuiSegmented, TuiSkeleton } from '@taiga-ui/kit';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APIService, HttpMethod } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { CDN_BASE, readableDate, UNKNOWN_DATE, ANNOUNCED_DATE, localeToLang, LANGS, langToLocale } from '../../../globals';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matHistoryOutline } from '@ng-icons/material-icons/outline';
import { solarBuildings2Linear } from '@ng-icons/solar-icons/linear';
import { solarDoubleAltArrowDown, solarDoubleAltArrowUp, solarLink } from '@ng-icons/solar-icons/outline';
import { LinkWarnDialog } from '../../link-warn-dialog/link-warn-dialog.component';
import { heroDocumentMagnifyingGlass } from '@ng-icons/heroicons/outline';
import { tablerSortAscendingLetters, tablerSortDescendingLetters, tablerSortAscending, tablerSortDescending, tablerList, tablerLayoutColumns, tablerLayoutGrid } from '@ng-icons/tabler-icons';
import { MangaSeriesColumnComponent } from '../../manga-series-column/manga-series-column.component';
import { MangaSeriesGridComponent } from '../../manga-series-grid/manga-series-grid.component';
import { MangaSeriesListComponent } from '../../manga-series-list/manga-series-list.component';

@Component({
    selector: 'contributor-detail',
    imports: [ TranslatePipe, MangaSeriesColumnComponent, MangaSeriesGridComponent, MangaSeriesListComponent, LinkWarnDialog, TuiSegmented, TuiPagination, TuiAppearance, TuiElasticContainer, NgIcon, NgIf, NgFor, TuiFade, TuiLoader, ReactiveFormsModule, TuiSkeleton, FormsModule, TuiTextfield, TuiSelectModule, TuiTextfieldControllerModule],
    templateUrl: './contributor-detail.component.html',
    styleUrl: './contributor-detail.component.less',
    providers: [tuiDateFormatProvider({mode: 'YMD', separator: '/'})],
    viewProviders: [provideIcons({ solarBuildings2Linear, matHistoryOutline, solarLink, heroDocumentMagnifyingGlass, solarDoubleAltArrowDown, solarDoubleAltArrowUp, tablerSortAscendingLetters, tablerSortDescendingLetters, tablerSortAscending, tablerSortDescending, tablerList, tablerLayoutColumns, tablerLayoutGrid })]
})
export class ContributorDetailComponent {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    private readonly alerts = inject(TuiAlertService);
    readonly theme = computed(() => this.auth.theme());
    constructor(private translate: TranslateService, private el: ElementRef, private title: Title, private route: ActivatedRoute, private router: Router){}
    readonly cdn_base = CDN_BASE;
    contributor: any = {};
    works: any = [];
    imgLoading: boolean = true;
    show404: boolean = false;
    linkDialogURL: string = "";

    availableDescLangs: any = [];
    selectedDescLang: any = {};
    descOverflowing: boolean = false;
    expandDesc: boolean = false;
    checkingDescOverflow: boolean = true;

    search:string = "";
    currentSearch:string = "";
    prevSearch:string = "";
    currentPage:number = 0;
    maxPages:number= 10;
    loading:boolean = true;
    viewIndex:number = 0;
    orders:any = [
        {key: 'name', value: 'name-asc', icon: 'tablerSortAscendingLetters'},
        {key: 'name', value: 'name-desc', icon: 'tablerSortDescendingLetters'},
        {key: 'added', value: 'added-asc', icon: 'tablerSortAscending'},
        {key: 'added', value: 'added-desc', icon: 'tablerSortDescending'},
    ]
    selectedOrder: any = this.orders[0];

    @ViewChild('content') content: any;
    @ViewChild('contributorTitle') contributorTitle: any;
    @ViewChild('desc') desc: any;
    @ViewChild('linkDialog') linkDialog: any;

    async ngOnInit(){
        this.title.setTitle(`Contributor | MangaDB`);

        // get query params (also on change)
        this.route.queryParams.subscribe(params => {
            if(params['order']) this.selectedOrder = this.orders.find((o: { value: any; }) => o.value === params['order']);
            if(params['page']) this.currentPage = parseInt(params['page']);
            if(params['search']) this.search = this.prevSearch = this.currentSearch = params['search'];
        });

        // get users view mode (list, column or grid)
        this.viewIndex = parseInt(localStorage.getItem('viewMode') || '0');

        this.route.paramMap.subscribe(()=>{
            if(!this.contributor?.id) return;
            this.currentPage = 0;
            this.search = this.currentSearch = this.prevSearch = "";
            this.selectedOrder = this.orders[0];
            this.imgLoading = true;
            this.loading = true;
            this.show404 = false;

            // reset description state (not expanded, max height and remove clamp)
            this.expandDesc = false;
            this.desc.nativeElement.style.maxHeight = '120px';
            this.desc.nativeElement.classList.remove('clamp');
            // check overflow for new description
            this.checkingDescOverflow = true;

            this.content.nativeElement.classList.remove('fits');

            const slug = this.route.snapshot.paramMap.get('slug');
            this.loadContributor(slug);
        });

        // get route param (slug)
        this.updateQueryParams(true);
    }

    // update query params
    updateQueryParams(first: boolean = false){
        // navigate router without reloading and without pushing to history
        this.router.navigate([], { queryParams: {order: this.selectedOrder.value, page: this.currentPage, search: this.search.trim() !== '' ? this.search : null}, queryParamsHandling: 'merge', replaceUrl: true });
        // reload series after
        const slug = this.route.snapshot.paramMap.get('slug');
        if(first) this.loadContributor(slug);
        else this.loadWorks();
    }

    // load publisher data from api
    loadContributor(slug: any){
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        this.api.request<any>(HttpMethod.GET, `contributor/slug/${slug}?user_lang=${lang}`, {}).subscribe((res:any)=>{
            this.contributor = res;
            this.title.setTitle(`${(`${this.contributor.last_name?.toUpperCase()} ${this.contributor.first_name}`).trim()} | MangaDB`);

            const langName = localeToLang(lang);
            // check if there is a description with the given language
            let description = this.contributor.descriptions.find((d: { language: string; }) => d.language === langName);
            if(!description && this.contributor.descriptions.length > 0) description = this.contributor.descriptions[0];
            if(description) this.contributor['description'] = description;

            // set selected description
            this.availableDescLangs = LANGS.filter(l => this.contributor?.descriptions.find((d: { language: string; }) => langToLocale(d.language) === l.value));
            this.selectedDescLang = this.availableDescLangs.find((l: { value: string; }) => l.value === langToLocale(description?.language || 'English'));

            this.loadWorks();

            setTimeout(()=>{
                // fit title and alias to container and check overflow for current description
                this.fitToParent(this.contributorTitle?.nativeElement,{max: 50, height: 120});
                if(description) this.checkDescriptionOverflow(description?.description);
                else {
                    this.desc.nativeElement.classList.add('loaded');
                    this.checkingDescOverflow = false;
                }
            },500);
        }, (err:any)=>{
            this.show404 = true;
            this.loading = false;
        });
    }

    // load published works
    loadWorks(){
        const LIMIT = 12;

        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        const offset = this.currentPage * LIMIT;

        this.api.request<any>(HttpMethod.POST, `contributor/works/${this.contributor.id}?user_lang=${lang}`, {order: this.selectedOrder.value, limit: 12, offset, search: this.search, user_lang: lang}).subscribe((res:any)=>{
            this.maxPages = res.max;

            // check if aliases were matched in backend
            for(const item of res.works){
                // if there are no aliases or name matches search keep it as it is
                if(!item.aliases || item.name?.toLowerCase()?.includes(this.search.toLocaleLowerCase())) continue;
                // else check aliases and add with found alias as name
                const aliases = (item.aliases as string).split(',');
                for(const alias of aliases){
                    if(alias.toLowerCase().includes(this.search.toLowerCase())){
                        item.alias = alias;
                        break;
                    }
                }
            }

            this.works = res.works;
            this.loading = false;
        });
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

    // description changed event
    descSelected(e:any){
        if(!this.contributor) return;
        // find description
        const desc = this.contributor.descriptions.find((d: { language: string; }) => langToLocale(d.language) === e.value);
        this.contributor['description'] = desc || null;
        // reset description state (not expanded, max height and remove clamp)
        this.expandDesc = false;
        this.desc.nativeElement.style.maxHeight = '120px';
        this.desc.nativeElement.classList.remove('clamp');
        // check overflow for new description
        this.checkingDescOverflow = true;
        this.checkDescriptionOverflow(desc?.description || '');
    }

    // open link dialog for given link
    openLinkDialog(link:string){
        this.linkDialog.showDialog();
        this.linkDialogURL = link;
    }

    // convert date to a more human-readable format
    foundingDate(date:string){
        return readableDate(date, this.translate.currentLang, true);
    }

    // toggle description expanded state
    toggleDesc(){
        this.expandDesc = !this.expandDesc;
        this.desc.nativeElement.classList.toggle('clamp');
        // based on expanded state set max-height of description
        if(this.expandDesc) this.desc.nativeElement.style.maxHeight = `${this.desc.nativeElement.getAttribute('data-max-height')}px`;
        else this.desc.nativeElement.style.maxHeight = '120px';
    }

    // convert headquarter country to locale
    headquarterToLocale(str:any){
        switch(str){
            case "Japan": return 'jpn';
            case "Italy": return 'it';
            case "Spain": return "es";
            case "France": return "fr";
            case "Germany": return "de";
            case "United States": return "us";
            case "Belgium": return "be";
            case "Switzerland": return "ch";
            case "South Korea": return "kor";
            case "Great Britain": return "en";
            case "Argentina": return "ar";
            case "Austria": return "at";
            case "China": return "cn";
            case "Canada": return "ca";
            default: return 'en';
        }
    }

    // view mode changed
    viewChanged(index: number) {
        // save to local storage
        localStorage.setItem('viewMode', index.toString());
    }

    // keydown handler for search input
    searchKeyDown(event: KeyboardEvent) {
        if(event.key === 'Enter') {
            // check if search is different from previous search
            if(this.search !== this.prevSearch) {
                this.currentPage = 0;
                this.prevSearch = this.search;
                this.currentSearch = this.search;
                // update query params
                this.updateQueryParams();
            }
        }
    }

    // redirect to other publisher
    relationClick(slug:string){
        this.router.navigate(['contributor',slug]);
    }

    // redirect to series
    seriesClick(slug:string){
        this.router.navigate(['series',slug]);
    }
}
