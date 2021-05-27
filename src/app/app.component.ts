import {Component, HostListener, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	animations: [
		trigger('sidebarOpenCollapse', [
			state('openOverlay', style({'z-index': 999, position: 'fixed'})),
			state('openFull', style({})),
			state('collapsed', style({transform: 'translateX(-100%)'})),
			transition('* => *', [animate('100ms')])
		]),
	]
})
export class AppComponent implements OnInit {
	static readonly MENU_COLLAPSE_WIDTH = 800;

	title = 'ng-doom';
	active = 'app-wad-upload';
	menuCardClass = 'sidebar-menu';
	private sidebarState = SidebarState.UNKNOWN;
	private innerWidth = 1500;
	private lastViewSmall;

	constructor() {
	}

	ngOnInit(): void {
		this.innerWidth = window.innerWidth;
		this.lastViewSmall = this.isViewSmall();
		this.updateSidebarState();
	}

	@HostListener('window:resize')
	onResize(): void {
		this.innerWidth = window.innerWidth;
		this.updateSidebarState();
	}

	isViewSmall(): boolean {
		return this.innerWidth < AppComponent.MENU_COLLAPSE_WIDTH;
	}

	isSidebarOpen(): boolean {
		return this.sidebarState === SidebarState.OPEN_OVERLAY || this.sidebarState === SidebarState.OPEN_FULL;
	}

	private updateSidebarState(): void {
		if (this.lastViewSmall !== this.isViewSmall()) {
			this.sidebarState = SidebarState.UNKNOWN;
		}

		if (this.sidebarState === SidebarState.UNKNOWN) {
			this.sidebarState = this.isViewSmall() ? SidebarState.COLLAPSED : SidebarState.OPEN_FULL;
		}
		this.lastViewSmall = this.isViewSmall();
	}

	toggleSidebarCollapse(): void {
		this.updateSidebarState();
		if (this.sidebarState === SidebarState.OPEN_FULL || this.sidebarState === SidebarState.OPEN_OVERLAY) {
			this.sidebarState = SidebarState.COLLAPSED;
		} else {
			this.sidebarState = this.isViewSmall() ? SidebarState.OPEN_OVERLAY : SidebarState.OPEN_FULL;
		}
	}

	sidebarOpenCollapseState(): string {
		let menuStateStr = 'open';
		switch (this.sidebarState) {
			case SidebarState.COLLAPSED:
				menuStateStr = 'collapsed';
				break;

			case SidebarState.OPEN_FULL:
				menuStateStr = 'openFull';
				break;

			case SidebarState.OPEN_OVERLAY:
				menuStateStr = 'openOverlay';
				break;
		}
		return menuStateStr;
	}

}

enum SidebarState {
	UNKNOWN,
	OPEN_FULL,
	OPEN_OVERLAY,
	COLLAPSED
}
