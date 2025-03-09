import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MangaCover } from './manga-cover.component';

describe('MangaCoverComponent', () => {
    let component: MangaCover;
    let fixture: ComponentFixture<MangaCover>;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MangaCover]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(MangaCover);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
