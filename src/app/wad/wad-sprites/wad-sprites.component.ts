import {Component, OnInit} from '@angular/core';
import {WadStorageService} from '../wad-storage.service';
import {functions as sp} from '../parser/sprite-parser';
import {functions as ic} from '../parser/image-converter';
import {BitmapSprite, Palette} from '../parser/wad-model';
import {functions as bp} from '../parser/bitmap-parser';

@Component({
	selector: 'app-wad-sprite',
	templateUrl: './wad-sprites.component.html',
	styleUrls: ['./wad-sprites.component.scss']
})
export class WadSpritesComponent implements OnInit {

	sprites: BitmapSprite[][];
	scale: number[];
	palette: Palette;
	private readonly ZOOM_MAX_SIZE = 150; // box has 200px, it's being set in .app-sprite

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad;
		this.sprites = sp.parseSpritesAsArray(wad.bytes, wad.dirs).map(ic.toBitmapSprites).filter(s => s.isRight()).map(s => s.get());
		this.scale = this.sprites.map(s => s[0]).map(ic.calcScale(this.ZOOM_MAX_SIZE));
		this.palette = bp.parsePlaypal(wad.bytes, wad.dirs).palettes[0];
	}
}




