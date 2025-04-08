import { Component, computed, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { APIService, HttpMethod } from '../../../services/api.service';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiAlertService, TuiButton, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { TuiPagination, TuiSegmented, TuiTile, TuiTiles } from '@taiga-ui/kit';
import { NgFor, NgIf } from '@angular/common';
import { MangaCover } from '../../manga-cover/manga-cover.component';
import { ago, errorAlert, getTranslation, langToLocale, readableDate, successAlert, UNKNOWN_DATE } from '../../../globals';
import { MangaSeriesColumnComponent } from '../../manga-series-column/manga-series-column.component';
import { MangaSeriesGridComponent } from '../../manga-series-grid/manga-series-grid.component';
import { MangaSeriesListComponent } from '../../manga-series-list/manga-series-list.component';
import { tablerArrowsMove, tablerCancel, tablerLayoutColumns, tablerLayoutGrid, tablerList } from '@ng-icons/tabler-icons';
import { NgAutoAnimateDirective } from 'ng-auto-animate';
import { MangaVolume } from '../../manga-volume/manga-volume.component';
import { solarListBold } from '@ng-icons/solar-icons/bold';
import { matSaveOutline } from '@ng-icons/material-icons/outline';

@Component({
    selector: 'app-list-detail',
    imports: [TuiTextfieldControllerModule, TuiTextfield, TuiTile, TuiTiles, TuiButton, MangaVolume, MangaSeriesColumnComponent, NgAutoAnimateDirective, MangaSeriesGridComponent, TuiSegmented, MangaSeriesListComponent, NgIf, TuiLoader, NgFor, TuiSelectModule, ReactiveFormsModule, FormsModule, NgIcon, TranslatePipe],
    templateUrl: './list-detail.component.html',
    styleUrl: './list-detail.component.less',
    viewProviders: [provideIcons({ tablerList, tablerLayoutColumns, tablerLayoutGrid, tablerArrowsMove, solarListBold, tablerCancel, matSaveOutline })]
})
export class ListDetailComponent {
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    readonly theme = computed(() => this.auth.theme());
    search:string = "";
    loading:boolean = true;
    list: any = null;
    allItems: any = [];
    items: any = [];
    viewIndex: number = 0;
    ordering: boolean = false;
    order: any = new Map();
    removeFromListMenuItem: any = [{title: 'remove-from-list', icon: 'tablerTrash', action: this.removeFromList.bind(this)}];
    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.lists')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        // get users view mode (list, column or grid)
        this.viewIndex = parseInt(localStorage.getItem('viewMode') || '0');

        this.loadList(this.route.snapshot.paramMap.get("slug"));
    }

    // view mode changed
    viewChanged(index: number) {
        // save to local storage
        localStorage.setItem('viewMode', index.toString());
    }

    // load reading history from api
    loadList(slug:string | null){
        if(!this.auth.isLoggedIn() || !slug){
            this.loading = false;
            return;
        }
        // show loading indicator
        this.loading = true;
    
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        this.api.request<any>(HttpMethod.GET, `lists/slug/${slug}?user_lang=${lang}`, {}).subscribe((res:any)=>{
            this.list = res;
            this.title.setTitle(`${this.list.name} | MangaDB`);
            this.loadListItems();
        }, (err:any)=>{
            this.loading = false;
        });
    }

    // load list items
    loadListItems(){
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        this.api.request<any>(HttpMethod.POST, `lists/items`, {list_id: this.list.id,limit:999999,offset:0,user_lang:lang}).subscribe((res:any)=>{
            this.allItems = this.items = res.items;
            this.loading = false;
        }, (err:any)=>{
            this.loading = false;
        });
    }

    // redirect to series
    seriesClick(ser:any){
        this.router.navigate(['series',ser.slug]);
    }

    // redirect to volume
    volumeClick(volume: any){
        const slug = volume.slug;
        const series = slug.split(':')[0];
        const volSlug = slug.split(':')[1];
        this.router.navigate(['volume', series, volSlug]);
    }

    // search key down handler
    searchKeyDown(val:any){
        if(val.trim() === ""){
            this.items = this.allItems;
            return;
        }
        this.items = this.allItems.filter((i:any)=>i.name.toLowerCase().includes(val.toLowerCase()) || i?.alias?.toLowerCase()?.includes(val.toLowerCase()));
    }

    // cancel reorder
    cancelReorder(){
        this.ordering = false;
        this.loadListItems();
        this.order = new Map();
    }

    // save reorder to db
    saveReorder(){
        let tmpOrder = [];
        for(let item of this.order){
            tmpOrder[item[1]] = this.items[item[0]];
        }

        const reorderedItems = tmpOrder.map((i:any) => `${i.id}:${tmpOrder.indexOf(i)}`).join(',');
        this.api.request<string>(HttpMethod.POST, `lists/reorder/${this.list.id}`, {order: reorderedItems}, 'text').subscribe(async (res:string)=>{
            const msg = await getTranslation(this.translate, `lists.reorder-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadListItems();
            this.ordering = false;
            this.order = new Map();
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }

    // remove item from list
    removeFromList(item:any){
        if(!item) return;
        this.api.request<any>(HttpMethod.DELETE, `lists/items/delete`, {list_id: this.list.id, item_id: item.id}, 'text').subscribe(async(res:any)=>{
            const msg = await getTranslation(this.translate, `lists.item-removed`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadListItems();
        },(err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
        });
    }
}
