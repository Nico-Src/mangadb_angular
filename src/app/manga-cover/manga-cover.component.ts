import { Component, Input, signal } from '@angular/core';
import { CDN_BASE, DEFAULT_SETTINGS } from '../../globals';
import { NgIf } from '@angular/common';
import { TuiImgLazyLoading } from '@taiga-ui/kit';
import { TuiSkeleton } from '@taiga-ui/kit';
import { AuthService } from '../../services/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerRating16Plus, tablerRating18Plus } from '@ng-icons/tabler-icons';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'manga-cover',
    imports: [NgIf, TuiImgLazyLoading, TuiSkeleton, NgIcon, TranslatePipe],
    templateUrl: './manga-cover.component.html',
    styleUrl: './manga-cover.component.less',
    viewProviders: [provideIcons({ tablerRating16Plus, tablerRating18Plus })]
})
export class MangaCover {
    readonly cdn_base = CDN_BASE;
    constructor(private auth: AuthService, private translate: TranslateService){}
    loading = true;
    @Input() id: number = -1;
    @Input() fit: string = 'default';
    @Input() blur: boolean = false;
    @Input() aspectRatio: number = 1;
    @Input() nsfw: boolean = false;
    @Input() nsfw18: boolean = false;
    @Input() forceSkeleton: boolean = false;
    @Input() res: string = 'scaled';
    needsNSFWPlaceholder = signal(false);
    needsNSFW18Placeholder = signal(false);
    needsSkeleton = signal(false);

    ngOnInit(){
        // get nsfw mode
        let nsfwMode = this.auth.getUserSetting('nsfw-mode');
        let ageVerified = false;
        // if user is logged in get age verified
        if(this.auth.isLoggedIn()){
            ageVerified = this.auth.getUser().age_verified || false;
        }
        // check if nsfw placeholders are needed and if skeleton is needed
        this.needsNSFWPlaceholder.set(this.nsfw && nsfwMode === 'settings.nsfw.hide-nsfw');
        this.needsNSFW18Placeholder.set((this.nsfw18 && (nsfwMode === 'settings.nsfw.hide-nsfw' || nsfwMode === 'settings.nsfw.show-nsfw')) || (this.nsfw18 && ageVerified === false));
        this.needsSkeleton.set((this.needsNSFWPlaceholder() === false && this.needsNSFW18Placeholder() === false) || this.forceSkeleton === true);
    }
}
