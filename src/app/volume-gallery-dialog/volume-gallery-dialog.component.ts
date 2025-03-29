import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiAppearance, TuiLoader, TuiAlertService, TuiTextfield } from '@taiga-ui/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { errorAlert, successAlert, getTranslation } from '../../globals';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiSegmented, TuiSlider } from '@taiga-ui/kit';
import { MangaCover } from '../manga-cover/manga-cover.component';

@Component({
    selector: 'volume-gallery-dialog',
    imports: [ TranslatePipe, MangaCover, TuiSegmented, TuiButton, TuiSlider, TuiAppearance, NgIf, NgFor, ReactiveFormsModule, FormsModule, TuiTextfield, TuiSelectModule, TuiTextfieldControllerModule],
    templateUrl: './volume-gallery-dialog.component.html',
    styleUrl: './volume-gallery-dialog.component.less',
})
export class VolumeGalleryDialog {
    constructor(private translate: TranslateService, private el: ElementRef){}
    @Input() volume: any = null;
    show: boolean = false;
    tabIndex: number = 0;

    @ViewChild('window') window: any;

    // open dialog
    public showDialog(){
        this.show = true;
    }

    public setTabIndex(index:number){
        this.tabIndex = index;
    }

    @HostListener('click', ['$event']) onDocumentClick(event: MouseEvent) {
        // close dialog if target is backdrop of dialog
        if (event.target === this.el.nativeElement) {
            this.show = false;
        }
    }
}
