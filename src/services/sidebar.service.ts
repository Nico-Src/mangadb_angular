import { signal, Injectable, computed, WritableSignal } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class SideBarService {
    private open:WritableSignal<boolean> = signal<boolean>(true);
    private inAdminArea:WritableSignal<boolean> = signal<boolean>(false);
    public isOpen = computed(() => this.open())
    public setOpen = (data: boolean) => this.open.set(data)
    public isInAdminArea = computed(() => this.inAdminArea())
    public setInAdminArea = (data: boolean) => this.inAdminArea.set(data)
}