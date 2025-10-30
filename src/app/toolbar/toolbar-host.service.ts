import {
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  Signal,
  signal,
  Type,
  ViewContainerRef,
  WritableSignal
} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ToolbarHostService {

  private hostRef: WritableSignal<ViewContainerRef> = signal(null);
  private host: Signal<ViewContainerRef> = this.hostRef.asReadonly();

  setHost(host: ViewContainerRef) {
    console.log("setting host")
    this.hostRef.set(host);
  }

  getHost(): Signal<ViewContainerRef | null> {
    return this.host;
  }

  resetHost() {
    console.log("resetting host")
  }

  registerHost<C>(host: Type<C>, injector: EnvironmentInjector): ComponentRef<C> {
    let comp = this.host().createComponent(host, {
      environmentInjector: injector,
    });
    return comp;
  }

}
