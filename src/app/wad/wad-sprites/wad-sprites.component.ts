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
