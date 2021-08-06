import {Component, OnInit} from '@angular/core';
import {functions as bp} from '../../parser/bitmap_parser';
import {Palette} from '../../parser/wad_model';
import {Log} from '../../../common/is/log';
import {WadStorageService} from '../../service/wad-storage.service';

@Component({
	selector: 'app-wad-playpal',
	templateUrl: './wad-playpal.component.html'
})
export class WadPlaypalComponent implements OnInit {
	static CMP = 'app-wad-playpal';
	palettes: Palette[];

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		if (!this.wadStorage.isLoaded()) {
			Log.error(WadPlaypalComponent.CMP, 'WAD not Loaded');
			return;
		}
		const wad = this.wadStorage.getCurrent().get();
		this.palettes = bp.parsePlaypal(wad.wad.bytes, wad.wad.dirs).palettes;
	}

}
