import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPublishersComponent } from './publishers.component';

describe('AdminPublishersComponent', () => {
    let component: AdminPublishersComponent;
    let fixture: ComponentFixture<AdminPublishersComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminPublishersComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(AdminPublishersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
