import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSeriesDetailComponent } from './series-detail.component';

describe('AdminSeriesDetailComponent', () => {
    let component: AdminSeriesDetailComponent;
    let fixture: ComponentFixture<AdminSeriesDetailComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminSeriesDetailComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(AdminSeriesDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
