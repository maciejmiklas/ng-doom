import {Component, OnInit} from '@angular/core';
import {functions as bp} from '../../parser/bitmap_parser';
import {WadStorageService} from '../../service/wad-storage.service';
import {Slide} from '../../../common/web/carousel/carousel-model';

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
		this.palettes = bp.parsePlaypal(wad.wad.bytes, wad.wad.dirs).palettes.map((p, idx) => ({item: p, name: 'Palette[' + idx + ']'}));
	}

}
