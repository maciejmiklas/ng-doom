import {Component, OnInit} from '@angular/core';
import {CurrentWadService} from '../../wad/current-wad.service';
import {PatchBitmap, Wad} from '../../wad/wad_model';
import {Log} from '../../common/log';

@Component({
	selector: 'app-wad-title-img',
	templateUrl: './wad-title-img.component.html',
})
export class WadTitleImgComponent implements OnInit {
	static CMP = 'app-title-img';
	wad: Wad;
	bitmaps: PatchBitmap[];

	constructor(private currentWadService: CurrentWadService) {
	}

	ngOnInit(): void {
		if (!this.currentWadService.isLoaded()) {
			Log.error(WadTitleImgComponent.CMP, 'WAD not Loaded');
			return;
		}
		this.wad = this.currentWadService.wad;
		this.bitmaps = new Array<PatchBitmap>();
		this.bitmaps.push(this.wad.title.title);
		this.bitmaps.push(this.wad.title.credit);
		this.wad.title.help.exec(ba => ba.forEach(b => this.bitmaps.push(b)));
	}

}
