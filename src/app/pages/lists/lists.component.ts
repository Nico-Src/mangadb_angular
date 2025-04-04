import { Component, computed, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { APIService, HttpMethod } from '../../../services/api.service';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiButton, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { TuiPagination } from '@taiga-ui/kit';
import { NgFor, NgIf } from '@angular/common';
import { MangaCover } from '../../manga-cover/manga-cover.component';
import { ago, CDN_BASE, getTranslation, langToLocale, readableDate, UNKNOWN_DATE } from '../../../globals';
import { NgAutoAnimateDirective } from 'ng-auto-animate';
import { PluralTranslatePipe } from '../../../pipes/pluralTranslate';
import { tablerEdit, tablerList, tablerTrash } from '@ng-icons/tabler-icons';

@Component({
    selector: 'app-dashboard',
    imports: [TuiTextfieldControllerModule, TuiTextfield, MangaCover, TuiButton, PluralTranslatePipe, NgAutoAnimateDirective, NgIf, TuiLoader, NgFor, TuiSelectModule, ReactiveFormsModule, FormsModule, NgIcon, TranslatePipe],
    templateUrl: './lists.component.html',
    styleUrl: './lists.component.less',
    viewProviders: [provideIcons({ tablerList, tablerTrash, tablerEdit })]
})
export class ListsComponent {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    readonly cdn_base = CDN_BASE;
    readonly theme = computed(() => this.auth.theme());
    search:string = "";
    loading:boolean = true;
    lists: any = [];
    volumeLists: any = [];
    seriesLists: any = [];
    constructor(private translate: TranslateService, private title: Title, private router: Router) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.lists')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        this.loadLists();
    }

    // load reading history from api
    loadLists(){
        if(!this.auth.isLoggedIn()){
            this.loading = false;
            return;
        }
        // show loading indicator
        this.loading = true;
    
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;
    
        this.api.request<any>(HttpMethod.GET, `lists?user_lang=${lang}`, {}).subscribe((res:any)=>{
            this.lists = res;
            for(const list of this.lists){
                const user = this.auth.getUser();
                const nsfwMode = this.auth.getUserSetting('nsfw-mode');
                list.show = (!list.nsfw && !list.nsfw18) || (list.nsfw && nsfwMode.value === 'settings.nsfw.show-nsfw') || (list.nsfw18 && nsfwMode.value === 'settings.nsfw.show-nsfw-18' && (user?.age_verified || false));
            }
            console.log(this.lists)
            this.volumeLists = res.filter((l:any)=>l.type === 'volume');
            this.seriesLists = res.filter((l:any)=>l.type === 'series');
            this.loading = false;
        }, (err:any)=>{
            this.loading = false;
        });
    }

    // search update
    searchUpdate(e:any){
        if(e.trim() !== ""){
            this.volumeLists = this.lists.filter((l:any)=>l.type === 'volume' && l.name.toLowerCase().includes(e.trim().toLowerCase()));
            this.seriesLists = this.lists.filter((l:any)=>l.type === 'series' && l.name.toLowerCase().includes(e.trim().toLowerCase()));
        } else {
            this.volumeLists = this.lists.filter((l:any)=>l.type === 'volume');
            this.seriesLists = this.lists.filter((l:any)=>l.type === 'series');
        }
    }

    // language to locale code
    toLocale(lang:string){
        return langToLocale(lang);
    }

    // return time that has passed since given datetime
    agoTime(time:string){
        return ago(time, this.translate.currentLang);
    }
}
