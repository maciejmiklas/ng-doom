/*
 * Copyright 2022 Maciej Miklas
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
import {AbstractType, Injectable, Injector} from '@angular/core';
import {MenuDecorator, MenuRoot, MenuState} from './menu-model';
import menuJson from './menu.json';
import {WadUploadMenuDecorator, WasLoadedMenuDecorator} from '../wad/wad-menu.service';
import {Either} from '@maciejmiklas/functional-ts';

@Injectable({
	providedIn: 'root'
})
export class MenuService {

	private menuStr: string = JSON.stringify(menuJson);
	_state: MenuState;
	private readonly _initialMenu: MenuRoot;

	private decoratorMap: Record<string, AbstractType<MenuDecorator>> = {
		dec_wad_upload: WadUploadMenuDecorator,
		dec_wad_loaded: WasLoadedMenuDecorator,
		dec_game_load: DummyMenuDecorator,
		dec_game_save: DummyMenuDecorator,
		dec_game_manage: DummyMenuDecorator,
	};

	constructor(private injector: Injector) {
		this._initialMenu = this.copyMenu();
		this._state = {...this._initialMenu.initialState};
	}

	get visibleMenu(): MenuRoot {
		const copy = this.copyMenu();
		// remove hidden elements on L2
		copy.l1.forEach(l1 => {
			l1.l2 = l1.l2.filter(l2 => {
				return Either.ofNullable(this.decoratorMap[l2.decorator], () => 'Decorator not defined: ' + l2.decorator)
					.map(d => this.injector.get(d)).get().visible();
			});
		});

		// remove empty Menus on L1
		copy.l1 = copy.l1.filter(l1 => l1.l2.length > 0);
		return copy;
	}

	private copyMenu(): MenuRoot {
		return JSON.parse(this.menuStr);
	}

	get routePath(): string {
		return this._initialMenu.l1.filter(e => e.id === this._state.idL1)[0].l2.filter(e => e.id === this._state.idL2)[0].path;
	}

	get initialMenu(): MenuRoot {
		return this._initialMenu;
	}

	replaceMenu(menuRoot: MenuRoot): void {
		this.menuStr = JSON.stringify(menuRoot);
	}

	set state(state: MenuState) {
		this._state = {...state};
	}

	get state(): MenuState {
		return this._state;
	}
}

@Injectable({
	providedIn: 'root'
})
export class DummyMenuDecorator implements MenuDecorator {
	visible(): boolean {
		return true;
	}
}
