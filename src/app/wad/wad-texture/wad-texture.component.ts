import {Component, Input, OnInit} from '@angular/core'
import {WadStorageService} from '../wad-storage.service'
import {DoomTexture, Palette, Patch} from '../parser/wad-model'
import {Either} from "../../common/either";
import {functions as tp} from "../parser/texture-parser";

@Component({
	selector: 'app-wad-texture',
	templateUrl: './wad-texture.component.html'
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
		const wad = this.wadStorage.getCurrent().get().wad;
		this.texture = wad.textures.find(tx => tx.name == this.name)
		this.highlightPalette = wad.playpal.palettes[this.highlight];
	}

	onPatchMoseOver(patch: Patch): void {
		if (this.activePatch &&
			this.activePatch.originX === patch.originX &&
			this.activePatch.originY === patch.originY) {
			return;
		}
		this.activePatch = patch;
		this.reloadTexture = true;
		this.texture = {...this.texture}
		this.texture.rgba = tp.highlightPatch(this.texture, (hp) =>
			Either.ofCondition(() => patch.patchName === hp.patchName && patch.originX === hp.originX && patch.originY === hp.originY,
				() => 'Not highlighted', () => this.highlightPalette))
	}

}
