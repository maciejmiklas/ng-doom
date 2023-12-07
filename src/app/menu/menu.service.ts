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
import {AbstractType, Injectable, Injector} from '@angular/core'
import {MenuDecorator, MenuRoot, MenuState} from './menu-model'
import menuJson from './menu.json'
import {WadUploadMenuDecorator, WasLoadedMenuDecorator} from '../wad/wad-menu.service'
import {Either} from '../common/either'

@Injectable({
	providedIn: 'root'
})
export class MenuService {

	private menuStr: string = JSON.stringify(menuJson)
	_state: MenuState
	private readonly _initialMenu: MenuRoot

	private decoratorMap: Record<string, AbstractType<MenuDecorator>> = {
		dec_wad_upload: WadUploadMenuDecorator,
		dec_wad_loaded: WasLoadedMenuDecorator,
		dec_game_load: DummyMenuDecorator,
		dec_game_save: DummyMenuDecorator,
		dec_game_manage: DummyMenuDecorator,
	}

	constructor(private injector: Injector) {
		this._initialMenu = this.copyMenu()
		this._state = {...this._initialMenu.initialState}
	}

	get visibleMenu(): MenuRoot {
		const copy = this.copyMenu()
		// remove hidden elements on L2
		copy.l1.forEach(l1 => {
			l1.l2 = l1.l2.filter(l2 => {
				return Either.ofNullable(this.decoratorMap[l2.decorator], () => 'Decorator not defined: ' + l2.decorator)
					.map(d => this.injector.get(d)).get().visible()
			})
		})

		// remove empty Menus on L1
		copy.l1 = copy.l1.filter(l1 => l1.l2.length > 0)
		return copy
	}

	private copyMenu(): MenuRoot {
		return JSON.parse(this.menuStr)
	}

	get routePath(): string {
		return this._initialMenu.l1.filter(e => e.id === this._state.idL1)[0].l2.filter(e => e.id === this._state.idL2)[0].path
	}

	get initialMenu(): MenuRoot {
		return this._initialMenu
	}

	replaceMenu(menuRoot: MenuRoot): void {
		this.menuStr = JSON.stringify(menuRoot)
	}

	set state(state: MenuState) {
		this._state = {...state}
	}

	get state(): MenuState {
		return this._state
	}
}

@Injectable({
	providedIn: 'root'
})
export class DummyMenuDecorator implements MenuDecorator {
	visible(): boolean {
		return true
	}
}
