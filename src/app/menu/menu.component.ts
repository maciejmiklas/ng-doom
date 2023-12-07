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
import {Component, EventEmitter, OnInit, Output, ViewEncapsulation} from '@angular/core'
import {MenuService} from './menu.service'
import {MenuRoot, MenuState} from './menu-model'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {Router, RouterLink} from '@angular/router'
import {WadEvent} from '../wad/wad-event'
import {MenuEvent} from './menu-event'
import {NgClass, NgFor} from '@angular/common'
import {NgbAccordion, NgbPanel, NgbPanelContent, NgbPanelHeader, NgbPanelToggle} from '@ng-bootstrap/ng-bootstrap'

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    encapsulation: ViewEncapsulation.None // TODO '<ngb-panel cardClass=....' does not support encapsulation?
    ,
    standalone: true,
    imports: [NgbAccordion, NgFor, NgbPanel, NgbPanelHeader, NgbPanelToggle, NgbPanelContent, RouterLink, NgClass]
})
export class MenuComponent implements OnInit {

	menuRoot: MenuRoot

	@Output()
	private selection = new EventEmitter<MenuState>()

	constructor(private menuService: MenuService, private eventBus: NgRxEventBusService, private router: Router) {
	}

	ngOnInit(): void {
		this.reloadMenu()
		this.eventBus.on(WadEvent.WAD_UPLOADED, () => {
			this.reloadMenu()
		})
		this.router.navigate([this.menuService.routePath])
	}

	private reloadMenu(): void {
		this.menuRoot = this.menuService.visibleMenu
	}

	onL2Click(state: MenuState): void {
		this.menuService.state = state
		this.selection.emit(state)
		this.eventBus.emit(new EmitEvent(MenuEvent.MENU_SELECTED, state))
	}

	get state(): MenuState {
		return this.menuService.state
	}

}
