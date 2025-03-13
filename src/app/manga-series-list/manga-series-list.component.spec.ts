import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MangaSeriesListComponent } from './manga-series-list.component';

describe('MangaSeriesListComponent', () => {
    let component: MangaSeriesListComponent;
    let fixture: ComponentFixture<MangaSeriesListComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MangaSeriesListComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(MangaSeriesListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
