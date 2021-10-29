import {Component, OnInit} from '@angular/core';
import {WadStorageService} from '../../service/wad-storage.service';
import {functions as sp} from '../../parser/sprite_parser';
import {functions as bc} from '../../parser/bitmap_converter';
import {BitmapSprite} from '../../parser/wad_model';

@Component({
	selector: 'app-wad-sprite',
	templateUrl: './wad-sprites.component.html',
	styleUrls: ['./wad-sprites.component.scss']
})
export class WadSpritesComponent implements OnInit {

	sprites: BitmapSprite[][];
	scale: number[];

	private readonly ZOOM_MAX_SIZE = 150; // box has 200px, it's being set in .app-sprite

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get().wad;
		this.sprites = sp.parseSpritesAsArray(wad.bytes, wad.dirs).map(bc.mapSprite).filter(s => s.isRight()).map(s => s.get());
		this.scale = this.sprites.map(s => s[0]).map(bc.calcScale(this.ZOOM_MAX_SIZE));
	}
}




