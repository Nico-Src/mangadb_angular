import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminContributorsComponent } from './contributors.component';

describe('AdminContributorsComponent', () => {
    let component: AdminContributorsComponent;
    let fixture: ComponentFixture<AdminContributorsComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminContributorsComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(AdminContributorsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
