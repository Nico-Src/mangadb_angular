import { Component, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { TuiIcon, TuiHint } from '@taiga-ui/core';
import { TuiFade } from '@taiga-ui/kit';
import { SideBarService } from '../../services/sidebar.service';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'side-bar',
    imports: [NgIf, TuiIcon, TuiFade, TuiHint, TranslatePipe, RouterLink],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.less'
})
export class SideBar {
    inAdminArea = false;
    constructor(public router: Router, public sidebar: SideBarService) { }

    ngOnInit() {
        
    }
}
