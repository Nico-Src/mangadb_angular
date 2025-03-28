import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { solarLinkBold } from '@ng-icons/solar-icons/bold';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiAppearance } from '@taiga-ui/core';

@Component({
    selector: 'link-warn-dialog',
    imports: [ NgIcon, TranslatePipe, TuiButton, TuiAppearance],
    templateUrl: './link-warn-dialog.component.html',
    styleUrl: './link-warn-dialog.component.less',
    viewProviders: [provideIcons({ solarLinkBold })]
})
export class LinkWarnDialog {
    constructor(private auth: AuthService, private translate: TranslateService, private el: ElementRef){}
    @Input() link: string = "";
    show = false;
    @ViewChild('window') window: any;

    // open dialog
    public showDialog(){
        this.show = true;
    }

    @HostListener('click', ['$event']) onDocumentClick(event: MouseEvent) {
        // close dialog if target is backdrop of dialog
        if (event.target === this.el.nativeElement) {
            this.show = false;
        }
    }

    // open current link
    openLink(){
        this.show = false;
        window.open(this.link, '_blank')?.focus();
    }
}
