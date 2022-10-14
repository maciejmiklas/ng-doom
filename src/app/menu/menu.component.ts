/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {Component, EventEmitter, OnInit, Output, ViewEncapsulation} from '@angular/core'
import {MenuService} from './menu.service'
import {MenuRoot, MenuState} from './menu-model'
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus'
import {Router} from '@angular/router'
import {WadEvent} from '../wad/wad-event'
import {MenuEvent} from './menu-event'

@Component({
	selector: 'app-menu',
	templateUrl: './menu.component.html',
	styleUrls: ['./menu.component.scss'],
	encapsulation: ViewEncapsulation.None // TODO '<ngb-panel cardClass=....' does not support encapsulation?
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
