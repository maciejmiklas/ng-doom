import {Component, OnInit} from '@angular/core';
import {functions as bp} from '../../wad/bitmap_parser';
import {CurrentWadService} from '../../wad/current-wad.service';
import {Palette} from '../../wad/wad_model';
import {Log} from '../../common/log';

@Component({
	selector: 'app-wad-playpal',
	templateUrl: './wad-playpal.component.html'
})
export class WadPlaypalComponent implements OnInit {
	static CMP = 'app-wad-playpal';
	palettes: Palette[];

	constructor(private currentWadService: CurrentWadService) {
	}

	ngOnInit(): void {
		if (!this.currentWadService.isLoaded()) {
			Log.error(WadPlaypalComponent.CMP, 'WAD not Loaded');
			return;
		}
		const wad = this.currentWadService.wad;
		const bytes = this.currentWadService.bytes;
		this.palettes = bp.parsePlaypal(bytes, wad.dirs).palettes;
	}

}
