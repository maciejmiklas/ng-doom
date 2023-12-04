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
import {NavbarPlugin} from '../../../main/navbar_plugin'
import {PatchesListControl} from '../wad-patches.component'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'

@Component({
    selector: 'app-wad-patches-navbar',
    templateUrl: './wad-patches-navbar.component.html',
    standalone: true,
    imports: [ReactiveFormsModule, FormsModule]
})
export class WadPatchesNavbarComponent implements NavbarPlugin<PatchesListControl> {

	private data: PatchesListControl

	setData(data: PatchesListControl): void {
		this.data = data
	}

	set filter(val: string) {
		this.data.applyFilter(val)
	}

	get filter(): string {
		return ''
	}
}
