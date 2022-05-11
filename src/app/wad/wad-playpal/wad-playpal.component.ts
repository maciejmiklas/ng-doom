import {Component, OnInit} from '@angular/core';
import {WadStorageService} from '../wad-storage.service';
import {Slide} from '../../common/carousel/carousel-model';

@Component({
	selector: 'app-wad-playpal',
	templateUrl: './wad-playpal.component.html',
	styleUrls: ['./wad-playpal.component.scss']
})
export class WadPlaypalComponent implements OnInit {
	static CMP = 'app-wad-playpal';
	palettes: Slide[];

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		const wad = this.wadStorage.getCurrent().get();
		this.palettes = wad.wad.playpal.palettes.map((p, idx) => ({item: p, name: 'Palette[' + idx + ']'}));
	}

}
