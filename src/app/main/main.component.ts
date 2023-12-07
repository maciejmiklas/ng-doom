/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {
	ChangeDetectorRef,
	Component,
	ComponentFactoryResolver,
	HostListener,
	ViewChild,
	ViewContainerRef
} from '@angular/core'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {MenuEvent} from '../menu/menu-event'
import {MainEvent} from './main-event'
import {NavbarPlugin, NavbarPluginFactory} from './navbar_plugin'
import {animate, state, style, transition, trigger} from '@angular/animations'
import {Bitmap} from '../wad/parser/wad-model'
import {WadEvent} from '../wad/wad-event'
import {UploadResult, UploadStatus} from '../wad/wad-upload/wad-upload-model'
import {WadStorageService} from '../wad/wad-storage.service'

@Component({
	selector: 'app-root',
	templateUrl: './main.component.html',
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
	static readonly MENU_COLLAPSE_WIDTH = 800
	title = 'ng-doom'
	active = 'app-wad-upload'
	sidebarState
	headerImage: Bitmap = null
	private innerWidth = 1500
	private lastViewSmall
	private overlayMenuClicked = false

	@ViewChild('navPluginRef', {read: ViewContainerRef})
	navPluginRef: ViewContainerRef

	constructor(private resolver: ComponentFactoryResolver,
							private eventBus: NgRxEventBusService,
							private wadStorage: WadStorageService,
							private detector: ChangeDetectorRef) {
	}


	headerImageLoaded(): boolean {
		return this.headerImage !== null
	}

	ngOnInit(): void {
		this.innerWidth = window.innerWidth
		this.lastViewSmall = this.isViewSmall()
		this.sidebarState = this.isViewSmall() ? SidebarState.COLLAPSED : SidebarState.OPEN_FULL

		this.eventBus.on(MenuEvent.MENU_SELECTED, () => {
			this.removePlugin()
		})

		this.eventBus.on(MainEvent.SET_NAVBAR_PLUGIN, (navbarPluginFactory: NavbarPluginFactory<any>) => {
			this.loadPlugin(navbarPluginFactory)
		})

		this.eventBus.on(WadEvent.WAD_UPLOADED, (result: UploadResult) => {
			if (result.status === UploadStatus.UPLOADED) {
				this.headerImage = this.wadStorage.getCurrent().map(c => c.wad).map(w => w.title.mDoom).orElse(() => null)
			}
		})
	}

	private loadPlugin(navbarPluginFactory: NavbarPluginFactory<any>): void {
		const compClass = this.resolver.resolveComponentFactory(navbarPluginFactory.component)
		const plugin = this.navPluginRef.createComponent<NavbarPlugin<any>>(compClass)
		plugin.instance.setData(navbarPluginFactory.data)
		this.detector.detectChanges()
	}

	private removePlugin(): void {
		this.navPluginRef.clear()
	}

	switchRoute(): void {
		this.eventBus.emit(new EmitEvent(MainEvent.SET_MAIN_OVERFLOW, 'visible'))
	}

	@HostListener('window:resize')
	onResize(): void {
		const trans = this.getTransition(this.innerWidth, window.innerWidth)
		this.innerWidth = window.innerWidth

		if (trans === Transition.EXPAND) {
			this.sidebarState = SidebarState.OPEN_FULL

		} else if (trans === Transition.COLLAPSE) {
			this.sidebarState = SidebarState.COLLAPSED
		}
	}

	isViewSmall(): boolean {
		return this.innerWidth < MainComponent.MENU_COLLAPSE_WIDTH
	}

	isSidebarOpen(): boolean {
		return this.sidebarState === SidebarState.OPEN_OVERLAY || this.sidebarState === SidebarState.OPEN_FULL
	}

	private getTransition(oldWidth: number, newWidth: number): Transition {
		let trans = Transition.NONE
		if (oldWidth > MainComponent.MENU_COLLAPSE_WIDTH && newWidth < MainComponent.MENU_COLLAPSE_WIDTH) {
			trans = Transition.COLLAPSE

		} else if (oldWidth < MainComponent.MENU_COLLAPSE_WIDTH && newWidth > MainComponent.MENU_COLLAPSE_WIDTH) {
			trans = Transition.EXPAND
		}
		return trans
	}

	toggleSidebarCollapse(): void {
		this.overlayMenuClicked = false
		if (this.isSidebarOpen()) {
			this.sidebarState = SidebarState.COLLAPSED
		} else {
			this.sidebarState = this.isViewSmall() ? SidebarState.OPEN_OVERLAY : SidebarState.OPEN_FULL
		}
	}

	shouldSidebarCollapse(): boolean {
		return this.isViewSmall() || !this.isSidebarOpen()
	}

	menuCollapsed(): boolean {
		return this.isViewSmall() && !this.overlayMenuClicked && this.sidebarState === SidebarState.OPEN_OVERLAY
	}

	onOverlayMenuSelected(): void {
		this.overlayMenuClicked = true
		this.sidebarState = SidebarState.COLLAPSED
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
