import { Component, computed, ElementRef, HostListener, inject, Input, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiAppearance, TuiLoader, TuiAlertService, TuiTextfield, tuiDateFormatProvider } from '@taiga-ui/core';
import { TuiElasticContainer, TuiFade, TuiSkeleton } from '@taiga-ui/kit';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APIService, HttpMethod } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { errorAlert, successAlert, getTranslation, CDN_BASE, readableDate, UNKNOWN_DATE, ANNOUNCED_DATE, localeToLang, LANGS, langToLocale } from '../../../globals';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matHistoryOutline } from '@ng-icons/material-icons/outline';
import { solarBuildings2Linear } from '@ng-icons/solar-icons/linear';
import { solarDoubleAltArrowDown, solarDoubleAltArrowUp, solarLink } from '@ng-icons/solar-icons/outline';
import { LinkWarnDialog } from '../../link-warn-dialog/link-warn-dialog.component';
import { heroDocumentMagnifyingGlass } from '@ng-icons/heroicons/outline';

@Component({
    selector: 'publisher-detail',
    imports: [ TranslatePipe, TuiButton, LinkWarnDialog, TuiAppearance, TuiElasticContainer, NgIcon, NgIf, NgFor, TuiFade, TuiLoader, ReactiveFormsModule, TuiSkeleton, FormsModule, TuiTextfield, TuiSelectModule, TuiTextfieldControllerModule],
    templateUrl: './publisher-detail.component.html',
    styleUrl: './publisher-detail.component.less',
    providers: [tuiDateFormatProvider({mode: 'YMD', separator: '/'})],
    viewProviders: [provideIcons({ solarBuildings2Linear, matHistoryOutline, solarLink, heroDocumentMagnifyingGlass, solarDoubleAltArrowDown, solarDoubleAltArrowUp })]
})
export class PublisherDetailComponent {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    private readonly alerts = inject(TuiAlertService);
    readonly theme = computed(() => this.auth.theme());
    constructor(private translate: TranslateService, private el: ElementRef, private title: Title, private route: ActivatedRoute){}
    readonly cdn_base = CDN_BASE;
    publisher: any = {};
    imgLoading: boolean = true;
    show404: boolean = false;
    linkDialogURL: string = "";

    availableDescLangs: any = [];
    selectedDescLang: any = {};
    descOverflowing: boolean = false;
    expandDesc: boolean = false;
    checkingDescOverflow: boolean = true;

    @ViewChild('content') content: any;
    @ViewChild('publisherTitle') publisherTitle: any;
    @ViewChild('desc') desc: any;
    @ViewChild('linkDialog') linkDialog: any;

    async ngOnInit(){
        this.title.setTitle(`Publisher | MangaDB`);
        // get route param (slug)
        const slug = this.route.snapshot.paramMap.get('slug');
        this.loadPublisher(slug);
    }

    // load publisher data from api
    loadPublisher(slug: any){
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        this.api.request<any>(HttpMethod.GET, `publisher/slug/${slug}?user_lang=${lang}`, {}).subscribe((res:any)=>{
            console.log(res)
            this.publisher = res;
            this.title.setTitle(`${(this.publisher.name || 'No Name')} | MangaDB`);
            // convert founding date to readable format
            this.publisher.founding_text = this.foundingDate(this.publisher?.founding_date);
            // if date is empty set to unknown
            if(this.publisher.founding_text.trim() === "") this.publisher.founding_text = UNKNOWN_DATE;
            // if date is unknown or announced string set bool to translate
            this.publisher.translate_founded = this.publisher.founding_text === UNKNOWN_DATE || this.publisher.founding_text === ANNOUNCED_DATE;

            const langName = localeToLang(lang);
            // check if there is a description with the given language
            let description = this.publisher.descriptions.find((d: { language: string; }) => d.language === langName);
            if(!description && this.publisher.descriptions.length > 0) description = this.publisher.descriptions[0];
            if(description) this.publisher['description'] = description;

            // set selected description
            this.availableDescLangs = LANGS.filter(l => this.publisher?.descriptions.find((d: { language: string; }) => langToLocale(d.language) === l.value));
            this.selectedDescLang = this.availableDescLangs.find((l: { value: string; }) => l.value === langToLocale(description?.language || 'English'));

            setTimeout(()=>{
                // fit title and alias to container and check overflow for current description
                this.fitToParent(this.publisherTitle?.nativeElement,{max: 50, height: 120});
                if(description) this.checkDescriptionOverflow(description?.description);
                else {
                    this.desc.nativeElement.classList.add('loaded');
                    this.checkingDescOverflow = false;
                }
            },500);
        }, (err:any)=>{
            this.show404 = true;
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
        if(!this.publisher) return;
        // find description
        const desc = this.publisher.descriptions.find((d: { language: string; }) => langToLocale(d.language) === e.value);
        this.publisher['description'] = desc || null;
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
}
