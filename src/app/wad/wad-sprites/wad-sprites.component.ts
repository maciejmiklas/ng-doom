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
import {functions as SP} from '../parser/sprite-parser'
import {Bitmap, Sprite} from '../parser/wad-model'
import {EmitEvent, NgRxEventBusService} from '@maciejmiklas/ngrx-event-bus'
import {MainEvent} from '../../main/main-event'
import {NavbarPluginFactory} from '../../main/navbar_plugin'
import {WadSpritesNavbarComponent} from './wad-sprites-navbar/wad-sprites-navbar.component'
import {NgbPopover} from '@ng-bootstrap/ng-bootstrap'
import {PbmpAnimationComponent} from '../pbmp-animation/pbmp-animation.component'
import {NgFor} from '@angular/common'

@Component({
	selector: 'app-wad-sprite',
	templateUrl: './wad-sprites.component.html',
	standalone: true,
	imports: [NgFor, PbmpAnimationComponent, NgbPopover]
})
export class WadSpritesComponent implements OnInit, SpritesListControl {

	sprites: SingleSprite[]
	scale: number[]
	private readonly ZOOM_MAX_SIZE = 150 // box has 200px, it's set in .app-sprite

	constructor(private wadStorage: WadStorageService, private eventBus: NgRxEventBusService) {
	}

	ngOnInit(): void {
		this.sprites = this.readSprites(() => true)
		this.scale = this.sprites.map(s => s.sprite).map(SP.calcScale(this.ZOOM_MAX_SIZE))
		this.eventBus.emit(new EmitEvent(MainEvent.SET_NAVBAR_PLUGIN, new NavbarPluginFactory(WadSpritesNavbarComponent, this)))
	}

	applyFilter(filter: string) {
		this.sprites = this.readSprites(s => s.name.toLowerCase().includes(filter.toLowerCase()))
	}

	private readSprites(filterSprite: (s: Sprite) => boolean): SingleSprite[] {
		const sss = Object.entries(this.wadStorage.getCurrent().get().wad.sprites).map(w => w[1])
			.filter(s => filterSprite(s))
			.map(sprite => ({
				name: sprite.name,
				sprite,
				frames: Object.values(sprite.frames).map(fr => fr[0].bitmap)
			}))

		return sss
	}
}

export type SingleSprite = {
	name: string,
	frames: Bitmap[],
	sprite: Sprite
}

export interface SpritesListControl {
	applyFilter(filter: string): void
}
