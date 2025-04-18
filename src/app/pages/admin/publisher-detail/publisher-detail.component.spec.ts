import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPublisherDetailComponent } from './publisher-detail.component';

describe('AdminPublisherDetailComponent', () => {
    let component: AdminPublisherDetailComponent;
    let fixture: ComponentFixture<AdminPublisherDetailComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminPublisherDetailComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(AdminPublisherDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
