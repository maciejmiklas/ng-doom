import {Component, Input, OnInit} from '@angular/core';
import {WadStorageService} from '../wad-storage.service';
import {DoomTexture} from '../parser/wad-model';

@Component({
	selector: 'app-wad-texture',
	templateUrl: './wad-texture.component.html',
	styleUrls: ['./wad-texture.component.scss']
})
export class WadTextureComponent implements OnInit {

	@Input()
	zoom = 2;

	@Input()
	maxSize = 300;

	@Input()
	name;

	texture: DoomTexture;

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		this.texture = this.wadStorage.getCurrent().get().wad.textures.find(tx => tx.name == this.name);
	}

}
