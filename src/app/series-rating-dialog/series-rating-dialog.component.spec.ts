import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeriesRatingDialog } from './series-rating-dialog.component';

describe('SeriesRatingDialog', () => {
    let component: SeriesRatingDialog;
    let fixture: ComponentFixture<SeriesRatingDialog>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SeriesRatingDialog]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(SeriesRatingDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
