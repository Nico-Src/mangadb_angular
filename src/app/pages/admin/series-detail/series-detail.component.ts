import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { _, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService, HttpMethod } from '../../../../services/api.service';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { Location, NgIf } from '@angular/common';
import { MangaCover } from '../../../manga-cover/manga-cover.component';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-series-detail',
    imports: [TranslatePipe,TuiButton,NgIf,MangaCover,TuiTextfield,TuiTextfieldControllerModule,TuiSelectModule,ReactiveFormsModule,FormsModule],
    templateUrl: './series-detail.component.html',
    styleUrl: './series-detail.component.less'
})
export class AdminSeriesDetailComponent {
    private readonly api = inject(APIService);
    series:any = null;
    editSeries:any = null;
    loading:boolean = true;
    constructor(private translate: TranslateService, private title: Title, private router: Router, private route: ActivatedRoute, private location: Location) { }
    
    ngOnInit() {
        // set title
        this.title.setTitle(`Edit Series | MangaDB`);

        const id = this.route.snapshot.paramMap.get('id');

        this.addLock(id);
        this.loadSeries(id);
    }

    loadSeries(id:any){
        this.api.request<any>(HttpMethod.GET, `admin-series/id/${id}`, {}).subscribe((res:any)=>{
            console.log(res)
            this.series = res;
            this.editSeries = JSON.parse(JSON.stringify(this.series));
            this.loading = false;
        });
    }

    addLock(id:any){
        this.api.request<string>(HttpMethod.POST, `admin/lock`,{route:'series',id:id},'text').subscribe((res:any)=>{},(err)=>{
            this.location.back();
        });
    }

    removeLock(){
        this.api.request<string>(HttpMethod.DELETE, `admin/remove-lock`, {route:'series',id:this.series.id},'text').subscribe((res:any)=>{
            this.location.back();
        });
    }
}
