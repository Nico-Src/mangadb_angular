import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolumeJumpDialog } from './volume-jump-dialog.component';

describe('VolumeJumpDialog', () => {
    let component: VolumeJumpDialog;
    let fixture: ComponentFixture<VolumeJumpDialog>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VolumeJumpDialog]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(VolumeJumpDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
