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
import {Component, OnInit, ViewEncapsulation} from '@angular/core'
import {Wad} from '../parser/wad-model'
import {WadStorageService} from '../wad-storage.service'
import {Slide} from '../../common/carousel/carousel-model'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {MainEvent} from '../../main/main-event'

@Component({
	selector: 'app-wad-title-img',
	templateUrl: './wad-title-img.component.html',
	styleUrls: ['./wad-title-img.component.scss'],
	encapsulation: ViewEncapsulation.None
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
