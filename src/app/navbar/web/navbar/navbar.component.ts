import {Component, HostListener, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	animations: [
		trigger('sidebarResponsiveStyle', [
			state('open_overlay', style({'z-index': 999, position: 'fixed'})),
			state('open_full', style({})),
			state('collapsed', style({transform: 'translateX(-100%)'})),
			transition('* => *', [animate('100ms')])
		]),
		trigger('sidebarHeaderResponsiveStyle', [
			state('open_overlay', style({visibility: 'hidden'})),
			state('open_full', style({})),
			state('collapsed', style({visibility: 'hidden'}))
		]),
	]
})

export class NavbarComponent implements OnInit {

	static readonly MENU_COLLAPSE_WIDTH = 800;

	title = 'ng-doom';
	active = 'app-wad-upload';
	private sidebarState;
	private innerWidth = 1500;
	private lastViewSmall;

	constructor() {
	}

	ngOnInit(): void {
		this.innerWidth = window.innerWidth;
		this.lastViewSmall = this.isViewSmall();
		this.sidebarState = this.isViewSmall() ? SidebarState.COLLAPSED : SidebarState.OPEN_FULL;
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
		return this.innerWidth < NavbarComponent.MENU_COLLAPSE_WIDTH;
	}

	isSidebarOpen(): boolean {
		return this.sidebarState === SidebarState.OPEN_OVERLAY || this.sidebarState === SidebarState.OPEN_FULL;
	}

	private getTransition(oldWidth: number, newWidth: number): Transition {
		let trans = Transition.NONE;
		if (oldWidth > NavbarComponent.MENU_COLLAPSE_WIDTH && newWidth < NavbarComponent.MENU_COLLAPSE_WIDTH) {
			trans = Transition.COLLAPSE;

		} else if (oldWidth < NavbarComponent.MENU_COLLAPSE_WIDTH && newWidth > NavbarComponent.MENU_COLLAPSE_WIDTH) {
			trans = Transition.EXPAND;
		}
		return trans;
	}

	toggleSidebarCollapse(): void {
		if (this.isSidebarOpen()) {
			this.sidebarState = SidebarState.COLLAPSED;
		} else {
			this.sidebarState = this.isViewSmall() ? SidebarState.OPEN_OVERLAY : SidebarState.OPEN_FULL;
		}
	}

	sidebarResponsiveState(): string {
		console.log('State:', this.sidebarState);
		return SidebarState[this.sidebarState];
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

