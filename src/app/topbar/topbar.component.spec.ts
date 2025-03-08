import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopBar } from './topbar.component';

describe('TopbarComponent', () => {
    let component: TopBar;
    let fixture: ComponentFixture<TopBar>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TopBar]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(TopBar);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
