import { Component, ElementRef, HostListener, inject, Input, ViewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiAppearance } from '@taiga-ui/core';
import { PluralTranslatePipe } from '../../pipes/pluralTranslate';
import { TuiLoader } from '@taiga-ui/core';
import { NgIf } from '@angular/common';
import { TuiElasticContainer } from '@taiga-ui/kit';
import { Router } from '@angular/router';
import { APIService, HttpMethod } from '../../services/api.service';

@Component({
    selector: 'tag-dialog',
    imports: [ NgIf, TranslatePipe, PluralTranslatePipe, TuiButton, TuiAppearance, TuiLoader, TuiElasticContainer],
    templateUrl: './tag-dialog.component.html',
    styleUrl: './tag-dialog.component.less',
})
export class TagDialog {
    private readonly api = inject(APIService);
    constructor(private el: ElementRef, private router: Router){}
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
        this.api.request<any>(HttpMethod.GET, `tags/id/${this.tag.id}`, {}).subscribe((res:any)=>{
            this.seriesCount = res.count;
            setTimeout(()=>{
                this.tagDataLoading = false;
            },250);
        });
    }

    // open dialog
    public showDialog(tag:any){
        this.show = true;
        // check if dialog was openened with the same tag agan
        const sameTag = this.tag === tag;
        this.tag = tag;

        // if it is the same tag dont load again
        if(sameTag) this.tagDataLoading = false;
        // else load data
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
