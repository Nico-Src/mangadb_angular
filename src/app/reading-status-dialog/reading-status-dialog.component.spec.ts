import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadingStatusDialog } from './reading-status-dialog.component';

describe('ReadingStatusDialog', () => {
    let component: ReadingStatusDialog;
    let fixture: ComponentFixture<ReadingStatusDialog>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReadingStatusDialog]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(ReadingStatusDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
