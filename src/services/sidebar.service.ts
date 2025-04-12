import { signal, Injectable, computed, WritableSignal } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class SideBarService {
    private open:WritableSignal<boolean> = signal<boolean>(true);
    private inAdminArea:WritableSignal<boolean> = signal<boolean>(false);
    scrollTop:WritableSignal<number> = signal<number>(0);
    public onSetScroll:any;
    public isOpen = computed(() => this.open())
    public setOpen = (data: boolean) => this.open.set(data)
    public isInAdminArea = computed(() => this.inAdminArea())
    public setInAdminArea = (data: boolean) => this.inAdminArea.set(data);
    public setScrollTop = (scroll:number) => this.onSetScroll(scroll);
}