import {Component, OnInit} from '@angular/core';
import {PatchBitmap, Wad} from '../../parser/wad_model';
import {Log} from '../../../common/is/log';
import {WadStorageService} from '../../service/wad-storage.service';

@Component({
	selector: 'app-wad-title-img',
	templateUrl: './wad-title-img.component.html'
})
export class WadTitleImgComponent implements OnInit {
	static CMP = 'app-title-img';
	wad: Wad;
	bitmaps: PatchBitmap[];

	constructor(private wadStorage: WadStorageService) {
	}

	ngOnInit(): void {
		if (!this.wadStorage.isLoaded()) {
			Log.error(WadTitleImgComponent.CMP, 'WAD not Loaded');
			return;
		}
		this.wad = this.wadStorage.getCurrent().get().wad;
		this.bitmaps = new Array<PatchBitmap>();
		this.bitmaps.push(this.wad.title.title);
		this.bitmaps.push(this.wad.title.credit);
		this.wad.title.help.exec(ba => ba.forEach(b => this.bitmaps.push(b)));
	}

}
