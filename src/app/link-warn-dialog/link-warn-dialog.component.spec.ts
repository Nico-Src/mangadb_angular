import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkWarnDialog } from './link-warn-dialog.component';

describe('LinkWarnDialog', () => {
    let component: LinkWarnDialog;
    let fixture: ComponentFixture<LinkWarnDialog>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LinkWarnDialog]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(LinkWarnDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
