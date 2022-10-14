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
import {functions as sp} from '../parser/sprite-parser'
import {functions as tp} from '../parser/texture-parser'
import {BitmapSprite, Palette} from '../parser/wad-model'
import {EmitEvent, NgRxEventBusService} from 'ngrx-event-bus'
import {MainEvent} from '../../main/service/main-event'
import {NavbarPluginFactory} from '../../main/service/navbar_plugin'
import {WadSpritesNavbarComponent} from './wad-sprites-navbar/wad-sprites-navbar.component'

@Component({
	selector: 'app-wad-sprite',
	templateUrl: './wad-sprites.component.html',
	styleUrls: ['./wad-sprites.component.scss']
})
export class WadSpritesComponent implements OnInit, SpritesListControl {

	sprites: BitmapSprite[][]
	scale: number[]
	private readonly ZOOM_MAX_SIZE = 150; // box has 200px, it's set in .app-sprite

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad
		this.sprites = this.readSprites(() => true)
		this.scale = this.sprites.map(s => s[0]).map(tp.calcScale(this.ZOOM_MAX_SIZE))
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadSpritesNavbarComponent, this)))
	}

	applyFilter(filter: string) {
		this.sprites = this.readSprites(s => s.name.toLowerCase().includes(filter.toLowerCase()))
	}

	private readSprites(filterSprite: (Sprite) => boolean): BitmapSprite[][] {
		const wad = this.wadStorage.getCurrent().get().wad
		return sp
			.parseSpritesAsArray(wad.bytes, wad.dirs) // (bytes[])=>Sprite[]
			.filter(s => filterSprite(s)) // (Sprite)=>boolean
			.map(tp.toBitmapSprites) // (Sprite) => Either<BitmapSprite[]>
			.filter(s => s.isRight()).map(s => s.get())
	}
}

export interface SpritesListControl {
	applyFilter(filter: string)
}
