import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TranslateService } from '@ngx-translate/core';
import { TuiRoot } from '@taiga-ui/core';

describe('AppComponent', () => {
    let component: AppComponent;
    let fixture: any;
    let translateService: TranslateService;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent, TuiRoot],
            providers: [
                { provide: TranslateService, useValue: jasmine.createSpyObj('TranslateService', ['addLangs', 'setDefaultLang', 'use', 'get']) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        translateService = TestBed.inject(TranslateService);
    });
    
    it('should create the app', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize translation service with correct languages', () => {
        expect(translateService.addLangs).toHaveBeenCalled();
        expect(translateService.setDefaultLang).toHaveBeenCalledWith(jasmine.any(String));
        expect(translateService.use).toHaveBeenCalledWith(jasmine.any(String));
    });

    it('should toggle sidebar state', () => {
        const initial = component.expanded();
        component.handleToggle();
        expect(component.expanded()).toBe(!initial);
    });
});
