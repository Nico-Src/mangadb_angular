import { Component, inject, computed, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TuiAlertService, TuiAppearance, TuiButton, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { TuiInputNumber, TuiPagination } from '@taiga-ui/kit';
import { TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { AuthService } from '../../../services/auth.service';
import { APIService, HttpMethod } from '../../../services/api.service';
import { tablerSortAscending, tablerSortAscendingLetters, tablerSortDescending, tablerSortDescendingLetters } from '@ng-icons/tabler-icons';
import { NgFor, NgIf } from '@angular/common';
import { MangaVolume } from "../../manga-volume/manga-volume.component";
import { UNKNOWN_DATE, successAlert, errorAlert } from '../../../globals';
import { TuiDay } from '@taiga-ui/cdk/date-time';

@Component({
    selector: 'app-collection',
    imports: [TuiSelectModule, NgIcon, TuiTextfield, TuiInputNumber, TuiInputDateModule, TuiAppearance, NgIf, NgFor, TuiButton, TuiLoader, ReactiveFormsModule, TuiTextfieldControllerModule, FormsModule, TuiPagination, TranslatePipe, MangaVolume],
    templateUrl: './collection.component.html',
    styleUrl: './collection.component.less',
    viewProviders: [provideIcons({ tablerSortAscendingLetters, tablerSortDescendingLetters, tablerSortAscending, tablerSortDescending })],
})
export class CollectionComponent {
    private readonly alerts = inject(TuiAlertService);
    private readonly auth = inject(AuthService);
    private readonly api = inject(APIService);
    readonly theme = computed(() => this.auth.theme());
    search:string = "";
    currentSearch:string = "";
    prevSearch:string = "";
    currentPage:number = 0;
    maxPages:number= 10;
    loading:boolean = true;
    orders:any = [
        {key: 'name', value: 'name-asc', icon: 'tablerSortAscendingLetters'},
        {key: 'name', value: 'name-desc', icon: 'tablerSortDescendingLetters'},
    ]
    volumes: any = [];
    volumeKeys: any = [];
    selectedOrder: any = this.orders[0];

    showEditPriceDialog: boolean = false;
    editPriceObj:any;
    savingPriceEdit: boolean = false;
    showEditBuyDateDialog: boolean = false;
    editBuyDateObj:any;
    savingBuyDateEdit: boolean = false;
    @ViewChild('editPriceDialog') editPriceDialog:any;
    @ViewChild('editBuyDateDialog') editBuyDateDialog:any;
    @ViewChildren('volume') volumeRefs:any;
    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.collection')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        // get query params (also on change)
        this.route.queryParams.subscribe(params => {
            if(params['order']) this.selectedOrder = this.orders.find((o: { value: any; }) => o.value === params['order']);
            if(params['page']) this.currentPage = parseInt(params['page']);
            if(params['search']) this.search = this.prevSearch = this.currentSearch = params['search'];
        });

        // update query params
        this.updateQueryParams();
    }

    // if backdrop of dialog is clicked close it
    editPriceDialogClick(event:any){
        if (event.target === this.editPriceDialog.nativeElement) {
            this.showEditPriceDialog = false;
        }
    }

    // if backdrop of dialog is clicked close it
    editBuyDateDialogClick(event:any){
        if (event.target === this.editBuyDateDialog.nativeElement) {
            this.showEditBuyDateDialog = false;
        }
    }

    // open price edit dialog
    openPriceEditDialog(e:any){
        this.editPriceObj = e;
        this.showEditPriceDialog = true;
    }

    // open buy date edit dialog
    openBuyDateEditDialog(e:any){
        this.editBuyDateObj = e;
        this.showEditBuyDateDialog = true;
    }

    // save price edit for collection item
    savePriceEdit(){
        if(!this.editPriceObj?.id) return;
        this.savingPriceEdit = true;

        const volume = this.volumes[this.editPriceObj.series].find((v:any)=>v.item_id == this.editPriceObj.id);

        this.api.request<string>(HttpMethod.POST, `user/collection/update/${this.editPriceObj.id}`, {price: this.editPriceObj.price, date: volume.buy_date}, 'text').subscribe((res:any)=>{
            // TODO translate
            successAlert(this.alerts, `Price saved successfully`, undefined, this.translate);
            volume.price = this.editPriceObj.price;
            this.savingPriceEdit = false;
            this.showEditPriceDialog = false;
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.savingPriceEdit = false;
        });
    }

    // save buy date edit for collection item
    saveBuyDateEdit(){
        if(!this.editBuyDateObj?.id) return;
        this.savingBuyDateEdit = true;

        const volume = this.volumes[this.editBuyDateObj.series].find((v:any)=>v.item_id == this.editBuyDateObj.id);
        const volumeRef = this.volumeRefs.filter((el:any)=>el.volume.item_id === this.editBuyDateObj.id)[0];
        const converted_date = this.editBuyDateObj.date.toString().split('.').reverse().join('-');

        this.api.request<string>(HttpMethod.POST, `user/collection/update/${this.editBuyDateObj.id}`, {price: volume.price, date: converted_date}, 'text').subscribe((res:any)=>{
            // TODO translate
            successAlert(this.alerts, `Date saved successfully`, undefined, this.translate);
            volume.buy_date = converted_date;
            volumeRef.updateBuyDate();
            this.savingBuyDateEdit = false;
            this.showEditBuyDateDialog = false;
        }, (err:any)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.savingBuyDateEdit = false;
        });
    }

    // update query params
    updateQueryParams(){
        // navigate router without reloading and without pushing to history
        this.router.navigate([], { queryParams: {order: this.selectedOrder.value, page: this.currentPage, search: this.search.trim() !== '' ? this.search : null}, queryParamsHandling: 'merge', replaceUrl: true });
        // reload series after
        this.loadCollection();
    }

    // keydown handler for search input
    searchKeyDown(event: KeyboardEvent) {
        if(event.key === 'Enter') {
            // check if search is different from previous search
            if(this.search !== this.prevSearch) {
                this.currentPage = 0;
                this.prevSearch = this.search;
                this.currentSearch = this.search;
                // update query params
                this.updateQueryParams();
            }
        }
    }

    loadCollection(){
        const PAGE_LIMIT = 48;

        if(!this.auth.isLoggedIn()){
            this.loading = false;
            return;
        }
        // show loading indicator
        this.loading = true;
    
        // get users prefered content language
        const contentLang = this.auth.getUserSetting('prefered-content-language');
        const lang = contentLang === 'interface' ? this.translate.currentLang || 'en' : contentLang;

        const offset = this.currentPage * PAGE_LIMIT;
    
        this.api.request<any>(HttpMethod.POST, `user/collection`, {order:this.selectedOrder.value,limit: PAGE_LIMIT, offset, search: this.search, user_lang: lang}).subscribe((res:any)=>{
            this.maxPages = res.max;
            const tmpData = res.volumes;

            const groupedVolumes:any = {};
            for(const vol of tmpData){
                // create extra date (converted to tui date for date inputs as a ngModel)
                const dateParts = vol.buy_date.toString().split('-').map((p:string) => parseInt(p));
                vol.buy_date_tui = new TuiDay(dateParts[0],dateParts[1]-1,dateParts[2]);
                if(Object.keys(groupedVolumes).includes(vol.series)) groupedVolumes[vol.series].push(vol);
                else groupedVolumes[vol.series] = [vol];
            }
            this.volumes = groupedVolumes;
            this.volumeKeys = Object.keys(this.volumes);
            this.loading = false;
        }, (err:any)=>{
            this.loading = false;
        });
    }

    // redirect to volume
    volumeClick(volume: any){
        const slug = volume.slug;
        const series = slug.split(':')[0];
        const volSlug = slug.split(':')[1];
        this.router.navigate(['volume', series, volSlug]);
    }
}
