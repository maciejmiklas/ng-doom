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
import {Wad} from '../parser/wad-model'
import {WadStorageService} from '../wad-storage.service'
import {Slide} from '../../common/carousel/carousel-model'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {MainEvent} from '../../main/main-event'
import {PbmpComponent} from '../pbmp/pbmp.component'
import {CarouselComponent} from '../../common/carousel/carousel.component'

@Component({
    selector: 'app-wad-title-img',
    templateUrl: './wad-title-img.component.html',
    standalone: true,
    imports: [CarouselComponent, PbmpComponent]
})
export class WadTitleImgComponent implements OnInit {
	private wad: Wad
	slides: Slide[]
	zoom = 2

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {

	}

	ngOnInit(): void {
		this.eventBus.emit(new EmitEvent(MainEvent.SET_MAIN_OVERFLOW, 'hidden'))
		this.wad = this.wadStorage.getCurrent().get().wad
		this.slides = this.createSlides(this.wad)
	}

	private createSlides(wad: Wad): Slide[] {
		const bitmaps = new Array<Slide>()
		bitmaps.push({item: wad.title.title, name: wad.title.title.header.dir.name})
		bitmaps.push({item: wad.title.credit, name: wad.title.credit.header.dir.name})
		bitmaps.push({item: wad.title.mDoom, name: wad.title.mDoom.header.dir.name})
		wad.title.help.exec(ba => ba.forEach(b => bitmaps.push({item: b, name: b.header.dir.name})))
		return bitmaps
	}
}
