import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseSeriesComponent } from './browse-series.component';

describe('BrowseSeriesComponent', () => {
    let component: BrowseSeriesComponent;
    let fixture: ComponentFixture<BrowseSeriesComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BrowseSeriesComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(BrowseSeriesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
