import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideBar } from './sidebar.component';

describe('SidebarComponent', () => {
    let component: SideBar;
    let fixture: ComponentFixture<SideBar>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SideBar]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(SideBar);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
