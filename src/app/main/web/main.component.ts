import {Component, ComponentFactoryResolver, HostListener, ViewChild, ViewContainerRef, ViewEncapsulation} from '@angular/core';
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus';
import {MenuEvent} from '../../menu/service/menu-event';
import {MainEvent} from '../service/main-event';
import {NavbarPlugin, NavbarPluginFactory} from '../service/navbar_plugin';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
	selector: 'app-root',
	templateUrl: './main.component.html',
	styleUrls: ['./main.component.scss'],
	encapsulation: ViewEncapsulation.None,
	animations: [
		trigger('sidebarAnimation', [
			state('collapsed', style({transform: 'translateX(-100%)'})),
			transition('* => *', [animate('100ms')])
		]),
		trigger('collapsedMenuAnimation', [
			state('open_overlay', style({'z-index': 999, position: 'fixed'}))
		])
	]
})
export class MainComponent {
	static readonly MENU_COLLAPSE_WIDTH = 800;
	title = 'ng-doom';
	active = 'app-wad-upload';
	sidebarState;
	private innerWidth = 1500;
	private lastViewSmall;
	private overlayMenuClicked = false;

	@ViewChild('navPluginRef', {read: ViewContainerRef})
	navPluginRef: ViewContainerRef;

	constructor(private resolver: ComponentFactoryResolver, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		this.innerWidth = window.innerWidth;
		this.lastViewSmall = this.isViewSmall();
		this.sidebarState = this.isViewSmall() ? SidebarState.COLLAPSED : SidebarState.OPEN_FULL;

		this.eventBus.on(MenuEvent.MENU_SELECTED, () => {
			this.removePlugin();
		});

		this.eventBus.on(MainEvent.SET_NAVBAR_PLUGIN, (navbarPluginFactory: NavbarPluginFactory<any>) => {
			this.loadPlugin(navbarPluginFactory);
		});
	}

	private loadPlugin(navbarPluginFactory: NavbarPluginFactory<any>): void {
		const compClass = this.resolver.resolveComponentFactory(navbarPluginFactory.component);
		const plugin = this.navPluginRef.createComponent<NavbarPlugin<any>>(compClass);
		plugin.instance.setData(navbarPluginFactory.data);
	}

	private removePlugin(): void {
		this.navPluginRef.clear();
	}

	switchRoute(): void {
		this.eventBus.emit(new EmitEvent(MainEvent.SET_MAIN_OVERFLOW, 'visible'));
	}

	@HostListener('window:resize')
	onResize(): void {
		const trans = this.getTransition(this.innerWidth, window.innerWidth);
		this.innerWidth = window.innerWidth;

		if (trans === Transition.EXPAND) {
			this.sidebarState = SidebarState.OPEN_FULL;

		} else if (trans === Transition.COLLAPSE) {
			this.sidebarState = SidebarState.COLLAPSED;
		}
	}

	isViewSmall(): boolean {
		return this.innerWidth < MainComponent.MENU_COLLAPSE_WIDTH;
	}

	isSidebarOpen(): boolean {
		return this.sidebarState === SidebarState.OPEN_OVERLAY || this.sidebarState === SidebarState.OPEN_FULL;
	}

	private getTransition(oldWidth: number, newWidth: number): Transition {
		let trans = Transition.NONE;
		if (oldWidth > MainComponent.MENU_COLLAPSE_WIDTH && newWidth < MainComponent.MENU_COLLAPSE_WIDTH) {
			trans = Transition.COLLAPSE;

		} else if (oldWidth < MainComponent.MENU_COLLAPSE_WIDTH && newWidth > MainComponent.MENU_COLLAPSE_WIDTH) {
			trans = Transition.EXPAND;
		}
		return trans;
	}

	toggleSidebarCollapse(): void {
		this.overlayMenuClicked = false;
		if (this.isSidebarOpen()) {
			this.sidebarState = SidebarState.COLLAPSED;
		} else {
			this.sidebarState = this.isViewSmall() ? SidebarState.OPEN_OVERLAY : SidebarState.OPEN_FULL;
		}
	}

	shouldSidebarCollapse(): boolean {
		return this.isViewSmall() || !this.isSidebarOpen();
	}

	collapsedMenuVisible(): boolean {
		return this.isViewSmall() && !this.overlayMenuClicked && this.sidebarState === SidebarState.OPEN_OVERLAY;
	}

	onOverlayMenuSelected(): void {
		this.overlayMenuClicked = true;
		this.sidebarState = SidebarState.COLLAPSED;
	}
}

enum Transition {
	NONE,
	COLLAPSE,
	EXPAND
}

enum SidebarState {
	OPEN_FULL = 'open_full',
	OPEN_OVERLAY = 'open_overlay',
	COLLAPSED = 'collapsed'
}
