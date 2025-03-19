import { Component } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { _, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-empty',
    imports: [],
    templateUrl: './empty.component.html',
    styleUrl: './empty.component.less'
})
export class EmptyComponent {
    constructor(private translate: TranslateService, private meta: Meta, private title: Title) { }
    
    ngOnInit() {

    }
}
