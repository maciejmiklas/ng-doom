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
import {Component, Input, OnInit} from '@angular/core'
import {WadStorageService} from '../wad-storage.service'
import {DoomTexture, Palette, Patch} from '../parser/wad-model'
import {Either} from "../../common/either"
import {functions as tp} from "../parser/texture-parser"
import {NgbPopover} from '@ng-bootstrap/ng-bootstrap'
import {NgFor} from '@angular/common'
import {WadDirElementComponent} from '../wad-dir-element/wad-dir-element.component'
import {PbmpComponent} from '../pbmp/pbmp.component'

@Component({
    selector: 'app-wad-texture',
    templateUrl: './wad-texture.component.html',
    standalone: true,
    imports: [PbmpComponent, WadDirElementComponent, NgFor, NgbPopover]
})
export class WadTextureComponent implements OnInit {

	@Input()
	textureMaxSize = 300

	@Input()
	highlight = 3

	@Input()
	patchMaxSize = 128

	@Input()
	name

	highlightPalette: Palette
	texture: DoomTexture
	reloadTexture = false
	activePatch: Patch = undefined

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad
		this.texture = wad.textures.find(tx => tx.name == this.name)
		this.highlightPalette = wad.playpal.palettes[this.highlight]
	}

	onPatchMoseOver(patch: Patch): void {
		if (this.activePatch &&
			this.activePatch.originX === patch.originX &&
			this.activePatch.originY === patch.originY) {
			return
		}
		this.activePatch = patch
		this.reloadTexture = true
		this.texture = {...this.texture}
		this.texture.rgba = tp.highlightPatch(this.texture, (hp) =>
			Either.ofCondition(() => patch.patchName === hp.patchName && patch.originX === hp.originX && patch.originY === hp.originY,
				() => 'Not highlighted', () => this.highlightPalette))
	}

}
