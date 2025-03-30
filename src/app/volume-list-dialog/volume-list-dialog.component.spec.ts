import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolumeListDialog } from './volume-list-dialog.component';

describe('VolumeListDialog', () => {
    let component: VolumeListDialog;
    let fixture: ComponentFixture<VolumeListDialog>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VolumeListDialog]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(VolumeListDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
