import { Component, ElementRef, HostListener, Input, signal, ViewChild } from '@angular/core';
import { API_BASE, CDN_BASE, DEFAULT_SETTINGS } from '../../globals';
import { AuthService } from '../../services/auth.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiAppearance } from '@taiga-ui/core';
import { PluralTranslatePipe } from '../pipes/pluralTranslate';
import { TuiLoader } from '@taiga-ui/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TuiElasticContainer } from '@taiga-ui/kit';
import { Router } from '@angular/router';

@Component({
    selector: 'tag-dialog',
    imports: [ NgIf, TranslatePipe, PluralTranslatePipe, TuiButton, TuiAppearance, TuiLoader, TuiElasticContainer],
    templateUrl: './tag-dialog.component.html',
    styleUrl: './tag-dialog.component.less',
})
export class TagDialog {
    constructor(private auth: AuthService, private translate: TranslateService, private el: ElementRef, private http: HttpClient, private router: Router){}
    @Input() tag: any = null;
    show = false;
    tagDataLoading = false;
    seriesCount = 0;
    @ViewChild('window') window: any

    ngOnInit(){

    }

    // load tag data (count of series that have this tag)
    loadTagData(){
        if(!this.tag?.id) return;
        this.http.get(`${API_BASE}/tags/id/${this.tag.id}`).subscribe((res:any)=>{
            this.seriesCount = res.count;
            setTimeout(()=>{
                this.tagDataLoading = false;
            },250);
        });
    }

    public showDialog(tag:any){
        this.show = true;
        const sameTag = this.tag === tag;
        this.tag = tag;

        if(sameTag) this.tagDataLoading = false;
        else {
            this.tagDataLoading = true;
            this.loadTagData();
        }
    }

    // listen on click events on host
    @HostListener('click', ['$event']) onDocumentClick(event: MouseEvent) {
        // target is host close
        if (event.target === this.el.nativeElement) {
            this.show = false;
            // so there isnt a flicker when clicking on another tag after closing the dialog
            setTimeout(()=>{
                this.tag = null;
            },250);
        }
    }

    // browse series with current tag
    browseTag(){
        this.router.navigate(['browse-series'],{queryParams: {filters: this.tag.name}});
    }
}
