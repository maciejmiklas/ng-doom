import {Injectable, Signal, signal, ViewContainerRef, WritableSignal} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ToolbarHostService {

  private hostRef: WritableSignal<ViewContainerRef> = signal(null);
  private host: Signal<ViewContainerRef> = this.hostRef.asReadonly();

  setHost(host: ViewContainerRef) {
    this.hostRef.set(host);
  }

  getHost(): Signal<ViewContainerRef | null> {
    return this.host;
  }

}
