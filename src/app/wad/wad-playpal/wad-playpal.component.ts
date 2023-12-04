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
import {Component, OnInit} from '@angular/core'
import {WadStorageService} from '../wad-storage.service'
import {Slide} from '../../common/carousel/carousel-model'
import { WadPaletteComponent } from '../wad-palette/wad-palette.component'
import { CarouselComponent } from '../../common/carousel/carousel.component'

@Component({
    selector: 'app-wad-playpal',
    templateUrl: './wad-playpal.component.html',
    standalone: true,
    imports: [CarouselComponent, WadPaletteComponent]
})
export class WadPlaypalComponent implements OnInit {
	static CMP = 'app-wad-playpal'
	palettes: Slide[]

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get()
		this.palettes = wad.wad.playpal.palettes.map((p, idx) => ({item: p, name: 'Palette[' + idx + ']'}))
	}

}
