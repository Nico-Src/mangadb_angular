import { Component, computed, effect, inject, ViewChild } from '@angular/core';
import { VERSION, CDN_BASE, API_BASE } from '../../globals';
import { UserService } from '../../services/user.service';
import { NgIf, NgForOf } from '@angular/common';
import { TuiButton, TuiHint, TuiTextfield, TuiLoader } from '@taiga-ui/core';
import { TuiAppearance } from '@taiga-ui/core';
import { FormsModule } from '@angular/forms';
import { HostListener } from '@angular/core';
import { TuiBadgedContent, TuiBadgeNotification } from '@taiga-ui/kit';
import { HttpClient } from '@angular/common/http';

const TEST_DATA = [
    { id: 1, name: 'Attack on Titan', type: 'Manga' },
    { id: 2, name: 'Attack on Titan', type: 'Novel'},
    { id: 3, name: 'Tokyo Ghoul', type: 'Manga' },
    { id: 4, name: 'Tokyo Ghoul', type: 'Novel' },
]

@Component({
    selector: 'top-bar',
    imports: [NgIf, NgForOf, TuiButton, TuiAppearance, TuiHint, TuiTextfield, FormsModule, TuiBadgedContent, TuiBadgeNotification, TuiLoader],
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.less',
})

export class TopBar {
    version = VERSION;
    cdn_base = CDN_BASE;
    user_service = inject(UserService);
    user = computed(() => this.user_service.getUser());
    @ViewChild('searchEl') searchEl: any
    protected search = '';
    searchLoading = false;
    searchTimeout:any = null;
    results:any = [];

    constructor(private http:HttpClient) {}

    ngOnInit(): void {
        
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
                if(!item.aliases){
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
        });
    }

    highlightSearch(text: string) {
        const regex = new RegExp(this.search, 'gi');
        return text.replace(regex, match => `<b>${match}</b>`);
    }
}