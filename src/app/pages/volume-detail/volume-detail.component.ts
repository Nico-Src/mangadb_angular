import { Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiLoader, TuiAlertService, TuiTextfield, tuiDateFormatProvider, TuiHint, TuiButton } from '@taiga-ui/core';
import { TuiAccordion, TuiFade } from '@taiga-ui/kit';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APIService, HttpMethod } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { CDN_BASE, readableDate, langToLocale, errorAlert, successAlert, getTranslation, REPORT_TYPES, ago } from '../../../globals';
import { TuiSelectModule, TuiTextareaModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { solarDoubleAltArrowDown, solarDoubleAltArrowUp, solarLink, solarNotebook } from '@ng-icons/solar-icons/outline';
import { LinkWarnDialog } from '../../link-warn-dialog/link-warn-dialog.component';
import { MangaCover } from '../../manga-cover/manga-cover.component';
import { faBookmark, faCopyright, faFlag } from '@ng-icons/font-awesome/regular';
import { tablerCalendar, tablerChartScatter3d, tablerLanguage, tablerNotebook, tablerRulerMeasure } from '@ng-icons/tabler-icons';
import { matBarcodeOutline, matFaceOutline } from '@ng-icons/material-icons/outline';
import { faSolidMinus, faSolidPlus } from '@ng-icons/font-awesome/solid';
import { solarAltArrowLeftBold, solarAltArrowRightBold } from '@ng-icons/solar-icons/bold';
import { VolumeJumpDialog } from '../../volume-jump-dialog/volume-jump-dialog.component';
import { VolumeGalleryDialog } from '../../volume-gallery-dialog/volume-gallery-dialog.component';
import { lucideImage } from '@ng-icons/lucide';
import { UserRole } from '../../../models/user';
import { VolumeListDialog } from '../../volume-list-dialog/volume-list-dialog.component';

@Component({
    selector: 'volume-detail',
    imports: [ TranslatePipe, MangaCover, VolumeListDialog, VolumeJumpDialog, TuiTextareaModule, TuiAccordion, TuiLoader, VolumeGalleryDialog, TuiFade, TuiButton, LinkWarnDialog, TuiHint, NgIcon, NgIf, NgFor, ReactiveFormsModule, FormsModule, TuiTextfield, TuiSelectModule, TuiTextfieldControllerModule],
    templateUrl: './volume-detail.component.html',
    styleUrl: './volume-detail.component.less',
    providers: [tuiDateFormatProvider({mode: 'YMD', separator: '/'})],
    viewProviders: [provideIcons({ solarLink, faCopyright, lucideImage, faSolidPlus, faSolidMinus, solarAltArrowLeftBold, solarAltArrowRightBold, faBookmark, tablerChartScatter3d, solarDoubleAltArrowDown, solarDoubleAltArrowUp, tablerLanguage, solarNotebook, matFaceOutline, tablerCalendar, tablerRulerMeasure, matBarcodeOutline, tablerNotebook, faFlag })]
})
export class VolumeDetailComponent {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    private readonly alerts = inject(TuiAlertService);
    readonly theme = computed(() => this.auth.theme());
    constructor(private translate: TranslateService, private el: ElementRef, private title: Title, private route: ActivatedRoute, private router: Router){}
    readonly cdn_base = CDN_BASE;
    volume: any = {};
    show404: boolean = false;
    loading: boolean = true;
    linkDialogURL: string = "";
    infoIndex: number = 0;
    togglingCollected: boolean = false;

    expandDesc: boolean = false;
    descOverflowing: boolean = false;
    checkingDescOverflow: boolean = true;

    // Report Dialog
    showReportDialog: boolean = false;
    showReportViewDialog: boolean = false;
    reportsLoading: boolean = false;
    reports: any = [];
    reportTypes:any = REPORT_TYPES.filter((t:any)=>t.type === 'volume');
    selectedReportType: any = this.reportTypes[0];
    reportDescription: string = "";

    @ViewChild('content') content: any;
    @ViewChild('volumeTitle') volumeTitle: any;
    @ViewChild('desc') desc: any;
    @ViewChild('linkDialog') linkDialog: any;
    @ViewChild('jumpDialog') jumpDialog: any;
    @ViewChild('galleryDialog') galleryDialog: any;
    @ViewChild('reportDialog') reportDialog: any;
    @ViewChild('reportViewDialog') reportViewDialog: any;
    @ViewChild('listDialog') listDialog: any;

    async ngOnInit(){
        this.title.setTitle(`Volume | MangaDB`);

        this.route.paramMap.subscribe(()=>{
            if(!this.volume?.id) return;
            this.show404 = false;
            this.galleryDialog.setTabIndex(0);

            // reset description state (not expanded, max height and remove clamp)
            this.expandDesc = false;
            this.checkingDescOverflow = true;

            this.content.nativeElement.classList.remove('fits');

            setTimeout(()=>{
                const slug = this.route.snapshot.paramMap.get('slug');
                const series = this.route.snapshot.paramMap.get('series');
                this.loadVolume(series, slug);
            },200);
        });

        const slug = this.route.snapshot.paramMap.get('slug');
        const series = this.route.snapshot.paramMap.get('series');
        this.loadVolume(series, slug);
    }

    // load publisher data from api
    loadVolume(seriesSlug: any, slug: any){
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        const completeSlug = `${seriesSlug}:${slug}`;

        this.api.request<any>(HttpMethod.GET, `volumes/slug/${completeSlug}?user_lang=${lang}`, {}).subscribe((res:any)=>{
            // calc how many images there are for this volume
            let imageCount = 0;
            if(res.cover_path) imageCount++;
            if(res.back_cover_path) imageCount++;
            if(res.spine_cover_path) imageCount++;
            this.volume = res;
            this.volume.images = this.volume.images.filter((i:any)=>i.name);
            // any extras
            imageCount += this.volume.images.length;
            this.volume.imageCount = imageCount;
            this.volume.measures_text = this.formatMeasures();
            if(this.volume.extras && this.volume.extras.trim() !== ''){
                const tmpExtraObj = {
                    name: this.volume.extras.split(':')[0],
                    items: this.volume.extras.split(':')[1].split(';').filter((i:any) => i.trim() !== '')
                };
                const extrasObj:any = { name: tmpExtraObj.name, items: [] };
                if(tmpExtraObj.items){
                    for(let item of tmpExtraObj.items){
                        const regex = /\[(\d+)\]/g;
                        const matches = [...item.matchAll(regex)];
                        
                        const images = matches.map(match => match[1]);
                        
                        // If you want to remove the brackets and IDs from the original string, you can do this:
                        const updatedItem = item.replace(/\[\d+\]/g, '');
                        item = updatedItem;
                        extrasObj.items.push({
                            html: updatedItem,
                            images
                        });
                    }
                }
                this.volume.extrasObj = extrasObj;
            }
            this.loading = false;
            console.log(this.volume)

            this.title.setTitle(`${this.volume.name} | MangaDB`);

            setTimeout(() => {
                this.fitToParent(this.volumeTitle.nativeElement,{max: 50, height: 100});
            }, 250);
        }, (err:any)=>{
            this.show404 = true;
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

    // open link dialog for given link
    openLinkDialog(link:string){
        this.linkDialog.showDialog();
        this.linkDialogURL = link;
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

    // open jump dialog
    openJumpDialog(){
        this.jumpDialog.showDialog(this.volume.index);
    }

    // jump to given volume
    async jumpTo(e:any){
        if(e == this.volume.index){
            const msg = await getTranslation(this.translate, `volume-jump-dialog.already`);
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }

        this.api.request<string>(HttpMethod.GET, `volumes/index/${this.volume.id}/${e}`, {}, 'text').subscribe((res)=>{
            this.visitVolume(res);
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
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

    // load reports from api
    loadReports(){
        this.api.request<any>(HttpMethod.GET, `reports/volume/${this.volume?.id}`, {}).subscribe((res)=>{
            this.reports = res;
            this.reportsLoading = false;
        }, (err) => {
            this.reportsLoading = false;
        });
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

        this.api.request<any>(HttpMethod.POST, `reports/add/volume`, 
            {item_id: this.volume?.id, type: this.selectedReportType.key, description: this.reportDescription},
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

    // return time that has passed since given datetime
    agoTime(time:string){
        return ago(time, this.translate.currentLang);
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

    // toggle description expanded state
    toggleDesc(){
        this.expandDesc = !this.expandDesc;
        this.desc.nativeElement.classList.toggle('clamp');
        // based on expanded state set max-height of description
        if(this.expandDesc) this.desc.nativeElement.style.maxHeight = `${this.desc.nativeElement.getAttribute('data-max-height')}px`;
        else this.desc.nativeElement.style.maxHeight = '120px';
    }

    langToLoc(lang:string){
        return langToLocale(lang);
    }

    // format measures of volume
    formatMeasures(include_depth: boolean = false){
        // if there are no measures set, return '-'
        if(!this.volume?.measures) return '-';
        const parts = this.volume.measures.split(' '); // 15.20 x 01.20 x 20.80 cm
                
        // concetenate width, depth and height with 'x' and 'cm'
        const w = parseFloat(parts[0]);
        const d = parseFloat(parts[2]);
        const h = parseFloat(parts[4]);
        if(include_depth) return `${w} x ${d} x ${h} cm`;
        else return `${w} x ${h} cm`;
    }

    // convert date to a more human-readable format
    releaseDate(date:string){
        return readableDate(date, this.translate.currentLang, true);
    }

    // redirect to volume
    visitVolume(slug:string){
        if(!slug) return;
        const series = slug.split(':')[0];
        const volume = slug.split(':')[1];
        this.router.navigate(['volume', series, volume], { replaceUrl: true });
    }

    // toggle collection state
    toggleCollectionState(){
        // if not logged in show error
        if(!this.auth.isLoggedIn()){
            // TODO translate
            errorAlert(this.alerts, 'You need to be logged in to do this.', undefined, this.translate);
            return;
        }
    
        this.togglingCollected = true;

        this.api.request<any>(HttpMethod.GET, `volumes/toggle-collection/id/${this.volume.id}`, {}).subscribe((res)=>{
            this.volume.collected = res;
            this.togglingCollected = false;
            // TODO translate
            if(res) successAlert(this.alerts, 'Successfully added to collection.', undefined, this.translate);
            else successAlert(this.alerts, 'Successfully removed from collection.', undefined, this.translate);
        }, (err)=>{
            this.togglingCollected = false;
        });
    }

    // open dialog for specific extras image
    openGalleryImage(index:any){
        // 3 is the base index because there are 4 tabs by default (we need to skip them), plus the index of the image
        const imageIndex = 3 + (index+1); 
        this.galleryDialog.setTabIndex(imageIndex);
        this.galleryDialog.showDialog();
    }

    open3D(){
        this.galleryDialog.setTabIndex((3 + this.volume.images?.length + 1));
        this.galleryDialog.showDialog();
    }
}
