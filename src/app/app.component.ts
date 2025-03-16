import { TUI_ALERT_POSITION, TuiAlertContext, TuiAlertService, TuiRoot, TuiScrollbar } from "@taiga-ui/core";
import { Component, computed, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { SideBar } from "./sidebar/sidebar.component";
import { TopBar } from "./topbar/topbar.component";
import { API_BASE, DEFAULT_SETTINGS, CONFIG, LANGS, errorAlert, hexToRGB } from "../globals";
import { HttpClient } from "@angular/common/http";
import { CookieService } from "ngx-cookie-service";
import { AuthService } from "../services/auth.service";
// @ts-ignore
import { pSBC, Color, Solver } from '../libs/filterTint.js';
import { TranslateService, _ } from "@ngx-translate/core";
import { SideBarService } from "../services/sidebar.service";

@Component({
    standalone: true,
    selector: 'app-root',
    imports: [TuiRoot, RouterOutlet, SideBar, TopBar],
    templateUrl: './app.component.html',
    styleUrl: './app.component.less',
    providers: [
        {
            provide: TUI_ALERT_POSITION,
            useValue: 'auto 1rem 1rem auto',
        }
    ],
})

export class AppComponent {
    private readonly auth = inject(AuthService);
    private readonly alerts = inject(TuiAlertService);

    theme = computed(() => this.auth.theme());

    constructor(private http:HttpClient, private cookieService:CookieService, private translate: TranslateService, public sidebar: SideBarService) {
        // setup languages
        this.translate.addLangs(LANGS.map(l => l.value));
        // set default locale
        this.translate.setDefaultLang(CONFIG.default_locale);
        // set locale (based on cookie, if user already selected a language) or default
        this.translate.use(this.cookieService.get('language') || CONFIG.default_locale);
    }

    ngOnInit(): void {
        // get session cookie
        const session_id = this.cookieService.get('auth_session');
        // return if there is no session
        if(!session_id){
            this.calcFilterTint();
            return;
        }
        // else send validation request with session token
        const header = "Bearer " + session_id;
        this.http.post(`${API_BASE}/auth/session`, {}, { headers: { 'Authorization': header } }).subscribe((res: any) => {
            // set auth state
            this.auth.setUser(res);
            this.auth.setLoggedIn(true);
            // calc filter tint
            this.calcFilterTint();
            document.body.classList.add(res.settings.theme);
            this.auth.setTheme(res.settings.theme);
        }, (err: any) => {
            // process errors
            if(err.status === 0){ // connection error
                this.translate.get(_('server.error.connection')).subscribe((res: any) => {
                    errorAlert(this.alerts, res, `Error (Code: ${err.status})`);
                });
            } else if(err.status === 440){ // session expired
                this.translate.get(_('server.error.session-expired')).subscribe((res: any) => {
                    errorAlert(this.alerts, res, `Error (Code: ${err.status})`);
                });
                // delete cookie
                this.cookieService.delete('auth_session','/');
                // set auth state
                this.auth.setUser(this.auth.nullUser);
                this.auth.setLoggedIn(false);
            }
            this.calcFilterTint();
        });
    }

    protected calcFilterTint(): void {
        // get current theme accent color
        const savedColor = this.auth.getUserSetting('theme-accent-color');
        // if there is a saved color (other than the default) set the css variables
        if(savedColor && savedColor !== '#71c94e'){
            const savedRGB = hexToRGB(savedColor);
            document.body.style.setProperty('--accent-color', `${savedRGB?.r}, ${savedRGB?.g}, ${savedRGB?.b}`);
            const lightAccent = pSBC(0.25, savedColor); // lighten by 25%
            const lightAccentRGB = hexToRGB(lightAccent);
            document.body.style.setProperty('--light-accent', `${lightAccentRGB?.r}, ${lightAccentRGB?.g}, ${lightAccentRGB?.b}`);
            const midAccent = pSBC(-0.25, savedColor); // darken by 25%
            const midAccentRGB = hexToRGB(midAccent);
            document.body.style.setProperty('--mid-accent', `${midAccentRGB?.r}, ${midAccentRGB?.g}, ${midAccentRGB?.b}`);
            const darkAccent = pSBC(-0.25, midAccent); // dark the previous darkened color by 25% again
            const darkAccentRGB = hexToRGB(darkAccent);
            document.body.style.setProperty('--dark-accent', `${darkAccentRGB?.r}, ${darkAccentRGB?.g}, ${darkAccentRGB?.b}`);
        }

        let result = {loss: Infinity, filter: '', originalColor: ''};
        // Check if there is a saved result in local storage
        let filter_css: any = localStorage.getItem('filter_css');
        let savedResult: any = null;
        try{ savedResult = JSON.parse(filter_css);} 
        catch(e){console.log(e)}
        // get current accent color
        let color = getComputedStyle(document.body).getPropertyValue('--accent-color').trim();
        
        // check if accent color changed, if so recalculate result
        if(savedResult && savedResult.originalColor === color){
            result = savedResult;
        }
        // if color changed recalculate
        if(savedResult?.originalColor !== color){
            savedResult = null;
            result = {loss: Infinity, filter: '', originalColor: ''};
        }

        // Calculate Filter
        if(!savedResult){
            const rgb = color.split(",");
            const rgbColor = new Color(rgb[0], rgb[1], rgb[2]);
            const solver = new Solver(rgbColor);
            
            // calculate till color loss is below 5
            while(result.loss > 5){
                result = solver.solve();
            }
            
            // set original color
            result.originalColor = color;
            
            // save to local storage
            localStorage.setItem('filter_css',JSON.stringify(result));
        }

        document.body.style.setProperty('--accent-filters',result.filter.replace('filter: ','').replace(';','').trim());
    }
}