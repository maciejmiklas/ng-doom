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
import {DirsListControl} from '../wad-dirs.component';
import {NavbarPlugin} from '../../../main/service/navbar_plugin';

@Component({
	selector: 'app-wad-dirs-wad-map-navbar',
	templateUrl: './wad-dirs-navbar.component.html',
	styleUrls: ['./wad-dirs-navbar.component.scss']
})
export class WadDirsNavbarComponent implements NavbarPlugin<DirsListControl> {
	maxSize = 10;

	private dirsListControl: DirsListControl;

	constructor() {
	}

	setData(dirsListControl: DirsListControl): void {
		this.dirsListControl = dirsListControl;
	}

	set filter(val: string) {
		this.dirsListControl.applyFilter(val);
	}

	get filter(): string {
		return '';
	}

}
