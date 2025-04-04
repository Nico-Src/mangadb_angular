import { Component, computed, HostListener, inject, signal, ViewChild, ViewChildren } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { _, TranslateService, TranslatePipe } from '@ngx-translate/core';
import { CDN_BASE } from '../../../globals';
import { AuthService } from '../../../services/auth.service';
import { TuiButton, TuiAppearance, TuiLoader } from '@taiga-ui/core';
import { MangaCover } from '../../manga-cover/manga-cover.component'; 
import { MangaVolume } from '../../manga-volume/manga-volume.component';
import { TuiLineClamp, TuiCarousel, TuiPagination } from '@taiga-ui/kit';
import { APIService, HttpMethod } from '../../../services/api.service';
import { Router } from '@angular/router';
import { TagDialog } from '../../tag-dialog/tag-dialog.component';

@Component({
    selector: 'app-home',
    imports: [NgFor, TuiButton, TuiAppearance, MangaCover, MangaVolume, TuiLineClamp, TranslatePipe, TuiCarousel, TuiPagination, TuiLoader, NgIf, TagDialog],
    templateUrl: './home.component.html',
    styleUrl: './home.component.less'
})
export class HomeComponent {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    readonly theme = computed(() => this.auth.theme());
    readonly cdn_base = CDN_BASE;
    trendingSeries:any = [];
    recentlyAddedLoading = signal(true);
    recentlyAddedVolumes:any = [];
    recentlyAddedIndex = 0;
    recentlyAddedShownItems = 0;
    nextReleasesLoading = signal(true);
    nextReleasesVolumes:any = [];
    nextReleasesIndex = 0;
    nextReleasesShownItems = 0;
    // Slider
    @ViewChild('slider') slider: any;
    @ViewChild('sliderTrack') sliderTrack: any;
    @ViewChildren('slide') slides: any;
    showSlider = false;
    slideIndex = 0;
    // Tag Dialog
    @ViewChild('tagDialog') tagDialog: any;
    tagDialogTag: string = "";
    constructor(private translate: TranslateService, private title: Title, private router: Router) {}
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.home')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        this.recentlyAddedShownItems = Math.floor(window.innerWidth / 200);
        this.nextReleasesShownItems = this.recentlyAddedShownItems;

        // fetch trending series
        this.fetchTrendingSeries();

        setTimeout(()=>{
            // fetch recently added volumes
            this.fetchRecentlyAddedVolumes();
        }, 500);

        // fetch next releases
        setTimeout(()=>{
            // fetch recently added volumes
            this.fetchNextReleases();
        }, 1000);
    }

    // open tag dialog for given tag
    openTagDialog(tag:any){
        this.tagDialog.showDialog(tag);
    }

    // increment slide index
    prevSlide(){
        this.slideIndex = this.slideIndex -1;
        if(this.slideIndex < 0) this.slideIndex = 0;
    }

    // decrement slide index
    nextSlide(){
        this.slideIndex = this.slideIndex + 1;
        if(this.slideIndex > this.trendingSeries.length - 1) this.slideIndex = this.trendingSeries.length - 1;
    }

    // fetch trending series from api
    fetchTrendingSeries() {
        const LIMIT = 10;
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;
        // send request
        this.api.request<any>(HttpMethod.GET, `series/trending/${LIMIT}/${lang}`, {}).subscribe((res:any)=>{
            // check each descriptions overflow status
            this.slides.changes.subscribe(() => {
                for(const slide of this.slides._results){
                    const desc = slide.nativeElement.querySelector('.description');
                    const overflowing = this.checkOverflow(desc);
                    desc.classList.toggle('overflowing', overflowing);
                }
            });
            this.trendingSeries = res;
            for(const ser of this.trendingSeries){
                ser.contentTypeTags = ser.tags.filter((t: { type: string; }) => t.type == 'content-type');
                ser.contentRatingTags = ser.tags.filter((t: { type: string; name: string; }) => t.type == 'content-rating' && t.name != 'Safe' && t.name);
                ser.contentWarningTags = ser.tags.filter((t: { type: string; }) => t.type == 'content-warning');
                ser.otherTags = ser.tags.filter((t: { type: string; }) => t.type != 'publication-status' && t.type != 'origin-country' && t.type != 'language' && t.type != 'content-rating' && t.type != 'content-warning' && t.type != 'content-type');
            }
            setTimeout(() => this.showSlider = true, 100);
        });
    }

    // fetch recently added volumes from api
    fetchRecentlyAddedVolumes() {
        this.recentlyAddedLoading.set(true);
        const LIMIT = 24;
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        // send request
        this.api.request<any>(HttpMethod.GET, `volumes/recently-added/${LIMIT}/${lang}`, {}).subscribe((res:any)=>{
            this.recentlyAddedVolumes = res;
            setTimeout(() => this.recentlyAddedLoading.set(false), 250);
        });
    }

    // fetch next releases from api
    fetchNextReleases() {
        this.nextReleasesLoading.set(true);
        const LIMIT = 24;
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        // send request
        this.api.request<any>(HttpMethod.GET, `volumes/next-releases/${LIMIT}/${lang}`, {}).subscribe((res:any)=>{
            this.nextReleasesVolumes = res;
            setTimeout(() => this.nextReleasesLoading.set(false), 250);
        });
    }

    // navigate to series detail page
    seriesClick(ser: { slug: any; }){
        this.router.navigate(['series', ser.slug]);
    }

    // check overflow status of given element
    checkOverflow(element: any) {
        if(!element) return false;
        element.style.overflow = 'unset';
        element.style.flex = 'unset';
        const rect = element.getBoundingClientRect();
        element.style.overflow = 'hidden';
        element.style.flex = '1';
        const rectAfter = element.getBoundingClientRect();
        return rectAfter.height < rect.height;
    }

    // redirect to volume
    volumeClick(volume: any){
        const slug = volume.slug;
        const series = slug.split(':')[0];
        const volSlug = slug.split(':')[1];
        this.router.navigate(['volume', series, volSlug]);
    }

    @HostListener('window:resize', ['$event'])
    onResize(event:any) {
        this.recentlyAddedShownItems = Math.floor(event.target.innerWidth / 200);
        this.nextReleasesShownItems = this.recentlyAddedShownItems;
    }
}
