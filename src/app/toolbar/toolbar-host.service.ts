import {ComponentRef, EnvironmentInjector, inject, Injectable, Type, ViewContainerRef} from "@angular/core";
import {BehaviorSubject, filter, Observable, ReplaySubject, Subject} from "rxjs";
import {NavigationStart, Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class ToolbarHostService {

  private host$: BehaviorSubject<ViewContainerRef> = new BehaviorSubject<ViewContainerRef>(null);
  private registered$: ReplaySubject<ComponentRef<any>> = new ReplaySubject<ComponentRef<any>>(1, 10);
  private componentRef: ComponentRef<any>;
  private injector: EnvironmentInjector = inject(EnvironmentInjector)
  private host: ViewContainerRef
  private router = inject(Router);

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe(() => {
      this.resetHost();
    });
  }

  setHost(host: ViewContainerRef) {
    this.host$.next(host);
    this.host = host
  }

  resetHost() {
    if (!this.host || !this.componentRef) {
      return
    }
    this.host.remove(
      this.host.indexOf(this.componentRef.hostView)
    )
  }

  registerHost<C>(type: Type<C>): Observable<ComponentRef<C>> {
    this.host$.subscribe((host: ViewContainerRef) => {
      if (!host) {
        return
      }
      let comp = host.createComponent(type, {
        environmentInjector: this.injector,
      });
      this.componentRef = comp
      this.registered$.next(comp);
    })
    return this.registered$;
  }

}
