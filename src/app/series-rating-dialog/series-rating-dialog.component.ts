import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiAppearance, TuiLoader, TuiAlertService } from '@taiga-ui/core';
import { TuiElasticContainer, TuiRating } from '@taiga-ui/kit';
import { TuiArcChart } from '@taiga-ui/addon-charts';
import { NgIf } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { solarStar } from '@ng-icons/solar-icons/outline';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APIService, HttpMethod } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { errorAlert, successAlert, getTranslation } from '../../globals';

@Component({
    selector: 'series-rating-dialog',
    imports: [ TranslatePipe, TuiButton, TuiAppearance, TuiElasticContainer, TuiArcChart, NgIf, NgIcon, TuiLoader, TuiRating, ReactiveFormsModule, FormsModule],
    templateUrl: './series-rating-dialog.component.html',
    styleUrl: './series-rating-dialog.component.less',
    viewProviders: [provideIcons({solarStar})]
})
export class SeriesRatingDialog {
    private readonly api = inject(APIService);
    private readonly auth = inject(AuthService);
    private readonly alerts = inject(TuiAlertService);
    constructor(private translate: TranslateService, private el: ElementRef){}
    @Input() series: any = null;
    @Output() triggerUpdate: EventEmitter<any> = new EventEmitter();
    loading: boolean = false;
    dataLoaded: boolean = false;
    rating: number = 0;
    ratingExists: boolean = false;
    chartValue: any = [];
    chartIndex: number = 0;
    deleting: boolean = false;
    updating: boolean = false;
    show = false;
    @ViewChild('window') window: any;
    
    ngOnChanges(){
        // create chart values for rating
        if(this.series?.id){
            this.updateChart();
        }
    }

    // open dialog
    public showDialog(){
        this.show = true;
        if(!this.dataLoaded && !this.loading){
            this.loadRating();
            this.loading = true;
        }
    }

    // update chart values for the current ratings
    public updateChart(){
        this.chartValue = [];
        const totalRatings = this.series.rating_count;
        for(let i = 1; i <= 5; i++){
            const percentage = totalRatings === 0 ? 0 : (((this.series.ratings.find((r:any)=>r.rating === i)?.count || 0) / totalRatings) * 100).toFixed(2);
            this.chartValue.push(percentage);
        }
    }

    // reset dialog
    public reset(){
        this.loading = false;
        this.dataLoaded = false;
        this.rating = 0;
        this.ratingExists = false;
        this.show = false;
        this.chartValue = [];
        this.chartIndex = 0;
    }

    // load user rating
    loadRating(){
        this.api.request<any>(HttpMethod.GET, `user/series-rating/id/${this.series?.id}`, {}).subscribe((res:any)=>{
            this.rating = res?.rating || 0;
            this.ratingExists = this.rating !== 0;
            this.loading = false;
            this.dataLoaded = true;
        });
    }

    @HostListener('click', ['$event']) onDocumentClick(event: MouseEvent) {
        // close dialog if target is backdrop of dialog
        if (event.target === this.el.nativeElement) {
            this.show = false;
        }
    }

    // update or add rating
    saveRating(){
        // if user isnt logged in show error message
        if(!this.auth.isLoggedIn()){
            // TODO translate
            errorAlert(this.alerts, 'You need to be logged in to do this.', undefined, this.translate);
            return;
        }

        this.updating = true;

        // if rating exists update it
        if(this.ratingExists){
            this.api.request<string>(HttpMethod.POST, `user/series-rating/update/${this.series?.id}`, { rating: this.rating }, 'text').subscribe(async (res)=>{
                // show success message
                const msg = await getTranslation(this.translate, 'rating-dialog.save-success');
                successAlert(this.alerts, msg, undefined, this.translate);
                this.triggerUpdate.emit();
                this.loadRating();

                this.show = false;
                this.updating = false;
            },(err)=>{
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
                this.updating = false;
            });
        // if not add rating
        } else {
            this.api.request<string>(HttpMethod.POST, `user/series-rating/add/${this.series?.id}`, { rating: this.rating }, 'text').subscribe(async (res)=>{
                // show success message
                const msg = await getTranslation(this.translate, 'rating-dialog.add-success');
                successAlert(this.alerts, msg, undefined, this.translate);
                this.triggerUpdate.emit();
                this.loadRating();

                this.show = false;
                this.updating = false;
            }, (err)=>{
                errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
                this.updating = false;
            });
        }
    }

    // delete rating
    deleteRating(){
        // if user isnt logged in show error message
        if(!this.auth.isLoggedIn()){
            // TODO translate
            errorAlert(this.alerts, 'You need to be logged in to do this.', undefined, this.translate);
            return;
        }

        this.deleting = true;
        this.api.request<string>(HttpMethod.DELETE, `user/series-rating/delete/${this.series?.id}`, {}, 'text').subscribe(async(res)=>{
            // show success message
            const msg = await getTranslation(this.translate, 'rating-dialog.delete-success');
            successAlert(this.alerts, msg, undefined, this.translate);
            this.triggerUpdate.emit();
            this.loadRating();

            this.show = false;
            this.deleting = false;
        }, (err)=>{
            errorAlert(this.alerts, JSON.stringify(err), undefined, this.translate);
            this.deleting = false;
        });
    }
}
