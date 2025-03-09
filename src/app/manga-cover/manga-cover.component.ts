import { Component, Input } from '@angular/core';
import { CDN_BASE } from '../../globals';
import { NgIf } from '@angular/common';
import { TuiImgLazyLoading } from '@taiga-ui/kit';
import { TuiSkeleton } from '@taiga-ui/kit';

@Component({
    selector: 'manga-cover',
    imports: [NgIf, TuiImgLazyLoading, TuiSkeleton],
    templateUrl: './manga-cover.component.html',
    styleUrl: './manga-cover.component.less'
})
export class MangaCover {
    readonly cdn_base = CDN_BASE;
    loading = true;
    @Input() id: number = -1;
    @Input() fit: string = 'default';
    @Input() blur: boolean = false;
    @Input() aspectRatio: number = 1;
}
