import {Component, OnInit} from '@angular/core';
import {functions as bp} from '../../../wad/bitmap_parser';
import {CurrentWadService} from '../../../wad/current-wad.service';
import {Palette} from '../../../wad/wad_model';

@Component({
	selector: 'app-playpal',
	templateUrl: './playpal.component.html',
	styleUrls: ['./playpal.component.css']
})
export class PlaypalComponent implements OnInit {

	palettes: Palette[];

	constructor(private currentWadService: CurrentWadService) {
	}

	ngOnInit(): void {
		if (!this.currentWadService.isLoaded()) {
			return;
		}
		const wad = this.currentWadService.wad;
		const bytes = this.currentWadService.bytes;
		this.palettes = bp.parsePlaypal(bytes, wad.dirs).palettes;
	}

}
