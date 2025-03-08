import { signal, Injectable, computed, WritableSignal } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class SideBarService {
    private open:WritableSignal<boolean> = signal<boolean>(true);
    public isOpen = computed(() => this.open())
    public setOpen = (data: boolean) => this.open.set(data)
}