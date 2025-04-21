import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiAlertService, TuiButton, TuiDataList, TuiHint, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { TuiComboBoxModule, TuiSelectModule, TuiTextareaModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerCheck, tablerEdit, tablerExternalLink, tablerEye, tablerPlus, tablerSortAscendingLetters, tablerSortAscendingNumbers, tablerSortDescendingLetters, tablerSortDescendingNumbers, tablerTrash, tablerX } from '@ng-icons/tabler-icons';
import { NgFor, NgIf } from '@angular/common';
import { TuiPagination, } from '@taiga-ui/kit';
import { CDN_BASE, errorAlert, getTranslation, LANGS, successAlert, langToLocale, ago } from '../../../../globals';
import { TuiTable } from '@taiga-ui/addon-table';

@Component({
    selector: 'app-admin-users',
    imports: [NgFor,NgIf,TuiTextfield,ScrollingModule,TuiTextareaModule,TuiTable,TuiHint,TuiComboBoxModule,TuiDataList,TuiPagination,TuiSelectModule,ReactiveFormsModule,FormsModule,TranslatePipe,NgIcon,TuiTextfieldControllerModule],
    templateUrl: './users.component.html',
    styleUrl: './users.component.less',
    providers: [],
    viewProviders: [provideIcons({tablerSortAscendingLetters,tablerExternalLink,tablerEye,tablerSortDescendingLetters,tablerEdit,tablerPlus,tablerTrash,tablerX,tablerCheck})]
})

export class AdminUsersComponent {
    private readonly alerts = inject(TuiAlertService);
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    readonly theme = computed(() => this.auth.theme());

    currentUser:any = computed(()=>this.auth.getUser());
    cdn_base = CDN_BASE;
    tableSize:any = 's';
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
    selectedOrder: any = this.orders[0];
    users: any = [];
    userMenuItems = [
        {title: 'edit', icon: 'tablerEdit', action: this.editUser.bind(this)},
        {title: 'delete', icon: 'tablerTrash', action: this.confirmDeleteUser.bind(this)},
    ];
    @ViewChild('dropdown') dropdown:any;

    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute) { }
    
    ngOnInit() {
        // set title
        this.translate.get(_('title.admin-users')).subscribe((res: any) => {
            this.title.setTitle(`${res} | MangaDB`);
        });

        // get query params (also on change)
        this.route.queryParams.subscribe(params => {
            if(params['order']) this.selectedOrder = this.orders.find((o: { value: any; }) => o.value === params['order']);
            if(params['page']) this.currentPage = parseInt(params['page']);
            if(params['search']) this.search = this.prevSearch = this.currentSearch = params['search'];
        });

        this.updateQueryParams();
    }

    // update query parameter
    updateQueryParams(){
        // navigate router without reloading and without pushing to history
        this.router.navigate([], { queryParams: {order: this.selectedOrder.value, page: this.currentPage, search: this.search.trim() !== '' ? this.search : null}, queryParamsHandling: 'merge', replaceUrl: true });
        this.loadUsers();
    }

    // lang to locale converter
    toLoc(lang:string){
        return langToLocale(lang);
    }

    agoTime(date:string){
        return ago(date, this.translate.currentLang);
    }

    // load users
    loadUsers(){
        this.loading = true;
        const PAGE_LIMIT = 50;
        const offset = this.currentPage * PAGE_LIMIT;
        this.api.request<any>(HttpMethod.POST, `admin-users`, {order: this.selectedOrder.value,limit: PAGE_LIMIT,offset,search:this.search}).subscribe((res:any)=>{
            this.users = res.users;
            this.maxPages = res.max;
            console.log(res)
            this.loading = false;
        });
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

    editUser(user:any){
        this.router.navigate(['admin','users',user.id]);
    }

    // delete user
    async confirmDeleteUser(user:any){
        if(!user) return;
        const msg = await getTranslation(this.translate, `user.delete-question`);
        const confirmDelete = confirm(msg);
        // if user wants to delete publisher send delete request
        if(confirmDelete){
            this.api.request<string>(HttpMethod.DELETE, `admin-users/delete/${user.id}`, {}, 'text').subscribe(async(res:any)=>{
                const msg = await getTranslation(this.translate, `user.delete-success`);
                successAlert(this.alerts, msg, undefined, this.translate);
                this.loadUsers();
            }, (err:any)=>{
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            });
        }
    }
}
