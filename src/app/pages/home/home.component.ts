import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, HostListener, inject, signal, ViewChild, ViewChildren } from '@angular/core';
import { NgFor } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { _, TranslateService, TranslatePipe } from '@ngx-translate/core';
import { API_BASE, DEFAULT_SETTINGS, CDN_BASE } from '../../../globals';
import { AuthService } from '../../../services/auth.service';
import { TuiButton, TuiAppearance } from '@taiga-ui/core';
import { MangaCover } from '../../manga-cover/manga-cover.component'; 
import { TuiLineClamp } from '@taiga-ui/kit';

@Component({
    selector: 'app-home',
    imports: [NgFor, TuiButton, TuiAppearance, MangaCover, TuiLineClamp, TranslatePipe],
    templateUrl: './home.component.html',
    styleUrl: './home.component.less'
})
export class HomeComponent {
    private auth = inject(AuthService);
    readonly cdn_base = CDN_BASE;
    trendingSeries:any = [];
    @ViewChild('slider') slider: any;
    @ViewChild('sliderTrack') sliderTrack: any;
    @ViewChildren('slide') slides: any;
    showSlider = false;
    slideIndex = 0;
    constructor(private translate: TranslateService, private meta: Meta, private title: Title, private http:HttpClient) {
        
    }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.home')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        // fetch trending series
        this.fetchTrendingSeries();
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
        const contentLang = this.auth.isLoggedIn() ? this.auth.getUser().settings['prefered-content-language'] : DEFAULT_SETTINGS['prefered-content-language'];
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;
        // send request
        this.http.get(`${API_BASE}/series/trending/${LIMIT}/${lang}`).subscribe((res: any) => {
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
}
