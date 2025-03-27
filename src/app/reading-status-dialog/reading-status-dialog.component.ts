import { Component, ElementRef, HostListener, inject, Input, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiAppearance, TuiLoader, TuiAlertService, TuiTextfield, tuiDateFormatProvider } from '@taiga-ui/core';
import { TuiElasticContainer, TuiInputNumber, TuiRadioList, TuiRating } from '@taiga-ui/kit';
import { NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APIService, HttpMethod } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { errorAlert, successAlert, getTranslation, READ_STATUS_VISIBILITY_OPTIONS, READ_STATUSES, READ_STATUS_PROGRESS_TYPE_OPTIONS, READ_STATUS_PRIORITY_OPTIONS } from '../../globals';
import { TuiInputDateModule, TuiInputModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiDay } from '@taiga-ui/cdk/date-time';

@Component({
    selector: 'reading-status-dialog',
    imports: [ TranslatePipe, TuiButton, TuiAppearance, TuiElasticContainer, NgIf, TuiLoader, TuiRating, ReactiveFormsModule, FormsModule, TuiRadioList, TuiInputNumber, TuiTextfield, TuiSelectModule, TuiInputDateModule, TuiInputModule, TuiTextfieldControllerModule],
    templateUrl: './reading-status-dialog.component.html',
    styleUrl: './reading-status-dialog.component.less',
    providers: [tuiDateFormatProvider({mode: 'YMD', separator: '/'})],
})
export class ReadingStatusDialog {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    private readonly alerts = inject(TuiAlertService);
    constructor(private translate: TranslateService, private el: ElementRef){}
    @Input() series: any = null;
    loading: boolean = false;
    dataLoaded: boolean = false;
    status: any = null;
    statusExists: boolean = false;
    deleting: boolean = false;
    updating: boolean = false;
    show = false;

    visibilityOptions = READ_STATUS_VISIBILITY_OPTIONS.map((v:any)=>v.value);
    statuses = READ_STATUSES;
    progressTypes = READ_STATUS_PROGRESS_TYPE_OPTIONS;
    priorityOptions = READ_STATUS_PRIORITY_OPTIONS;

    @ViewChild('window') window: any;

    // open dialog
    public showDialog(){
        this.show = true;
        if(!this.dataLoaded && !this.loading){
            this.loadStatus();
            this.loading = true;
        }
    }

    // reset dialog
    public reset(){
        this.loading = false;
        this.dataLoaded = false;
        this.status = null;
        this.statusExists = false;
        this.show = false;
    }

    // load user rating
    loadStatus(){
        this.api.request<any>(HttpMethod.GET, `user/reading-status/id/${this.series.id}`, {}).subscribe((res:any)=>{
            console.log(res)
            this.statusExists = res !== null;
            const defaultStatus = {
                visibility: 'private',
                progressType: READ_STATUS_PROGRESS_TYPE_OPTIONS.find((o:any)=>o.key === 'chapters'),
                progress: 0,
                status: READ_STATUSES.find((s:any)=>s.key === 'started'),
                reread: 0,
                score: 0,
                priority: {key: 'low'},
                start: undefined,
                end: undefined
            };
            this.status = this.statusExists ? res : defaultStatus;
            this.loading = false;
            this.dataLoaded = true;

            if(this.statusExists && this.status){
                this.status.progressType = {key: this.status.progress_type};
                this.status.status = {key: this.status.status};
                this.status.priority = {key: this.status.priority};
                if(this.status.start){
                    const dateParts = this.status.start.toString().split('-').map((p:string) => parseInt(p));
                    this.status.start = new TuiDay(dateParts[0],dateParts[1]-1,dateParts[2]);
                }
                if(this.status.end){
                    const dateParts = this.status.end.toString().split('-').map((p:string) => parseInt(p));
                    this.status.end = new TuiDay(dateParts[0],dateParts[1]-1,dateParts[2]);
                }
            }
        });
    }

    @HostListener('click', ['$event']) onDocumentClick(event: MouseEvent) {
        // close dialog if target is backdrop of dialog
        if (event.target === this.el.nativeElement) {
            this.show = false;
        }
    }

    // update or add status
    saveStatus(){
        // if user isnt logged in show error message
        if(!this.auth.isLoggedIn()){
            // TODO translate
            errorAlert(this.alerts, 'You need to be logged in to do this.', undefined, this.translate);
            return;
        }

        this.updating = true;
        
        // convert date to format for api
        if(this.status.start) this.status.start = this.status.start.toString().split('.').reverse().join('-');
        if(this.status.end) this.status.end = this.status.end.toString().split('.').reverse().join('-');

        // based on if there is already a status update or add it
        if(this.statusExists === true){
            this.api.request<any>(HttpMethod.POST, `user/reading-status/update/${this.series.id}`, {...this.status}, 'text').subscribe(async (res:any)=>{
                const msg = await getTranslation(this.translate, 'reading-dialog.save-success');
                successAlert(this.alerts, msg, undefined, this.translate);
                this.loadStatus();
                this.updating = false;
                this.show = false;
            }, (err:any)=>{
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
                this.updating = false;
            });
        } else {
            this.api.request<any>(HttpMethod.POST, `user/reading-status/add/${this.series.id}`, {...this.status}, 'text').subscribe(async (res:any)=>{
                const msg = await getTranslation(this.translate, 'reading-dialog.add-success');
                successAlert(this.alerts, msg, undefined, this.translate);
                this.loadStatus();
                this.updating = false;
                this.show = false;
            }, (err:any)=>{
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
                this.updating = false;
            });
        }
    }

    // delete status
    deleteStatus(){
        // if user isnt logged in show error message
        if(!this.auth.isLoggedIn()){
            // TODO translate
            errorAlert(this.alerts, 'You need to be logged in to do this.', undefined, this.translate);
            return;
        }

        this.deleting = true;

        this.api.request<any>(HttpMethod.DELETE, `user/reading-status/delete/${this.series.id}`, {}, 'text').subscribe(async (res:any)=>{
            const msg = await getTranslation(this.translate, 'reading-dialog.delete-success');
            successAlert(this.alerts, msg, undefined, this.translate);
            this.loadStatus();
            this.deleting = false;
            this.show = false;
        }, (err)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.deleting = false;
        });
    }

    // reading status progress change listener
    readingStatusProgressChange(e:any){
        // if empty set to 0
        if(!e || e.trim() === "") this.status.progress = 0;
    }
}
