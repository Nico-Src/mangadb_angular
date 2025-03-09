import { Component, computed, effect, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { TuiIcon, TuiHint } from '@taiga-ui/core';
import { TuiFade } from '@taiga-ui/kit';
import { SideBarService } from '../../services/sidebar.service';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { filter } from 'rxjs';

@Component({
    selector: 'side-bar',
    imports: [NgIf, TuiIcon, TuiFade, TuiHint, TranslatePipe, RouterLink],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.less'
})
export class SideBar {
    inAdminArea = false;
    constructor(public router: Router, public sidebar: SideBarService) {
        // listen to navigationEnd events to update the inAdminArea variable
        this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
            // check if the current route starts with '/admin'
            this.inAdminArea = this.router.url.startsWith('/admin');
            sidebar.setInAdminArea(this.inAdminArea);
        });
    }

    ngOnInit() {
        
    }
}
