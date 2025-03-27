import { Component, ElementRef, HostListener, inject, Input, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiAppearance, TuiLoader, TuiAlertService, TuiTextfield, tuiDateFormatProvider } from '@taiga-ui/core';
import { TuiElasticContainer } from '@taiga-ui/kit';
import { NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APIService, HttpMethod } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { errorAlert, successAlert, getTranslation } from '../../globals';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiBooleanHandler } from '@taiga-ui/cdk/types';

@Component({
    selector: 'series-list-dialog',
    imports: [ TranslatePipe, TuiButton, TuiAppearance, TuiElasticContainer, NgIf, TuiLoader, ReactiveFormsModule, FormsModule, TuiTextfield, TuiSelectModule, TuiTextfieldControllerModule],
    templateUrl: './series-list-dialog.component.html',
    styleUrl: './series-list-dialog.component.less',
    providers: [tuiDateFormatProvider({mode: 'YMD', separator: '/'})],
})
export class SeriesListDialog {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    private readonly alerts = inject(TuiAlertService);
    constructor(private translate: TranslateService, private el: ElementRef){}
    @Input() series: any = null;
    loading: boolean = false;
    dataLoaded: boolean = false;
    lists: any = [];
    selectedList: any;
    adding: boolean = false;
    show = false;

    @ViewChild('window') window: any;

    // open dialog
    public showDialog(){
        this.show = true;
        if(!this.dataLoaded && !this.loading){
            this.loadLists();
            this.loading = true;
        }
    }

    // load user rating
    loadLists(){
        this.api.request<any>(HttpMethod.GET, `lists/type/series/${this.series.id}`, {}).subscribe((res:any)=>{
            this.lists = res;
            for(const list of this.lists) list.disabled = list.in_list;
            this.loading = false;
        });
    }

    @HostListener('click', ['$event']) onDocumentClick(event: MouseEvent) {
        // close dialog if target is backdrop of dialog
        if (event.target === this.el.nativeElement) {
            this.show = false;
        }
    }

    // add to list
    async addToList(){
        // if not list is selected show error message
        if(!this.selectedList){
            const msg = await getTranslation(this.translate, `list-dialog.not-selected`);
            errorAlert(this.alerts, msg, undefined, this.translate);
            return;
        }

        this.adding = true;

        // send api request
        this.api.request<any>(HttpMethod.POST, `lists/add/series`, {item_id: this.series.id, list_id: this.selectedList.id}, 'text').subscribe(async (res:string)=>{
            const msg = await getTranslation(this.translate, `list-dialog.add-success`);
            successAlert(this.alerts, msg, undefined, this.translate);
            this.adding = false;
            this.show = false;
            this.selectedList = null;
            this.loadLists();
        }, async (err:any)=>{
            if(err.status === 409){
                const msg = await getTranslation(this.translate, `list-dialog.already-in-list`);
                errorAlert(this.alerts, msg, undefined, this.translate);
            } else {
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            }
            this.adding = false;
        });
    }

    // disabled list handler
    protected readonly disabledListHandler: TuiBooleanHandler<any> = (v) => v.disabled === true;
}
