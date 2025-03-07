import { Component, computed, effect, inject, ViewChild } from '@angular/core';
import { VERSION, CDN_BASE, API_BASE, LANGS } from '../../globals';
import { UserService } from '../../services/user.service';
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

@Component({
    selector: 'top-bar',
    imports: [NgIf, NgForOf, TuiButton, TuiAppearance, TuiHint, TuiTextfield, FormsModule, ReactiveFormsModule, TuiBadgedContent, TuiBadgeNotification, TuiLoader, TuiScrollbar, TranslatePipe, TuiSelectModule, TuiDataList, TuiDataListWrapper, TuiTextfieldControllerModule, TuiIcon, RouterLink, TuiCheckbox],
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.less',
    providers: [
        {
            provide: TUI_ALERT_POSITION,
            useValue: 'auto 1rem 1rem auto',
        },
    ]
})

export class TopBar {
    private readonly alerts = inject(TuiAlertService);
    version = VERSION;
    cdn_base = CDN_BASE;
    user_service = inject(UserService);
    user = computed(() => this.user_service.getUser());
    loggedIn = computed(() => this.user_service.isLoggedIn());
    @ViewChild('searchEl') searchEl: any
    protected search = '';
    searchLoading = false;
    searchFocused = false;
    searchTimeout:any = null;
    results:any = [];
    showProfile = false;
    showLogout = false;
    logoutAll = false;
    profileForm = new FormGroup({
        language: new FormControl(),
    });
    languages = LANGS;

    constructor(private http:HttpClient, private translate: TranslateService, private cookieService:CookieService, private router: Router) {
        
    }

    ngOnInit(): void {
        this.profileForm.get('language')?.setValue(LANGS.find(l => l.value === this.translate.currentLang));
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) { 
        // ctrl + s to focus search
        if(event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.searchEl.nativeElement.focus();
        }
    }

    debounceSearch() {
        if(this.search.trim() === ''){
            this.results = [];
            return;
        }

        if(this.searchLoading){
            this.results = [];
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.updateResults(this.search);
            }, 1000);
            return;
        }

        this.searchLoading = true;
        this.searchTimeout = setTimeout(() => {
            this.updateResults(this.search);
        }, 1000);
    }

    updateResults(search: string) {
        this.http.post(`${API_BASE}/series/search`,{ search, limit: 10 }).subscribe((res: any) => {
            // the aliases could be better matching so check
            let result = [];
            for(const item of res){
                if(!item.aliases || item.name.toLowerCase().includes(search.toLowerCase())){
                    result.push({id: item.id, name: item.name, type: item.type});
                    continue;
                }
                const aliases = item.aliases.split(',');
                for(const alias of aliases){
                    if(alias.toLowerCase().includes(search.toLowerCase())){
                        result.push({id: item.id, name: this.highlightSearch(alias), type: item.type});
                        break;
                    }
                }
            }
            this.results = result;
            this.searchLoading = false;
        }, (err: any) => {
            if(err.status === 0){
                this.translate.get(_('server.error.connection')).subscribe((res: any) => {
                    this.errorAlert(res, `Server Error (Code: ${err.status})`);
                });
            } else {
                this.errorAlert(JSON.stringify(err), `Server Error (Code: ${err.status})`);
            }
            this.searchLoading = false;
            this.results = [];
        });
    }

    highlightSearch(text: string) {
        const regex = new RegExp(this.search, 'gi');
        return text.replace(regex, match => `<b>${match}</b>`);
    }

    protected errorAlert(message: string, label: string = 'Error'): void {
        this.alerts.open(message, {label: label, appearance: 'negative'}).subscribe();
    }

    protected successAlert(message: string, label: string = 'Success'): void {
        this.alerts.open(message, {label: label, appearance: 'positive'}).subscribe();
    }

    toggleProfile() {
        this.showProfile = !this.showProfile;
    }

    languageSelected(lang: { value: string, key: string }) {
        this.translate.use(lang.value);
        this.cookieService.set('language', lang.value);
    }

    confirmLogout(){
        this.showLogout = true;
    }

    logout(){
        const session_id = this.cookieService.get('auth_session');
        const header = "Bearer " + session_id;

        this.showProfile = false;
        this.showLogout = false;

        this.http.post(`${API_BASE}/auth/logout`, {fromAllDevices: this.logoutAll}, { headers: { 'Authorization': header }, responseType: 'text' }).subscribe((res: any) => {
            this.cookieService.delete('auth_session');
            this.user_service.setLoggedIn(false);
            this.user_service.setUser({}); // empty user
            this.translate.get(_('dialog.logout-success')).subscribe((res: any) => {
                this.successAlert(res);
            });
            this.router.navigate(['/login']);
        }, (err: any) => {
            if(err.status === 0){
                this.translate.get(_('server.error.connection')).subscribe((res: any) => {
                    this.errorAlert(res, `Error (Code: ${err.status})`);
                });
            } else {
                this.errorAlert(JSON.stringify(err), `Error (Code: ${err.status})`);
            }
        });
    }

    protected readonly disabledLanguageHandler: TuiBooleanHandler<any> = (v) => v.disabled === true;
}