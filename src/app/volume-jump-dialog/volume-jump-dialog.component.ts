import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiAppearance, TuiLoader, TuiAlertService, TuiTextfield } from '@taiga-ui/core';
import { NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { errorAlert, successAlert, getTranslation } from '../../globals';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiSlider } from '@taiga-ui/kit';

@Component({
    selector: 'volume-jump-dialog',
    imports: [ TranslatePipe, TuiButton, TuiSlider, TuiAppearance, NgIf, TuiLoader, ReactiveFormsModule, FormsModule, TuiTextfield, TuiSelectModule, TuiTextfieldControllerModule],
    templateUrl: './volume-jump-dialog.component.html',
    styleUrl: './volume-jump-dialog.component.less',
})
export class VolumeJumpDialog {
    constructor(private translate: TranslateService, private el: ElementRef){}
    @Input() volume: any = null;
    @Output() jumpTrigger: EventEmitter<any> = new EventEmitter();
    show: boolean = false;
    tmpIndex: number = 0;

    @ViewChild('window') window: any;

    // open dialog
    public showDialog(index: number){
        this.show = true;
        this.tmpIndex = index;
    }

    @HostListener('click', ['$event']) onDocumentClick(event: MouseEvent) {
        // close dialog if target is backdrop of dialog
        if (event.target === this.el.nativeElement) {
            this.show = false;
        }
    }

    jumpTo(){
        this.jumpTrigger.emit(this.tmpIndex);
        this.show = false;
    }
}
