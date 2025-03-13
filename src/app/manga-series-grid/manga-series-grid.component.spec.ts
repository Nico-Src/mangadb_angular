import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MangaSeriesGridComponent } from './manga-series-grid.component';

describe('MangaSeriesGridComponent', () => {
    let component: MangaSeriesGridComponent;
    let fixture: ComponentFixture<MangaSeriesGridComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MangaSeriesGridComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(MangaSeriesGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
