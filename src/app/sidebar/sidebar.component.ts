import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { TuiHint } from '@taiga-ui/core';
import { TuiFade } from '@taiga-ui/kit';
import { SideBarService } from '../../services/sidebar.service';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerDashboard, tablerHome, tablerListSearch, tablerMessageReport, tablerQuote, tablerUsers } from '@ng-icons/tabler-icons';
import { solarLibrary, solarHistory, solarBillList, solarSettings, solarUsersGroupRounded, solarCart4, solarFileText } from '@ng-icons/solar-icons/outline';
import { solarBuildingsLinear } from '@ng-icons/solar-icons/linear';
import { lucideBook, lucideDices, lucideImage, lucideLibrary } from '@ng-icons/lucide';
import { matFaceOutline, matPrivacyTipOutline } from '@ng-icons/material-icons/outline';
import { APIService, HttpMethod } from '../../services/api.service';
import { heroBuildingOffice2 } from '@ng-icons/heroicons/outline';

@Component({
    selector: 'side-bar',
    imports: [NgIf, TuiFade, TuiHint, TranslatePipe, RouterLink, NgIcon],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.less',
    viewProviders: [provideIcons({ tablerHome, tablerDashboard, lucideLibrary, lucideBook, matFaceOutline, lucideImage, tablerUsers, tablerMessageReport, heroBuildingOffice2, solarLibrary, solarHistory, solarBillList, solarSettings, tablerListSearch, solarBuildingsLinear, lucideDices, solarUsersGroupRounded, solarCart4, tablerQuote, matPrivacyTipOutline, solarFileText })]
})
export class SideBar {
    private readonly api = inject(APIService);
    inAdminArea = false;
    randomLoading = false;
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

    // redirect to random series
    randomSeries(){
        if(this.randomLoading) return;
        this.randomLoading = true;
        this.api.request<string>(HttpMethod.GET, `series/random`, {}, 'text').subscribe((res:string)=>{
            this.router.navigate(['series', res]);

            setTimeout(()=>{
                this.randomLoading = false;
            },500);
        });
    }
}
