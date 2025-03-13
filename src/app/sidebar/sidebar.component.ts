import { Component, computed, effect, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { TuiHint } from '@taiga-ui/core';
import { TuiFade } from '@taiga-ui/kit';
import { SideBarService } from '../../services/sidebar.service';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerHome, tablerListSearch, tablerQuote } from '@ng-icons/tabler-icons';
import { solarLibrary, solarHistory, solarBillList, solarSettings, solarUsersGroupRounded, solarCart4, solarFileText } from '@ng-icons/solar-icons/outline';
import { solarBuildingsLinear } from '@ng-icons/solar-icons/linear';
import { lucideDices } from '@ng-icons/lucide';
import { matPrivacyTipOutline } from '@ng-icons/material-icons/outline';

@Component({
    selector: 'side-bar',
    imports: [NgIf, TuiFade, TuiHint, TranslatePipe, RouterLink, NgIcon],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.less',
    viewProviders: [provideIcons({ tablerHome, solarLibrary, solarHistory, solarBillList, solarSettings, tablerListSearch, solarBuildingsLinear, lucideDices, solarUsersGroupRounded, solarCart4, tablerQuote, matPrivacyTipOutline, solarFileText })]
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
