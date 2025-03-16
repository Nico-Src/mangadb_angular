import { Component, computed, effect, inject, ViewChild } from '@angular/core';
import { CONFIG, CDN_BASE, API_BASE, LANGS, errorAlert, successAlert } from '../../globals';
import { AuthService } from '../../services/auth.service';
import { NgIf, NgForOf } from '@angular/common';
import { TuiButton, TuiHint, TuiTextfield, TuiLoader, TUI_ALERT_POSITION, TuiAlertService, TuiDataList, TuiIcon, TuiIconPipe } from '@taiga-ui/core';
import { TuiAppearance, TuiScrollbar } from '@taiga-ui/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HostListener } from '@angular/core';
import { TuiBadgedContent, TuiBadgeNotification, TuiDataListWrapper, TuiCheckbox } from '@taiga-ui/kit';
import { HttpClient } from '@angular/common/http';
import { TranslateService, TranslatePipe, TranslateDirective, _ } from "@ngx-translate/core";
import { TuiSelectModule } from '@taiga-ui/legacy';
import { CookieService } from 'ngx-cookie-service';
import { TuiTextfieldControllerModule } from '@taiga-ui/legacy'; 
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TuiBooleanHandler } from '@taiga-ui/cdk/types';
import { SideBarService } from '../../services/sidebar.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerLanguage } from '@ng-icons/tabler-icons';

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
    private readonly alerts = inject(TuiAlertService);
    private readonly auth = inject(AuthService);
    readonly version = CONFIG.version;
    readonly cdn_base = CDN_BASE;
    readonly user = computed(() => this.auth.getUser());
    readonly loggedIn = computed(() => this.auth.isLoggedIn());
    readonly inAdminArea = computed(() => this.sidebar.isInAdminArea());
    readonly routeStates = [
        { url: '/', state: 'translucent' },
        { url: '/login', state: 'translucent' },
        { url: '/register', state: 'translucent' },
        { url: 'collection', state: 'solid' }
    ];
    routeTranslucent = () => this.routeStates.find(r => r.url === this.router.url)?.state === 'translucent';
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

    constructor(private http:HttpClient, private translate: TranslateService, private cookieService:CookieService, public router: Router, public sidebar: SideBarService) {
        
    }

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

        this.http.post(`${API_BASE}/series/search`,{ search, limit: LIMIT }).subscribe((res: any) => {
            // check if aliases were matched in backend
            let result = [];
            for(const item of res){
                // if there are no aliases or name matches search add item
                if(!item.aliases || item.name.toLowerCase().includes(search.toLowerCase())){
                    result.push({id: item.id, name: item.name, type: item.type});
                    continue;
                }

                // else check aliases and add with found alias as name
                const aliases = item.aliases.split(',');
                for(const alias of aliases){
                    if(alias.toLowerCase().includes(search.toLowerCase())){
                        result.push({id: item.id, name: this.highlightSearch(alias), type: item.type});
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
                    errorAlert(this.alerts, res, `Server Error (Code: ${err.status})`);
                });
            } else { // other error
                errorAlert(this.alerts, JSON.stringify(err), `Server Error (Code: ${err.status})`);
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

    // logout user
    logout(){
        // get current session token
        const session_id = this.cookieService.get('auth_session');
        const header = "Bearer " + session_id;

        // hide profile and logout modals
        this.showProfile = false;
        this.showLogout = false;

        // send request to api
        this.http.post(`${API_BASE}/auth/logout`, {fromAllDevices: this.logoutAll}, { headers: { 'Authorization': header }, responseType: 'text' }).subscribe((res: any) => {
            // delete cookie
            this.cookieService.delete('auth_session','/');
            // clear auth state
            this.auth.setLoggedIn(false);
            this.auth.setUser(this.auth.nullUser);
            this.translate.get(_('dialog.logout-success')).subscribe((res: any) => {
                successAlert(this.alerts,res);
            });
            // redirect to login
            this.router.navigate(['/login']);
        }, (err: any) => {
            // process errors
            if(err.status === 0){ // connection error
                this.translate.get(_('server.error.connection')).subscribe((res: any) => {
                    errorAlert(this.alerts, res, `Error (Code: ${err.status})`);
                });
            } else { // other error
                errorAlert(this.alerts, JSON.stringify(err), `Error (Code: ${err.status})`);
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