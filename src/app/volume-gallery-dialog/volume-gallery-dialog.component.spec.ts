import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolumeGalleryDialog } from './volume-gallery-dialog.component';

describe('VolumeJumpDialog', () => {
    let component: VolumeGalleryDialog;
    let fixture: ComponentFixture<VolumeGalleryDialog>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VolumeGalleryDialog]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(VolumeGalleryDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
