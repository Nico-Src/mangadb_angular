import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminVolumeDetailComponent } from './volume-detail.component';

describe('AdminVolumeDetailComponent', () => {
    let component: AdminVolumeDetailComponent;
    let fixture: ComponentFixture<AdminVolumeDetailComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminVolumeDetailComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(AdminVolumeDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
