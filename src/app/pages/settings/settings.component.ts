import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { _, TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiTextfield, TuiAppearance, TuiButton } from '@taiga-ui/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgAutoAnimateDirective } from 'ng-auto-animate';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerHome, tablerBrush, tablerUser, tablerLanguage, tablerWallpaper, tablerCheck } from '@ng-icons/tabler-icons';
import { AuthService } from '../../../services/auth.service';
import { API_BASE, DEFAULT_SETTINGS, THEMES, hexToRGB, LANGS, NSFW_SETTINGS } from '../../../globals';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { TuiInputColorModule, TuiInputModule, TuiTextfieldControllerModule, TuiSelectModule } from '@taiga-ui/legacy';
import { MaskitoDirective } from '@maskito/angular';
// @ts-ignore
import { pSBC, Color, Solver } from '../../../libs/filterTint.js';
import { TuiBooleanHandler } from '@taiga-ui/cdk/types';

@Component({
    selector: 'app-settings',
    imports: [TranslatePipe, TuiTextfield, TuiInputModule, TuiButton, TuiSelectModule, TuiTextfieldControllerModule, TuiAppearance, ReactiveFormsModule, FormsModule, NgAutoAnimateDirective, NgIf, NgFor, NgIcon, TuiInputColorModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.less',
    viewProviders: [provideIcons({ tablerHome, tablerBrush, tablerUser, tablerLanguage, tablerWallpaper, tablerCheck })]
})
export class SettingsComponent {
    private auth = inject(AuthService);
    readonly availableThemes = THEMES;
    readonly colorMask = {mask: ['#', ...new Array(6).fill(/[0-9a-f]/i)]};
    search:string = "";
    selectedCategory:string = "all";
    settings:any = {
        appearance: {
            theme: true,
            theme_accent: true,
        },
        language: {
            content: true
        },
        content: {
            nsfw_mode: true
        }
    };
    selectedTheme:string = "light";
    selectedAccentColor:string = "#000";
    showThemeAccentColorPicker = false;
    selectedContentLanguage = DEFAULT_SETTINGS['prefered-content-language'];
    availableContentLanguages = JSON.parse(JSON.stringify(LANGS));
    selectedNSFWOption = DEFAULT_SETTINGS['nsfw-mode'];
    nsfwSettings:any = NSFW_SETTINGS;
    constructor(private translate: TranslateService, private meta: Meta, private title: Title, private http: HttpClient, private cookie: CookieService) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.settings')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        // get current settings
        this.selectedTheme = this.auth.getUserSetting('theme');
        this.selectedAccentColor = this.auth.getUserSetting('theme-accent-color');

        this.availableContentLanguages.unshift({key: 'language.interface', value: 'interface', disabled: false});
        this.selectedContentLanguage = this.availableContentLanguages.find((lang:any) => lang.value === this.auth.getUserSetting('prefered-content-language'));

        this.selectedNSFWOption = this.nsfwSettings.find((mode:any) => mode.key === this.auth.getUserSetting('nsfw-mode'));
    }

    // select current setting category
    selectCategory(cat:string){
        this.selectedCategory = cat;
        this.updateSettingsState();
    }

    // select content language
    selectContentLanguage(lang: { value: string, key: string }){
        this.saveSettings();
    }

    // select nsfw mode
    selectNSFWMode(mode: { value: string, key: string }){
        this.saveSettings();
    }

    // update settings visibility state
    async updateSettingsState(){
        for(let key of Object.keys(this.settings)){
            for(let sub_key of Object.keys(this.settings[key])){
                this.settings[key][sub_key] = await this.checkSettingVisibility(key, sub_key);
            }
        }
    }

    // check if setting is visible
    async checkSettingVisibility(key:string, sub_key:string){
        // get title and description (translated)
        const title = await this.getTranslation(`settings.${key}.${sub_key}.title`);
        const description = await this.getTranslation(`settings.${key}.${sub_key}.desc`);
        // check if setting is visible (based on category and searched term)
        return (this.selectedCategory === "all" || this.selectedCategory === key) && (title.toLowerCase().includes(this.search.toLowerCase()) || description.toLowerCase().includes(this.search.toLowerCase()));
    }

    // async get translation function
    async getTranslation(key:string){
        return await this.translate.get(key).toPromise();
    }

    // select theme
    selectTheme(theme:string){
        this.selectedTheme = theme;
        // remove all possible theme classes from body
        for(let theme of this.availableThemes){
            document.body.classList.remove(theme.key);
        }
        // add current theme as class to body and update settings
        document.body.classList.add(theme);
        this.auth.setTheme(theme);
        this.saveSettings();
    }

    // select theme accent color
    selectColor(){
        // update settings and recalc filter tint
        this.saveSettings();
        this.calcFilterTint(false);
    }

    // reset theme accent color to default value
    resetAccentColor(){
        this.selectedAccentColor = DEFAULT_SETTINGS['theme-accent-color'];
        // update settings and recalc filter tint
        this.saveSettings();
        this.calcFilterTint(true);
    }

    // update user settings
    saveSettings(){
        // if not logged in return
        if(!this.auth.isLoggedIn()) return;
        // get current settings
        const user = this.auth.getUser();
        const settings = Object.keys(user.settings).length > 0 ? user.settings : DEFAULT_SETTINGS; 
        // replace with current values
        settings.theme = this.selectedTheme;
        settings['theme-accent-color'] = this.selectedAccentColor;
        settings['prefered-content-language'] = this.selectedContentLanguage.value;
        settings['nsfw-mode'] = this.selectedNSFWOption.key;
        // get session id
        const session_id = this.cookie.get('auth_session');
        const header = "Bearer " + session_id;
        // send api request
        this.http.post(`${API_BASE}/users/${user.id}/save-settings`, {settings: settings}, { headers: { 'Authorization': header }, responseType: 'text' }).subscribe();
    }

    // calculate filter tint (reset if default button is pressed and saved color is the default)
    protected calcFilterTint(reset:boolean): void {
        // get current theme accent color
        const savedColor = this.selectedAccentColor;
        // if there is a saved color (other than the default) set the css variables
        if(savedColor && (savedColor !== DEFAULT_SETTINGS['theme-accent-color'] || reset === true)){
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

    // disabled language handler
    protected readonly disabledLanguageHandler: TuiBooleanHandler<any> = (v) => v.disabled === true;

    // disabled nsfw option handler
    protected readonly disabledNSFWOptionHandler: TuiBooleanHandler<any> = (v) => {
        // disable last nsfw option (18+) if user is not age verified
        if(v.key !== 'settings.nsfw.show-nsfw-18') return false;
        return this.auth.getUser().age_verified === false;
    };
}
