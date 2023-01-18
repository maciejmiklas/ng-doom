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
import {NavbarPlugin} from "../../../main/navbar_plugin"
import {FlatsListControl} from "../wad-flats.component"

@Component({
	selector: 'app-wad-flats-navbar',
	templateUrl: './wad-flats-navbar.component.html',
	styleUrls: ['./wad-flats-navbar.component.scss']
})
export class WadFlatsNavbarComponent implements NavbarPlugin<FlatsListControl> {
	private data: FlatsListControl

	setData(data: FlatsListControl): void {
		this.data = data
	}

	set filter(val: string) {
		this.data.applyFilter(val)
	}

	get filter(): string {
		return ''
	}

}
