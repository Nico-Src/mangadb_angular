import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMediaComponent } from './media-library.component';

describe('AdminMediaComponent', () => {
    let component: AdminMediaComponent;
    let fixture: ComponentFixture<AdminMediaComponent>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminMediaComponent]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(AdminMediaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
