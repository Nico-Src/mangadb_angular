import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContributorDetailComponent } from './contributor-detail.component';

describe('ContributorDetailComponent', () => {
    let component: ContributorDetailComponent;
    let fixture: ComponentFixture<ContributorDetailComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContributorDetailComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(ContributorDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
