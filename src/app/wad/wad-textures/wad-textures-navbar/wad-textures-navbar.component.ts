/*
 * Copyright 2002-2019 the original author or authors.
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
import {Component} from '@angular/core';
import {TexturesListControl} from '../wad-textures.component';
import {NavbarPlugin} from '../../../main/service/navbar_plugin';

@Component({
	selector: 'app-wad-textures-navbar',
	templateUrl: './wad-textures-navbar.component.html',
	styleUrls: ['./wad-textures-navbar.component.scss']
})
export class WadTexturesNavbarComponent implements NavbarPlugin<TexturesListControl> {

	private data: TexturesListControl;

	constructor() {
	}

	setData(data: TexturesListControl): void {
		this.data = data;
	}

	set filter(val: string) {
		this.data.applyFilter(val);
	}

	get filter(): string {
		return '';
	}

}
