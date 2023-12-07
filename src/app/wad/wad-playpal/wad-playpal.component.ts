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
import {Component, OnInit} from '@angular/core'
import {WadStorageService} from '../wad-storage.service'
import {Slide} from '../../common/carousel/carousel-model'
import {WadPaletteComponent} from '../wad-palette/wad-palette.component'
import {CarouselComponent} from '../../common/carousel/carousel.component'

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
