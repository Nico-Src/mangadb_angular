import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeriesListDialog } from './series-list-dialog.component';

describe('SeriesListDialog', () => {
    let component: SeriesListDialog;
    let fixture: ComponentFixture<SeriesListDialog>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SeriesListDialog]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(SeriesListDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
