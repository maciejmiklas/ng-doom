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
import {Component, Input, OnInit} from '@angular/core'
import * as R from 'ramda'
import {Palette, RGBA} from '../parser/wad-model'

@Component({
	selector: 'app-wad-palette',
	templateUrl: './wad-palette.component.html',
	styleUrls: ['./wad-palette.component.scss']
})
export class WadPaletteComponent implements OnInit {

	@Input()
	palette: Palette

	/** 16 rows, each containing 16xRGB */
	rows: RGBA[][]

	ngOnInit(): void {
		this.rows = R.splitEvery(16, this.palette.colors)
	}

}
