import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminVolumesComponent } from './volumes.component';

describe('AdminSeriesComponent', () => {
    let component: AdminVolumesComponent;
    let fixture: ComponentFixture<AdminVolumesComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminVolumesComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(AdminVolumesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
