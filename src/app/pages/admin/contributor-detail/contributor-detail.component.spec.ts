import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminContributorDetailComponent } from './contributor-detail.component';

describe('AdminContributorDetailComponent', () => {
    let component: AdminContributorDetailComponent;
    let fixture: ComponentFixture<AdminContributorDetailComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminContributorDetailComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(AdminContributorDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
