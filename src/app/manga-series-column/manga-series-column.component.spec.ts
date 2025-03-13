import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MangaSeriesColumnComponent } from './manga-series-column.component';

describe('MangaSeriesColumnComponent', () => {
    let component: MangaSeriesColumnComponent;
    let fixture: ComponentFixture<MangaSeriesColumnComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MangaSeriesColumnComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(MangaSeriesColumnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
