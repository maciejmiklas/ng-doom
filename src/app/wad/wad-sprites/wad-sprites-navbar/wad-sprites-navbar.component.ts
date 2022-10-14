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
import {Component} from '@angular/core'
import {NavbarPlugin} from '../../../main/service/navbar_plugin'
import {SpritesListControl} from '../wad-sprites.component'

@Component({
	selector: 'app-wad-sprites-navbar',
	templateUrl: './wad-sprites-navbar.component.html',
	styleUrls: ['./wad-sprites-navbar.component.css']
})
export class WadSpritesNavbarComponent implements NavbarPlugin<SpritesListControl> {

	private spritesListControl: SpritesListControl

	setData(data: SpritesListControl): void {
		this.spritesListControl = data
	}

	set filter(val: string) {
		this.spritesListControl.applyFilter(val)
	}

	get filter(): string {
		return ''
	}

}
