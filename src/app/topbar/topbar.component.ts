import { Component, computed, inject, ViewChild } from '@angular/core';
import { CONFIG, CDN_BASE, LANGS, errorAlert, successAlert, getTranslation } from '../../globals';
import { AuthService } from '../../services/auth.service';
import { NgIf, NgForOf } from '@angular/common';
import { TuiButton, TuiHint, TuiTextfield, TuiLoader, TUI_ALERT_POSITION, TuiAlertService, TuiDataList, TuiIcon } from '@taiga-ui/core';
import { TuiAppearance, TuiScrollbar } from '@taiga-ui/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HostListener } from '@angular/core';
import { TuiBadgedContent, TuiBadgeNotification, TuiDataListWrapper, TuiCheckbox } from '@taiga-ui/kit';
import { TranslateService, TranslatePipe, _ } from "@ngx-translate/core";
import { TuiSelectModule } from '@taiga-ui/legacy';
import { CookieService } from 'ngx-cookie-service';
import { TuiTextfieldControllerModule } from '@taiga-ui/legacy'; 
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TuiBooleanHandler } from '@taiga-ui/cdk/types';
import { SideBarService } from '../../services/sidebar.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerLanguage } from '@ng-icons/tabler-icons';
import { UserRole } from '../../models/user';
import { APIService, HttpMethod } from '../../services/api.service';

@Component({
    selector: 'top-bar',
    imports: [NgIf, NgForOf, TuiButton, NgIcon, TuiAppearance, TuiHint, TuiTextfield, FormsModule, ReactiveFormsModule, TuiBadgedContent, TuiBadgeNotification, TuiLoader, TuiScrollbar, TranslatePipe, TuiSelectModule, TuiDataList, TuiDataListWrapper, TuiTextfieldControllerModule, TuiIcon, RouterLink, TuiCheckbox],
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.less',
    providers: [
        {
            provide: TUI_ALERT_POSITION,
            useValue: 'auto 1rem 1rem auto',
        },
    ],
    viewProviders: [provideIcons({ tablerLanguage })]
})

export class TopBar {
    private readonly api = inject(APIService);
    private readonly alerts = inject(TuiAlertService);
    private readonly auth = inject(AuthService);
    readonly UserRole = UserRole;
    readonly version = CONFIG.version;
    readonly cdn_base = CDN_BASE;
    readonly user = computed(() => this.auth.getUser());
    readonly loggedIn = computed(() => this.auth.isLoggedIn());
    readonly inAdminArea = computed(() => this.sidebar.isInAdminArea());
    readonly routeStates = [
        { url: '/login', state: 'translucent' },
        { url: '/register', state: 'translucent' },
        { url: '/series/', state: 'translucent' },
        { url: '/volume/', state: 'translucent' },
        { url: '/publisher/', state: 'translucent' },
        { url: '/contributor/', state: 'translucent' },
        { url: '/settings', state: 'solid' },
        { url: '/collection', state: 'solid' },
        { url: '/admin/series/', state: 'translucent' }
    ];

    routeTranslucent = () => {
        let isTranslucent = false;
        if(this.router.url === '/') isTranslucent = true;
        else isTranslucent = this.routeStates.find(r => this.router.url.startsWith(r.url))?.state === 'translucent';
        return isTranslucent;
    };

    @ViewChild('searchEl') searchEl: any

    protected search = '';

    searchLoading = false;
    searchFocused = false;
    searchTimeout:any = null;
    results:any = [];
    showProfile = false;
    toggleProfile() { this.showProfile = !this.showProfile; }
    showLogout = false;
    logoutAll = false;

    profileForm = new FormGroup({
        language: new FormControl(),
    });

    languages = LANGS;

    constructor(private translate: TranslateService, private cookieService:CookieService, public router: Router, public sidebar: SideBarService, private route: ActivatedRoute) {}

    // toggle sidebar state
    toggleSidebar(){
        this.sidebar.setOpen(!this.sidebar.isOpen());
    }

    ngOnInit(): void {
        // set selected language in language switcher
        this.profileForm.get('language')?.setValue(LANGS.find(l => l.value === this.translate.currentLang));
    }

    // listen to keyboard shortcuts
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) { 
        // ctrl + s to focus search
        if(event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.searchEl.nativeElement.focus();
        }
    }

    // debounce search (only update results after 500ms)
    debounceSearch() {
        const DURATION = 1000;

        // if search is empty, clear results and return
        if(this.search.trim() === ''){
            this.results = [];
            return;
        }

        // if search is already loading
        if(this.searchLoading){
            // clear results and timeout
            this.results = [];
            clearTimeout(this.searchTimeout);
            // restart timeout
            this.searchTimeout = setTimeout(() => {
                this.updateSearchResults(this.search);
            }, DURATION);
            return;
        }

        // set loading status and create timeout
        this.searchLoading = true;
        this.searchTimeout = setTimeout(() => {
            this.updateSearchResults(this.search);
        }, DURATION);
    }

    // fetch search results based on search
    updateSearchResults(search: string) {
        const LIMIT = 10;

        this.api.request<any>(HttpMethod.POST, 'series/search', { search, limit: LIMIT}).subscribe((res)=>{
            // check if aliases were matched in backend
            let result = [];
            for(const item of res){
                // if there are no aliases or name matches search add item
                if(!item.aliases || item.name?.toLowerCase()?.includes(search.toLowerCase())){
                    result.push({id: item.id, name: item.name, type: item.type, slug: item.slug});
                    continue;
                }

                // else check aliases and add with found alias as name
                const aliases = (item.aliases as string).split(',');
                for(const alias of aliases){
                    if(alias.toLowerCase().includes(search.toLowerCase())){
                        result.push({id: item.id, name: this.highlightSearch(alias), type: item.type, slug: item.slug});
                        break;
                    }
                }
            }

            // set results and stop loading indicator
            this.results = result;
            this.searchLoading = false;
        }, (err: any) => {
            // process errors
            if(err.status === 0){ // connection error
                this.translate.get(_('server.error.connection')).subscribe((res: any) => {
                    errorAlert(this.alerts, res, undefined , this.translate);
                });
            } else { // other error
                errorAlert(this.alerts, JSON.stringify(err), undefined , this.translate);
            }
            // clear results and stop loading indicator
            this.searchLoading = false;
            this.results = [];
        });
    }

    // add bold tags to searched term in given text
    highlightSearch(text: string) {
        const regex = new RegExp(this.search, 'gi');
        return text.replace(regex, match => `<b>${match}</b>`);
    }

    // change handler for language switcher (update locale and cookie)
    languageSelected(lang: { value: string, key: string }) {
        this.translate.use(lang.value);
        this.cookieService.set('language', lang.value);
    }

    // navigate to series detail page
    seriesClick(ser: { slug: any; }){
        this.searchEl.nativeElement.blur();
        this.searchFocused = false;
        this.router.navigate(['series', ser.slug]);
    }

    // logout user
    logout(){
        // hide profile and logout modals
        this.showProfile = false;
        this.showLogout = false;

        this.api.request<string>(HttpMethod.POST, 'auth/logout',{ fromAllDevices: this.logoutAll }, 'text').subscribe(async(res)=>{
            // delete cookie
            this.cookieService.delete('auth_session','/');
            // clear auth state
            this.auth.setLoggedIn(false);
            this.auth.setUser(this.auth.nullUser);
            const msg = await getTranslation(this.translate,'dialog.logout-success');
            successAlert(this.alerts,msg,undefined,this.translate);
            // redirect to login
            this.router.navigate(['/login']);
        }, async (err: any) => {
            // process errors
            if(err.status === 0){ // connection error
                const msg = await getTranslation(this.translate,'server.error.connection');
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else { // other error
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            }
        });
    }

    // redirect to admin dashboard
    adminDashboard() {
        const user = this.auth.getUser();
        if(!user || user.role !== 'Admin') return;
        if(this.sidebar.isInAdminArea()) this.router.navigate(['/']);
        else this.router.navigate(['/admin/dashboard']);
    }

    // keydown handler for search input
    searchKeyDown(event: KeyboardEvent) {
        // if enter key is pressed and search is not empty redirect to browse series page
        if(event.key === 'Enter' && this.search.trim() !== ''){
            // navigate to browse series page with search query
            this.router.navigate(['/browse-series'], { queryParams: {search: this.search.trim()}});
            this.searchFocused = false;
            this.search = "";
        }
    }

    // disabled language handler
    protected readonly disabledLanguageHandler: TuiBooleanHandler<any> = (v) => v.disabled === true;
}