import {Component, Input, OnInit} from '@angular/core';
import {WadStorageService} from '../wad-storage.service';
import {Bitmap, DoomTexture} from '../parser/wad-model';

@Component({
	selector: 'app-wad-texture',
	templateUrl: './wad-texture.component.html',
	styleUrls: ['./wad-texture.component.scss']
})
export class WadTextureComponent implements OnInit {

	@Input()
	textureZoom = 4;

	@Input()
	textureMaxSize = 300;

	@Input()
	patchMaxSize = 128;

	@Input()
	patchZoom = 1;

	@Input()
	name;

	texture: DoomTexture;
	patches: Bitmap[];

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		this.texture = this.wadStorage.getCurrent().get().wad.textures.find(tx => tx.name == this.name);
	}

}
